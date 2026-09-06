import type { Team } from '../types/tournament';
import type { TwoLegMatch, UCLPenaltyShootout, UCLPenaltyKick, TieStatus } from '../types/uclConfig';
import { simulateUCLMatch } from './uclEngine';
import { buildKnockoutTimeline } from './random';

export const FINAL_VENUE = 'Estadio Metropolitano, Madrid';

/**
 * ═══════════════════════════════════════════════════════════════
 *  HELPER: EXTRA TIME GENERATOR (From WC26 random.ts)
 * ═══════════════════════════════════════════════════════════════
 */
const sampleExtraTimeBaseGoals = () => {
  const r = Math.random() * 100;
  if (r < 66) return 0;
  if (r < 93) return 1;
  return 2;
};

const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

const applyExtraTimeBias = (goals: number, ratingDifference: number) => {
  let adjusted = goals;
  const magnitude = Math.abs(ratingDifference);
  if (ratingDifference >= 10 && Math.random() < Math.min(0.32, magnitude / 52)) adjusted += 1;
  if (ratingDifference <= -10 && adjusted > 0 && Math.random() < Math.min(0.28, magnitude / 58)) adjusted -= 1;
  return clamp(adjusted, 0, 2);
};

const generateExtraTimeScoreline = (homeTeam: Team, awayTeam: Team) => ({
  homeGoals: applyExtraTimeBias(sampleExtraTimeBaseGoals(), homeTeam.rating - awayTeam.rating),
  awayGoals: applyExtraTimeBias(sampleExtraTimeBaseGoals(), awayTeam.rating - homeTeam.rating),
});

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

  const CONVERSION_RATE = 0.72; // Flat 72%

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
      const scored = Math.random() < CONVERSION_RATE;

      kicks.push({ team: side, playerName: player.name, scored, round });

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

  return { homeScore: 5, awayScore: 4, kicks: [] }; // Fallback
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
  const sim = simulateUCLMatch(homeTeam, awayTeam, { isNeutralVenue: isFinal });

  let aggHome = isFinal ? sim.homeScore : (match.leg1.awayScore || 0) + sim.homeScore;
  let aggAway = isFinal ? sim.awayScore : (match.leg1.homeScore || 0) + sim.awayScore;
  let tieStatus: TieStatus = aggHome === aggAway ? 'leg2-done' : 'completed';

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
      motm: sim.motm,
      playerRatings: sim.playerRatings,
    },
    aggregate: { homeScore: aggHome, awayScore: aggAway },
    winnerId: aggHome === aggAway ? null : (aggHome > aggAway ? homeTeam.id : awayTeam.id),
    isCompleted: tieStatus === 'completed',
  };
};

export const simulateExtraTime = (match: TwoLegMatch, homeTeam: Team, awayTeam: Team): TwoLegMatch => {
  const isFinal = match.round === 'final';
  const et = generateExtraTimeScoreline(homeTeam, awayTeam);
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
    },
    aggregate: { homeScore: newAggHome, awayScore: newAggAway },
    winnerId: newAggHome === newAggAway ? null : (newAggHome > newAggAway ? homeTeam.id : awayTeam.id),
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

  return {
    ...match,
    tieStatus: 'completed',
    leg2: {
      ...match.leg2,
      penalties: pens,
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
