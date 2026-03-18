import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_STREAK = 'glossia_streak';
const KEY_LAST_PLAYED = 'glossia_last_played';
const KEY_HISTORY = 'glossia_history';

export async function getHistory() {
  try {
    const val = await AsyncStorage.getItem(KEY_HISTORY);
    return val ? JSON.parse(val) : [];
  } catch { return []; }
}

export async function saveToHistory(score, theme) {
  try {
    const history = await getHistory();
    const entry = { score, theme, date: new Date().toDateString() };
    const updated = [entry, ...history].slice(0, 5);
    await AsyncStorage.setItem(KEY_HISTORY, JSON.stringify(updated));
  } catch {}
}

export async function isFirstSession() {
  try {
    const history = await getHistory();
    return history.length === 0;
  } catch { return false; }
}

export async function hasPlayedToday() {
  try {
    const today = new Date().toDateString();
    const lastPlayed = await AsyncStorage.getItem(KEY_LAST_PLAYED);
    return lastPlayed === today;
  } catch { return false; }
}

export async function getStreak() {
  try {
    const val = await AsyncStorage.getItem(KEY_STREAK);
    return val ? parseInt(val, 10) : 0;
  } catch {
    return 0;
  }
}

/**
 * Call once after a completed game session.
 * Returns the new streak value.
 */
export async function recordPlay() {
  try {
    const today = new Date().toDateString();
    const lastPlayed = await AsyncStorage.getItem(KEY_LAST_PLAYED);

    if (lastPlayed === today) {
      return getStreak(); // already played today
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const current = await getStreak();
    const newStreak = lastPlayed === yesterday.toDateString() ? current + 1 : 1;

    await AsyncStorage.setItem(KEY_STREAK, String(newStreak));
    await AsyncStorage.setItem(KEY_LAST_PLAYED, today);
    return newStreak;
  } catch {
    return 0;
  }
}
