import type { LeagueMatch, LeagueStanding } from '../types/leagueConfig';
import type { TwoLegMatch } from '../types/uclConfig';
import type { Team } from '../types/tournament';
import {
  MAX_UCL_STORAGE_CHARS,
  UCL_STORAGE_VERSION,
  validateAndNormalizeUCLState,
} from './uclStorageValidation';

const STORAGE_KEY = 'ucl_2627_sim_state_v1';

export interface UCLSavedState {
  version: typeof UCL_STORAGE_VERSION;
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
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    if (raw.length > MAX_UCL_STORAGE_CHARS) {
      console.warn('Ignored oversized UCL state from localStorage');
      return null;
    }
    return validateAndNormalizeUCLState(JSON.parse(raw));
  } catch (err) {
    console.warn('Failed to load UCL state from localStorage', err);
  }
  return null;
};

export const saveUCLState = (state: Omit<UCLSavedState, 'version' | 'updatedAt'>) => {
  try {
    const payload: UCLSavedState = {
      version: UCL_STORAGE_VERSION,
      ...state,
      updatedAt: new Date().toISOString(),
    };
    const serialized = JSON.stringify(payload);
    if (serialized.length > MAX_UCL_STORAGE_CHARS) {
      console.warn('Skipped oversized UCL state write');
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, serialized);
  } catch (err) {
    console.warn('Failed to save UCL state to localStorage', err);
  }
};

export const clearUCLState = () => {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to clear UCL state from localStorage', err);
  }
};
