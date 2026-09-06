import { useState } from 'react';
import type { LeagueMatch } from '../../types/leagueConfig';
import type { Team, TimelineEvent } from '../../types/tournament';
import { getClubTheme } from '../../data/competitions/ucl2627/clubThemes';
import { ChevronDown, Clock, Star } from 'lucide-react';
import uclBallImg from '../../img/CUP COMPETITION/UCL/ball/ucl_ball_26-27.png';
import patchUclImg from '../../img/CUP COMPETITION/UCL/patch_ucl.png';

interface UCLMatchCardProps {
  match: LeagueMatch;
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

interface GoalLineProps {
  event: Pick<TimelineEvent, 'displayMinute' | 'playerName'> &
    Partial<Pick<TimelineEvent, 'isPenalty' | 'isOwnGoal'>>;
  side: 'home' | 'away';
}

const GoalLine: React.FC<GoalLineProps> = ({ event, side }) => (
  <div className={`flex min-w-0 items-center gap-1.5 text-xs ${side === 'away' ? 'flex-row-reverse text-right' : ''}`}>
    <img src={uclBallImg} alt="Goal" className="h-5 w-5 shrink-0 object-contain" />
    <span className={`shrink-0 font-mono font-black ${side === 'home' ? 'text-sky-300' : 'text-blue-300'}`}>
      {event.displayMinute}
    </span>
    <span className="truncate font-semibold text-white/90">{event.playerName}</span>
    {event.isPenalty && <span className="shrink-0 rounded bg-amber-400/15 px-1 py-0.5 text-[8px] font-black text-amber-300">PEN</span>}
    {event.isOwnGoal && <span className="shrink-0 rounded bg-rose-400/15 px-1 py-0.5 text-[8px] font-black text-rose-300">OG</span>}
  </div>
);

export const UCLMatchCard: React.FC<UCLMatchCardProps> = ({
  match,
  homeTeam,
  awayTeam,
  onPredict,
  onSelectTeam,
}) => {
  const [expanded, setExpanded] = useState(false);
  const isCompleted = match.status === 'completed';
  const homeTheme = getClubTheme(homeTeam.id);
  const timeline = match.timeline || [];
  const homeEvents = timeline.filter((event) => event.side === 'home');
  const awayEvents = timeline.filter((event) => event.side === 'away');

  const fallbackEvents = (side: 'home' | 'away'): GoalLineProps['event'][] =>
    (match.scorers?.[side] || []).map((scorer) => ({
      displayMinute: `${scorer.minute}'`,
      playerName: scorer.playerName,
      isPenalty: false,
      isOwnGoal: false,
    }));

  const displayedHomeEvents = homeEvents.length > 0 ? homeEvents : fallbackEvents('home');
  const displayedAwayEvents = awayEvents.length > 0 ? awayEvents : fallbackEvents('away');

  return (
    <article className="w-full overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#071329] via-[#050d1d] to-[#020817] shadow-[0_20px_60px_rgba(0,6,20,0.36)] transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-sky-300/30">
      <header className="flex items-center justify-between gap-3 border-b border-white/10 bg-black/25 px-4 py-3">
        <div className={`flex min-w-0 items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold ${homeTheme.badgeBg} ${homeTheme.badgeText} ${homeTheme.badgeBorder}`}>
          <StadiumIcon />
          <span className="truncate">{homeTeam.stadium || 'Home Arena'}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <img src={patchUclImg} alt="UEFA Champions League" className="h-5 w-5 object-contain opacity-70" />
          <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${isCompleted ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300' : 'border-white/10 bg-white/5 text-white/40'}`}>
            {isCompleted ? 'Full time' : 'Pending'}
          </span>
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
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={`ucl-timeline-${match.id}`}
            onClick={() => setExpanded((current) => !current)}
            className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-left text-sm font-bold text-white/70 transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-sky-300/25 hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
          >
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-sky-300" />
              Match Timeline
            </span>
            <ChevronDown className={`h-4 w-4 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${expanded ? 'rotate-180' : ''}`} />
          </button>

          <div
            id={`ucl-timeline-${match.id}`}
            className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${expanded ? 'mt-3 max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}
          >
            <div className="grid grid-cols-2 gap-4 rounded-2xl bg-black/15 p-3">
              <div className="min-w-0 space-y-2 border-r border-white/10 pr-2">
                {displayedHomeEvents.length > 0 ? displayedHomeEvents.map((event, index) => <GoalLine key={index} event={event} side="home" />) : <span className="text-xs italic text-white/25">No goals</span>}
              </div>
              <div className="min-w-0 space-y-2 pl-2">
                {displayedAwayEvents.length > 0 ? displayedAwayEvents.map((event, index) => <GoalLine key={index} event={event} side="away" />) : <span className="block text-right text-xs italic text-white/25">No goals</span>}
              </div>
            </div>

            {match.motm && (
              <div className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/[0.07] px-3 py-2 text-xs">
                <Star className="h-4 w-4 shrink-0 fill-amber-400 text-amber-400" />
                <span className="text-[9px] font-black uppercase tracking-wider text-amber-300">MOTM</span>
                <span className="truncate font-black text-white">{match.motm.playerName}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {!isCompleted && (
        <div className="border-t border-white/10 bg-black/20 p-4">
          <button type="button" onClick={() => onPredict(match.id)} className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-white shadow-[0_0_20px_rgba(0,240,255,0.28)] transition hover:brightness-110 active:scale-[0.98]">
            Predict
          </button>
        </div>
      )}
    </article>
  );
};
