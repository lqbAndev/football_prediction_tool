import React, { useMemo } from 'react';
import { Activity, FastForward, Pause, Play, Radio } from 'lucide-react';
import type { LeagueMatch } from '../../types/leagueConfig';
import type { UCLLeagueStanding } from '../../utils/uclStandings';
import type { Team } from '../../types/tournament';

interface Props {
  minute: number;
  paused: boolean;
  standings: UCLLeagueStanding[];
  matches: LeagueMatch[];
  teamsById: Record<string, Team>;
  onTogglePause: () => void;
  onFinish: () => void;
}

const RaceList: React.FC<{ title: string; subtitle: string; rows: UCLLeagueStanding[]; teamsById: Record<string, Team> }> = ({ title, subtitle, rows, teamsById }) => (
  <div className="rounded-2xl border border-white/10 bg-black/20 p-3 sm:p-4">
    <div className="mb-3"><p className="text-xs font-black uppercase tracking-[0.14em] text-white/75">{title}</p><p className="mt-1 text-[11px] text-white/40">{subtitle}</p></div>
    <div className="space-y-2">{rows.map((row) => <div key={row.teamId} className="grid min-h-11 grid-cols-[28px_28px_minmax(0,1fr)_auto] items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.035] px-2.5 py-2"><span className="font-mono text-xs font-black text-cyan-300">#{row.position}</span>{teamsById[row.teamId]?.logo ? <img src={teamsById[row.teamId].logo} alt="" className="h-6 w-6 object-contain" /> : <span />}<span className="min-w-0 whitespace-normal text-xs font-bold leading-4 text-white/85 [overflow-wrap:anywhere]">{row.teamName}</span><span className="font-mono text-xs font-black text-white">{row.points} pts</span></div>)}</div>
  </div>
);

export const UCLFinalMatchdayLive: React.FC<Props> = ({ minute, paused, standings, matches, teamsById, onTogglePause, onFinish }) => {
  const latestEvents = useMemo(() => matches
    .flatMap((match) => (match.timeline ?? []).map((event) => ({ event, match })))
    .sort((left, right) => right.event.sortMinute - left.event.sortMinute)
    .slice(0, 4), [matches]);
  const progress = Math.min(100, Math.round((minute / 95) * 100));

  return (
    <section aria-labelledby="ucl-live-table-title" className="rounded-3xl border border-rose-300/30 bg-gradient-to-br from-[#10132d] via-[#061126] to-[#020817] p-3 shadow-[0_22px_80px_rgba(0,0,0,0.62)] sm:p-5">
      <header className="sticky top-[68px] z-30 rounded-2xl border border-rose-300/25 bg-[#081329]/95 p-3 shadow-[0_14px_40px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3"><span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-rose-300/35 bg-rose-300/10 text-rose-300"><span className="absolute inset-1 animate-ping rounded-full border border-rose-300/25 motion-reduce:hidden" /><Radio className="relative h-5 w-5" /></span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="text-[11px] font-black uppercase tracking-[0.18em] text-rose-300">Final Matchday Live</p><span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${paused ? 'bg-amber-300/15 text-amber-200' : 'bg-emerald-300/15 text-emerald-200'}`}>{paused ? 'Paused' : 'Playing'}</span></div><h3 id="ucl-live-table-title" className="mt-0.5 text-xl font-black sm:text-2xl">Live table · {minute >= 90 ? '90+' : `${minute}'`}</h3></div></div>
          <div className="grid grid-cols-2 gap-2 sm:flex"><button type="button" onClick={onTogglePause} aria-pressed={paused} className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.07] px-4 text-sm font-black transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">{paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}{paused ? 'Resume' : 'Pause'}</button><button type="button" onClick={onFinish} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-cyan-300 px-4 text-sm font-black text-[#001226] transition hover:bg-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"><FastForward className="h-4 w-4" />Finish now</button></div>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-rose-400 via-amber-300 to-cyan-300 transition-[width] duration-500 motion-reduce:transition-none" style={{ width: `${progress}%` }} /></div>
      </header>

      <div className="mt-4 rounded-2xl border border-white/10 bg-black/15 p-3 sm:p-4">
        <div className="mb-3 flex items-center justify-between gap-3"><div><p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-cyan-200"><Activity className="h-4 w-4" />18-match live scoreboard</p><p className="mt-1 text-[11px] text-white/40">Every score below changes with the match clock.</p></div><span className="shrink-0 font-mono text-2xl font-black text-white">{minute >= 90 ? '90+' : minute}'</span></div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">{matches.map((match) => {
          const home = teamsById[match.homeTeamId];
          const away = teamsById[match.awayTeamId];
          return <article key={match.id} className="rounded-xl border border-white/[0.07] bg-white/[0.035] p-2.5"><div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-2 gap-y-1.5 text-xs"><span className="min-w-0 whitespace-normal font-bold leading-4 [overflow-wrap:anywhere]">{home?.shortName}</span><span className="font-mono font-black text-cyan-200">{match.homeScore ?? 0}</span><span className="min-w-0 whitespace-normal font-bold leading-4 [overflow-wrap:anywhere]">{away?.shortName}</span><span className="font-mono font-black text-cyan-200">{match.awayScore ?? 0}</span></div></article>;
        })}</div>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-[1fr_1fr_0.9fr]"><RaceList title="Direct R16 race" subtitle="Positions 7–10 around the Top 8 cut" rows={standings.slice(6, 10)} teamsById={teamsById} /><RaceList title="Knockout survival" subtitle="Positions 23–26 around the Top 24 cut" rows={standings.slice(22, 26)} teamsById={teamsById} /><div className="rounded-2xl border border-white/10 bg-black/20 p-4"><p className="text-xs font-black uppercase tracking-[0.14em] text-white/75">Latest goals</p><div className="mt-3 space-y-2">{latestEvents.length > 0 ? latestEvents.map(({ event, match }, index) => <div key={`${match.id}-${event.sortMinute}-${index}`} className="rounded-xl bg-white/[0.04] px-3 py-2"><div className="flex items-start gap-2"><span className="shrink-0 font-mono text-xs font-black text-rose-300">{event.displayMinute}</span><div className="min-w-0"><p className="whitespace-normal text-xs font-black leading-4 [overflow-wrap:anywhere]">{event.playerName}</p><p className="mt-0.5 text-[10px] text-white/40">{teamsById[event.teamId]?.name}</p></div></div></div>) : <p className="rounded-xl border border-dashed border-white/10 px-3 py-5 text-center text-xs text-white/35">Waiting for the first goal…</p>}</div></div></div>
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">Final matchday minute {minute}. Position 8: {standings[7]?.teamName}. Position 24: {standings[23]?.teamName}.</div>
    </section>
  );
};
