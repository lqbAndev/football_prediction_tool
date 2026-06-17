import { ROUND_LABELS, TEAMS_BY_ID } from '../data/tournament';
import type {
  GroupMatch,
  KnockoutMatch,
  KnockoutRound,
  SeasonMOTM,
  Team,
  TopScorerEntry,
} from '../types/tournament';
import { buildBestXI, type BestXIResult } from './bestXI';

export interface ScorerInfo {
  playerName: string;
  displayMinute: string;
}

export interface MatchHighlight {
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  totalGoals: number;
  roundLabel: string;
  penalty: { home: number; away: number } | null;
  homeScorers: ScorerInfo[];
  awayScorers: ScorerInfo[];
}

export interface GoldenGloveInfo {
  playerName: string;
  teamName: string;
  cleanSheets: number;
}

export interface BiggestFlopInfo {
  teamName: string;
  rank: number;
}

export interface CinderellaInfo {
  teamName: string;
  rank: number;
  journey: string;
}

export interface TournamentRecapStats {
  champion: string;
  runnerUp: string;
  thirdPlace: string;
  topScorer: TopScorerEntry | null;
  seasonMOTM: SeasonMOTM | null;
  bestXI: BestXIResult | null;
  totalGoals: number;
  totalMatches: number;
  totalPenaltyMatches: number;
  highestScoringMatch: MatchHighlight | null;
  mostGoalsTeam: { teamName: string; goals: number } | null;
  mostConcededTeam: { teamName: string; goals: number } | null;
  finalMatch: MatchHighlight | null;
  thirdPlaceMatch: MatchHighlight | null;
  mostDramaticMatch: MatchHighlight | null;
  goalsPerMatch: number;
  isComplete: boolean;
  goldenGlove: GoldenGloveInfo | null;
  biggestFlop: BiggestFlopInfo | null;
  cinderella: CinderellaInfo | null;
}

const getTeamName = (teamId: string | null): string =>
  teamId ? (TEAMS_BY_ID[teamId]?.name ?? teamId) : 'TBD';

const buildMatchHighlight = (
  match: GroupMatch | KnockoutMatch,
  roundLabel: string,
): MatchHighlight | null => {
  if (match.homeScore == null || match.awayScore == null) {
    return null;
  }

  const homeScorers: ScorerInfo[] = [];
  const awayScorers: ScorerInfo[] = [];

  if (match.timeline) {
    for (const event of match.timeline) {
      const name = event.isOwnGoal ? `${event.playerName} (OG)` : event.playerName;
      const info: ScorerInfo = { playerName: name, displayMinute: event.displayMinute };
      if (event.side === 'home') {
        homeScorers.push(info);
      } else {
        awayScorers.push(info);
      }
    }
  } else if (match.scorers) {
    for (const event of match.scorers.home) {
      const name = event.isOwnGoal ? `${event.playerName} (OG)` : event.playerName;
      homeScorers.push({ playerName: name, displayMinute: `${event.minute}'` });
    }
    for (const event of match.scorers.away) {
      const name = event.isOwnGoal ? `${event.playerName} (OG)` : event.playerName;
      awayScorers.push({ playerName: name, displayMinute: `${event.minute}'` });
    }
  }

  return {
    homeTeamName: getTeamName(match.homeTeamId),
    awayTeamName: getTeamName(match.awayTeamId),
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    totalGoals: match.homeScore + match.awayScore,
    roundLabel,
    penalty: 'penalty' in match && match.penalty ? { home: match.penalty.home, away: match.penalty.away } : null,
    homeScorers,
    awayScorers,
  };
};

export const isTournamentComplete = (knockoutMatches: Record<KnockoutRound, KnockoutMatch[]>) => {
  const finalMatch = knockoutMatches.final[0];
  const thirdPlaceMatch = knockoutMatches.thirdPlace[0];

  return finalMatch?.status === 'completed' && thirdPlaceMatch?.status === 'completed';
};

export const calculateTournamentStats = (
  groupMatches: GroupMatch[],
  knockoutMatches: Record<KnockoutRound, KnockoutMatch[]>,
  topScorers: TopScorerEntry[],
  teams?: Team[],
): TournamentRecapStats => {
  const allKnockoutMatches = Object.values(knockoutMatches).flat();
  const completedGroupMatches = groupMatches.filter((match) => match.status === 'completed');
  const completedKnockoutMatches = allKnockoutMatches.filter((match) => match.status === 'completed');
  const isComplete = isTournamentComplete(knockoutMatches);

  const finalMatch = knockoutMatches.final[0];
  const thirdPlaceMatch = knockoutMatches.thirdPlace[0];
  const champion = getTeamName(finalMatch?.winnerTeamId ?? null);
  const runnerUp = getTeamName(finalMatch?.loserTeamId ?? null);
  const thirdPlace = getTeamName(thirdPlaceMatch?.winnerTeamId ?? null);

  let totalGoals = 0;
  const teamGoalsFor = new Map<string, number>();
  const teamGoalsAgainst = new Map<string, number>();

  const addGoals = (teamId: string | null, goalsFor: number, goalsAgainst: number) => {
    if (!teamId) {
      return;
    }
    teamGoalsFor.set(teamId, (teamGoalsFor.get(teamId) ?? 0) + goalsFor);
    teamGoalsAgainst.set(teamId, (teamGoalsAgainst.get(teamId) ?? 0) + goalsAgainst);
  };

  for (const match of [...completedGroupMatches, ...completedKnockoutMatches]) {
    if (match.homeScore == null || match.awayScore == null) {
      continue;
    }

    totalGoals += match.homeScore + match.awayScore;
    addGoals(match.homeTeamId, match.homeScore, match.awayScore);
    addGoals(match.awayTeamId, match.awayScore, match.homeScore);
  }

  const totalMatches = completedGroupMatches.length + completedKnockoutMatches.length;
  const totalPenaltyMatches = completedKnockoutMatches.filter((match) => match.penalty !== null).length;

  let highestScoringMatch: MatchHighlight | null = null;
  let highestGoals = -1;

  for (const match of completedGroupMatches) {
    const goals = (match.homeScore ?? 0) + (match.awayScore ?? 0);
    if (goals > highestGoals) {
      highestGoals = goals;
      highestScoringMatch = buildMatchHighlight(match, `Group ${match.group}`);
    }
  }

  for (const match of completedKnockoutMatches) {
    const goals = (match.homeScore ?? 0) + (match.awayScore ?? 0);
    if (goals > highestGoals) {
      highestGoals = goals;
      highestScoringMatch = buildMatchHighlight(match, ROUND_LABELS[match.round]);
    }
  }

  let mostGoalsTeam: { teamName: string; goals: number } | null = null;
  let maxGoals = -1;
  for (const [teamId, goals] of teamGoalsFor) {
    if (goals > maxGoals) {
      maxGoals = goals;
      mostGoalsTeam = { teamName: getTeamName(teamId), goals };
    }
  }

  let mostConcededTeam: { teamName: string; goals: number } | null = null;
  let maxConceded = -1;
  for (const [teamId, goals] of teamGoalsAgainst) {
    if (goals > maxConceded) {
      maxConceded = goals;
      mostConcededTeam = { teamName: getTeamName(teamId), goals };
    }
  }

  const finalMatchHighlight = finalMatch ? buildMatchHighlight(finalMatch, 'Final') : null;
  const thirdPlaceMatchHighlight = thirdPlaceMatch ? buildMatchHighlight(thirdPlaceMatch, 'Third Place Match') : null;

  let mostDramaticMatch: MatchHighlight | null = null;
  let highestDramaScore = -1;

  const computeDramaScore = (match: GroupMatch | KnockoutMatch) => {
    if (match.homeScore == null || match.awayScore == null) {
      return -1;
    }

    const goalDiff = Math.abs(match.homeScore - match.awayScore);
    let score = 0;
    if ('penalty' in match && match.penalty) {
      score += 10;
    }
    if (goalDiff === 0) {
      score += 5;
    } else if (goalDiff === 1) {
      score += 3;
    }
    score += (match.homeScore + match.awayScore) * 0.5;
    return score;
  };

  for (const match of completedGroupMatches) {
    const dramaScore = computeDramaScore(match);
    if (dramaScore > highestDramaScore) {
      highestDramaScore = dramaScore;
      mostDramaticMatch = buildMatchHighlight(match, `Group ${match.group}`);
    }
  }

  for (const match of completedKnockoutMatches) {
    if (match.round === 'final' || match.round === 'thirdPlace') {
      continue;
    }
    const dramaScore = computeDramaScore(match);
    if (dramaScore > highestDramaScore) {
      highestDramaScore = dramaScore;
      mostDramaticMatch = buildMatchHighlight(match, ROUND_LABELS[match.round]);
    }
  }

  const goalsPerMatch = totalMatches > 0 ? Number((totalGoals / totalMatches).toFixed(2)) : 0;
  const bestXI = isComplete ? buildBestXI(groupMatches, knockoutMatches) : null;

  // MOTS = Best Player from Best XI of the Tournament
  let seasonMOTM: SeasonMOTM | null = null;
  if (bestXI?.bestPlayer) {
    seasonMOTM = {
      playerName: bestXI.bestPlayer.playerName,
      teamName: bestXI.bestPlayer.teamName,
      motmCount: bestXI.bestPlayer.motmCount,
      motmScore: bestXI.bestPlayer.totalScore,
    };
  }

  // ═══ GOLDEN GLOVE — synced from Best XI goalkeeper (GK with most clean sheets) ═══
  let goldenGlove: GoldenGloveInfo | null = null;
  if (isComplete) {
    // Count clean sheets per GK using match data (same logic as bestXI.ts)
    const gkCleanSheets = new Map<string, { name: string; teamName: string; count: number }>();

    for (const match of [...completedGroupMatches, ...completedKnockoutMatches]) {
      if (match.homeScore == null || match.awayScore == null) continue;
      if (!match.homeTeamId || !match.awayTeamId) continue;

      const homeTeam = TEAMS_BY_ID[match.homeTeamId];
      const awayTeam = TEAMS_BY_ID[match.awayTeamId];

      if (match.awayScore === 0 && homeTeam) {
        const gk = homeTeam.players.find(p => p.position === 'GK');
        if (gk) {
          const key = `${homeTeam.id}:${gk.id}`;
          const existing = gkCleanSheets.get(key);
          gkCleanSheets.set(key, {
            name: gk.name,
            teamName: homeTeam.name,
            count: (existing?.count ?? 0) + 1,
          });
        }
      }
      if (match.homeScore === 0 && awayTeam) {
        const gk = awayTeam.players.find(p => p.position === 'GK');
        if (gk) {
          const key = `${awayTeam.id}:${gk.id}`;
          const existing = gkCleanSheets.get(key);
          gkCleanSheets.set(key, {
            name: gk.name,
            teamName: awayTeam.name,
            count: (existing?.count ?? 0) + 1,
          });
        }
      }
    }

    // Pick the GK with most clean sheets (same tie-break as bestXI.ts)
    let bestCS = 0;
    for (const [, info] of gkCleanSheets) {
      if (info.count > bestCS) {
        bestCS = info.count;
        goldenGlove = { playerName: info.name, teamName: info.teamName, cleanSheets: info.count };
      }
    }
  }

  // ═══ BIGGEST FLOP — Top 10 rated team eliminated in group stage ═══
  let biggestFlop: BiggestFlopInfo | null = null;
  if (isComplete && teams?.length) {
    const sortedByRating = [...teams].sort((a, b) => b.rating - a.rating);
    const top12 = sortedByRating.slice(0, 12);

    // Find teams that did NOT appear in any knockout match
    const knockoutTeamIds = new Set<string>();
    for (const matches of Object.values(knockoutMatches)) {
      for (const match of matches) {
        if (match.homeTeamId) knockoutTeamIds.add(match.homeTeamId);
        if (match.awayTeamId) knockoutTeamIds.add(match.awayTeamId);
      }
    }

    for (let i = 0; i < top12.length; i++) {
      const team = top12[i];
      if (!knockoutTeamIds.has(team.id)) {
        biggestFlop = { teamName: team.name, rank: i + 1 };
        break;
      }
    }
  }

  // ═══ CINDERELLA — Bottom-half rated team reaching QF or further ═══
  let cinderella: CinderellaInfo | null = null;
  if (isComplete && teams?.length) {
    const sortedByRating = [...teams].sort((a, b) => b.rating - a.rating);
    const halfwayIndex = Math.floor(sortedByRating.length / 2);
    const bottomHalf = new Set(sortedByRating.slice(halfwayIndex).map((t) => t.id));

    const KO_ROUND_ORDER = ['roundOf32', 'roundOf16', 'quarterfinals', 'semifinals', 'thirdPlace', 'final'] as const;
    const DEEP_ROUNDS: string[] = ['roundOf16', 'quarterfinals', 'semifinals', 'thirdPlace', 'final'];

    const deepestRound = new Map<string, string>();
    for (const round of KO_ROUND_ORDER) {
      for (const match of knockoutMatches[round]) {
        if (match.status !== 'completed') continue;
        if (match.homeTeamId && bottomHalf.has(match.homeTeamId) && DEEP_ROUNDS.includes(round)) {
          deepestRound.set(match.homeTeamId, round);
        }
        if (match.awayTeamId && bottomHalf.has(match.awayTeamId) && DEEP_ROUNDS.includes(round)) {
          deepestRound.set(match.awayTeamId, round);
        }
      }
    }

    const ROUND_DEPTH: Record<string, number> = {
      roundOf16: 1,
      quarterfinals: 2,
      semifinals: 3,
      thirdPlace: 4,
      final: 5,
    };

    let bestCinderellaId: string | null = null;
    let bestDepth = 0;
    let bestRating = Infinity;

    for (const [teamId, round] of deepestRound) {
      const depth = ROUND_DEPTH[round] ?? 0;
      const teamData = TEAMS_BY_ID[teamId];
      if (!teamData) continue;

      if (depth > bestDepth || (depth === bestDepth && teamData.rating < bestRating)) {
        bestDepth = depth;
        bestRating = teamData.rating;
        bestCinderellaId = teamId;
      }
    }

    if (bestCinderellaId) {
      const team = TEAMS_BY_ID[bestCinderellaId];
      const rank = sortedByRating.findIndex(t => t.id === bestCinderellaId) + 1;
      const roundLabel = ROUND_LABELS[deepestRound.get(bestCinderellaId)! as keyof typeof ROUND_LABELS] ?? deepestRound.get(bestCinderellaId)!;
      cinderella = {
        teamName: team.name,
        rank: rank,
        journey: `Reached ${roundLabel}`,
      };
    }
  }

  return {
    champion,
    runnerUp,
    thirdPlace,
    topScorer: topScorers[0] ?? null,
    seasonMOTM,
    bestXI,
    totalGoals,
    totalMatches,
    totalPenaltyMatches,
    highestScoringMatch,
    mostGoalsTeam,
    mostConcededTeam,
    finalMatch: finalMatchHighlight,
    thirdPlaceMatch: thirdPlaceMatchHighlight,
    mostDramaticMatch,
    goalsPerMatch,
    isComplete,
    goldenGlove,
    biggestFlop,
    cinderella,
  };
};
