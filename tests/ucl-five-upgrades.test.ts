import assert from 'node:assert/strict';
import { applyPenaltyShootout, takeNextLivePenaltyKick } from '../src/utils/uclKnockout';
import type { UCLLivePenaltyState } from '../src/utils/uclKnockout';
import { computeUclRecapStats } from '../src/utils/uclRecapStats';
import { advanceFinalMatchdayMinute, formatFinalMatchdayMinute } from '../src/utils/uclFinalMatchdayClock';
import type { Team } from '../src/types/tournament';
import type { LeagueMatch } from '../src/types/leagueConfig';
import type { TwoLegMatch } from '../src/types/uclConfig';

const makeTeam = (id: string): Team => ({
  id, name: id, shortName: id, group: 'A', rating: 86,
  players: Array.from({ length: 11 }, (_, index) => ({
    id: `${id}-${index}`, name: `${id} player ${index}`,
    position: index === 0 ? 'GK' : index < 5 ? 'DF' : index < 8 ? 'MF' : 'FW',
  })),
});
const home = makeTeam('home');
const away = makeTeam('away');
const start = (): UCLLivePenaltyState => ({ homeScore: 0, awayScore: 0, kicks: [], firstSide: 'home', complete: false });
const run = (name: string, test: () => void) => { test(); console.log(`PASS ${name}`); };

run('Final matchday clock includes varied first-half and second-half added time', () => {
  const firstHalfLimit = 45.4;
  let minute = 42;
  const ticks = [minute];
  while (minute < firstHalfLimit) {
    minute = advanceFinalMatchdayMinute(minute, firstHalfLimit, 97);
    ticks.push(minute);
  }
  assert.deepEqual(ticks, [42, 45, 45.1, 45.2, 45.3, 45.4]);
  assert.equal(formatFinalMatchdayMinute(minute), "45+4'");
  assert.equal(advanceFinalMatchdayMinute(minute, firstHalfLimit, 97), 48);
  assert.equal(advanceFinalMatchdayMinute(90, firstHalfLimit, 97), 91);
  assert.equal(formatFinalMatchdayMinute(97), "90+7'");
  assert.equal(advanceFinalMatchdayMinute(97, firstHalfLimit, 97), 97);
});

run('Live shootout samples one kick at a time and does not reveal a future winner', () => {
  let draws = 0;
  const first = takeNextLivePenaltyKick(start(), home, away, () => { draws++; return 0; });
  assert.equal(draws, 1);
  assert.equal(first.kicks.length, 1);
  assert.equal(first.homeScore, 1);
  assert.equal(first.awayScore, 0);
  assert.equal(first.complete, false);
  const second = takeNextLivePenaltyKick(first, home, away, () => { draws++; return 0.99; });
  assert.equal(second.kicks.length, 2);
  assert.equal(second.kicks[1].team, 'away');
  assert.equal(second.kicks[1].scored, false);
  assert.equal(draws, 3, 'A miss draws its save/off-target outcome only when that kick happens');
  assert.equal(first.kicks.length, 1, 'Previous state is immutable');
});

run('Shootout ends when a team cannot catch up, with no fabricated remaining kicks', () => {
  let shootout = start();
  for (let index = 0; index < 6; index++) {
    shootout = takeNextLivePenaltyKick(shootout, home, away, () => index % 2 === 0 ? 0 : 0.99);
  }
  assert.equal(shootout.complete, true);
  assert.equal(shootout.homeScore, 3);
  assert.equal(shootout.awayScore, 0);
  assert.equal(shootout.kicks.length, 6);
  assert.equal(takeNextLivePenaltyKick(shootout, home, away), shootout);
});

run('Sudden death cannot finish before both clubs have taken the same round', () => {
  let shootout = start();
  for (let index = 0; index < 10; index++) shootout = takeNextLivePenaltyKick(shootout, home, away, () => 0);
  assert.equal(shootout.complete, false);
  shootout = takeNextLivePenaltyKick(shootout, home, away, () => 0.99);
  assert.equal(shootout.complete, false);
  shootout = takeNextLivePenaltyKick(shootout, home, away, () => 0);
  assert.equal(shootout.complete, true);
  assert.equal(shootout.kicks.at(-1)?.round, 6);
});

run('Only a completed live shootout crowns the final winner and MOTM', () => {
  const tied: TwoLegMatch = {
    id: 'final', round: 'final', homeTeamId: home.id, awayTeamId: away.id,
    tieStatus: 'aet',
    leg1: { homeScore: null, awayScore: null, status: 'pending' },
    leg2: { homeScore: 0, awayScore: 0, status: 'completed', extraTime: true, etHomeGoals: 0, etAwayGoals: 0, timeline: [], etTimeline: [] },
    aggregate: { homeScore: 0, awayScore: 0 }, winnerId: null, isCompleted: false,
  };
  let shootout = start();
  for (let index = 0; index < 6; index++) shootout = takeNextLivePenaltyKick(shootout, home, away, () => index % 2 === 0 ? 0 : 0.99);
  assert.equal(tied.winnerId, null);
  const completed = applyPenaltyShootout(tied, home, away, shootout);
  assert.equal(completed.winnerId, home.id);
  assert.equal(completed.leg2.penalties?.kicks.length, 6);
  assert.equal(completed.leg2.motm?.finalizedAt, 'penalties');
});

run('Champion dossier counts match scores, all squad players, and excludes shootout goals', () => {
  const league: LeagueMatch[] = [
    { id: 'm1', matchweek: 1, homeTeamId: home.id, awayTeamId: away.id, homeScore: 1, awayScore: 0, status: 'completed', predictedAt: null,
      timeline: [{ playerId: home.players[8].id, playerName: home.players[8].name, teamId: home.id, side: 'home', sortMinute: 30, displayMinute: "30'", phase: 'regulation', assistPlayerId: home.players[7].id, assistPlayerName: home.players[7].name }] },
    { id: 'm2', matchweek: 2, homeTeamId: away.id, awayTeamId: home.id, homeScore: 2, awayScore: 0, status: 'completed', predictedAt: null },
  ];
  const final: TwoLegMatch = {
    id: 'final', round: 'final', homeTeamId: home.id, awayTeamId: away.id,
    leg1: { homeScore: null, awayScore: null, status: 'pending' },
    leg2: { homeScore: 1, awayScore: 1, status: 'completed', extraTime: true, etHomeGoals: 0, etAwayGoals: 0,
      penalties: { homeScore: 4, awayScore: 3, kicks: [] } },
    aggregate: { homeScore: 1, awayScore: 1 }, winnerId: home.id, isCompleted: true,
  };
  const report = computeUclRecapStats(league, [final], [home, away]).championReport;
  assert(report);
  assert.equal(report.matches, 3);
  assert.deepEqual([report.wins, report.draws, report.losses], [1, 1, 1]);
  assert.deepEqual([report.goalsFor, report.goalsAgainst, report.shootoutWins], [2, 3, 1]);
  assert.equal(report.players.length, home.players.length);
  assert.equal(report.players.find((player) => player.playerId === home.players[8].id)?.goals, 1);
  assert.equal(report.players.find((player) => player.playerId === home.players[7].id)?.assists, 1);
  assert.equal(report.stages.find((stage) => stage.stage === 'League Phase')?.matches, 2);
});
