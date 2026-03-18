const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { setGlobalOptions } = require('firebase-functions');
const OpenAI = require('openai');
const { toFile } = require('openai');

setGlobalOptions({ maxInstances: 10, region: 'northamerica-northeast1' });

const openaiKey = defineSecret('OPENAI_API_KEY');

const prompts = {
  fr: {
    whisper_lang: 'fr',
    gpt_system_first: (duration) =>
      `Tu es l'arbitre d'un jeu d'éloquence. C'est la première fois que cet utilisateur joue — sois bienveillant et encourageant. Commence TOUJOURS ton feedback par ce qui s'est bien passé avant d'aborder les axes d'amélioration. Reçois la transcription d'un discours de ${duration} secondes. Évalue sur 3 critères : fluidité (30pts max), absence de mots parasites comme "euh", "alors", "donc", "voilà", "genre", "en fait", "bah" (30pts max), pertinence par rapport au thème (40pts max). Le score total est la somme des 3. Retourne UNIQUEMENT un JSON valide : {"score": number, "fluidity": number, "fillers_score": number, "relevance": number, "feedback": string, "fillers_count": number}. Rédige le feedback en français.`,
    gpt_system: (duration) =>
      `Tu es l'arbitre d'un jeu d'éloquence. Reçois la transcription d'un discours de ${duration} secondes. Évalue sur 3 critères : fluidité (30pts max), absence de mots parasites comme "euh", "alors", "donc", "voilà", "genre", "en fait", "bah" (30pts max), pertinence par rapport au thème (40pts max). Le score total est la somme des 3. Retourne UNIQUEMENT un JSON valide avec exactement cette structure : {"score": number, "fluidity": number, "fillers_score": number, "relevance": number, "feedback": string, "fillers_count": number}. Rédige le feedback en français.`,
    gpt_user: (theme, transcript) => `Thème : "${theme}"\nTranscription : "${transcript}"`,
  },
  en: {
    whisper_lang: 'en',
    gpt_system_first: (duration) =>
      `You are the judge of a public speaking game. This is the user's first time playing — be kind and encouraging. ALWAYS start your feedback with what went well before addressing areas for improvement. You receive the transcription of a ${duration}-second speech. Evaluate on 3 criteria: fluency (30pts max), absence of filler words like "um", "uh", "so", "like", "you know", "basically", "right" (30pts max), relevance to the theme (40pts max). The total score is the sum of the 3. Return ONLY valid JSON: {"score": number, "fluidity": number, "fillers_score": number, "relevance": number, "feedback": string, "fillers_count": number}. Write the feedback in English.`,
    gpt_system: (duration) =>
      `You are the judge of a public speaking game. You receive the transcription of a ${duration}-second speech. Evaluate on 3 criteria: fluency (30pts max), absence of filler words like "um", "uh", "so", "like", "you know", "basically", "right" (30pts max), relevance to the theme (40pts max). The total score is the sum of the 3. Return ONLY valid JSON with exactly this structure: {"score": number, "fluidity": number, "fillers_score": number, "relevance": number, "feedback": string, "fillers_count": number}. Write the feedback in English.`,
    gpt_user: (theme, transcript) => `Theme: "${theme}"\nTranscript: "${transcript}"`,
  },
};

exports.analyzeSession = onRequest(
  { secrets: [openaiKey], timeoutSeconds: 120, memory: '512MiB', cors: true },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const { audioBase64, theme, lang = 'fr', isFirst = false } = req.body;

    if (!audioBase64) { res.status(400).json({ error: 'Missing audio data' }); return; }
    if (!theme)       { res.status(400).json({ error: 'Missing theme' }); return; }

    try {
      const openai = new OpenAI({ apiKey: openaiKey.value() });
      const p = prompts[lang] ?? prompts['fr'];

      // 1. Whisper transcription
      const audioBuffer = Buffer.from(audioBase64, 'base64');
      const audioFile = await toFile(audioBuffer, 'recording.m4a', { type: 'audio/m4a' });
      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        language: p.whisper_lang,
      });

      const transcript = transcription.text;
      if (!transcript || transcript.trim().length === 0) {
        res.status(422).json({ error: 'No speech detected' });
        return;
      }

      // 2. GPT analysis
      const systemPrompt = (isFirst ? p.gpt_system_first : p.gpt_system)(30);
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: p.gpt_user(theme, transcript) },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const raw = completion.choices[0].message.content;
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;

      res.json({
        transcript,
        score:         Math.min(100, Math.max(0, Number(parsed.score) || 0)),
        fluidity:      Math.min(30,  Math.max(0, Number(parsed.fluidity) || 0)),
        fillers_score: Math.min(30,  Math.max(0, Number(parsed.fillers_score) || 0)),
        relevance:     Math.min(40,  Math.max(0, Number(parsed.relevance) || 0)),
        feedback:      String(parsed.feedback || ''),
        fillers_count: Number(parsed.fillers_count) || 0,
      });
    } catch (e) {
      console.error('analyzeSession error:', e);
      res.status(500).json({ error: e.message });
    }
  }
);
