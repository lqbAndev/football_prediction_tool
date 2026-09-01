import type { CupConfig } from '../../../types/cupConfig';

/**
 * Test Cup — Minimal 8-team tournament for engine validation.
 *
 * 8 teams · 2 groups of 4 · top 2 per group · 0 best 3rds = 4 advancing.
 * Knockout starts directly from Semi-finals.
 *
 * NOTE: This configuration is for local testing only (not deployed to GitHub).
 */
export const testCupConfig: CupConfig = {
  id: 'test-cup',
  name: 'Vibe Test Cup',
  teams: 8,
  groupsCount: 2,
  teamsPerGroup: 4,
  advancePerGroup: 2,
  bestThirdsToAdvance: 0,
  storageKey: 'test-cup-prediction:v1',
};
