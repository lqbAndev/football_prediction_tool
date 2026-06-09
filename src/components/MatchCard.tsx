import { useState } from 'react';
import { ChevronDown, Clock } from 'lucide-react';
import { useTeamsById } from '../hooks/CompetitionContext';
import type { GroupMatch } from '../types/tournament';
import { Flag } from './Flag';
import { TriondaBall } from './BrandAssets';

interface MatchCardProps {
  match: GroupMatch;
  onPredict: (matchId: string) => void;
}

export const MatchCard = ({ match, onPredict }: MatchCardProps) => {
  const teamsById = useTeamsById();
  const homeTeam = teamsById[match.homeTeamId];
  const awayTeam = teamsById[match.awayTeamId];
  const isCompleted = match.status === 'completed';
  const [expanded, setExpanded] = useState(false);
  const hasTimeline = match.timeline && match.timeline.length > 0;

  const homeEvents = match.timeline?.filter((e) => e.side === 'home') ?? [];
  const awayEvents = match.timeline?.filter((e) => e.side === 'away') ?? [];

  return (
    <article className="rounded-[28px] border border-white/10 bg-black/15 p-4 shadow-glow">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="field-label">Round {match.matchday}</p>
          <div className="mt-1 space-y-2">
            <div className="flex items-center gap-3 text-base font-semibold text-white">
              <Flag teamName={homeTeam.name} size={28} />
              <span>{homeTeam.name}</span>
            </div>
            <div className="flex items-center gap-3 text-base font-semibold text-white">
              <Flag teamName={awayTeam.name} size={28} />
              <span>{awayTeam.name}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span
            className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${isCompleted
                ? 'border border-emerald-300/20 bg-emerald-400/10 text-emerald-100'
                : 'border border-amber-300/20 bg-amber-300/10 text-amber-100'
              }`}
          >
            {isCompleted ? 'Completed' : 'Pending'}
          </span>

          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-center">
            <div className="text-xs uppercase tracking-[0.28em] text-white/45">Score</div>
            <div className="mt-1 text-2xl font-bold text-white">
              {match.homeScore ?? '-'} <span className="text-white/35">:</span> {match.awayScore ?? '-'}
            </div>
          </div>
        </div>
      </div>

      {isCompleted && match.motm ? (
        <div className="mt-3 flex items-center gap-2 rounded-2xl border border-host-mexico/18 bg-host-mexico/10 px-3 py-2">
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/55">MOTM:</span>
          <Flag teamName={match.motm.teamName} size={16} />
          <span className="text-white/45">-</span>
          <span className="text-sm font-bold text-host-ice">{match.motm.playerName}</span>
        </div>
      ) : null}

      {/* Expandable Scorers */}
      {isCompleted && hasTimeline ? (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="inline-flex w-full items-center justify-between gap-2 rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2 text-left text-sm text-white/70 transition hover:bg-white/[0.06]"
          >
            <span className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-emerald-300/60" />
              <span className="text-xs uppercase tracking-[0.18em]">Match Timeline</span>
            </span>
            <ChevronDown
              className={`h-4 w-4 text-white/40 transition-transform duration-200 ${expanded ? 'rotate-180' : ''
                }`}
            />
          </button>

          <div
            className={`timeline-collapse overflow-hidden transition-all duration-300 ease-in-out ${expanded ? 'mt-2 max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
              }`}
          >
            <div className="grid gap-2 md:grid-cols-2">
              {/* Home scorers */}
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                <p className="text-xs uppercase tracking-[0.22em] text-emerald-200/60">{homeTeam.shortName}</p>
                <div className="mt-2 space-y-1">
                  {homeEvents.length > 0 ? (
                    homeEvents.map((event, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-white/80">
                        <TriondaBall size={14} />
                        <span className="shrink-0 font-mono text-[14px] text-emerald-300/70">
                          {event.displayMinute}
                        </span>
                        <span>
                          {event.playerName}
                          {event.isPenalty && (
                            <span className="ml-1 text-[10px] font-semibold text-amber-300/70">PEN</span>
                          )}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-white/40">No goals</p>
                  )}
                </div>
              </div>

              {/* Away scorers */}
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                <p className="text-xs uppercase tracking-[0.22em] text-cyan-200/60">{awayTeam.shortName}</p>
                <div className="mt-2 space-y-1">
                  {awayEvents.length > 0 ? (
                    awayEvents.map((event, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-white/80">
                        <TriondaBall size={14} />
                        <span className="shrink-0 font-mono text-[14px] text-cyan-300/70">
                          {event.displayMinute}
                        </span>
                        <span>
                          {event.playerName}
                          {event.isPenalty && (
                            <span className="ml-1 text-[10px] font-semibold text-amber-300/70">PEN</span>
                          )}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-white/40">No goals</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : isCompleted ? (
        /* Fallback for matches without timeline (legacy data) */
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
            <p className="text-xs uppercase tracking-[0.22em] text-emerald-200/60">{homeTeam.shortName}</p>
            <p className="mt-2 text-sm leading-6 text-white/80">
              {match.scorers?.home.length
                ? match.scorers.home.map((e) => `${e.playerName} ${e.minute}'`).join(', ')
                : 'No goals.'}
            </p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-200/60">{awayTeam.shortName}</p>
            <p className="mt-2 text-sm leading-6 text-white/80">
              {match.scorers?.away.length
                ? match.scorers.away.map((e) => `${e.playerName} ${e.minute}'`).join(', ')
                : 'No goals.'}
            </p>
          </div>
        </div>
      ) : null}

      {!isCompleted && (
        <button
          type="button"
          onClick={() => onPredict(match.id)}
          className="mt-5 inline-flex w-full items-center justify-center gap-2.5 rounded-2xl border border-emerald-400/25 bg-gradient-to-r from-emerald-500/20 via-teal-500/15 to-emerald-500/20 px-5 py-4 text-sm font-bold tracking-widest text-emerald-100 shadow-[0_4px_24px_rgba(52,211,153,0.08)] transition-all duration-200 hover:-translate-y-1 hover:border-emerald-400/45 hover:from-emerald-500/30 hover:via-teal-500/25 hover:to-emerald-500/30 hover:shadow-[0_8px_32px_rgba(52,211,153,0.18)] active:translate-y-0"
        >
          PREDICT MATCH
        </button>
      )}
    </article>
  );
};
