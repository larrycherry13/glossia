import * as FileSystem from 'expo-file-system/legacy';

const FUNCTION_URL = 'https://northamerica-northeast1-glossia-325c1.cloudfunctions.net/analyzeSession';

export async function analyzeSession(audioUri, theme, lang = 'fr', isFirst = false) {
  const fileInfo = await FileSystem.getInfoAsync(audioUri);
  if (!fileInfo.exists) throw new Error('Audio file not found after recording.');

  const audioBase64 = await FileSystem.readAsStringAsync(audioUri, { encoding: 'base64' });
  if (!audioBase64) throw new Error('Failed to read audio file.');

  const response = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ audioBase64, theme, lang, isFirst }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Server error ${response.status}`);
  }

  return response.json();
}
