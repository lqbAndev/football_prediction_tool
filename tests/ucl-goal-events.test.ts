import assert from 'node:assert/strict';
import { attributeUCLGoals } from '../src/utils/uclGoalEvents';
import { buildUCLPlayerRatings, simulateUCLMatch } from '../src/utils/uclEngine';
import { calculateUCLMatchMOTM } from '../src/utils/uclMotm';
import { computeUclRecapStats } from '../src/utils/uclRecapStats';
import { ensureExtraTimeDetails, simulateExtraTime, simulatePenalties } from '../src/utils/uclKnockout';
import { loadUCLState, saveUCLState } from '../src/utils/uclStorage';
import { UCL_TEAMS } from '../src/data/competitions/ucl2627';
import type { Team, TimelineEvent } from '../src/types/tournament';
import type { LeagueMatch } from '../src/types/leagueConfig';
import type { TwoLegMatch } from '../src/types/uclConfig';

const makeTeam = (id: string): Team => ({
  id, name: id, shortName: id, group: 'A', rating: 90,
  players: Array.from({ length: 12 }, (_, i) => ({
    id: `${id}-${i}`, name: `${id} player ${i}`,
    position: i === 0 ? 'GK' : i < 5 ? 'DF' : i < 9 ? 'MF' : 'FW',
  })),
});
const home = makeTeam('home'), away = makeTeam('away');
const event = (side: 'home' | 'away', minute = 30): TimelineEvent => {
  const team = side === 'home' ? home : away;
  return { playerId: team.players[9].id, playerName: team.players[9].name, teamId: team.id,
    side, sortMinute: minute, displayMinute: `${minute}'`, phase: 'regulation', isPenalty: false };
};
const withRandom = <T>(random: () => number, test: () => T): T => {
  const original = Math.random;
  Math.random = random;
  try { return test(); } finally { Math.random = original; }
};
const seeded = (seed: number) => () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
};
const sequence = (values: number[]) => () => values.shift() ?? 0.5;
const run = (name: string, test: () => void) => { test(); console.log(`PASS ${name}`); };
const ratings = Object.fromEntries([home, away].flatMap(team => team.players.map(player => [player.id, 7])));
const assisted = { ...event('home'), assistPlayerId: home.players[8].id, assistPlayerName: home.players[8].name };
const match: LeagueMatch = { id: 'test', matchweek: 1, homeTeamId: home.id, awayTeamId: away.id,
  homeScore: 1, awayScore: 0, status: 'completed', predictedAt: null, playerRatings: ratings };

run('Two OGs are possible; beneficiary, scorer map and defending player stay consistent', () => {
  const source = [event('home', 10), event('away', 20), event('home', 30), event('away', 40)];
  const generated = withRandom(sequence([0, 0.1, 0, 0.1]), () => attributeUCLGoals(source, home, away));
  assert.equal(generated.timeline.filter(goal => goal.isOwnGoal).length, 2);
  generated.timeline.forEach(goal => {
    if (!goal.isOwnGoal) return;
    const opponent = goal.side === 'home' ? away : home;
    assert(opponent.players.some(player => player.id === goal.playerId));
    assert.equal(goal.teamId, goal.side === 'home' ? home.id : away.id);
    assert.equal(goal.assistPlayerId, undefined);
  });
  assert.equal(generated.scorers.home.length, 2);
  assert.equal(generated.scorers.away.length, 2);
  assert(generated.scorers.home[0].isOwnGoal);
  assert.equal(source.some(goal => goal.isOwnGoal), false, 'Source timeline must not be mutated');
  const et = withRandom(() => 0, () => attributeUCLGoals([event('home', 105)], home, away, generated.timeline));
  assert.equal(et.timeline[0].isOwnGoal, undefined, 'ET cannot create a third OG');
});
run('Assists exclude the scorer; GK assists are reachable; penalties never have an assist or OG', () => {
  const gkAssist = withRandom(sequence([0.5, 0, 0]), () => attributeUCLGoals([event('home')], home, away));
  assert.equal(gkAssist.timeline[0].assistPlayerId, home.players[0].id);
  assert.equal(gkAssist.scorers.home[0].assistPlayerId, home.players[0].id);
  const penalty = withRandom(() => 0, () => attributeUCLGoals([{ ...event('home'), isPenalty: true }], home, away)).timeline[0];
  assert.equal(penalty.assistPlayerId, undefined);
  assert.equal(penalty.isOwnGoal, undefined);
});
run('Third assist still lifts rating during ET, at a lower rate', () => {
  const regulation = [assisted, { ...assisted, sortMinute: 70, displayMinute: "70'" }];
  const base = withRandom(() => 0.5, () => buildUCLPlayerRatings(home, away, 2, 0, []));
  const updated = withRandom(() => 0.5, () => buildUCLPlayerRatings(home, away, 2, 0, regulation));
  assert.equal(updated[home.players[8].id], Number((base[home.players[8].id] + 0.7).toFixed(1)));
  const extra = { ...assisted, phase: 'extra-time' as const, sortMinute: 105, displayMinute: "105'" };
  const extended = buildUCLPlayerRatings(home, away, 3, 0, [extra], { playerRatings: updated, homeScore: 2, awayScore: 0, timeline: regulation });
  assert.equal(extended[home.players[8].id], Number((updated[home.players[8].id] + 0.15).toFixed(1)));
});
run('MOTM recognizes a reserve assister, excludes OG players and counts OG in decisive score position', () => {
  const input = { homeTeam: home, awayTeam: away, homeScore: 1, awayScore: 0,
    timeline: [assisted], playerRatings: { ...ratings, [home.players[8].id]: 10 }, finalizedAt: '90' as const };
  const motm = calculateUCLMatchMOTM(input)!;
  assert.equal(motm.playerId, home.players[8].id);
  assert.equal(motm.breakdown.assistPoints, 3.25);
  assert.equal(motm.breakdown.decisivePoints, 1.5);
  const og = { ...event('home', 10), playerId: away.players[1].id, playerName: away.players[1].name, isOwnGoal: true };
  assert.notEqual(calculateUCLMatchMOTM({ ...input, timeline: [og], playerRatings: { ...ratings, [away.players[1].id]: 10 } })?.playerId, away.players[1].id);
  const decisive = calculateUCLMatchMOTM({ ...input, homeScore: 2, awayScore: 1, timeline: [og, event('away', 20), event('home', 30)], playerRatings: { ...ratings, [home.players[9].id]: 10 } })!;
  assert.equal(decisive.breakdown.decisivePoints, 2);
});
run('Three assists can win MOTM over individual scorers', () => {
  const creator = home.players[8];
  const goals = [9, 10, 11].map((index, offset) => ({
    ...event('home', 20 + offset * 30),
    playerId: home.players[index].id,
    playerName: home.players[index].name,
    assistPlayerId: creator.id,
    assistPlayerName: creator.name,
  }));
  const timeline = [...goals, event('away', 60)];
  const playerRatings = withRandom(() => 0.5, () => buildUCLPlayerRatings(home, away, 3, 1, timeline));
  const motm = calculateUCLMatchMOTM({
    homeTeam: home, awayTeam: away, homeScore: 3, awayScore: 1,
    timeline, playerRatings, finalizedAt: '90',
  })!;
  assert.equal(motm.playerId, creator.id);
  assert.equal(motm.breakdown.assistPoints, 9.75);
  assert.equal(motm.breakdown.decisivePoints, 1.5);
});
run('Two assists can beat a goal when the creator also has a stronger rating', () => {
  const creator = home.players[8];
  const timeline = [9, 10].map((index, offset) => ({
    ...event('home', 20 + offset * 40),
    playerId: home.players[index].id,
    playerName: home.players[index].name,
    assistPlayerId: creator.id,
    assistPlayerName: creator.name,
  }));
  const motm = calculateUCLMatchMOTM({
    homeTeam: home, awayTeam: away, homeScore: 2, awayScore: 0,
    timeline, playerRatings: { ...ratings, [creator.id]: 7.5 }, finalizedAt: '90',
  })!;
  assert.equal(motm.playerId, creator.id);
  assert.equal(motm.breakdown.assistPoints, 6.5);
  assert.equal(motm.breakdown.decisivePoints, 1.5);
});
run('Extra-time creator receives the assist and decisive bonuses', () => {
  const extraTimeGoal = { ...assisted, sortMinute: 110, displayMinute: "110'", phase: 'extra-time' as const };
  const motm = calculateUCLMatchMOTM({
    homeTeam: home, awayTeam: away, homeScore: 1, awayScore: 0,
    timeline: [extraTimeGoal], playerRatings: { ...ratings, [home.players[8].id]: 10 },
    finalizedAt: '120',
  })!;
  assert.equal(motm.playerId, home.players[8].id);
  assert.equal(motm.breakdown.assistPoints, 4.25);
  assert.equal(motm.breakdown.decisivePoints, 1.5);
});
run('Assists contribute to POTS/Best XI points in timeline and scorer fallback; OG is not a player goal', () => {
  const result = computeUclRecapStats([{ ...match, timeline: [assisted] }], [], [home, away]);
  const creator = result.bestXI!.midfielders.find(player => player.playerId === assisted.assistPlayerId)!;
  assert.equal(creator.assists, 1);
  assert.equal(creator.scoreBreakdown?.assistPoints, 1.25);
  assert.equal(Object.values(creator.scoreBreakdown!).reduce((sum, value) => sum + value, 0), creator.totalScore);
  const fallback = computeUclRecapStats([{ ...match, scorers: { home: [{ ...assisted, minute: 30 }], away: [] } }], [], [home, away]);
  assert.deepEqual(fallback.bestXI?.midfielders, result.bestXI?.midfielders);
  const og = { ...event('home'), playerId: away.players[1].id, isOwnGoal: true, assistPlayerId: home.players[5].id };
  const ogRecap = computeUclRecapStats([{ ...match, timeline: [og] }], [], [home, away]);
  assert.equal(ogRecap.topScorers.length, 0);
  assert(ogRecap.bestXI?.midfielders.every(player => player.assists === 0));
});
run('Season assist stage weight includes ET, while penalty and self-assists are excluded', () => {
  const final: TwoLegMatch = { id: 'final', round: 'final', homeTeamId: home.id, awayTeamId: away.id,
    leg1: { homeScore: null, awayScore: null, status: 'pending' },
    leg2: { homeScore: 2, awayScore: 0, status: 'completed', playerRatings: ratings,
      timeline: [assisted, { ...assisted, isPenalty: true }], extraTime: true, etHomeGoals: 2, etAwayGoals: 0,
      etTimeline: [{ ...assisted, phase: 'extra-time' }, { ...assisted, assistPlayerId: assisted.playerId }] },
    aggregate: { homeScore: 4, awayScore: 0 }, isCompleted: true, winnerId: home.id };
  const creator = computeUclRecapStats([], [final], [home, away]).bestXI!.midfielders.find(player => player.playerId === assisted.assistPlayerId)!;
  assert.equal(creator.assists, 2);
  assert.equal(creator.scoreBreakdown?.assistPoints, 4.38);
});
run('Assist leaderboard combines league, both legs and ET; ties use goals and stay deterministic', () => {
  const awayAssist = { ...event('away'), assistPlayerId: away.players[8].id, assistPlayerName: away.players[8].name };
  const creatorGoal = { ...event('home'), playerId: home.players[8].id, playerName: home.players[8].name };
  const league: LeagueMatch = { ...match, homeScore: 3, awayScore: 3, timeline: [assisted, assisted, creatorGoal, awayAssist, awayAssist, awayAssist] };
  const tie: TwoLegMatch = { id: 'playoff', round: 'playoffs', homeTeamId: home.id, awayTeamId: away.id,
    leg1: { homeScore: 1, awayScore: 1, status: 'completed', timeline: [{ ...awayAssist, side: 'home' }, { ...assisted, side: 'away' }], playerRatings: ratings },
    leg2: { homeScore: 1, awayScore: 1, status: 'completed', timeline: [assisted, awayAssist], playerRatings: ratings,
      extraTime: true, etHomeGoals: 1, etAwayGoals: 0, etTimeline: [{ ...assisted, phase: 'extra-time' }], ratingsIncludeExtraTime: true },
    aggregate: { homeScore: 3, awayScore: 2 }, isCompleted: true, winnerId: home.id };
  const result = computeUclRecapStats([league], [tie], [home, away]);
  assert.deepEqual(result.topAssists.map(player => [player.playerId, player.assists, player.goals]), [[home.players[8].id, 5, 1], [away.players[8].id, 5, 0]]);
  assert.equal(result.topAssists[0].teamName, home.name);
  assert.deepEqual(computeUclRecapStats([league], [tie], [away, home]).topAssists, result.topAssists);
  assert.deepEqual(computeUclRecapStats([{ ...match, timeline: [event('home')] }], [], [home, away]).topAssists, []);
});
run('Seeded simulation preserves score/event counts and maintains rare role distribution', () => {
  withRandom(seeded(20260918), () => {
    const ownRoles = { GK: 0, DF: 0, MF: 0, FW: 0 };
    const assistRoles = { GK: 0, DF: 0, MF: 0, FW: 0 };
    let ogCount = 0, assists = 0, nonPenalty = 0;
    for (let i = 0; i < 20000; i++) {
      const goals = attributeUCLGoals([event('home', 10), event('away', 20), event('home', 40), event('away', 60)], home, away).timeline;
      for (const goal of goals) {
        nonPenalty++;
        const team = goal.side === 'home' ? home : away;
        if (goal.isOwnGoal) {
          ogCount++;
          const opponent = goal.side === 'home' ? away : home;
          ownRoles[opponent.players.find(player => player.id === goal.playerId)!.position]++;
        } else if (goal.assistPlayerId) {
          assists++;
          assert.notEqual(goal.assistPlayerId, goal.playerId);
          assistRoles[team.players.find(player => player.id === goal.assistPlayerId)!.position]++;
        }
      }
    }
    assert(ogCount / nonPenalty > 0.008 && ogCount / nonPenalty < 0.012);
    assert(ownRoles.DF > ownRoles.GK && ownRoles.GK > ownRoles.MF && ownRoles.FW === 0);
    assert(assistRoles.GK > 0 && assistRoles.GK / assists < 0.002);
    assert(assists / (nonPenalty - ogCount) > 0.72 && assists / (nonPenalty - ogCount) < 0.76);
    for (let i = 0; i < 100; i++) {
      const simulated = simulateUCLMatch(home, away);
      assert.equal(simulated.timeline.filter(goal => goal.side === 'home').length, simulated.homeScore);
      assert.equal(simulated.timeline.filter(goal => goal.side === 'away').length, simulated.awayScore);
      assert.equal(simulated.scorers.home.length, simulated.homeScore);
      assert.equal(simulated.timeline.filter(goal => goal.isOwnGoal).length <= 2, true);
      const pending: TwoLegMatch = { id: 'final', round: 'final', homeTeamId: home.id, awayTeamId: away.id,
        leg1: { homeScore: null, awayScore: null, status: 'pending' },
        leg2: { homeScore: 0, awayScore: 0, status: 'completed', timeline: [], playerRatings: ratings },
        aggregate: { homeScore: 0, awayScore: 0 }, tieStatus: 'leg2-done', isCompleted: false, winnerId: null };
      const et = simulateExtraTime(pending, home, away);
      assert.equal(et.leg2.etTimeline?.length, (et.leg2.etHomeGoals || 0) + (et.leg2.etAwayGoals || 0));
      assert(et.leg2.etTimeline?.every(goal => goal.phase === 'extra-time'));
      const restored = JSON.parse(JSON.stringify(et));
      assert.deepEqual(ensureExtraTimeDetails(restored, home, away), restored);
      if (!et.isCompleted) {
        assert.equal(et.leg2.motm, null);
        const pens = simulatePenalties(et, home, away);
        assert.deepEqual(pens.leg2.etTimeline, et.leg2.etTimeline);
        assert.deepEqual(pens.leg2.playerRatings, et.leg2.playerRatings);
      }
    }
    console.log(`  Attribution sample: ${ogCount} OG / ${nonPenalty} goals; ${assists} assists; ${assistRoles.GK} GK assists`);
  });
});
run('Saved states preserve attribution on reload and old states remain compatible', () => {
  let raw = '';
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    setItem: (_key: string, value: string) => { raw = value; }, getItem: () => raw,
  } });
  try {
    const [homeTeamId, awayTeamId] = UCL_TEAMS.map(team => team.id);
    const matches = Array.from({ length: 144 }, (_, i) => ({
      ...match, id: `match-${i}`, homeTeamId, awayTeamId,
      timeline: [{ ...assisted, teamId: homeTeamId }],
    }));
    saveUCLState({ leagueMatches: matches, currentMatchday: 1, playoffs: [], roundOf16: [], quarterfinals: [], semifinals: [], finalMatch: null, champion: null });
    assert.deepEqual(loadUCLState()?.leagueMatches, matches);
    saveUCLState({ leagueMatches: matches.map(({ timeline, ...old }) => old), currentMatchday: 1, playoffs: [], roundOf16: [], quarterfinals: [], semifinals: [], finalMatch: null, champion: null });
    assert.equal(loadUCLState()?.leagueMatches[0].timeline, undefined);
  } finally {
    if (original) Object.defineProperty(globalThis, 'localStorage', original);
    else delete (globalThis as { localStorage?: unknown }).localStorage;
  }
});
console.log('UCL goal attribution regression tests passed.');
