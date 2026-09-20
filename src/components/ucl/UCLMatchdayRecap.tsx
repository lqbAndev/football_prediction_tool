import React, { useMemo } from 'react';
import type { LeagueMatch } from '../../types/leagueConfig';
import type { Team } from '../../types/tournament';
import { calculateUCLStandings } from '../../utils/uclStandings';
import patchUclImg from '../../img/CUP COMPETITION/UCL/patch_ucl.png';
import mvpCupImg from '../../img/CUP COMPETITION/UCL/ucl_mvp_cup.png';

interface Props {
  matchday: number;
  matches: LeagueMatch[];
  teams: Team[];
  teamsById: Record<string, Team>;
}

export const UCLMatchdayRecap: React.FC<Props> = ({ matchday, matches, teams, teamsById }) => {
  const recap = useMemo(() => {
    const current = matches.filter((match) => match.matchweek === matchday && match.status === 'completed');
    if (current.length !== 18) return null;
    const before = calculateUCLStandings(matches.filter((match) => match.matchweek < matchday), teams);
    const after = calculateUCLStandings(matches.filter((match) => match.matchweek <= matchday), teams);
    const beforePosition = new Map(before.map((row) => [row.teamId, row.position]));
    const movers = after
      .map((row) => ({ ...row, movement: (beforePosition.get(row.teamId) ?? row.position) - row.position }))
      .filter((row) => row.movement !== 0)
      .sort((a, b) => Math.abs(b.movement) - Math.abs(a.movement))
      .slice(0, 3);
    const totalGoals = current.reduce((sum, match) => sum + (match.homeScore ?? 0) + (match.awayScore ?? 0), 0);
    const totalAssists = current.reduce((sum, match) => sum + (match.timeline?.filter((event) => event.assistPlayerId).length ?? 0), 0);
    const matchOfNight = [...current].sort((a, b) => {
      const score = (match: LeagueMatch) => ((match.homeScore ?? 0) + (match.awayScore ?? 0)) * 3 + (match.timeline?.filter((event) => event.sortMinute >= 80).length ?? 0);
      return score(b) - score(a);
    })[0];
    const upset = current
      .map((match) => {
        const home = teamsById[match.homeTeamId];
        const away = teamsById[match.awayTeamId];
        const winner = (match.homeScore ?? 0) > (match.awayScore ?? 0) ? home : (match.awayScore ?? 0) > (match.homeScore ?? 0) ? away : null;
        const loser = winner?.id === home?.id ? away : home;
        return { match, winner, gap: winner && loser ? loser.rating - winner.rating : -1 };
      })
      .filter((entry) => entry.winner && entry.gap >= 2)
      .sort((a, b) => b.gap - a.gap)[0] ?? null;
    const playerOfNight = current
      .filter((match) => match.motm)
      .map((match) => ({ match, motm: match.motm!, rating: match.playerRatings?.[match.motm!.playerId] ?? 0 }))
      .sort((a, b) => b.rating - a.rating)[0] ?? null;
    const beforeDirect = new Set(before.slice(0, 8).map((row) => row.teamId));
    const beforeQualified = new Set(before.slice(0, 24).map((row) => row.teamId));
    const enteredDirect = after.slice(0, 8).filter((row) => !beforeDirect.has(row.teamId));
    const enteredTop24 = after.slice(0, 24).filter((row) => !beforeQualified.has(row.teamId));
    const droppedOut = before.slice(0, 24).filter((row) => !after.slice(0, 24).some((currentRow) => currentRow.teamId === row.teamId));
    return { current, before, after, movers, totalGoals, totalAssists, matchOfNight, upset, playerOfNight, enteredDirect, enteredTop24, droppedOut };
  }, [matchday, matches, teams, teamsById]);

  if (!recap) return null;
  const matchHome = teamsById[recap.matchOfNight.homeTeamId];
  const matchAway = teamsById[recap.matchOfNight.awayTeamId];
  const directCut = recap.after[7];
  const firstPlayoff = recap.after[8];
  const playoffCut = recap.after[23];
  const firstEliminated = recap.after[24];
  const movementText = recap.enteredDirect.length > 0
    ? `${recap.enteredDirect.map((row) => row.teamName).join(', ')} moved into the direct Round of 16 places.`
    : recap.enteredTop24.length > 0
    ? `${recap.enteredTop24.map((row) => row.teamName).join(', ')} moved into the Top 24.`
    : recap.droppedOut.length > 0
    ? `${recap.droppedOut.map((row) => row.teamName).join(', ')} dropped below the Top 24 line.`
    : 'No club crossed either qualification line this matchday.';
  const qualificationMoves = [
    ...recap.enteredDirect.map((row) => ({ teamId: row.teamId, name: row.teamName, direction: 'up' as const, label: 'Entered Top 8' })),
    ...recap.enteredTop24
      .filter((row) => !recap.enteredDirect.some((direct) => direct.teamId === row.teamId))
      .map((row) => ({ teamId: row.teamId, name: row.teamName, direction: 'up' as const, label: 'Entered Top 24' })),
    ...recap.droppedOut.map((row) => ({ teamId: row.teamId, name: row.teamName, direction: 'down' as const, label: 'Dropped out' })),
  ].slice(0, 3);

  const renderCutLine = (
    label: string,
    safe: typeof directCut,
    chasing: typeof firstPlayoff,
    tone: 'cyan' | 'amber',
  ) => {
    const gap = safe && chasing ? safe.points - chasing.points : 0;
    const safeTeam = safe ? teamsById[safe.teamId] : null;
    const chasingTeam = chasing ? teamsById[chasing.teamId] : null;
    const toneClasses = tone === 'cyan'
      ? 'border-cyan-300/20 bg-cyan-300/[0.045] text-cyan-300'
      : 'border-amber-300/20 bg-amber-300/[0.045] text-amber-300';
    return <div className={`rounded-xl border p-2.5 ${toneClasses}`}><div className="flex items-center justify-between gap-2"><p className="text-[10px] font-black uppercase tracking-wider">{label}</p><span className="rounded-full bg-black/25 px-2 py-1 font-mono text-[10px] font-black">Gap {gap}</span></div><div className="mt-2.5 grid grid-cols-[minmax(0,1fr)_32px_minmax(0,1fr)] items-stretch"><div className="min-w-0 rounded-lg bg-black/20 p-2"><div className="flex items-center justify-between gap-1"><span className="font-mono text-[10px] font-black text-white/45">#{safe?.position}</span><span className="font-mono text-sm font-black text-white">{safe?.points} pts</span></div><div className="mt-2 flex min-w-0 items-center gap-2">{safeTeam?.logo && <img src={safeTeam.logo} alt="" className="h-6 w-6 shrink-0 object-contain" />}<span className="min-w-0 whitespace-normal text-[11px] font-black leading-4 text-white [overflow-wrap:anywhere]">{safe?.teamName}</span></div></div><div className="flex flex-col items-center justify-center"><span className="h-full w-px bg-current opacity-30" /><span className="py-1 text-[8px] font-black tracking-wider">CUT</span><span className="h-full w-px bg-current opacity-30" /></div><div className="min-w-0 rounded-lg bg-black/20 p-2"><div className="flex items-center justify-between gap-1"><span className="font-mono text-[10px] font-black text-white/45">#{chasing?.position}</span><span className="font-mono text-sm font-black text-white">{chasing?.points} pts</span></div><div className="mt-2 flex min-w-0 items-center gap-2">{chasingTeam?.logo && <img src={chasingTeam.logo} alt="" className="h-6 w-6 shrink-0 object-contain" />}<span className="min-w-0 whitespace-normal text-[11px] font-black leading-4 text-white [overflow-wrap:anywhere]">{chasing?.teamName}</span></div></div></div></div>;
  };

  return (
    <section aria-labelledby={`md-${matchday}-recap-title`} className="overflow-hidden rounded-3xl border border-cyan-300/15 bg-gradient-to-br from-[#071934] via-[#041027] to-[#020817] p-4 shadow-[0_20px_65px_rgba(0,6,20,0.4)] sm:p-6">
      <header className="flex flex-col gap-3 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-3"><img src={patchUclImg} alt="" className="h-11 w-11 object-contain" /><div><p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">Auto-generated briefing</p><h3 id={`md-${matchday}-recap-title`} className="text-2xl font-black">Matchday {matchday} Recap</h3></div></div>
        <p className="text-xs text-white/45">{recap.totalGoals} goals · {recap.totalAssists} assists · 18 matches</p>
      </header>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] p-4"><p className="text-[10px] font-black uppercase tracking-wider text-amber-300">Match of the night</p><div className="mt-4 flex items-center justify-between gap-3"><div className="flex items-center gap-2">{matchHome?.logo && <img src={matchHome.logo} alt="" className="h-9 w-9 object-contain" />}<span className="font-black">{matchHome?.shortName}</span></div><span className="font-mono text-2xl font-black">{recap.matchOfNight.homeScore}–{recap.matchOfNight.awayScore}</span><div className="flex items-center gap-2"><span className="font-black">{matchAway?.shortName}</span>{matchAway?.logo && <img src={matchAway.logo} alt="" className="h-9 w-9 object-contain" />}</div></div></article>
        <article className="rounded-2xl border border-fuchsia-300/20 bg-fuchsia-300/[0.05] p-4"><div className="flex items-center gap-2"><img src={mvpCupImg} alt="" className="h-7 w-7 object-contain" /><p className="text-[10px] font-black uppercase tracking-wider text-fuchsia-300">Player of the night</p></div>{recap.playerOfNight ? <div className="mt-3"><p className="text-lg font-black">{recap.playerOfNight.motm.playerName}</p><p className="mt-1 text-xs text-white/45">{recap.playerOfNight.motm.teamName} · Rating {recap.playerOfNight.rating.toFixed(1)}</p></div> : <p className="mt-4 text-sm text-white/40">No award recorded</p>}</article>
        <article className="rounded-2xl border border-rose-300/20 bg-rose-300/[0.05] p-4"><p className="text-[10px] font-black uppercase tracking-wider text-rose-300">Upset watch</p>{recap.upset?.winner ? <div className="mt-4 flex items-center gap-3">{recap.upset.winner.logo && <img src={recap.upset.winner.logo} alt="" className="h-10 w-10 object-contain" />}<div><p className="font-black">{recap.upset.winner.name}</p><p className="text-xs text-white/45">Beat a club rated {recap.upset.gap} points higher</p></div></div> : <p className="mt-4 text-sm text-white/40">No major upset this matchday</p>}</article>
        <article className="rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.035] p-4"><p className="text-[10px] font-black uppercase tracking-wider text-emerald-300">Qualification lines</p><div className="mt-3 space-y-2.5">{renderCutLine('Direct R16 · 8th / 9th', directCut, firstPlayoff, 'cyan')}{renderCutLine('Play-off · 24th / 25th', playoffCut, firstEliminated, 'amber')}{qualificationMoves.length > 0 ? <div className="space-y-1.5 pt-1">{qualificationMoves.map((move) => <div key={`${move.teamId}-${move.label}`} className="flex min-h-8 items-center gap-2 rounded-lg bg-black/20 px-2.5"><span className={`font-mono text-sm font-black ${move.direction === 'up' ? 'text-emerald-300' : 'text-rose-300'}`}>{move.direction === 'up' ? '↑' : '↓'}</span>{teamsById[move.teamId]?.logo && <img src={teamsById[move.teamId].logo} alt="" className="h-4 w-4 shrink-0 object-contain" />}<span className="min-w-0 flex-1 whitespace-normal text-[10px] font-bold leading-4 [overflow-wrap:anywhere]">{move.name}</span><span className="text-[9px] font-black uppercase tracking-wider text-white/35">{move.label}</span></div>)}</div> : <p className="rounded-lg bg-black/20 px-2.5 py-2 text-[10px] leading-4 text-white/45">{movementText}</p>}</div></article>
      </div>
      {recap.movers.length > 0 && <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">Biggest table movers</p><div className="mt-3 grid gap-2 sm:grid-cols-3">{recap.movers.map((row) => <div key={row.teamId} className="flex min-h-11 items-center gap-2 rounded-xl bg-white/[0.04] px-3">{teamsById[row.teamId]?.logo && <img src={teamsById[row.teamId].logo} alt="" className="h-6 w-6 shrink-0 object-contain" />}<span className="min-w-0 flex-1 whitespace-normal text-xs font-bold leading-4 [overflow-wrap:anywhere]">{row.teamName}</span><span className={`flex items-center gap-1 font-mono text-xs font-black ${row.movement > 0 ? 'text-emerald-300' : 'text-rose-300'}`}>{row.movement > 0 ? '↑' : '↓'}{Math.abs(row.movement)}</span></div>)}</div></div>}
    </section>
  );
};
