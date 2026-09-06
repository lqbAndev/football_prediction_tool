import type { LeagueMatch, LeagueStanding } from '../types/leagueConfig';
import type { TwoLegMatch } from '../types/uclConfig';
import type { Team } from '../types/tournament';

const STORAGE_KEY = 'ucl_2627_sim_state_v1';

export interface UCLSavedState {
  leagueMatches: LeagueMatch[];
  currentMatchday: number;
  playoffs: TwoLegMatch[];
  roundOf16: TwoLegMatch[];
  quarterfinals: TwoLegMatch[];
  semifinals: TwoLegMatch[];
  finalMatch: TwoLegMatch | null;
  champion: Team | null;
  updatedAt: string;
}

export const loadUCLState = (): UCLSavedState | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.leagueMatches) && parsed.leagueMatches.length === 144) {
      return parsed as UCLSavedState;
    }
  } catch (err) {
    console.warn('Failed to load UCL state from localStorage', err);
  }
  return null;
};

export const saveUCLState = (state: Omit<UCLSavedState, 'updatedAt'>) => {
  try {
    const payload: UCLSavedState = {
      ...state,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn('Failed to save UCL state to localStorage', err);
  }
};

export const clearUCLState = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to clear UCL state from localStorage', err);
  }
};
