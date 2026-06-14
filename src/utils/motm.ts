import { TEAMS_BY_ID } from '../data/tournament';
import { EPL_TEAMS_BY_ID } from '../data/competitions/epl2526/teams';
import type {
  GroupMatch,
  KnockoutMatch,
  KnockoutRound,
  MatchMOTM,
  MatchMOTMReason,
  SeasonMOTM,
  Team,
  PlayerProfile,
} from '../types/tournament';
import type { LeagueMatch, LeagueStanding } from '../types/leagueConfig';

type CompletedMatch = GroupMatch | KnockoutMatch;

interface MatchGoalEvent {
  playerId: string;
  playerName: string;
  teamId: string;
  side: 'home' | 'away';
  sortMinute: number;
}

interface MotmCandidate {
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  goals: number;
}

const hashString = (value: string) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
};

const pickByHash = <T,>(items: T[], seed: string): T => items[hashString(seed) % items.length];

const buildSeed = (match: CompletedMatch, suffix = '') => {
  const base = [
    match.id,
    match.stage,
    String(match.homeScore ?? ''),
    String(match.awayScore ?? ''),
    match.predictedAt ?? '',
    suffix,
  ];

  if (match.stage === 'knockout') {
    base.push(match.round, String(match.slot), match.winnerTeamId ?? '');
  }

  return base.join('|');
};

const getTeamName = (teamId: string) => TEAMS_BY_ID[teamId]?.name ?? teamId;

const inferWinnerTeamId = (match: CompletedMatch) => {
  if (match.stage === 'knockout' && match.winnerTeamId) {
    return match.winnerTeamId;
  }

  if (match.homeScore === null || match.awayScore === null) {
    return null;
  }

  if (match.homeScore > match.awayScore) {
    return match.homeTeamId;
  }

  if (match.awayScore > match.homeScore) {
    return match.awayTeamId;
  }

  return null;
};

const buildGoalEvents = (match: CompletedMatch): MatchGoalEvent[] => {
  if (match.timeline?.length) {
    return [...match.timeline]
      .sort((left, right) => left.sortMinute - right.sortMinute)
      .map((event) => ({
        playerId: event.playerId,
        playerName: event.playerName,
        teamId: event.teamId,
        side: event.side,
        sortMinute: event.sortMinute,
      }));
  }

  const fallbackEvents: MatchGoalEvent[] = [];

  if (match.scorers?.home.length) {
    for (const scorer of match.scorers.home) {
      const fallbackTeamId = match.homeTeamId;
      const resolvedTeamId = scorer.teamId ?? fallbackTeamId;

      if (!resolvedTeamId) {
        continue;
      }

      fallbackEvents.push({
        playerId: scorer.playerId,
        playerName: scorer.playerName,
        teamId: resolvedTeamId,
        side: 'home',
        sortMinute: scorer.minute,
      });
    }
  }

  if (match.scorers?.away.length) {
    for (const scorer of match.scorers.away) {
      const fallbackTeamId = match.awayTeamId;
      const resolvedTeamId = scorer.teamId ?? fallbackTeamId;

      if (!resolvedTeamId) {
        continue;
      }

      fallbackEvents.push({
        playerId: scorer.playerId,
        playerName: scorer.playerName,
        teamId: resolvedTeamId,
        side: 'away',
        sortMinute: scorer.minute,
      });
    }
  }

  return fallbackEvents.sort((left, right) => left.sortMinute - right.sortMinute);
};

const buildCandidates = (events: MatchGoalEvent[]) => {
  const candidateMap = new Map<string, MotmCandidate>();

  for (const event of events) {
    const key = `${event.teamId}:${event.playerId}`;
    const current = candidateMap.get(key);

    if (current) {
      current.goals += 1;
      continue;
    }

    candidateMap.set(key, {
      playerId: event.playerId,
      playerName: event.playerName,
      teamId: event.teamId,
      teamName: getTeamName(event.teamId),
      goals: 1,
    });
  }

  return Array.from(candidateMap.values());
};

const toMatchMOTM = (candidate: MotmCandidate, reason: MatchMOTMReason): MatchMOTM => ({
  playerName: candidate.playerName,
  teamName: candidate.teamName,
  reason,
});

const getDecisiveGoalScorer = (match: CompletedMatch, events: MatchGoalEvent[]) => {
  const winnerTeamId = inferWinnerTeamId(match);

  if (!winnerTeamId || match.homeScore === null || match.awayScore === null || match.homeScore === match.awayScore) {
    return null;
  }

  const loserGoals = Math.min(match.homeScore, match.awayScore);
  const decisiveGoalOrder = loserGoals + 1;
  let winnerGoalCount = 0;

  for (const event of events) {
    if (event.teamId !== winnerTeamId) {
      continue;
    }

    winnerGoalCount += 1;

    if (winnerGoalCount === decisiveGoalOrder) {
      return event;
    }
  }

  return null;
};

const pickFallbackFromTeam = (team: Team, seed: string): MatchMOTM => {
  const player = pickByHash(team.players, seed);

  return {
    playerName: player.name,
    teamName: team.name,
    reason: 'controlled-random',
  };
};

const pickFallbackMOTM = (match: CompletedMatch): MatchMOTM | null => {
  const winnerTeamId = inferWinnerTeamId(match);

  if (winnerTeamId && TEAMS_BY_ID[winnerTeamId]?.players.length) {
    return pickFallbackFromTeam(TEAMS_BY_ID[winnerTeamId], buildSeed(match, 'fallback-winner'));
  }

  const availableTeamIds = [match.homeTeamId, match.awayTeamId].filter(Boolean) as string[];
  if (!availableTeamIds.length) {
    return null;
  }

  const selectedTeamId = pickByHash(availableTeamIds, buildSeed(match, 'fallback-team'));
  const selectedTeam = TEAMS_BY_ID[selectedTeamId];

  if (!selectedTeam?.players.length) {
    return null;
  }

  return pickFallbackFromTeam(selectedTeam, buildSeed(match, 'fallback-player'));
};

export const calculateMatchMOTM = (
  match: CompletedMatch | LeagueMatch,
  homeTeam: Team,
  awayTeam: Team
): { playerId: string; playerName: string; teamId: string; teamName: string; reason: MatchMOTMReason } | null => {
  if (match.status !== 'completed') return null;

  const homeScore = match.homeScore ?? 0;
  const awayScore = match.awayScore ?? 0;

  // 1. Determine winner
  let winnerTeamId: string | null = null;
  if ('winnerTeamId' in match && match.winnerTeamId) {
    winnerTeamId = match.winnerTeamId;
  } else if (homeScore > awayScore) {
    winnerTeamId = match.homeTeamId;
  } else if (awayScore > homeScore) {
    winnerTeamId = match.awayTeamId;
  }

  // Initialize player scores Map
  const playerScores = new Map<string, { player: PlayerProfile; team: Team; score: number }>();

  const initializePlayers = (team: Team) => {
    for (const player of team.players) {
      playerScores.set(`${team.id}:${player.id}`, {
        player,
        team,
        score: 0,
      });
    }
  };

  initializePlayers(homeTeam);
  initializePlayers(awayTeam);

  // 2. Goal scoring: Forward (+4 pts), Midfielder (+5 pts), Defender/Goalkeeper (+8 pts)
  const goalEvents: { playerId: string; teamId: string }[] = [];
  if (match.timeline?.length) {
    for (const event of match.timeline) {
      goalEvents.push({ playerId: event.playerId, teamId: event.teamId });
    }
  } else if (match.scorers) {
    for (const scorer of match.scorers.home) {
      goalEvents.push({ playerId: scorer.playerId, teamId: homeTeam.id });
    }
    for (const scorer of match.scorers.away) {
      goalEvents.push({ playerId: scorer.playerId, teamId: awayTeam.id });
    }
  }

  for (const event of goalEvents) {
    const key = `${event.teamId}:${event.playerId}`;
    const entry = playerScores.get(key);
    if (entry) {
      const pos = entry.player.position;
      let points = 0;
      if (pos === 'FW') points = 4;
      else if (pos === 'MF') points = 5;
      else if (pos === 'DF' || pos === 'GK') points = 8;
      entry.score += points;
    }
  }

  // 3. Clean Sheet: Goalkeeper #1 and all Defenders (DF) get +4 pts
  const awardCleanSheet = (team: Team) => {
    // Only primary GK (index 0 in GK list)
    const gks = team.players.filter((p) => p.position === 'GK');
    if (gks.length > 0) {
      const entry = playerScores.get(`${team.id}:${gks[0].id}`);
      if (entry) entry.score += 4;
    }
    // All Defenders (DF)
    for (const p of team.players) {
      if (p.position === 'DF') {
        const entry = playerScores.get(`${team.id}:${p.id}`);
        if (entry) entry.score += 4;
      }
    }
  };

  if (awayScore === 0) {
    awardCleanSheet(homeTeam);
  }
  if (homeScore === 0) {
    awardCleanSheet(awayTeam);
  }

  // 4. Winner Team: +2 pts for all players
  if (winnerTeamId) {
    const winnerTeam = winnerTeamId === homeTeam.id ? homeTeam : awayTeam;
    for (const p of winnerTeam.players) {
      const entry = playerScores.get(`${winnerTeam.id}:${p.id}`);
      if (entry) entry.score += 2;
    }
  }

  // 5. Small random factor (Math.random() * 2) to break ties dynamically
  for (const entry of playerScores.values()) {
    entry.score += Math.random() * 2;
  }

  // Find player with the highest score
  let bestPlayerKey: string | null = null;
  let maxScore = -1;

  for (const [key, entry] of playerScores.entries()) {
    if (entry.score > maxScore) {
      maxScore = entry.score;
      bestPlayerKey = key;
    }
  }

  if (!bestPlayerKey) return null;
  const bestEntry = playerScores.get(bestPlayerKey)!;

  return {
    playerId: bestEntry.player.id,
    playerName: bestEntry.player.name,
    teamId: bestEntry.team.id,
    teamName: bestEntry.team.name,
    reason: 'performance-points',
  };
};

export const computeMatchMOTM = (match: CompletedMatch): MatchMOTM | null => {
  if (match.status !== 'completed') {
    return null;
  }

  if (!match.homeTeamId || !match.awayTeamId) return null;
  const homeTeam = TEAMS_BY_ID[match.homeTeamId];
  const awayTeam = TEAMS_BY_ID[match.awayTeamId];
  if (!homeTeam || !awayTeam) return null;

  const result = calculateMatchMOTM(match, homeTeam, awayTeam);
  if (!result) return null;

  return {
    playerName: result.playerName,
    teamName: result.teamName,
    reason: result.reason,
  };
};

const KNOCKOUT_MOTM_BONUS: Record<KnockoutRound, number> = {
  roundOf32: 0.25,
  roundOf16: 0.4,
  quarterfinals: 0.6,
  semifinals: 0.9,
  thirdPlace: 0.75,
  final: 1.25,
};

export const buildSeasonMOTM = (
  groupMatches: GroupMatch[],
  knockoutMatches: Record<KnockoutRound, KnockoutMatch[]>,
): SeasonMOTM | null => {
  const aggregate = new Map<string, SeasonMOTM>();

  const addAward = (playerName: string, teamName: string, bonus: number) => {
    const key = `${teamName}::${playerName}`;
    const current = aggregate.get(key);

    if (current) {
      current.motmCount += 1;
      current.motmScore += 1 + bonus;
      return;
    }

    aggregate.set(key, {
      playerName,
      teamName,
      motmCount: 1,
      motmScore: 1 + bonus,
    });
  };

  for (const match of groupMatches) {
    if (match.status !== 'completed' || !match.motm) {
      continue;
    }

    addAward(match.motm.playerName, match.motm.teamName, 0);
  }

  for (const round of Object.keys(knockoutMatches) as KnockoutRound[]) {
    const roundBonus = KNOCKOUT_MOTM_BONUS[round];
    for (const match of knockoutMatches[round]) {
      if (match.status !== 'completed' || !match.motm) {
        continue;
      }

      addAward(match.motm.playerName, match.motm.teamName, roundBonus);
    }
  }

  const leaderboard = Array.from(aggregate.values()).sort((left, right) => {
    if (right.motmCount !== left.motmCount) {
      return right.motmCount - left.motmCount;
    }

    if (right.motmScore !== left.motmScore) {
      return right.motmScore - left.motmScore;
    }

    const byName = left.playerName.localeCompare(right.playerName);
    if (byName !== 0) {
      return byName;
    }

    return left.teamName.localeCompare(right.teamName);
  });

  if (!leaderboard.length) {
    return null;
  }

  const seasonWinner = leaderboard[0];
  return {
    ...seasonWinner,
    motmScore: Number(seasonWinner.motmScore.toFixed(2)),
  };
};

// ═══════════════════════════════════════════════════════════════
//  LEAGUE-MODE MOTM & MOTS (Man Of The Season)
// ═══════════════════════════════════════════════════════════════

export interface LeagueMOTS {
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  motmCount: number;
  points: number;
  teamPosition: number;
}

/**
 * Computes MOTM for a league match using the same goal-based algorithm.
 * Adapts the tournament computeMatchMOTM for LeagueMatch shape.
 */
export const computeLeagueMatchMOTM = (
  match: LeagueMatch,
  homeTeam?: Team,
  awayTeam?: Team,
): { playerId: string; playerName: string; teamId: string; teamName: string; reason: string } | null => {
  if (match.status !== 'completed') return null;

  const resolvedHome = homeTeam ?? EPL_TEAMS_BY_ID[match.homeTeamId];
  const resolvedAway = awayTeam ?? EPL_TEAMS_BY_ID[match.awayTeamId];
  if (!resolvedHome || !resolvedAway) return null;

  return calculateMatchMOTM(match, resolvedHome, resolvedAway);
};

/**
 * Builds the Man Of The Season (MOTS) for league mode.
 * Each MOTM award gives 3 points. Champion team player gets +10 points, Top 4 team player gets +5 points.
 * Sorts by points (DESC), then by team position (ASC) as tie-breaker.
 */
export const buildLeagueSeasonMOTM = (
  fixtures: LeagueMatch[],
  standings?: LeagueStanding[],
): LeagueMOTS | null => {
  // 1. Count MOTM awards per player
  const aggregate = new Map<string, { playerId: string; playerName: string; teamId: string; teamName: string; motmCount: number }>();

  for (const match of fixtures) {
    if (match.status !== 'completed' || !match.motm) continue;
    const { playerId, playerName, teamId, teamName } = match.motm;
    const key = `${teamId}::${playerId}`;
    const current = aggregate.get(key);
    if (current) {
      current.motmCount += 1;
    } else {
      aggregate.set(key, { playerId, playerName, teamId, teamName, motmCount: 1 });
    }
  }

  if (aggregate.size === 0) return null;

  // 2. Build standings lookup
  const teamPositionMap = new Map<string, number>();
  if (standings) {
    for (const s of standings) {
      teamPositionMap.set(s.teamId, s.position);
    }
  }

  // 3. Calculate points for each player
  const leaderboard: LeagueMOTS[] = Array.from(aggregate.values()).map((entry) => {
    const teamPosition = teamPositionMap.get(entry.teamId) ?? 99;
    let points = entry.motmCount * 3; // Each MOTM = +3 points

    // Champion bonus (1st place) = +10
    if (teamPosition === 1) points += 10;
    // Top 4 bonus = +5
    else if (teamPosition <= 4) points += 5;

    return {
      ...entry,
      points,
      teamPosition,
    };
  });

  // 4. Sort: points DESC → team position ASC (higher ranked team wins tiebreak)
  leaderboard.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (a.teamPosition !== b.teamPosition) return a.teamPosition - b.teamPosition;
    return a.playerName.localeCompare(b.playerName);
  });

  return leaderboard[0];
};
