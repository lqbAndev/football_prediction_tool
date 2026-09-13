import type { Team } from '../types/tournament';
import type { TwoLegMatch, UCLPenaltyShootout, UCLPenaltyKick, TieStatus } from '../types/uclConfig';
import { sampleUCLScoreline, simulateUCLMatch } from './uclEngine';
import { calculateUCLMatchMOTM } from './uclMotm';
import { buildKnockoutTimeline } from './random';

export const FINAL_VENUE = 'Estadio Metropolitano, Madrid';

/**
 * ═══════════════════════════════════════════════════════════════
 *  HELPER: EXTRA TIME GENERATOR (From WC26 random.ts)
 * ═══════════════════════════════════════════════════════════════
 */
const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

const generateExtraTimeScoreline = (homeTeam: Team, awayTeam: Team, isNeutralVenue: boolean) => {
  const score = sampleUCLScoreline(homeTeam, awayTeam, {
    isNeutralVenue,
    durationFactor: 0.29,
  });
  return { homeGoals: Math.min(3, score.homeScore), awayGoals: Math.min(3, score.awayScore) };
};

const getPenaltyConversionRate = (team: Team, opponent: Team, position?: Team['players'][number]['position']) => {
  const teamQuality = clamp((team.rating - 82) * 0.0012, -0.015, 0.015);
  const opponentGoalkeeping = clamp((82 - opponent.rating) * 0.0008, -0.01, 0.01);
  const positionAdjustment = position === 'FW' ? 0.012 : position === 'MF' ? 0.004 : position === 'GK' ? -0.035 : -0.012;
  return clamp(0.72 + teamQuality + opponentGoalkeeping + positionAdjustment, 0.68, 0.77);
};

/**
 * ═══════════════════════════════════════════════════════════════
 *  HELPER: PENALTY SHOOTOUT GENERATOR (From WC26 random.ts)
 * ═══════════════════════════════════════════════════════════════
 */
export const simulatePenaltyShootout = (homeTeam: Team, awayTeam: Team): UCLPenaltyShootout => {
  const homePool = homeTeam.players.filter(p => p.position === 'FW' || p.position === 'MF').length >= 3
    ? homeTeam.players.filter(p => p.position === 'FW' || p.position === 'MF')
    : homeTeam.players;
  const awayPool = awayTeam.players.filter(p => p.position === 'FW' || p.position === 'MF').length >= 3
    ? awayTeam.players.filter(p => p.position === 'FW' || p.position === 'MF')
    : awayTeam.players;

  const hasDecisiveLead = (home: number, away: number, homeKicks: number, awayKicks: number) => {
    const remainingHome = Math.max(0, 5 - homeKicks);
    const remainingAway = Math.max(0, 5 - awayKicks);
    return home > away + remainingAway || away > home + remainingHome;
  };

  const simulateSingleShootout = (): UCLPenaltyShootout | null => {
    let home = 0, away = 0, homeKicks = 0, awayKicks = 0, round = 1;
    const homeFirst = Math.random() < 0.5;
    const kicks: UCLPenaltyKick[] = [];

    const takeKick = (side: 'home' | 'away') => {
      const team = side === 'home' ? homeTeam : awayTeam;
      const pool = side === 'home' ? homePool : awayPool;
      const kickIndex = side === 'home' ? homeKicks : awayKicks;
      const player = pool[kickIndex % pool.length];
      const opponent = side === 'home' ? awayTeam : homeTeam;
      const scored = Math.random() < getPenaltyConversionRate(team, opponent, player.position);
      const outcome: UCLPenaltyKick['outcome'] = scored
        ? 'goal'
        : Math.random() < 0.7
        ? 'saved'
        : 'off-target';

      kicks.push({ team: side, playerId: player.id, playerName: player.name, scored, outcome, round });

      if (side === 'home') { homeKicks++; if (scored) home++; }
      else { awayKicks++; if (scored) away++; }
    };

    // 5-kick regulation
    for (let i = 0; i < 5; i++) {
      takeKick(homeFirst ? 'home' : 'away');
      if (hasDecisiveLead(home, away, homeKicks, awayKicks)) return { homeScore: home, awayScore: away, kicks };
      takeKick(homeFirst ? 'away' : 'home');
      if (hasDecisiveLead(home, away, homeKicks, awayKicks)) return { homeScore: home, awayScore: away, kicks };
      round++;
    }

    if (home !== away) return { homeScore: home, awayScore: away, kicks };

    // Sudden death
    for (let sd = 0; sd < 15; sd++) {
      takeKick(homeFirst ? 'home' : 'away');
      takeKick(homeFirst ? 'away' : 'home');
      if (home !== away) return { homeScore: home, awayScore: away, kicks };
      round++;
    }

    return null;
  };

  for (let attempt = 0; attempt < 200; attempt++) {
    const result = simulateSingleShootout();
    if (result && result.homeScore !== result.awayScore) return result;
  }

  const homeWins = Math.random() < 0.5;
  return {
    homeScore: homeWins ? 5 : 4,
    awayScore: homeWins ? 4 : 5,
    kicks: [],
  };
};

/**
 * ═══════════════════════════════════════════════════════════════
 *  KNOCKOUT TIE SIMULATION
 * ═══════════════════════════════════════════════════════════════
 */
export const simulateKnockoutLeg1 = (match: TwoLegMatch, homeTeam: Team, awayTeam: Team): TwoLegMatch => {
  const sim = simulateUCLMatch(awayTeam, homeTeam);
  return {
    ...match,
    tieStatus: 'leg1-done',
    leg1: {
      homeScore: sim.homeScore,
      awayScore: sim.awayScore,
      status: 'completed',
      scorers: sim.scorers,
      timeline: sim.timeline,
      motm: sim.motm,
      playerRatings: sim.playerRatings,
    },
    aggregate: { homeScore: sim.awayScore, awayScore: sim.homeScore },
  };
};

export const simulateKnockoutLeg2 = (match: TwoLegMatch, homeTeam: Team, awayTeam: Team): TwoLegMatch => {
  // If final, just simulate the 90 min. If tied, go to ET.
  const isFinal = match.round === 'final';
  const aggregateDelta = (match.aggregate.homeScore || 0) - (match.aggregate.awayScore || 0);
  const deficit = Math.abs(aggregateDelta);
  const trailingAttackBoost = Math.min(0.45, deficit * 0.16);
  const counterAttackBoost = Math.min(0.24, deficit * 0.08);
  const sim = simulateUCLMatch(homeTeam, awayTeam, {
    isNeutralVenue: isFinal,
    deferMotm: true,
    homeXgModifier: isFinal || aggregateDelta === 0 ? 0 : aggregateDelta < 0 ? trailingAttackBoost : counterAttackBoost,
    awayXgModifier: isFinal || aggregateDelta === 0 ? 0 : aggregateDelta > 0 ? trailingAttackBoost : counterAttackBoost,
  });

  let aggHome = isFinal ? sim.homeScore : (match.leg1.awayScore || 0) + sim.homeScore;
  let aggAway = isFinal ? sim.awayScore : (match.leg1.homeScore || 0) + sim.awayScore;
  let tieStatus: TieStatus = aggHome === aggAway ? 'leg2-done' : 'completed';
  const winnerId = aggHome === aggAway ? null : (aggHome > aggAway ? homeTeam.id : awayTeam.id);
  const motm = tieStatus === 'completed'
    ? calculateUCLMatchMOTM({
        homeTeam,
        awayTeam,
        homeScore: sim.homeScore,
        awayScore: sim.awayScore,
        timeline: sim.timeline,
        playerRatings: sim.playerRatings,
        winnerTeamId: winnerId,
        finalizedAt: '90',
      })
    : null;

  return {
    ...match,
    stadium: isFinal ? FINAL_VENUE : homeTeam.stadium,
    tieStatus,
    leg2: {
      ...match.leg2,
      homeScore: sim.homeScore,
      awayScore: sim.awayScore,
      status: 'completed',
      scorers: sim.scorers,
      timeline: sim.timeline,
      motm,
      playerRatings: sim.playerRatings,
    },
    aggregate: { homeScore: aggHome, awayScore: aggAway },
    winnerId,
    isCompleted: tieStatus === 'completed',
  };
};

export const simulateExtraTime = (match: TwoLegMatch, homeTeam: Team, awayTeam: Team): TwoLegMatch => {
  const isFinal = match.round === 'final';
  const et = generateExtraTimeScoreline(homeTeam, awayTeam, isFinal);
  const { timeline: etTimeline, scorers: etScorers } = buildKnockoutTimeline(
    homeTeam,
    awayTeam,
    0,
    0,
    et.homeGoals,
    et.awayGoals,
  );

  const newAggHome = (match.aggregate.homeScore || 0) + et.homeGoals;
  const newAggAway = (match.aggregate.awayScore || 0) + et.awayGoals;

  const tieStatus: TieStatus = newAggHome === newAggAway ? 'aet' : 'completed';
  const winnerId = newAggHome === newAggAway ? null : (newAggHome > newAggAway ? homeTeam.id : awayTeam.id);
  const fullTimeline = [...(match.leg2.timeline || []), ...etTimeline]
    .sort((left, right) => left.sortMinute - right.sortMinute);
  const fullHomeScore = (match.leg2.homeScore || 0) + et.homeGoals;
  const fullAwayScore = (match.leg2.awayScore || 0) + et.awayGoals;
  const motm = tieStatus === 'completed'
    ? calculateUCLMatchMOTM({
        homeTeam,
        awayTeam,
        homeScore: fullHomeScore,
        awayScore: fullAwayScore,
        timeline: fullTimeline,
        playerRatings: match.leg2.playerRatings,
        winnerTeamId: winnerId,
        finalizedAt: '120',
      })
    : null;

  return {
    ...match,
    tieStatus,
    leg2: {
      ...match.leg2,
      extraTime: true,
      etHomeGoals: et.homeGoals,
      etAwayGoals: et.awayGoals,
      etScorers,
      etTimeline,
      motm,
    },
    aggregate: { homeScore: newAggHome, awayScore: newAggAway },
    winnerId,
    isCompleted: tieStatus === 'completed',
  };
};

/**
 * Backfills scorer events for tournaments saved before extra-time timelines were
 * persisted. Keeping this deterministic per loaded state is not required: the
 * generated details are immediately stored by UCLApp and remain stable afterwards.
 */
export const ensureExtraTimeDetails = (
  match: TwoLegMatch,
  homeTeam: Team,
  awayTeam: Team,
): TwoLegMatch => {
  const homeGoals = match.leg2.etHomeGoals || 0;
  const awayGoals = match.leg2.etAwayGoals || 0;
  const hasRecordedEvents = Boolean(match.leg2.etTimeline?.length);

  if (!match.leg2.extraTime || homeGoals + awayGoals === 0 || hasRecordedEvents) {
    return match;
  }

  const { timeline, scorers } = buildKnockoutTimeline(
    homeTeam,
    awayTeam,
    0,
    0,
    homeGoals,
    awayGoals,
  );

  return {
    ...match,
    leg2: {
      ...match.leg2,
      etTimeline: timeline,
      etScorers: scorers,
    },
  };
};

export const simulatePenalties = (match: TwoLegMatch, homeTeam: Team, awayTeam: Team): TwoLegMatch => {
  const pens = simulatePenaltyShootout(homeTeam, awayTeam);
  const winnerId = pens.homeScore > pens.awayScore ? homeTeam.id : awayTeam.id;
  const fullTimeline = [...(match.leg2.timeline || []), ...(match.leg2.etTimeline || [])]
    .sort((left, right) => left.sortMinute - right.sortMinute);
  const motm = calculateUCLMatchMOTM({
    homeTeam,
    awayTeam,
    homeScore: (match.leg2.homeScore || 0) + (match.leg2.etHomeGoals || 0),
    awayScore: (match.leg2.awayScore || 0) + (match.leg2.etAwayGoals || 0),
    timeline: fullTimeline,
    playerRatings: match.leg2.playerRatings,
    winnerTeamId: winnerId,
    finalizedAt: 'penalties',
    penalties: pens,
  });

  return {
    ...match,
    tieStatus: 'completed',
    leg2: {
      ...match.leg2,
      penalties: pens,
      motm,
    },
    winnerId,
    isCompleted: true,
  };
};

/**
 * ═══════════════════════════════════════════════════════════════
 *  DRAW GENERATORS
 * ═══════════════════════════════════════════════════════════════
 */
export const generatePlayoffs = (rankings: { teamId: string }[]): TwoLegMatch[] => {
  const seeded = rankings.slice(8, 16);
  const unseeded = rankings.slice(16, 24);
  return seeded.map((seed, idx) => {
    const unseed = unseeded[unseeded.length - 1 - idx] || unseeded[idx];
    return {
      id: `ucl-po-${idx + 1}`,
      round: 'playoffs',
      homeTeamId: seed.teamId,
      awayTeamId: unseed.teamId,
      tieStatus: 'pending',
      leg1: { homeScore: null, awayScore: null, status: 'pending' },
      leg2: { homeScore: null, awayScore: null, status: 'pending' },
      aggregate: { homeScore: null, awayScore: null },
      winnerId: null,
      isCompleted: false,
    };
  });
};

export const generateRoundOf16 = (top8Ids: string[], playoffWinnerIds: string[]): TwoLegMatch[] => {
  // Path 1 receives seeds 1, 3, 5, 7
  // Path 2 receives seeds 2, 4, 6, 8
  // This guarantees Rank 1 and Rank 2 are in opposite pathways
  const path1Seeds = [top8Ids[0], top8Ids[2], top8Ids[4], top8Ids[6]]; // 1st, 3rd, 5th, 7th
  const path2Seeds = [top8Ids[1], top8Ids[3], top8Ids[5], top8Ids[7]]; // 2nd, 4th, 6th, 8th
  const orderedSeeds = [...path1Seeds, ...path2Seeds];

  return orderedSeeds.map((topId, idx) => {
    const oppId = playoffWinnerIds[playoffWinnerIds.length - 1 - idx] || playoffWinnerIds[idx];
    return {
      id: `ucl-r16-${idx + 1}`,
      round: 'roundOf16',
      homeTeamId: topId,
      awayTeamId: oppId,
      tieStatus: 'pending',
      leg1: { homeScore: null, awayScore: null, status: 'pending' },
      leg2: { homeScore: null, awayScore: null, status: 'pending' },
      aggregate: { homeScore: null, awayScore: null },
      winnerId: null,
      isCompleted: false,
    };
  });
};

export const generateQuarterFinals = (r16WinnerIds: string[]): TwoLegMatch[] => {
  const matches: TwoLegMatch[] = [];
  for (let i = 0; i < 4; i++) {
    matches.push({
      id: `ucl-qf-${i + 1}`,
      round: 'quarterfinals',
      homeTeamId: r16WinnerIds[i * 2],
      awayTeamId: r16WinnerIds[i * 2 + 1],
      tieStatus: 'pending',
      leg1: { homeScore: null, awayScore: null, status: 'pending' },
      leg2: { homeScore: null, awayScore: null, status: 'pending' },
      aggregate: { homeScore: null, awayScore: null },
      winnerId: null,
      isCompleted: false,
    });
  }
  return matches;
};

export const generateSemiFinals = (qfWinnerIds: string[]): TwoLegMatch[] => {
  return [
    {
      id: 'ucl-sf-1',
      round: 'semifinals',
      homeTeamId: qfWinnerIds[0],
      awayTeamId: qfWinnerIds[1],
      tieStatus: 'pending',
      leg1: { homeScore: null, awayScore: null, status: 'pending' },
      leg2: { homeScore: null, awayScore: null, status: 'pending' },
      aggregate: { homeScore: null, awayScore: null },
      winnerId: null,
      isCompleted: false,
    },
    {
      id: 'ucl-sf-2',
      round: 'semifinals',
      homeTeamId: qfWinnerIds[2],
      awayTeamId: qfWinnerIds[3],
      tieStatus: 'pending',
      leg1: { homeScore: null, awayScore: null, status: 'pending' },
      leg2: { homeScore: null, awayScore: null, status: 'pending' },
      aggregate: { homeScore: null, awayScore: null },
      winnerId: null,
      isCompleted: false,
    },
  ];
};

export const generateFinal = (sfWinnerIds: string[]): TwoLegMatch => {
  return {
    id: 'ucl-final',
    round: 'final',
    homeTeamId: sfWinnerIds[0],
    awayTeamId: sfWinnerIds[1],
    stadium: FINAL_VENUE,
    tieStatus: 'leg1-done', // Final implies Leg 1 is already "done" for UI logic
    leg1: { homeScore: 0, awayScore: 0, status: 'completed' },
    leg2: { homeScore: null, awayScore: null, status: 'pending' },
    aggregate: { homeScore: null, awayScore: null },
    winnerId: null,
    isCompleted: false,
  };
};
