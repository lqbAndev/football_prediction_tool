export interface SavedSimulation {
  saveId: string;
  saveName: string;
  competitionId: string;
  competitionType: 'cup' | 'league';
  timestamp: number;
  stateData: unknown;
}

const SAVES_STORAGE_KEY = 'football-prediction-tool:saved-simulations';
const MAX_SAVED_SIMULATIONS = 50;
const MAX_SAVES_STORAGE_CHARS = 4_000_000;
const MAX_SAVE_NAME_LENGTH = 80;
const COMPETITION_ID_PATTERN = /^[a-z0-9-]{1,40}$/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isSavedSimulation = (value: unknown): value is SavedSimulation => {
  if (!isRecord(value)) return false;
  return (
    typeof value.saveId === 'string' &&
    value.saveId.length > 0 &&
    value.saveId.length <= 80 &&
    typeof value.saveName === 'string' &&
    value.saveName.length > 0 &&
    value.saveName.length <= MAX_SAVE_NAME_LENGTH &&
    typeof value.competitionId === 'string' &&
    COMPETITION_ID_PATTERN.test(value.competitionId) &&
    (value.competitionType === 'cup' || value.competitionType === 'league') &&
    typeof value.timestamp === 'number' &&
    Number.isFinite(value.timestamp) &&
    value.timestamp > 0 &&
    isRecord(value.stateData)
  );
};

const persistSavedSimulations = (saves: SavedSimulation[]) => {
  const newestSaves = [...saves]
    .sort((left, right) => right.timestamp - left.timestamp)
    .slice(0, MAX_SAVED_SIMULATIONS);
  const serialized = JSON.stringify(newestSaves);
  if (serialized.length > MAX_SAVES_STORAGE_CHARS) {
    throw new Error('Saved simulations exceed the local storage safety limit');
  }
  window.localStorage.setItem(SAVES_STORAGE_KEY, serialized);
};

export const getStorageKeyForCompetition = (competitionId: string): string => {
  if (!COMPETITION_ID_PATTERN.test(competitionId)) {
    throw new Error('Invalid competition id');
  }
  if (competitionId === 'wc26') {
    return 'wc26-prediction-tool:v2';
  }
  if (competitionId === 'test-league') {
    return 'vibe-test-league-state';
  }
  if (competitionId === 'test-cup') {
    return 'test-cup-prediction:v1';
  }
  return `${competitionId}-prediction:v1`;
};

export const getCompetitionName = (competitionId: string, competitionType: 'cup' | 'league'): string => {
  if (competitionId === 'wc26') return 'FIFA World Cup 2026';
  if (competitionId === 'test-cup') return 'Vibe Test Cup';
  if (competitionId === 'test-league') return 'Vibe Test League';
  if (competitionId === 'epl') return 'Premier League';
  return competitionId.toUpperCase();
};

export const getSavedSimulations = (): SavedSimulation[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(SAVES_STORAGE_KEY);
    if (!raw) return [];
    if (raw.length > MAX_SAVES_STORAGE_CHARS) return [];
    const list: unknown = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    return list
      .filter(isSavedSimulation)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, MAX_SAVED_SIMULATIONS);
  } catch {
    return [];
  }
};

export const saveSimulation = (
  saveName: string,
  competitionId: string,
  competitionType: 'cup' | 'league',
  stateData: unknown
): SavedSimulation => {
  if (!COMPETITION_ID_PATTERN.test(competitionId)) {
    throw new Error('Invalid competition id');
  }
  if (!isRecord(stateData)) {
    throw new Error('Invalid simulation state');
  }
  const saves = getSavedSimulations();
  const normalizedSaveName = saveName.trim().slice(0, MAX_SAVE_NAME_LENGTH) || 'Untitled simulation';
  const newSave: SavedSimulation = {
    saveId: Date.now().toString(),
    saveName: normalizedSaveName,
    competitionId,
    competitionType,
    timestamp: Date.now(),
    stateData,
  };
  
  // Remove existing save with same saveId (shouldn't happen, but for safety)
  const filtered = saves.filter(s => s.saveId !== newSave.saveId);
  filtered.push(newSave);

  persistSavedSimulations(filtered);
  return newSave;
};

export const deleteSimulation = (saveId: string): boolean => {
  const saves = getSavedSimulations();
  const filtered = saves.filter((s) => s.saveId !== saveId);
  if (saves.length === filtered.length) return false;
  persistSavedSimulations(filtered);
  return true;
};

export const loadSimulation = (save: SavedSimulation) => {
  if (!isSavedSimulation(save)) {
    throw new Error('Invalid saved simulation');
  }
  const key = getStorageKeyForCompetition(save.competitionId);
  window.localStorage.setItem(key, JSON.stringify(save.stateData));
};
