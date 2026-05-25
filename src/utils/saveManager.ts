export interface SavedSimulation {
  saveId: string;
  saveName: string;
  competitionId: string;
  competitionType: 'cup' | 'league';
  timestamp: number;
  stateData: any;
}

const SAVES_STORAGE_KEY = 'football-prediction-tool:saved-simulations';

export const getStorageKeyForCompetition = (competitionId: string): string => {
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
    const list = JSON.parse(raw) as SavedSimulation[];
    return list.sort((a, b) => b.timestamp - a.timestamp);
  } catch {
    return [];
  }
};

export const saveSimulation = (
  saveName: string,
  competitionId: string,
  competitionType: 'cup' | 'league',
  stateData: any
): SavedSimulation => {
  const saves = getSavedSimulations();
  const newSave: SavedSimulation = {
    saveId: Date.now().toString(),
    saveName,
    competitionId,
    competitionType,
    timestamp: Date.now(),
    stateData,
  };
  
  // Remove existing save with same saveId (shouldn't happen, but for safety)
  const filtered = saves.filter(s => s.saveId !== newSave.saveId);
  filtered.push(newSave);
  
  window.localStorage.setItem(SAVES_STORAGE_KEY, JSON.stringify(filtered));
  return newSave;
};

export const deleteSimulation = (saveId: string): boolean => {
  const saves = getSavedSimulations();
  const filtered = saves.filter((s) => s.saveId !== saveId);
  if (saves.length === filtered.length) return false;
  window.localStorage.setItem(SAVES_STORAGE_KEY, JSON.stringify(filtered));
  return true;
};

export const loadSimulation = (save: SavedSimulation) => {
  const key = getStorageKeyForCompetition(save.competitionId);
  window.localStorage.setItem(key, JSON.stringify(save.stateData));
};
