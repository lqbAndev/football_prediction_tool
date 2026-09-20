import React, { useEffect, useMemo, useState } from 'react';
import { Check, CircleDot, Crown, LockKeyhole, MapPin, Route, ShieldCheck, Swords } from 'lucide-react';
import type { Team } from '../../types/tournament';
import type { TwoLegMatch } from '../../types/uclConfig';
import type { UCLLeagueStanding } from '../../utils/uclStandings';
import uclCupImg from '../../img/CUP COMPETITION/UCL/ucl_cup.png';

interface Props {
  standings: UCLLeagueStanding[];
  teamsById: Record<string, Team>;
  playoffs: TwoLegMatch[];
  roundOf16: TwoLegMatch[];
  quarterfinals: TwoLegMatch[];
  semifinals: TwoLegMatch[];
  finalMatch: TwoLegMatch | null;
}

type StageState = 'won' | 'lost' | 'current' | 'waiting' | 'ended';
type RouteStage = { label: string; tie: TwoLegMatch | null; state: StageState; opponent: Team | null; score: string | null; detail: string };
type NextOpponentPool = { label: string; note: string; teams: Team[] };

const getAggregate = (tie: TwoLegMatch, teamId: string) => {
  if (tie.aggregate.homeScore === null || tie.aggregate.awayScore === null) return null;
  const own = tie.homeTeamId === teamId ? tie.aggregate.homeScore : tie.aggregate.awayScore;
  const opponent = tie.homeTeamId === teamId ? tie.aggregate.awayScore : tie.aggregate.homeScore;
  const penaltyScore = tie.leg2.penalties
    ? tie.homeTeamId === teamId
      ? `${tie.leg2.penalties.homeScore}–${tie.leg2.penalties.awayScore}`
      : `${tie.leg2.penalties.awayScore}–${tie.leg2.penalties.homeScore}`
    : null;
  return `${own}–${opponent}${penaltyScore ? ` · pens ${penaltyScore}` : ' agg'}`;
};

export const UCLPathToMadrid: React.FC<Props> = ({ standings, teamsById, playoffs, roundOf16, quarterfinals, semifinals, finalMatch }) => {
  const qualified = standings.slice(0, 24);
  const [teamId, setTeamId] = useState(qualified[0]?.teamId ?? '');
  useEffect(() => {
    if (!qualified.some((row) => row.teamId === teamId)) setTeamId(qualified[0]?.teamId ?? '');
  }, [qualified, teamId]);

  const standing = standings.find((row) => row.teamId === teamId);
  const team = teamsById[teamId];
  const routeData = useMemo(() => {
    if (!standing) return null;
    const pools: Array<{ label: string; ties: TwoLegMatch[] }> = [
      ...(standing.position > 8 ? [{ label: 'Play-off', ties: playoffs }] : []),
      { label: 'Round of 16', ties: roundOf16 },
      { label: 'Quarter-final', ties: quarterfinals },
      { label: 'Semi-final', ties: semifinals },
      { label: 'Final', ties: finalMatch ? [finalMatch] : [] },
    ];
    let journeyEnded = false;
    const stages: RouteStage[] = pools.map(({ label, ties }) => {
      if (journeyEnded) return { label, tie: null, state: 'ended', opponent: null, score: null, detail: 'Journey ended in the previous round' };
      const tie = ties.find((item) => item.homeTeamId === teamId || item.awayTeamId === teamId) ?? null;
      if (!tie) return { label, tie: null, state: 'waiting', opponent: null, score: null, detail: 'Waiting for the feeder ties to finish' };
      const opponentId = tie.homeTeamId === teamId ? tie.awayTeamId : tie.homeTeamId;
      const opponent = teamsById[opponentId] ?? null;
      if (!tie.isCompleted) return { label, tie, state: 'current', opponent, score: getAggregate(tie, teamId), detail: tie.homeTeamId === teamId ? 'Second leg at home' : 'First leg at home' };
      const won = tie.winnerId === teamId;
      if (!won) journeyEnded = true;
      return { label, tie, state: won ? 'won' : 'lost', opponent, score: getAggregate(tie, teamId), detail: won ? 'Advanced to the next round' : `Eliminated by ${opponent?.name ?? 'opponent'}` };
    });
    const allTies = [playoffs, roundOf16, quarterfinals, semifinals, finalMatch ? [finalMatch] : []].flat();
    const journeyTies = allTies.filter((tie) => tie.homeTeamId === teamId || tie.awayTeamId === teamId);
    const completed = journeyTies.filter((tie) => tie.isCompleted);
    const wins = completed.filter((tie) => tie.winnerId === teamId).length;
    const elimination = stages.find((stage) => stage.state === 'lost');
    const current = stages.find((stage) => stage.state === 'current');
    const isChampion = finalMatch?.isCompleted && finalMatch.winnerId === teamId;
    const status = isChampion ? 'Champions of Europe' : elimination ? `Eliminated · ${elimination.label}` : current ? `${current.label} confirmed` : 'Awaiting next bracket slot';
    const progress = Math.round((Math.min(stages.length, wins + (current || elimination ? 1 : 0)) / stages.length) * 100);

    const teamsFromTie = (tie: TwoLegMatch | undefined) => {
      if (!tie) return [];
      const ids = tie.isCompleted && tie.winnerId ? [tie.winnerId] : [tie.homeTeamId, tie.awayTeamId];
      return ids.map((id) => teamsById[id]).filter((candidate): candidate is Team => Boolean(candidate));
    };
    const poolFromSibling = (
      ties: TwoLegMatch[],
      label: string,
      nextRound: string,
    ): NextOpponentPool | null => {
      const tieIndex = ties.findIndex((tie) => tie.homeTeamId === teamId || tie.awayTeamId === teamId);
      if (tieIndex < 0) return null;
      const siblingIndex = tieIndex % 2 === 0 ? tieIndex + 1 : tieIndex - 1;
      const sibling = ties[siblingIndex];
      const candidates = teamsFromTie(sibling);
      if (candidates.length === 0) return null;
      return {
        label,
        teams: candidates,
        note: sibling?.isCompleted
          ? `${candidates[0]?.name ?? 'The winner'} is confirmed in the ${nextRound}.`
          : `Winner of ${sibling?.id.toUpperCase() ?? 'the adjacent tie'} enters this exact bracket lane.`,
      };
    };

    let nextOpponentPool: NextOpponentPool | null = null;
    if (!elimination && !isChampion && !(finalMatch && (finalMatch.homeTeamId === teamId || finalMatch.awayTeamId === teamId))) {
      nextOpponentPool = poolFromSibling(semifinals, 'Potential final opponent', 'Final')
        ?? poolFromSibling(quarterfinals, 'Potential semi-final opponent', 'Semi-final')
        ?? poolFromSibling(roundOf16, 'Potential quarter-final opponent', 'Quarter-final');

      if (!nextOpponentPool) {
        const playoffIndex = playoffs.findIndex((tie) => tie.homeTeamId === teamId || tie.awayTeamId === teamId);
        const topEight = standings.slice(0, 8).map((row) => row.teamId);
        const orderedSeeds = [topEight[0], topEight[2], topEight[4], topEight[6], topEight[1], topEight[3], topEight[5], topEight[7]];
        if (playoffIndex >= 0) {
          const seed = teamsById[orderedSeeds[playoffs.length - 1 - playoffIndex]];
          if (seed) nextOpponentPool = {
            label: 'Round of 16 opponent',
            teams: [seed],
            note: `${seed.name} owns the fixed seeded slot connected to this play-off tie.`,
          };
        } else {
          const seedIndex = orderedSeeds.indexOf(teamId);
          const feederTie = seedIndex >= 0 ? playoffs[playoffs.length - 1 - seedIndex] : undefined;
          const candidates = teamsFromTie(feederTie);
          if (candidates.length > 0) nextOpponentPool = {
            label: candidates.length === 1 ? 'Round of 16 opponent' : 'Possible Round of 16 opponents',
            teams: candidates,
            note: feederTie?.isCompleted
              ? `${candidates[0]?.name ?? 'The play-off winner'} is confirmed in this bracket lane.`
              : `Only the winner of ${feederTie?.id.toUpperCase() ?? 'this feeder tie'} can enter this slot.`,
          };
        }
      }
    }
    return { stages, wins, status, progress, current, nextOpponentPool };
  }, [finalMatch, playoffs, qualified, quarterfinals, roundOf16, semifinals, standing, teamId, teamsById]);

  if (!team || !standing || !routeData) return null;
  const seedBenefit = standing.position <= 8
    ? 'Skipped play-offs · seeded in the Round of 16'
    : standing.position <= 16
    ? 'Seeded play-off club · second leg at home'
    : 'Unseeded play-off club · must survive an away second leg';

  return (
    <section aria-labelledby="path-to-madrid-title" className="rounded-3xl border border-amber-300/25 bg-gradient-to-br from-[#0b1834] via-[#051027] to-[#020817] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.45)] sm:p-6">
      <header className="flex flex-col gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div><p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-amber-300"><Route className="h-4 w-4" />Bracket intelligence</p><h3 id="path-to-madrid-title" className="mt-1 text-2xl font-black sm:text-3xl">Path to Madrid</h3><p className="mt-1 max-w-2xl text-sm leading-5 text-white/50">See the club’s seed advantage, live bracket status, confirmed opponent and the stages still standing between them and the trophy.</p></div>
        <label htmlFor="ucl-path-club" className="block text-xs font-black uppercase tracking-wider text-white/55"><span className="mb-2 block">Explore club</span><select id="ucl-path-club" value={teamId} onChange={(event) => setTeamId(event.target.value)} className="min-h-12 w-full rounded-xl border border-cyan-300/45 bg-[#071329] px-4 text-base font-black text-white outline-none focus:border-cyan-200 lg:w-80">{qualified.map((row) => <option key={row.teamId} value={row.teamId}>#{row.position} · {row.teamName}</option>)}</select></label>
      </header>

      <div className="mt-5 grid gap-3 lg:grid-cols-[1.3fr_1fr_1fr]">
        <article className="flex min-w-0 items-center gap-4 rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.07] p-4">{team.logo && <img src={team.logo} alt="" className="h-16 w-16 shrink-0 object-contain" />}<div className="min-w-0 flex-1"><p className="whitespace-normal text-xl font-black leading-tight [overflow-wrap:anywhere]">{team.name}</p><p className="mt-1 text-sm font-bold text-cyan-200">{routeData.status}</p><p className="mt-1 text-xs leading-5 text-white/50">League seed #{standing.position} · {standing.points} pts</p></div></article>
        <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"><p className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-300"><ShieldCheck className="h-4 w-4" />Seed advantage</p><p className="mt-3 text-sm font-bold leading-6 text-white/80">{seedBenefit}</p></article>
        <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"><div className="flex items-center justify-between"><p className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-cyan-300"><Swords className="h-4 w-4" />Route progress</p><span className="font-mono text-sm font-black text-cyan-200">{routeData.progress}%</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-amber-300" style={{ width: `${routeData.progress}%` }} /></div><p className="mt-3 text-xs text-white/50">{routeData.wins} knockout tie{routeData.wins === 1 ? '' : 's'} won</p></article>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{routeData.stages.map((stage) => {
        const stateClass = stage.state === 'won' ? 'border-emerald-300/30 bg-emerald-300/[0.07]' : stage.state === 'lost' ? 'border-rose-300/30 bg-rose-300/[0.07]' : stage.state === 'current' ? 'border-cyan-300/40 bg-cyan-300/[0.09] shadow-[0_0_24px_rgba(34,211,238,0.1)]' : 'border-white/10 bg-white/[0.025]';
        return <article key={stage.label} className={`min-w-0 rounded-2xl border p-4 ${stateClass}`}><div className="flex items-center justify-between gap-2"><p className="text-xs font-black uppercase tracking-[0.14em] text-cyan-300">{stage.label}</p>{stage.state === 'won' ? <Check className="h-4 w-4 text-emerald-300" /> : stage.state === 'lost' ? <CircleDot className="h-4 w-4 text-rose-300" /> : stage.state === 'current' ? <Swords className="h-4 w-4 text-cyan-300" /> : <LockKeyhole className="h-4 w-4 text-white/25" />}</div><div className="mt-4 flex min-h-14 items-center gap-3">{stage.opponent?.logo ? <img src={stage.opponent.logo} alt="" className="h-10 w-10 shrink-0 object-contain" /> : <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5"><LockKeyhole className="h-4 w-4 text-white/25" /></span>}<div className="min-w-0"><p className="whitespace-normal text-sm font-black leading-5 [overflow-wrap:anywhere]">{stage.opponent?.name ?? (stage.state === 'ended' ? 'Journey ended' : 'Opponent pending')}</p>{stage.score && <p className="mt-1 font-mono text-xs font-black text-white/80">{stage.score}</p>}</div></div><p className="mt-3 border-t border-white/10 pt-3 text-xs leading-5 text-white/45">{stage.detail}</p></article>;
      })}</div>

      <div className={`mt-4 grid gap-3 ${routeData.nextOpponentPool ? 'lg:grid-cols-[1fr_auto]' : 'lg:justify-end'}`}>
        {routeData.nextOpponentPool && <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.055] p-4"><div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs font-black uppercase tracking-[0.14em] text-cyan-300">{routeData.nextOpponentPool.label}</p><span className="text-[10px] font-bold uppercase tracking-wider text-white/35">Exact bracket lane</span></div><div className="mt-3 flex flex-wrap gap-2">{routeData.nextOpponentPool.teams.map((candidate) => <span key={candidate.id} className="inline-flex min-h-12 items-center gap-3 rounded-xl border border-white/10 bg-[#071329] px-3 text-sm font-black">{candidate.logo && <img src={candidate.logo} alt="" className="h-7 w-7 shrink-0 object-contain" />}<span className="whitespace-normal [overflow-wrap:anywhere]">{candidate.name}</span></span>)}</div><p className="mt-3 text-xs leading-5 text-white/50">{routeData.nextOpponentPool.note}</p></div>}
        <div className="flex items-center gap-3 rounded-2xl border border-amber-300/25 bg-amber-300/[0.07] p-4"><img src={uclCupImg} alt="" className="h-12 w-12 object-contain" /><div><p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-300"><MapPin className="h-4 w-4" />Destination</p><p className="mt-1 text-sm font-black">Estadio Metropolitano · Madrid</p></div>{finalMatch?.winnerId === teamId && <Crown className="ml-auto h-5 w-5 text-amber-300" />}</div>
      </div>
    </section>
  );
};
