import type { Team, TopScorerEntry } from '../types/tournament';
import type { LeagueMatch } from '../types/leagueConfig';
import type { TwoLegMatch } from '../types/uclConfig';
import type { BestXIPlayer, BestXIResult } from './bestXI';

interface PlayerTournamentStats {
  playerId: string;
  name: string;
  teamId: string;
  position: Team['players'][number]['position'];
  goals: number;
  penalties: number;
  motmAwards: number;
  cleanSheets: number;
  ratingTotal: number;
  ratingAppearances: number;
  goalPoints: number;
  cleanSheetPoints: number;
  motmPoints: number;
  teamWinPoints: number;
  achievementPoints: number;
}

interface GoalEvent {
  playerId: string;
  playerName: string;
  teamId: string;
  isPenalty?: boolean;
  isOwnGoal?: boolean;
}

interface MatchSnapshot {
  id: string;
  stage: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  timeline?: GoalEvent[];
  scorers?: LeagueMatch['scorers'];
  motm?: LeagueMatch['motm'];
  playerRatings?: Record<string, number>;
}

export interface UCLRecapStats {
  playerOfTheSeason: {
    playerName: string;
    teamName: string;
    teamLogo?: string;
    position: string;
    rating: number;
    points: number;
    goals: number;
    motmAwards: number;
  } | null;
  topScorers: TopScorerEntry[];
  mostMotmAwards: { playerName: string; teamName: string; teamLogo?: string; awards: number }[];
  goldenGlove: { playerName: string; teamName: string; teamLogo?: string; cleanSheets: number } | null;
  bestAttackingTeam: { teamName: string; teamLogo?: string; goals: number; average: string } | null;
  bestDefensiveTeam: { teamName: string; teamLogo?: string; conceded: number } | null;
  highestScoringMatch: {
    matchId: string;
    stage: string;
    homeTeamName: string;
    awayTeamName: string;
    homeTeamLogo?: string;
    awayTeamLogo?: string;
    homeScore: number;
    awayScore: number;
    totalGoals: number;
  } | null;
  tournamentGoalAnalysis: {
    totalGoals: number;
    totalMatches: number;
    averagePerMatch: string;
    openPlayPercent: string;
    penaltyPercent: string;
  };
  bestXI: BestXIResult | null;
}

const clampRating = (rating: number) => Math.max(4, Math.min(10, Number(rating.toFixed(1))));

export const computeUclRecapStats = (
  leagueMatches: LeagueMatch[],
  knockoutMatches: TwoLegMatch[],
  teams: Team[],
): UCLRecapStats => {
  const teamMap = new Map(teams.map((team) => [team.id, team]));
  const playerStats = new Map<string, PlayerTournamentStats>();

  teams.forEach((team) => {
    team.players.forEach((player) => {
      playerStats.set(`${team.id}:${player.id}`, {
        playerId: player.id,
        name: player.name,
        teamId: team.id,
        position: player.position,
        goals: 0,
        penalties: 0,
        motmAwards: 0,
        cleanSheets: 0,
        ratingTotal: 0,
        ratingAppearances: 0,
        goalPoints: 0,
        cleanSheetPoints: 0,
        motmPoints: 0,
        teamWinPoints: 0,
        achievementPoints: 0,
      });
    });
  });

  const resolvePlayer = (teamId: string, playerId?: string, playerName?: string) => {
    if (playerId) {
      const direct = playerStats.get(`${teamId}:${playerId}`);
      if (direct) return direct;
    }
    const player = teamMap.get(teamId)?.players.find((candidate) => candidate.name === playerName);
    return player ? playerStats.get(`${teamId}:${player.id}`) : undefined;
  };

  const teamGoalsScored = new Map(teams.map((team) => [team.id, 0]));
  const teamGoalsConceded = new Map(teams.map((team) => [team.id, 0]));
  const teamMatchesPlayed = new Map(teams.map((team) => [team.id, 0]));
  let totalGoals = 0;
  let totalPenalties = 0;
  let totalMatches = 0;
  let highestScoringMatch: UCLRecapStats['highestScoringMatch'] = null;

  const buildLegacyRatings = (match: MatchSnapshot, goalEvents: GoalEvent[]) => {
    const ratings: Record<string, number> = {};
    const winnerId = match.homeScore === match.awayScore
      ? null
      : match.homeScore > match.awayScore
      ? match.homeTeamId
      : match.awayTeamId;

    [match.homeTeamId, match.awayTeamId].forEach((teamId) => {
      const boost = winnerId === null ? 0.1 : winnerId === teamId ? 0.35 : -0.15;
      teamMap.get(teamId)?.players.forEach((player) => {
        ratings[player.id] = 6.2 + boost;
      });
    });

    goalEvents.forEach((event) => {
      const player = resolvePlayer(event.teamId, event.playerId, event.playerName);
      if (!player) return;
      if (event.isOwnGoal) ratings[player.playerId] -= 0.8;
      else ratings[player.playerId] += player.position === 'FW' ? 0.85 : player.position === 'MF' ? 1 : 1.2;
    });

    if (match.awayScore === 0) {
      const home = teamMap.get(match.homeTeamId);
      const goalkeeper = home?.players.find((player) => player.position === 'GK');
      if (goalkeeper) ratings[goalkeeper.id] += 0.8;
    }
    if (match.homeScore === 0) {
      const away = teamMap.get(match.awayTeamId);
      const goalkeeper = away?.players.find((player) => player.position === 'GK');
      if (goalkeeper) ratings[goalkeeper.id] += 0.8;
    }
    if (match.motm?.playerId) ratings[match.motm.playerId] = Math.max(ratings[match.motm.playerId] || 0, 8.7);
    return ratings;
  };

  const processMatch = (match: MatchSnapshot) => {
    const homeTeam = teamMap.get(match.homeTeamId);
    const awayTeam = teamMap.get(match.awayTeamId);
    if (!homeTeam || !awayTeam) return;

    totalMatches += 1;
    const matchGoals = match.homeScore + match.awayScore;
    totalGoals += matchGoals;
    teamGoalsScored.set(homeTeam.id, (teamGoalsScored.get(homeTeam.id) || 0) + match.homeScore);
    teamGoalsConceded.set(homeTeam.id, (teamGoalsConceded.get(homeTeam.id) || 0) + match.awayScore);
    teamGoalsScored.set(awayTeam.id, (teamGoalsScored.get(awayTeam.id) || 0) + match.awayScore);
    teamGoalsConceded.set(awayTeam.id, (teamGoalsConceded.get(awayTeam.id) || 0) + match.homeScore);
    teamMatchesPlayed.set(homeTeam.id, (teamMatchesPlayed.get(homeTeam.id) || 0) + 1);
    teamMatchesPlayed.set(awayTeam.id, (teamMatchesPlayed.get(awayTeam.id) || 0) + 1);

    if (!highestScoringMatch || matchGoals > highestScoringMatch.totalGoals) {
      highestScoringMatch = {
        matchId: match.id,
        stage: match.stage,
        homeTeamName: homeTeam.name,
        awayTeamName: awayTeam.name,
        homeTeamLogo: homeTeam.logo,
        awayTeamLogo: awayTeam.logo,
        homeScore: match.homeScore,
        awayScore: match.awayScore,
        totalGoals: matchGoals,
      };
    }

    const awardCleanSheet = (team: Team) => {
      const primaryGoalkeeper = team.players.find((player) => player.position === 'GK');
      if (primaryGoalkeeper) {
        const goalkeeperStats = resolvePlayer(team.id, primaryGoalkeeper.id);
        if (goalkeeperStats) {
          goalkeeperStats.cleanSheets += 1;
          goalkeeperStats.cleanSheetPoints += 2;
        }
      }
      team.players.filter((player) => player.position === 'DF').forEach((player) => {
        const defenderStats = resolvePlayer(team.id, player.id);
        if (defenderStats) {
          defenderStats.cleanSheets += 1;
          defenderStats.cleanSheetPoints += 2;
        }
      });
    };
    if (match.awayScore === 0) awardCleanSheet(homeTeam);
    if (match.homeScore === 0) awardCleanSheet(awayTeam);

    const goalEvents: GoalEvent[] = match.timeline?.length
      ? match.timeline
      : [
          ...(match.scorers?.home || []).map((scorer) => ({ ...scorer, teamId: homeTeam.id })),
          ...(match.scorers?.away || []).map((scorer) => ({ ...scorer, teamId: awayTeam.id })),
        ];
    goalEvents.forEach((event) => {
      if (event.isOwnGoal) return;
      const player = resolvePlayer(event.teamId, event.playerId, event.playerName);
      if (!player) return;
      player.goals += 1;
      player.goalPoints += player.position === 'FW' ? 2 : player.position === 'MF' ? 3 : 5;
      if (event.isPenalty) {
        player.penalties += 1;
        totalPenalties += 1;
      }
    });

    if (match.motm?.playerName) {
      const motmPlayer = resolvePlayer(match.motm.teamId, match.motm.playerId, match.motm.playerName);
      if (motmPlayer) {
        motmPlayer.motmAwards += 1;
        motmPlayer.motmPoints += 5;
      }
    }

    const winnerId = match.homeScore === match.awayScore
      ? null
      : match.homeScore > match.awayScore
      ? match.homeTeamId
      : match.awayTeamId;
    const isLeaguePhase = match.stage.startsWith('League Phase');
    const isFinal = match.stage.startsWith('Final');
    const teamWinValue = isLeaguePhase ? 0.5 : isFinal ? 0 : 1;
    if (winnerId && teamWinValue > 0) {
      teamMap.get(winnerId)?.players.forEach((player) => {
        const stats = resolvePlayer(winnerId, player.id);
        if (stats) stats.teamWinPoints += teamWinValue;
      });
    }

    const ratings = match.playerRatings || buildLegacyRatings(match, goalEvents);
    [homeTeam, awayTeam].forEach((team) => {
      team.players.forEach((player) => {
        const rating = ratings[player.id];
        const stats = resolvePlayer(team.id, player.id);
        if (stats && Number.isFinite(rating)) {
          stats.ratingTotal += clampRating(rating);
          stats.ratingAppearances += 1;
        }
      });
    });
  };

  leagueMatches.forEach((match) => {
    if (match.status !== 'completed' || match.homeScore === null || match.awayScore === null) return;
    processMatch({
      ...match,
      stage: `League Phase · Matchday ${match.matchweek}`,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
    });
  });

  knockoutMatches.forEach((tie) => {
    if (tie.round !== 'final' && tie.leg1.status === 'completed' && tie.leg1.homeScore !== null && tie.leg1.awayScore !== null) {
      processMatch({
        id: `${tie.id}-leg1`,
        stage: `${tie.round} · Leg 1`,
        homeTeamId: tie.awayTeamId,
        awayTeamId: tie.homeTeamId,
        homeScore: tie.leg1.homeScore,
        awayScore: tie.leg1.awayScore,
        timeline: tie.leg1.timeline,
        scorers: tie.leg1.scorers,
        motm: tie.leg1.motm,
        playerRatings: tie.leg1.playerRatings,
      });
    }

    if (tie.leg2.status === 'completed' && tie.leg2.homeScore !== null && tie.leg2.awayScore !== null) {
      const extraHome = tie.leg2.etHomeGoals || 0;
      const extraAway = tie.leg2.etAwayGoals || 0;
      processMatch({
        id: tie.round === 'final' ? tie.id : `${tie.id}-leg2`,
        stage: tie.round === 'final' ? 'Final · Madrid 27' : `${tie.round} · Leg 2`,
        homeTeamId: tie.homeTeamId,
        awayTeamId: tie.awayTeamId,
        homeScore: tie.leg2.homeScore + extraHome,
        awayScore: tie.leg2.awayScore + extraAway,
        timeline: [...(tie.leg2.timeline || []), ...(tie.leg2.etTimeline || [])],
        scorers: tie.leg2.scorers,
        motm: tie.leg2.motm,
        playerRatings: tie.leg2.playerRatings,
      });
    }
  });

  const completedFinal = knockoutMatches.find((tie) => tie.round === 'final' && tie.isCompleted && tie.winnerId);
  if (completedFinal?.winnerId) {
    const runnerUpId = completedFinal.winnerId === completedFinal.homeTeamId
      ? completedFinal.awayTeamId
      : completedFinal.homeTeamId;
    teamMap.get(completedFinal.winnerId)?.players.forEach((player) => {
      const stats = resolvePlayer(completedFinal.winnerId!, player.id);
      if (stats) stats.achievementPoints += 3;
    });
    teamMap.get(runnerUpId)?.players.forEach((player) => {
      const stats = resolvePlayer(runnerUpId, player.id);
      if (stats) stats.achievementPoints += 2;
    });
  }

  const averageRating = (player: PlayerTournamentStats) =>
    player.ratingAppearances > 0 ? player.ratingTotal / player.ratingAppearances : 0;
  const performanceScore = (player: PlayerTournamentStats) =>
    player.goalPoints +
    player.cleanSheetPoints +
    player.motmPoints +
    player.teamWinPoints +
    player.achievementPoints;
  const rankedPlayers = [...playerStats.values()]
    .filter((player) => player.ratingAppearances > 0)
    .sort((left, right) =>
      performanceScore(right) - performanceScore(left) ||
      averageRating(right) - averageRating(left) ||
      right.motmAwards - left.motmAwards ||
      right.goals - left.goals ||
      left.name.localeCompare(right.name),
    );

  const topScorers: TopScorerEntry[] = [...playerStats.values()]
    .filter((player) => player.goals > 0)
    .sort((left, right) => right.goals - left.goals || left.penalties - right.penalties)
    .map((player) => ({
      playerId: player.playerId,
      playerName: player.name,
      teamId: player.teamId,
      teamName: teamMap.get(player.teamId)?.name || player.teamId,
      goals: player.goals,
    }));

  const motmLeaders = [...playerStats.values()]
    .filter((player) => player.motmAwards > 0)
    .sort((left, right) => right.motmAwards - left.motmAwards || right.goals - left.goals)
    .slice(0, 5)
    .map((player) => ({
      playerName: player.name,
      teamName: teamMap.get(player.teamId)?.name || player.teamId,
      teamLogo: teamMap.get(player.teamId)?.logo,
      awards: player.motmAwards,
    }));

  const goalkeeper = [...playerStats.values()]
    .filter((player) => player.position === 'GK')
    .sort((left, right) => right.cleanSheets - left.cleanSheets || averageRating(right) - averageRating(left))[0];
  const goldenGlove = goalkeeper && goalkeeper.cleanSheets > 0 ? {
    playerName: goalkeeper.name,
    teamName: teamMap.get(goalkeeper.teamId)?.name || goalkeeper.teamId,
    teamLogo: teamMap.get(goalkeeper.teamId)?.logo,
    cleanSheets: goalkeeper.cleanSheets,
  } : null;

  const attackingTeam = [...teams]
    .filter((team) => (teamMatchesPlayed.get(team.id) || 0) > 0)
    .sort((left, right) => (teamGoalsScored.get(right.id) || 0) - (teamGoalsScored.get(left.id) || 0))[0];
  const bestAttackingTeam = attackingTeam ? {
    teamName: attackingTeam.name,
    teamLogo: attackingTeam.logo,
    goals: teamGoalsScored.get(attackingTeam.id) || 0,
    average: ((teamGoalsScored.get(attackingTeam.id) || 0) / (teamMatchesPlayed.get(attackingTeam.id) || 1)).toFixed(2),
  } : null;

  const defensiveTeam = [...teams]
    .filter((team) => (teamMatchesPlayed.get(team.id) || 0) > 0)
    .sort((left, right) => (teamGoalsConceded.get(left.id) || 0) - (teamGoalsConceded.get(right.id) || 0))[0];
  const bestDefensiveTeam = defensiveTeam ? {
    teamName: defensiveTeam.name,
    teamLogo: defensiveTeam.logo,
    conceded: teamGoalsConceded.get(defensiveTeam.id) || 0,
  } : null;

  const potsPlayer = rankedPlayers[0];
  const playerOfTheSeason = potsPlayer ? {
    playerName: potsPlayer.name,
    teamName: teamMap.get(potsPlayer.teamId)?.name || potsPlayer.teamId,
    teamLogo: teamMap.get(potsPlayer.teamId)?.logo,
    position: potsPlayer.position,
    rating: Number(averageRating(potsPlayer).toFixed(2)),
    points: performanceScore(potsPlayer),
    goals: potsPlayer.goals,
    motmAwards: potsPlayer.motmAwards,
  } : null;

  const mapLineupPosition = (position: PlayerTournamentStats['position']): BestXIPlayer['naturalPosition'] =>
    position === 'DF' ? 'DEF' : position === 'MF' ? 'MID' : position === 'FW' ? 'ATT' : 'GK';
  const toBestXIPlayer = (player: PlayerTournamentStats): BestXIPlayer => ({
    playerId: player.playerId,
    playerName: player.name,
    teamId: player.teamId,
    teamName: teamMap.get(player.teamId)?.name || player.teamId,
    teamLogo: teamMap.get(player.teamId)?.logo,
    naturalPosition: mapLineupPosition(player.position),
    lineupPosition: mapLineupPosition(player.position),
    goals: player.goals,
    cleanSheets: player.cleanSheets,
    motmCount: player.motmAwards,
    totalScore: performanceScore(player),
    averageRating: Number(averageRating(player).toFixed(2)),
    scoreBreakdown: {
      goalPoints: player.goalPoints,
      cleanSheetPoints: player.cleanSheetPoints,
      motmPoints: player.motmPoints,
      teamWinPoints: player.teamWinPoints,
      achievementPoints: player.achievementPoints,
    },
    knockoutImpact: 0,
    semiFinalImpact: 0,
    progressScore: 0,
  });
  const selectPosition = (position: PlayerTournamentStats['position'], count: number) =>
    rankedPlayers.filter((player) => player.position === position).slice(0, count).map(toBestXIPlayer);
  const bestGoalkeeper = selectPosition('GK', 1)[0];
  const defenders = selectPosition('DF', 4);
  const midfielders = selectPosition('MF', 3);
  const attackers = selectPosition('FW', 3);
  const bestXI = bestGoalkeeper && defenders.length === 4 && midfielders.length === 3 && attackers.length === 3
    ? {
        goalkeeper: bestGoalkeeper,
        defenders,
        midfielders,
        attackers,
        bestPlayer: toBestXIPlayer(rankedPlayers[0]),
      }
    : null;

  const averagePerMatch = totalMatches > 0 ? (totalGoals / totalMatches).toFixed(2) : '0.00';
  const penaltyPercentValue = totalGoals > 0 ? Math.round((totalPenalties / totalGoals) * 100) : 0;

  return {
    playerOfTheSeason,
    topScorers,
    mostMotmAwards: motmLeaders,
    goldenGlove,
    bestAttackingTeam,
    bestDefensiveTeam,
    highestScoringMatch,
    tournamentGoalAnalysis: {
      totalGoals,
      totalMatches,
      averagePerMatch,
      openPlayPercent: `${100 - penaltyPercentValue}%`,
      penaltyPercent: `${penaltyPercentValue}%`,
    },
    bestXI,
  };
};
