import { useEffect, useRef, useState } from 'react';
import type { LeagueMatch } from '../../types/leagueConfig';
import type { Team } from '../../types/tournament';
import { getClubTheme } from '../../data/competitions/ucl2627/clubThemes';
import { Check, Play as PlayIcon } from 'lucide';
import patchUclImg from '../../img/CUP COMPETITION/UCL/patch_ucl.png';
import badgeUclImg from '../../img/CUP COMPETITION/UCL/badge_ucl.png';
import { UCLMorphIcon } from './UCLMorphIcon';
import { UCLMatchTimeline } from './UCLMatchTimeline';

interface UCLMatchCardProps {
  match: LeagueMatch;
  matchday: number;
  homeTeam: Team;
  awayTeam: Team;
  onPredict: (matchId: string) => void;
  onSelectTeam?: (teamId: string) => void;
}

const StadiumIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 shrink-0" aria-hidden="true">
    <path d="M2 10c0-3.3 4.5-6 10-6s10 2.7 10 6v4c0 3.3-4.5 6-10 6S2 17.3 2 14v-4z" />
    <path d="M6 10v4M10 10v4M14 10v4M18 10v4" />
    <ellipse cx="12" cy="10" rx="10" ry="3" />
  </svg>
);

export const UCLMatchCard: React.FC<UCLMatchCardProps> = ({
  match,
  matchday,
  homeTeam,
  awayTeam,
  onPredict,
  onSelectTeam,
}) => {
  const [isPredicting, setIsPredicting] = useState(false);
  const predictTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isCompleted = match.status === 'completed';
  const homeTheme = getClubTheme(homeTeam.id);

  useEffect(() => () => {
    if (predictTimer.current) clearTimeout(predictTimer.current);
  }, []);

  const handlePredict = () => {
    if (isPredicting) return;
    setIsPredicting(true);
    predictTimer.current = setTimeout(() => onPredict(match.id), 220);
  };

  return (
    <article className="w-full overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#071329] via-[#050d1d] to-[#020817] shadow-[0_20px_60px_rgba(0,6,20,0.36)] transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-sky-300/30">
      <header className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 border-b border-white/10 bg-black/25 px-3 py-2.5 sm:grid-cols-[1fr_minmax(0,1.45fr)_1fr] sm:gap-3 sm:px-4 sm:py-3">
        <div className="flex min-w-0 items-center gap-1.5">
          <img src={patchUclImg} alt="UEFA Champions League" className="h-5 w-5 shrink-0 object-contain opacity-80" />
          <span className="truncate rounded-lg border border-cyan-200/20 bg-white/[0.055] px-2 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-cyan-100 sm:text-[9px] sm:tracking-[0.12em]">
            MD {matchday}<span className="hidden sm:inline"> · Matchday</span>
          </span>
        </div>
        <div className={`flex min-w-0 items-center justify-self-center rounded-full border px-2 py-1 text-[8px] font-bold sm:gap-2 sm:px-3 sm:text-[10px] ${homeTheme.badgeBg} ${homeTheme.badgeText} ${homeTheme.badgeBorder}`}>
          <StadiumIcon />
          <span className="truncate">{homeTeam.stadium || 'Home Arena'}</span>
        </div>
        <div className="flex min-w-0 items-center justify-end gap-1.5 sm:gap-2">
          <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${isCompleted ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300' : 'border-white/10 bg-white/5 text-white/40'}`}>
            {isCompleted ? 'FT' : 'Pending'}
          </span>
          <img src={badgeUclImg} alt="UEFA Champions League badge" className="h-5 w-5 shrink-0 object-contain opacity-85 sm:h-6 sm:w-6" />
        </div>
      </header>

      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 px-4 py-5 sm:gap-5 sm:px-6">
        <button type="button" onClick={() => onSelectTeam?.(homeTeam.id)} className="group min-w-0 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">
          <img src={homeTeam.logo} alt={homeTeam.name} className="mx-auto h-12 w-12 object-contain transition group-hover:scale-105 sm:h-16 sm:w-16" />
          <span className="mt-2 block truncate text-lg font-black text-white group-hover:text-sky-200">{homeTeam.name}</span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-cyan-400">Home</span>
        </button>

        <div className="text-center">
          <p className="text-[9px] font-black uppercase tracking-[0.25em] text-white/35">Score</p>
          <div className="mt-1 rounded-2xl border border-white/15 bg-black/35 px-3 py-2 font-mono text-4xl font-black text-white sm:px-5">
            {isCompleted ? (
              <>{match.homeScore}<span className="mx-1.5 text-white/25">—</span>{match.awayScore}</>
            ) : (
              <span className="text-white/30">– — –</span>
            )}
          </div>
        </div>

        <button type="button" onClick={() => onSelectTeam?.(awayTeam.id)} className="group min-w-0 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300">
          <img src={awayTeam.logo} alt={awayTeam.name} className="mx-auto h-12 w-12 object-contain transition group-hover:scale-105 sm:h-16 sm:w-16" />
          <span className="mt-2 block truncate text-lg font-black text-white group-hover:text-sky-200">{awayTeam.name}</span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-sky-300">Away</span>
        </button>
      </div>

      {isCompleted && (
        <div className="border-t border-white/10 px-4 py-4 sm:px-6">
          <UCLMatchTimeline
            matchId={match.id} homeTeam={homeTeam} awayTeam={awayTeam}
            timeline={match.timeline} scorers={match.scorers} motm={match.motm}
          />
        </div>
      )}

      {!isCompleted && (
        <div className="border-t border-white/10 bg-black/20 p-4">
          <button type="button" onClick={handlePredict} disabled={isPredicting} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-white shadow-[0_0_20px_rgba(0,240,255,0.28)] transition hover:brightness-110 active:scale-[0.98] disabled:cursor-wait">
            <UCLMorphIcon icon={isPredicting ? Check : PlayIcon} size={17} strokeWidth={2.2} />
            {isPredicting ? 'Generating score' : 'Predict'}
          </button>
        </div>
      )}
    </article>
  );
};
