export const DEFAULT_PREFERENCES = {
  dailyGoal: 3,
  weekStartsOn: 'monday',
  compactCalendar: false,
  reduceMotion: false,
  emailReminders: true,
  overdueWarnings: true,
  weeklyDigest: false,
};

const KEY = 'takenhandelaar-preferences';

export function loadPreferences() {
  try {
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function savePreferences(prefs) {
  localStorage.setItem(KEY, JSON.stringify({ ...DEFAULT_PREFERENCES, ...prefs }));
}
