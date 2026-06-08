/**
 * EPL Best XI of the Season — Performance-based selection algorithm.
 *
 * Scoring rules (differ from WC26 bestXI.ts):
 *   ALL positions : MOTM award +5 pts, Champion team +10, Top 4 team +5
 *   FW            : Goal +2
 *   MF            : Goal +3
 *   DF / GK       : Goal +5, Team clean sheet +2
 *
 * Formation: 4-3-3 (1 GK, 4 DF, 3 MF, 3 FW)
 */

import type { LeagueMatch, LeagueStanding } from '../types/leagueConfig';
import type { Team } from '../types/tournament';

// ─── Types ──────────────────────────────────────────────────────

export type EPLPosition = 'GK' | 'DF' | 'MF' | 'FW';

export interface EPLBestXIPlayer {
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  position: EPLPosition;
  goals: number;
  motmCount: number;
  cleanSheets: number;
  totalScore: number;
}

export interface EPLBestXIResult {
  goalkeeper: EPLBestXIPlayer;
  defenders: EPLBestXIPlayer[];   // 4
  midfielders: EPLBestXIPlayer[]; // 3
  forwards: EPLBestXIPlayer[];    // 3
  bestPlayer: EPLBestXIPlayer;
}

// ─── Helpers ────────────────────────────────────────────────────

interface MutablePlayer extends EPLBestXIPlayer {}

const goalPoints = (pos: EPLPosition): number => {
  if (pos === 'FW') return 2;
  if (pos === 'MF') return 3;
  return 5; // DF, GK
};

const MOTM_POINTS = 5;
const CHAMPION_BONUS = 10;
const TOP4_BONUS = 5;
const CLEAN_SHEET_POINTS = 2;

const comparePlayers = (a: MutablePlayer, b: MutablePlayer): number => {
  if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
  if (b.goals !== a.goals) return b.goals - a.goals;
  if (b.motmCount !== a.motmCount) return b.motmCount - a.motmCount;
  return a.playerName.localeCompare(b.playerName);
};

/**
 * Select best `count` players for a given position from the sorted pool.
 * First pass: natural position match. Second pass: any remaining player.
 */
const selectByPosition = (
  pool: MutablePlayer[],
  usedIds: Set<string>,
  position: EPLPosition,
  count: number,
): EPLBestXIPlayer[] => {
  const selected: EPLBestXIPlayer[] = [];

  // 1st pass — natural position
  for (const p of pool) {
    if (selected.length >= count) break;
    if (usedIds.has(p.playerId)) continue;
    if (p.position !== position) continue;
    usedIds.add(p.playerId);
    selected.push({ ...p });
  }

  // 2nd pass — any remaining
  if (selected.length < count) {
    for (const p of pool) {
      if (selected.length >= count) break;
      if (usedIds.has(p.playerId)) continue;
      usedIds.add(p.playerId);
      selected.push({ ...p, position });
    }
  }

  return selected;
};

// ─── Main Builder ───────────────────────────────────────────────

export const buildEPLBestXI = (
  fixtures: LeagueMatch[],
  standings: LeagueStanding[],
  teams: Team[],
): EPLBestXIResult | null => {
  const completedMatches = fixtures.filter((f) => f.status === 'completed');
  if (completedMatches.length === 0) return null;

  // Build player registry
  const registry = new Map<string, MutablePlayer>();
  const teamsById = new Map<string, Team>();

  for (const team of teams) {
    teamsById.set(team.id, team);
    for (const player of team.players) {
      const key = `${team.id}:${player.id}`;
      registry.set(key, {
        playerId: player.id,
        playerName: player.name,
        teamId: team.id,
        teamName: team.name,
        position: player.position as EPLPosition,
        goals: 0,
        motmCount: 0,
        cleanSheets: 0,
        totalScore: 0,
      });
    }
  }

  // ── 1. Count goals ────────────────────────────────────────────
  for (const match of completedMatches) {
    if (!match.timeline) continue;
    for (const event of match.timeline) {
      const key = `${event.teamId}:${event.playerId}`;
      const player = registry.get(key);
      if (!player) continue;
      player.goals += 1;
      player.totalScore += goalPoints(player.position);
    }
  }

  // ── 2. Count MOTM ────────────────────────────────────────────
  for (const match of completedMatches) {
    if (!match.motm) continue;
    const key = `${match.motm.teamId}:${match.motm.playerId}`;
    const player = registry.get(key);
    if (!player) continue;
    player.motmCount += 1;
    player.totalScore += MOTM_POINTS;
  }

  // ── 3. Count clean sheets (DF + GK only) ─────────────────────
  for (const match of completedMatches) {
    if (match.homeScore === null || match.awayScore === null) continue;

    // Away team kept clean sheet (homeScore === 0)
    if (match.homeScore === 0) {
      const awayTeam = teamsById.get(match.awayTeamId);
      if (awayTeam) {
        for (const p of awayTeam.players) {
          if (p.position === 'GK' || p.position === 'DF') {
            const player = registry.get(`${awayTeam.id}:${p.id}`);
            if (player) {
              player.cleanSheets += 1;
              player.totalScore += CLEAN_SHEET_POINTS;
            }
          }
        }
      }
    }

    // Home team kept clean sheet (awayScore === 0)
    if (match.awayScore === 0) {
      const homeTeam = teamsById.get(match.homeTeamId);
      if (homeTeam) {
        for (const p of homeTeam.players) {
          if (p.position === 'GK' || p.position === 'DF') {
            const player = registry.get(`${homeTeam.id}:${p.id}`);
            if (player) {
              player.cleanSheets += 1;
              player.totalScore += CLEAN_SHEET_POINTS;
            }
          }
        }
      }
    }
  }

  // ── 4. Apply champion / top-4 bonus ──────────────────────────
  const championTeamId = standings.length > 0 ? standings[0].teamId : null;
  const top4TeamIds = new Set(standings.slice(0, 4).map((s) => s.teamId));

  for (const player of registry.values()) {
    if (player.teamId === championTeamId) {
      player.totalScore += CHAMPION_BONUS;
    } else if (top4TeamIds.has(player.teamId)) {
      player.totalScore += TOP4_BONUS;
    }
  }

  // ── 5. Sort and select 4-3-3 ─────────────────────────────────
  const sortedPool = Array.from(registry.values()).sort(comparePlayers);
  if (sortedPool.length === 0) return null;

  const usedIds = new Set<string>();

  // GK — pick the one with most clean sheets; tiebreak by totalScore
  const allGKs = sortedPool.filter((p) => p.position === 'GK');
  const bestGK = allGKs.reduce<MutablePlayer | null>((best, p) => {
    if (!best) return p;
    if (p.cleanSheets > best.cleanSheets) return p;
    if (p.cleanSheets === best.cleanSheets && p.totalScore > best.totalScore) return p;
    return best;
  }, null);

  let goalkeeper: EPLBestXIPlayer;
  if (bestGK) {
    usedIds.add(bestGK.playerId);
    goalkeeper = { ...bestGK };
  } else {
    const [fallback] = selectByPosition(sortedPool, usedIds, 'GK', 1);
    if (!fallback) return null;
    goalkeeper = fallback;
  }

  const defenders = selectByPosition(sortedPool, usedIds, 'DF', 4);
  const midfielders = selectByPosition(sortedPool, usedIds, 'MF', 3);
  const forwards = selectByPosition(sortedPool, usedIds, 'FW', 3);

  if (defenders.length !== 4 || midfielders.length !== 3 || forwards.length !== 3) {
    return null;
  }

  // Best Player = highest totalScore among the XI
  const fullXI = [goalkeeper, ...defenders, ...midfielders, ...forwards].sort(comparePlayers);
  const bestPlayer = fullXI[0];

  return {
    goalkeeper,
    defenders,
    midfielders,
    forwards,
    bestPlayer,
  };
};
