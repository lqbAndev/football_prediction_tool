/**
 * EPL Curious Stats — 9 advanced analytical functions for League Recap.
 *
 * All functions take completed LeagueMatch[] fixtures as input.
 * They use the `timeline` array (with sortMinute, displayMinute, isPenalty, etc.)
 * and `scorers` fallback for computation.
 */

import type { LeagueMatch, LeagueStanding } from '../types/leagueConfig';

// ─── Result Types ───────────────────────────────────────────────

export interface ComebackKingResult {
  teamId: string;
  teamName: string;
  comebacks: number;
}

export interface BiggestBottlerResult {
  teamId: string;
  teamName: string;
  bottledPoints: number;
}

export interface FastestGoalResult {
  playerName: string;
  playerId: string;
  teamId: string;
  teamName: string;
  sortMinute: number;
  displayMinute: string;
  matchLabel: string;
}

export interface LastMinuteWinnerResult {
  playerName: string;
  playerId: string;
  teamId: string;
  teamName: string;
  sortMinute: number;
  displayMinute: string;
  matchLabel: string;
}

export interface HatTrickHeroResult {
  playerName: string;
  playerId: string;
  teamId: string;
  teamName: string;
  goals: number;
  matchLabel: string;
}

export interface PenaltySpecialistResult {
  playerName: string;
  playerId: string;
  teamId: string;
  teamName: string;
  penaltyGoals: number;
}

export interface EarlyBirdsResult {
  teamId: string;
  teamName: string;
  earlyGoals: number;
}

export interface PenaltyVillainResult {
  teamId: string;
  teamName: string;
  penaltiesConceded: number;
}

export interface EntertainersResult {
  teamId: string;
  teamName: string;
  avgTotalGoals: number;
}

// ─── Helpers ────────────────────────────────────────────────────

const getTeamName = (
  teamId: string,
  nameMap: Record<string, string>,
): string => nameMap[teamId] || teamId;

const buildTeamNameMap = (fixtures: LeagueMatch[], standings?: LeagueStanding[]): Record<string, string> => {
  const map: Record<string, string> = {};
  if (standings) {
    for (const s of standings) {
      map[s.teamId] = s.teamName;
    }
  }
  // Fallback from fixtures — collect team IDs at minimum
  for (const f of fixtures) {
    if (!map[f.homeTeamId]) map[f.homeTeamId] = f.homeTeamId;
    if (!map[f.awayTeamId]) map[f.awayTeamId] = f.awayTeamId;
  }
  return map;
};

type TimelineEvent = NonNullable<LeagueMatch['timeline']>[number];

const getTimeline = (match: LeagueMatch): TimelineEvent[] => {
  if (match.timeline?.length) return match.timeline;

  // Fallback from scorers
  const events: TimelineEvent[] = [];
  if (match.scorers?.home) {
    for (const s of match.scorers.home) {
      events.push({
        sortMinute: s.minute,
        displayMinute: `${s.minute}'`,
        playerName: s.playerName,
        playerId: s.playerId,
        teamId: s.teamId,
        side: 'home',
        isPenalty: false,
      });
    }
  }
  if (match.scorers?.away) {
    for (const s of match.scorers.away) {
      events.push({
        sortMinute: s.minute,
        displayMinute: `${s.minute}'`,
        playerName: s.playerName,
        playerId: s.playerId,
        teamId: s.teamId,
        side: 'away',
        isPenalty: false,
      });
    }
  }
  return events.sort((a, b) => a.sortMinute - b.sortMinute);
};

const matchLabel = (match: LeagueMatch, nameMap: Record<string, string>): string =>
  `${getTeamName(match.homeTeamId, nameMap)} vs ${getTeamName(match.awayTeamId, nameMap)} (MW ${match.matchweek})`;

// ─── 1. The Comeback Kings ─────────────────────────────────────
// Team that won/drew the most matches after conceding first.

export const computeComebackKings = (
  fixtures: LeagueMatch[],
  standings?: LeagueStanding[],
): ComebackKingResult | null => {
  const nameMap = buildTeamNameMap(fixtures, standings);
  const comebackMap: Record<string, number> = {};

  for (const match of fixtures) {
    if (match.status !== 'completed' || match.homeScore === null || match.awayScore === null) continue;
    const timeline = getTimeline(match);
    if (timeline.length === 0) continue;

    // Sort by minute to find first goal
    const sorted = [...timeline].sort((a, b) => a.sortMinute - b.sortMinute);
    const firstGoalTeamId = sorted[0].teamId;

    // Determine which team conceded first (opponent of first scorer)
    const concedingTeamId = firstGoalTeamId === match.homeTeamId ? match.awayTeamId : match.homeTeamId;

    // Did the conceding team come back to win or draw?
    const concedingIsHome = concedingTeamId === match.homeTeamId;
    const concedingScore = concedingIsHome ? match.homeScore : match.awayScore;
    const scorerScore = concedingIsHome ? match.awayScore : match.homeScore;

    if (concedingScore >= scorerScore) {
      // Comeback: drew or won after going behind
      comebackMap[concedingTeamId] = (comebackMap[concedingTeamId] || 0) + 1;
    }
  }

  let best: ComebackKingResult | null = null;
  for (const [teamId, comebacks] of Object.entries(comebackMap)) {
    if (!best || comebacks > best.comebacks) {
      best = { teamId, teamName: getTeamName(teamId, nameMap), comebacks };
    }
  }
  return best;
};

// ─── 2. Biggest Bottlers ───────────────────────────────────────
// Team that lost the most points after leading first.

export const computeBiggestBottlers = (
  fixtures: LeagueMatch[],
  standings?: LeagueStanding[],
): BiggestBottlerResult | null => {
  const nameMap = buildTeamNameMap(fixtures, standings);
  const bottleMap: Record<string, number> = {};

  for (const match of fixtures) {
    if (match.status !== 'completed' || match.homeScore === null || match.awayScore === null) continue;
    const timeline = getTimeline(match);
    if (timeline.length === 0) continue;

    const sorted = [...timeline].sort((a, b) => a.sortMinute - b.sortMinute);
    const leadingTeamId = sorted[0].teamId;

    const leadingIsHome = leadingTeamId === match.homeTeamId;
    const leadingScore = leadingIsHome ? match.homeScore : match.awayScore;
    const opponentScore = leadingIsHome ? match.awayScore : match.homeScore;

    if (leadingScore < opponentScore) {
      // Led first but lost → lost 3 points (would have won, ended up losing)
      bottleMap[leadingTeamId] = (bottleMap[leadingTeamId] || 0) + 3;
    } else if (leadingScore === opponentScore) {
      // Led first but drew → lost 2 points (would have won, ended up drawing)
      bottleMap[leadingTeamId] = (bottleMap[leadingTeamId] || 0) + 2;
    }
  }

  let best: BiggestBottlerResult | null = null;
  for (const [teamId, bottledPoints] of Object.entries(bottleMap)) {
    if (!best || bottledPoints > best.bottledPoints) {
      best = { teamId, teamName: getTeamName(teamId, nameMap), bottledPoints };
    }
  }
  return best;
};

// ─── 3. Fastest Goal ───────────────────────────────────────────

export const computeFastestGoal = (
  fixtures: LeagueMatch[],
  standings?: LeagueStanding[],
): FastestGoalResult | null => {
  const nameMap = buildTeamNameMap(fixtures, standings);
  let fastest: FastestGoalResult | null = null;

  for (const match of fixtures) {
    if (match.status !== 'completed') continue;
    const timeline = getTimeline(match);
    for (const event of timeline) {
      if (!fastest || event.sortMinute < fastest.sortMinute) {
        fastest = {
          playerName: event.playerName,
          playerId: event.playerId,
          teamId: event.teamId,
          teamName: getTeamName(event.teamId, nameMap),
          sortMinute: event.sortMinute,
          displayMinute: event.displayMinute,
          matchLabel: matchLabel(match, nameMap),
        };
      }
    }
  }
  return fastest;
};

// ─── 4. Last-Minute Winner ─────────────────────────────────────
// The winning goal scored at the latest minute.

export const computeLastMinuteWinner = (
  fixtures: LeagueMatch[],
  standings?: LeagueStanding[],
): LastMinuteWinnerResult | null => {
  const nameMap = buildTeamNameMap(fixtures, standings);
  let latest: LastMinuteWinnerResult | null = null;

  for (const match of fixtures) {
    if (match.status !== 'completed' || match.homeScore === null || match.awayScore === null) continue;
    if (match.homeScore === match.awayScore) continue; // draws have no winner

    const timeline = getTimeline(match);
    if (timeline.length === 0) continue;

    // Determine winner
    const winnerTeamId = match.homeScore > match.awayScore ? match.homeTeamId : match.awayTeamId;
    const loserGoals = Math.min(match.homeScore, match.awayScore);

    // Find the winning goal (the goal that gave the lead that was never surrendered)
    // The decisive goal is the (loserGoals + 1)th goal by the winner
    const winnerGoals = timeline
      .filter((e) => e.teamId === winnerTeamId)
      .sort((a, b) => a.sortMinute - b.sortMinute);

    const decisiveGoal = winnerGoals[loserGoals]; // 0-indexed
    if (!decisiveGoal) continue;

    if (!latest || decisiveGoal.sortMinute > latest.sortMinute) {
      latest = {
        playerName: decisiveGoal.playerName,
        playerId: decisiveGoal.playerId,
        teamId: decisiveGoal.teamId,
        teamName: getTeamName(decisiveGoal.teamId, nameMap),
        sortMinute: decisiveGoal.sortMinute,
        displayMinute: decisiveGoal.displayMinute,
        matchLabel: matchLabel(match, nameMap),
      };
    }
  }
  return latest;
};

// ─── 5. Hat-trick Heroes ───────────────────────────────────────

export const computeHatTrickHeroes = (
  fixtures: LeagueMatch[],
  standings?: LeagueStanding[],
): HatTrickHeroResult[] => {
  const nameMap = buildTeamNameMap(fixtures, standings);
  const heroes: HatTrickHeroResult[] = [];

  for (const match of fixtures) {
    if (match.status !== 'completed') continue;
    const timeline = getTimeline(match);
    if (timeline.length === 0) continue;

    // Count goals per player in this match
    const perPlayer: Record<string, { playerName: string; teamId: string; count: number }> = {};
    for (const event of timeline) {
      const key = `${event.teamId}:${event.playerId}`;
      if (!perPlayer[key]) {
        perPlayer[key] = { playerName: event.playerName, teamId: event.teamId, count: 0 };
      }
      perPlayer[key].count += 1;
    }

    for (const [key, data] of Object.entries(perPlayer)) {
      if (data.count >= 3) {
        const playerId = key.split(':')[1];
        heroes.push({
          playerName: data.playerName,
          playerId,
          teamId: data.teamId,
          teamName: getTeamName(data.teamId, nameMap),
          goals: data.count,
          matchLabel: matchLabel(match, nameMap),
        });
      }
    }
  }

  // Sort by goals DESC, then name
  return heroes.sort((a, b) => b.goals - a.goals || a.playerName.localeCompare(b.playerName));
};

// ─── 6. Penalty Specialist ─────────────────────────────────────
// Player with most penalty goals (isPenalty === true).

export const computePenaltySpecialist = (
  fixtures: LeagueMatch[],
  standings?: LeagueStanding[],
): PenaltySpecialistResult | null => {
  const nameMap = buildTeamNameMap(fixtures, standings);
  const penMap: Record<string, { playerName: string; teamId: string; count: number }> = {};

  for (const match of fixtures) {
    if (match.status !== 'completed') continue;
    const timeline = getTimeline(match);
    for (const event of timeline) {
      if (!event.isPenalty) continue;
      const key = `${event.teamId}:${event.playerId}`;
      if (!penMap[key]) {
        penMap[key] = { playerName: event.playerName, teamId: event.teamId, count: 0 };
      }
      penMap[key].count += 1;
    }
  }

  let best: PenaltySpecialistResult | null = null;
  for (const [key, data] of Object.entries(penMap)) {
    if (!best || data.count > best.penaltyGoals) {
      const playerId = key.split(':')[1];
      best = {
        playerName: data.playerName,
        playerId,
        teamId: data.teamId,
        teamName: getTeamName(data.teamId, nameMap),
        penaltyGoals: data.count,
      };
    }
  }
  return best;
};

// ─── 7. The Early Birds ────────────────────────────────────────
// Team with most goals scored in the first 15 minutes.

export const computeEarlyBirds = (
  fixtures: LeagueMatch[],
  standings?: LeagueStanding[],
): EarlyBirdsResult | null => {
  const nameMap = buildTeamNameMap(fixtures, standings);
  const earlyMap: Record<string, number> = {};

  for (const match of fixtures) {
    if (match.status !== 'completed') continue;
    const timeline = getTimeline(match);
    for (const event of timeline) {
      if (event.sortMinute <= 15) {
        earlyMap[event.teamId] = (earlyMap[event.teamId] || 0) + 1;
      }
    }
  }

  let best: EarlyBirdsResult | null = null;
  for (const [teamId, earlyGoals] of Object.entries(earlyMap)) {
    if (!best || earlyGoals > best.earlyGoals) {
      best = { teamId, teamName: getTeamName(teamId, nameMap), earlyGoals };
    }
  }
  return best;
};

// ─── 8. Penalty Villains ───────────────────────────────────────
// Team that conceded the most penalties (opponent scored isPenalty goals).

export const computePenaltyVillains = (
  fixtures: LeagueMatch[],
  standings?: LeagueStanding[],
): PenaltyVillainResult | null => {
  const nameMap = buildTeamNameMap(fixtures, standings);
  const villainMap: Record<string, number> = {};

  for (const match of fixtures) {
    if (match.status !== 'completed') continue;
    const timeline = getTimeline(match);
    for (const event of timeline) {
      if (!event.isPenalty) continue;
      // The scoring team got a penalty → the OPPONENT is the villain
      const villainTeamId = event.teamId === match.homeTeamId ? match.awayTeamId : match.homeTeamId;
      villainMap[villainTeamId] = (villainMap[villainTeamId] || 0) + 1;
    }
  }

  let best: PenaltyVillainResult | null = null;
  for (const [teamId, penaltiesConceded] of Object.entries(villainMap)) {
    if (!best || penaltiesConceded > best.penaltiesConceded) {
      best = { teamId, teamName: getTeamName(teamId, nameMap), penaltiesConceded };
    }
  }
  return best;
};

// ─── 9. The Entertainers ───────────────────────────────────────
// Team with highest average (goalsFor + goalsAgainst) per match.

export const computeEntertainers = (
  standings: LeagueStanding[],
): EntertainersResult | null => {
  let best: EntertainersResult | null = null;

  for (const s of standings) {
    if (s.played === 0) continue;
    const avg = (s.goalsFor + s.goalsAgainst) / s.played;
    if (!best || avg > best.avgTotalGoals) {
      best = {
        teamId: s.teamId,
        teamName: s.teamName,
        avgTotalGoals: Number(avg.toFixed(2)),
      };
    }
  }
  return best;
};
