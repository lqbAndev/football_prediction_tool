import assert from 'node:assert/strict';
import { buildUCLBestXI, computeUclRecapStats } from '../src/utils/uclRecapStats';
import { buildUCLPlayerRatings } from '../src/utils/uclEngine';
import { ensureExtraTimeDetails, simulateExtraTime, simulatePenalties } from '../src/utils/uclKnockout';
import { calculateUCLMatchMOTM } from '../src/utils/uclMotm';
import type { Team, TimelineEvent } from '../src/types/tournament';
import type { LeagueMatch } from '../src/types/leagueConfig';
import type { TwoLegMatch } from '../src/types/uclConfig';

const makeTeam = (id: string): Team => ({
  id, name: id, shortName: id, group: 'A', rating: 90,
  players: Array.from({ length: 18 }, (_, index) => ({
    id: `${id}-${index}`, name: `${id} player ${index}`,
    position: index < 2 ? 'GK' : index < 8 ? 'DF' : index < 14 ? 'MF' : 'FW',
  })),
});
const [home, away, early] = ['champion', 'runner', 'early'].map(makeTeam);
const teams = [home, away, early];
const ratings = Object.fromEntries(teams.flatMap(team => team.players.map(player => [player.id, 7])));
const league = (id: string, homeTeam: Team, awayTeam: Team, homeScore: number, awayScore: number): LeagueMatch => ({
  id, matchweek: 1, homeTeamId: homeTeam.id, awayTeamId: awayTeam.id,
  homeScore, awayScore, status: 'completed', predictedAt: null, playerRatings: ratings,
});
const final: TwoLegMatch = {
  id: 'final', round: 'final', homeTeamId: home.id, awayTeamId: away.id,
  leg1: { homeScore: 0, awayScore: 0, status: 'completed' },
  leg2: { homeScore: 1, awayScore: 0, status: 'completed', playerRatings: ratings },
  aggregate: { homeScore: 1, awayScore: 0 }, winnerId: home.id, isCompleted: true,
};
const run = (name: string, test: () => void) => { test(); console.log(`PASS ${name}`); };

run('Defensive award compares per-match rates, excluding early exits at completion', () => {
  const matches = [
    ...Array.from({ length: 8 }, (_, i) => league(`home-${i}`, home, early, 0, i < 4 ? 1 : 0)),
    league('away', away, early, 0, 1),
  ];
  const defensive = computeUclRecapStats(matches, [final], teams).bestDefensiveTeam;
  assert.equal(defensive?.teamName, home.name, '4/9 beats 2/2; early has 0 conceded but is ineligible');
  assert.equal(defensive?.average, '0.44');
  assert.equal(defensive?.matchesPlayed, 9);
  assert.equal(defensive?.conceded, 4);
  assert.equal(computeUclRecapStats(matches, [], teams).bestDefensiveTeam?.teamName, early.name, 'Live ranking remains available before QF');
});
run('Golden Boot midfielder stays in MID and all XI slots remain unique', () => {
  const xi = buildUCLBestXI([league('rated', home, away, 0, 0)], [], teams, null, { playerId: home.players[8].id })!;
  assert(xi.midfielders.some(player => player.playerId === home.players[8].id));
  assert(!xi.attackers.some(player => player.playerId === home.players[8].id));
  assert.equal(new Set([xi.goalkeeper, ...xi.defenders, ...xi.midfielders, ...xi.attackers].map(player => player.playerId)).size, 11);
});
run('POTS has a fallback for inconsistent legacy tournament data', () => {
  const invalidFinal = { ...final, homeTeamId: 'missing-home', awayTeamId: 'missing-away', winnerId: 'missing-home' };
  assert(computeUclRecapStats([league('rated', early, away, 1, 0)], [invalidFinal], teams).playerOfTheSeason);
  assert.equal(computeUclRecapStats([], [], teams).playerOfTheSeason, null, 'No played matches still means no award');
});
const goal = (team: Team, minute: number, side: 'home' | 'away'): TimelineEvent => ({
  playerId: team.players[14].id, playerName: team.players[14].name, teamId: team.id,
  sortMinute: minute, displayMinute: `${minute}'`, side, phase: 'extra-time', isPenalty: false,
});
run('Own-goal penalty targets the defending player rather than the beneficiary squad', () => {
  const random = Math.random;
  Math.random = () => 0.5;
  try {
    const base = buildUCLPlayerRatings(home, away, 1, 0, []);
    const ownGoal = { ...goal(home, 30, 'home'), playerId: away.players[2].id, playerName: away.players[2].name, isOwnGoal: true, phase: 'regulation' as const };
    const updated = buildUCLPlayerRatings(home, away, 1, 0, [ownGoal]);
    assert(Math.abs(updated[away.players[2].id] - base[away.players[2].id] + 0.8) < 0.001);
    assert.equal(updated[home.players[14].id], base[home.players[14].id]);
    assert.equal(computeUclRecapStats([{ ...league('og', home, away, 1, 0), timeline: [ownGoal] }], [], teams).topScorers.length, 0);
  } finally { Math.random = random; }
});
run('ET goals update ratings, lost clean sheets are removed, and source ratings are not mutated', () => {
  const updated = buildUCLPlayerRatings(home, away, 1, 1, [goal(home, 105, 'home'), goal(away, 118, 'away')], { playerRatings: ratings, homeScore: 0, awayScore: 0 });
  assert.equal(updated[home.players[14].id], 7.8);
  assert.equal(updated[home.players[0].id], 6.2);
  assert.equal(updated[away.players[0].id], 6.2);
  assert.equal(updated[home.players[2].id], 6.7);
  assert.equal(ratings[home.players[14].id], 7);
  assert(Object.values(updated).every(rating => rating >= 4 && rating <= 10));
});
run('Legacy ET state upgrades once and stays stable through F5/penalties', () => {
  const tied: TwoLegMatch = { ...final, isCompleted: false, winnerId: null, tieStatus: 'aet', aggregate: { homeScore: 1, awayScore: 1 }, leg2: { homeScore: 0, awayScore: 0, status: 'completed', extraTime: true, etHomeGoals: 1, etAwayGoals: 1, etTimeline: [goal(home, 105, 'home'), goal(away, 118, 'away')], playerRatings: ratings } };
  const upgraded = ensureExtraTimeDetails(tied, home, away);
  assert.equal(upgraded.leg2.ratingsIncludeExtraTime, true);
  assert.equal(upgraded.leg2.playerRatings?.[home.players[14].id], 7.8);
  const reloaded = JSON.parse(JSON.stringify(upgraded));
  assert.deepEqual(ensureExtraTimeDetails(reloaded, home, away), reloaded);
  assert.deepEqual(reloaded.leg2.playerRatings, upgraded.leg2.playerRatings);
  const penalties = simulatePenalties(upgraded, home, away);
  assert.deepEqual(penalties.leg2.playerRatings, upgraded.leg2.playerRatings);
  assert.equal(penalties.leg2.motm?.finalizedAt, 'penalties');
  assert.deepEqual(penalties.leg2.motm, calculateUCLMatchMOTM({ homeTeam: home, awayTeam: away, homeScore: 1, awayScore: 1, timeline: tied.leg2.etTimeline, playerRatings: upgraded.leg2.playerRatings, winnerTeamId: penalties.winnerId, finalizedAt: 'penalties', penalties: penalties.leg2.penalties }));
});
run('Fresh ET simulation persists corrected ratings and uses them for MOTM', () => {
  const pending: TwoLegMatch = { ...final, isCompleted: false, winnerId: null, tieStatus: 'leg2-done', aggregate: { homeScore: 0, awayScore: 0 }, leg2: { homeScore: 0, awayScore: 0, status: 'completed', timeline: [], playerRatings: ratings } };
  const simulated = simulateExtraTime(pending, home, away);
  const expected = buildUCLPlayerRatings(home, away, simulated.leg2.etHomeGoals || 0, simulated.leg2.etAwayGoals || 0, simulated.leg2.etTimeline || [], { playerRatings: ratings, homeScore: 0, awayScore: 0 });
  assert.deepEqual(simulated.leg2.playerRatings, expected);
  assert.deepEqual(ensureExtraTimeDetails(simulated, home, away), simulated);
  if (simulated.isCompleted) assert.deepEqual(simulated.leg2.motm, calculateUCLMatchMOTM({ homeTeam: home, awayTeam: away, homeScore: simulated.leg2.etHomeGoals || 0, awayScore: simulated.leg2.etAwayGoals || 0, timeline: simulated.leg2.etTimeline, playerRatings: expected, winnerTeamId: simulated.winnerId, finalizedAt: '120' }));
  else assert.equal(simulated.leg2.motm, null, 'MOTM remains pending until penalties finish');
});
console.log('UCL Tier 1 regression tests passed.');
