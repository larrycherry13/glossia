// ⚠️  Ne pas committer cette clé — utiliser une variable d'environnement en production
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const API_TIMEOUT_MS = 60000; // 60 seconds

/**
 * Fetch with timeout
 */
function fetchWithTimeout(url, options = {}, timeoutMs = API_TIMEOUT_MS) {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('API request timeout')), timeoutMs)
    ),
  ]);
}

/**
 * Sends audio to Whisper and returns the French transcription.
 */
export async function transcribeAudio(audioUri) {
  const formData = new FormData();
  formData.append('file', { uri: audioUri, type: 'audio/m4a', name: 'recording.m4a' });
  formData.append('model', 'whisper-1');
  formData.append('language', 'fr');

  try {
    const response = await fetchWithTimeout('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Whisper error (${response.status}): ${err.substring(0, 200)}`);
    }

    const data = await response.json();
    if (!data.text) throw new Error('No transcription returned from Whisper');
    return data.text;
  } catch (error) {
    if (error.message.includes('timeout')) {
      throw new Error('Transcription took too long. Please try again.');
    }
    throw error;
  }
}

/**
 * Sends the transcript + game context to GPT-4o.
 * Returns { score, feedback, fillers_count }.
 */
export async function analyzeWithGPT(transcript, theme) {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured');
  }

  if (!transcript || transcript.trim().length === 0) {
    throw new Error('No speech detected. Please try again.');
  }

  const systemPrompt = `Tu es l'arbitre d'un jeu d'éloquence. Reçois la transcription d'un discours de 10 secondes. Évalue sur 3 critères : fluidité (30pts max), absence de mots parasites comme "euh", "alors", "donc", "voilà", "genre", "en fait", "bah" (30pts max), pertinence par rapport au thème (40pts max). Le score total est la somme des 3. Retourne UNIQUEMENT un JSON valide avec exactement cette structure : {"score": number, "fluidity": number, "fillers_score": number, "relevance": number, "feedback": string, "fillers_count": number}. fluidity est le score obtenu sur 30, fillers_score sur 30, relevance sur 40.`;

  const userMessage = `Thème : "${theme}"\nTranscription : "${transcript}"`;

  try {
    const response = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      if (response.status === 401) {
        throw new Error('Invalid API key. Please check your configuration.');
      }
      if (response.status === 429) {
        throw new Error('API rate limit exceeded. Please wait a moment and try again.');
      }
      throw new Error(`Analysis error (${response.status}): ${err.substring(0, 200)}`);
    }

    const data = await response.json();
    if (!data.choices || !data.choices[0]) {
      throw new Error('Invalid response from GPT');
    }

    const raw = data.choices[0].message.content;
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;

    return {
      score:        Math.min(100, Math.max(0, Number(parsed.score) || 0)),
      fluidity:     Math.min(30,  Math.max(0, Number(parsed.fluidity) || 0)),
      fillers_score:Math.min(30,  Math.max(0, Number(parsed.fillers_score) || 0)),
      relevance:    Math.min(40,  Math.max(0, Number(parsed.relevance) || 0)),
      feedback:     String(parsed.feedback || 'Analysis unavailable'),
      fillers_count:Number(parsed.fillers_count) || 0,
    };
  } catch (error) {
    if (error.message.includes('timeout')) {
      throw new Error('Analysis took too long. Please try again.');
    }
    throw error;
  }
}
