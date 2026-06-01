import { TEAMS_BY_ID } from '../data/tournament';
import type {
  GroupMatch,
  KnockoutMatch,
  KnockoutRound,
  MatchMOTM,
  MatchMOTMReason,
  SeasonMOTM,
  Team,
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

export const computeMatchMOTM = (match: CompletedMatch): MatchMOTM | null => {
  if (match.status !== 'completed') {
    return null;
  }

  const goalEvents = buildGoalEvents(match);

  if (!goalEvents.length) {
    return pickFallbackMOTM(match);
  }

  const candidates = buildCandidates(goalEvents);

  if (!candidates.length) {
    return pickFallbackMOTM(match);
  }

  const maxGoals = Math.max(...candidates.map((candidate) => candidate.goals));
  const topCandidates = candidates.filter((candidate) => candidate.goals === maxGoals);

  if (topCandidates.length === 1) {
    return toMatchMOTM(topCandidates[0], 'top-goals');
  }

  const decisiveScorer = getDecisiveGoalScorer(match, goalEvents);
  if (decisiveScorer) {
    const decisiveCandidate = topCandidates.find(
      (candidate) =>
        candidate.playerId === decisiveScorer.playerId && candidate.teamId === decisiveScorer.teamId,
    );

    if (decisiveCandidate) {
      return toMatchMOTM(decisiveCandidate, 'decisive-goal');
    }
  }

  const winnerTeamId = inferWinnerTeamId(match);
  const winnerCandidates = winnerTeamId
    ? topCandidates.filter((candidate) => candidate.teamId === winnerTeamId)
    : [];

  if (winnerCandidates.length === 1) {
    return toMatchMOTM(winnerCandidates[0], 'winner-priority');
  }

  if (winnerCandidates.length > 1) {
    const selected = pickByHash(winnerCandidates, buildSeed(match, 'winner-random'));
    return toMatchMOTM(selected, 'controlled-random');
  }

  const selected = pickByHash(topCandidates, buildSeed(match, 'top-random'));
  return toMatchMOTM(selected, 'controlled-random');
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

  const goalEvents: MatchGoalEvent[] = [];

  if (match.timeline?.length) {
    for (const event of match.timeline) {
      goalEvents.push({
        playerId: event.playerId,
        playerName: event.playerName,
        teamId: event.teamId,
        side: event.side,
        sortMinute: event.sortMinute,
      });
    }
  } else if (match.scorers) {
    for (const s of match.scorers.home) {
      goalEvents.push({ playerId: s.playerId, playerName: s.playerName, teamId: s.teamId, side: 'home', sortMinute: s.minute });
    }
    for (const s of match.scorers.away) {
      goalEvents.push({ playerId: s.playerId, playerName: s.playerName, teamId: s.teamId, side: 'away', sortMinute: s.minute });
    }
  }

  if (!goalEvents.length) {
    // 0-0 draw: pick a random DF or GK from one of the two teams
    if (homeTeam && awayTeam) {
      const selectedTeam = Math.random() < 0.5 ? homeTeam : awayTeam;
      const defenders = selectedTeam.players.filter(p => p.position === 'DF' || p.position === 'GK');
      if (defenders.length > 0) {
        const player = defenders[Math.floor(Math.random() * defenders.length)];
        return {
          playerId: player.id,
          playerName: player.name,
          teamId: selectedTeam.id,
          teamName: selectedTeam.name,
          reason: 'clean-sheet',
        };
      }
    }
    return null;
  }

  goalEvents.sort((a, b) => a.sortMinute - b.sortMinute);
  const candidates = buildCandidates(goalEvents);
  if (!candidates.length) return null;

  const maxGoals = Math.max(...candidates.map((c) => c.goals));
  const topCandidates = candidates.filter((c) => c.goals === maxGoals);

  if (topCandidates.length === 1) {
    const c = topCandidates[0];
    return { playerId: c.playerId, playerName: c.playerName, teamId: c.teamId, teamName: c.teamName, reason: 'top-goals' };
  }

  // Decisive goal check
  const winnerTeamId = match.homeScore !== null && match.awayScore !== null && match.homeScore !== match.awayScore
    ? (match.homeScore > match.awayScore ? match.homeTeamId : match.awayTeamId)
    : null;

  if (winnerTeamId) {
    const loserGoals = Math.min(match.homeScore!, match.awayScore!);
    const decisiveOrder = loserGoals + 1;
    let winnerGoalCount = 0;
    let decisiveScorer: MatchGoalEvent | null = null;
    for (const event of goalEvents) {
      if (event.teamId === winnerTeamId) {
        winnerGoalCount++;
        if (winnerGoalCount === decisiveOrder) { decisiveScorer = event; break; }
      }
    }
    if (decisiveScorer) {
      const dc = topCandidates.find((c) => c.playerId === decisiveScorer!.playerId && c.teamId === decisiveScorer!.teamId);
      if (dc) return { playerId: dc.playerId, playerName: dc.playerName, teamId: dc.teamId, teamName: dc.teamName, reason: 'decisive-goal' };
    }

    // Winner priority
    const winnerCandidates = topCandidates.filter((c) => c.teamId === winnerTeamId);
    if (winnerCandidates.length === 1) {
      const c = winnerCandidates[0];
      return { playerId: c.playerId, playerName: c.playerName, teamId: c.teamId, teamName: c.teamName, reason: 'winner-priority' };
    }
    if (winnerCandidates.length > 1) {
      const seed = `${match.id}|${match.homeScore}|${match.awayScore}|${match.predictedAt}`;
      const c = pickByHash(winnerCandidates, seed);
      return { playerId: c.playerId, playerName: c.playerName, teamId: c.teamId, teamName: c.teamName, reason: 'controlled-random' };
    }
  }

  // Draw or no winner candidates — hash pick from all top
  const seed = `${match.id}|${match.homeScore}|${match.awayScore}|${match.predictedAt}|top`;
  const c = pickByHash(topCandidates, seed);
  return { playerId: c.playerId, playerName: c.playerName, teamId: c.teamId, teamName: c.teamName, reason: 'controlled-random' };
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
