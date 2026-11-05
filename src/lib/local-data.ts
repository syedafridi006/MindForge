export const MINDFORGE_STORAGE_KEYS = [
  'mindforge-v1',
  'mindforge-learning-hub-v1',
  'mindforge-brain-levels',
  'mindforge-flashcards-v1',
] as const;

export type MindForgeCloudData = Partial<Record<(typeof MINDFORGE_STORAGE_KEYS)[number], string>>;

export function saveLocalData(key: (typeof MINDFORGE_STORAGE_KEYS)[number], value: string) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, value);
  window.dispatchEvent(new CustomEvent('mindforge:local-data-changed'));
}

export function readLocalData(): MindForgeCloudData {
  const result: MindForgeCloudData = {};
  for (const key of MINDFORGE_STORAGE_KEYS) {
    const value = window.localStorage.getItem(key);
    if (value !== null) result[key] = value;
  }
  return result;
}

export function writeLocalData(data: MindForgeCloudData) {
  for (const key of MINDFORGE_STORAGE_KEYS) {
    const value = data[key];
    if (typeof value === 'string') window.localStorage.setItem(key, value);
  }
}
