import { useState } from 'react';
import { Zap, Clock, ChevronDown } from 'lucide-react';
import type { LeagueMatch } from '../../types/leagueConfig';
import type { Team } from '../../types/tournament';
import { TriondaBall } from '../BrandAssets';

interface LeagueMatchCardProps {
  match: LeagueMatch;
  homeTeam: Team;
  awayTeam: Team;
  onPredictMatch?: (matchId: string) => void;
}

function LeagueMatchCard({
  match,
  homeTeam,
  awayTeam,
  onPredictMatch,
}: LeagueMatchCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isCompleted = match.status === 'completed';
  const hasTimeline = match.timeline && match.timeline.length > 0;

  const homeEvents = match.timeline?.filter((e) => e.side === 'home') ?? [];
  const awayEvents = match.timeline?.filter((e) => e.side === 'away') ?? [];

  return (
    <div className="bg-emerald-950/10 rounded-2xl p-4 border border-emerald-500/10 hover:bg-emerald-950/20 hover:border-emerald-500/20 transition-all duration-300 shadow-sm flex flex-col gap-3">
      <div className="flex items-center justify-between">
        {/* Home Team */}
        <div className="flex-1 text-right pr-2">
          <span className="text-white font-bold text-sm sm:text-base">{homeTeam.name}</span>
        </div>

        {/* Score or VS */}
        <div className="mx-3 min-w-[80px] text-center flex flex-col items-center justify-center gap-1">
          {isCompleted ? (
            <div className="flex items-center justify-center gap-2 bg-emerald-950/50 px-3 py-1 rounded-xl border border-emerald-500/10 shadow-inner">
              <span className="text-xl font-black text-emerald-300">{match.homeScore}</span>
              <span className="text-emerald-500/60 font-bold">:</span>
              <span className="text-xl font-black text-emerald-300">{match.awayScore}</span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <span className="text-emerald-400/40 text-xs font-black tracking-wider bg-emerald-950/40 px-3 py-1 rounded-lg border border-emerald-500/5">VS</span>
            </div>
          )}
        </div>

        {/* Away Team */}
        <div className="flex-1 text-left pl-2">
          <span className="text-white font-bold text-sm sm:text-base">{awayTeam.name}</span>
        </div>
      </div>

      {/* Expandable Scorers / Timeline */}
      {isCompleted && hasTimeline ? (
        <div className="mt-1">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="inline-flex w-full items-center justify-between gap-2 rounded-xl border border-emerald-500/10 bg-emerald-950/40 px-3 py-2 text-left text-sm text-emerald-300/70 transition hover:bg-emerald-900/30"
          >
            <span className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-emerald-400/60" />
              <span className="text-xs font-bold uppercase tracking-[0.18em]">Match Timeline</span>
            </span>
            <ChevronDown
              className={`h-4 w-4 text-emerald-400/45 transition-transform duration-200 ${expanded ? 'rotate-180' : ''
                }`}
            />
          </button>

          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${expanded ? 'mt-2 max-h-[300px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
              }`}
          >
            <div className="grid gap-2 grid-cols-2">
              {/* Home scorers */}
              <div className="rounded-xl border border-emerald-500/5 bg-emerald-950/30 p-2.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-400/50">{homeTeam.name.slice(0, 3).toUpperCase()}</p>
                <div className="mt-1.5 space-y-1">
                  {homeEvents.length > 0 ? (
                    homeEvents.map((event, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-xs text-white/80">
                        <TriondaBall size={12} className="shrink-0" />
                        <span className="shrink-0 font-mono text-[11px] font-bold text-emerald-400/80">
                          {event.displayMinute}
                        </span>
                        <span className="truncate">
                          {event.playerName}
                          {event.isPenalty && (
                            <span className="ml-1 text-[9px] font-bold text-amber-400/80">(P)</span>
                          )}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-[11px] text-white/30 italic">No goals</p>
                  )}
                </div>
              </div>

              {/* Away scorers */}
              <div className="rounded-xl border border-emerald-500/5 bg-emerald-950/30 p-2.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-400/50">{awayTeam.name.slice(0, 3).toUpperCase()}</p>
                <div className="mt-1.5 space-y-1">
                  {awayEvents.length > 0 ? (
                    awayEvents.map((event, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-xs text-white/80">
                        <TriondaBall size={12} className="shrink-0" />
                        <span className="shrink-0 font-mono text-[11px] font-bold text-emerald-400/80">
                          {event.displayMinute}
                        </span>
                        <span className="truncate">
                          {event.playerName}
                          {event.isPenalty && (
                            <span className="ml-1 text-[9px] font-bold text-amber-400/80">(P)</span>
                          )}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-[11px] text-white/30 italic">No goals</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : isCompleted ? (
        /* Fallback for legacy goals */
        <div className="mt-1 grid gap-2 grid-cols-2">
          <div className="rounded-xl border border-emerald-500/5 bg-emerald-950/30 p-2.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-400/50">{homeTeam.name.slice(0, 3).toUpperCase()}</p>
            <p className="mt-1 text-xs text-white/70">
              {match.scorers?.home.length
                ? match.scorers.home.map((e) => `${e.playerName} ${e.minute}'`).join(', ')
                : 'No goals'}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-500/5 bg-emerald-950/30 p-2.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-400/50">{awayTeam.name.slice(0, 3).toUpperCase()}</p>
            <p className="mt-1 text-xs text-white/70">
              {match.scorers?.away.length
                ? match.scorers.away.map((e) => `${e.playerName} ${e.minute}'`).join(', ')
                : 'No goals'}
            </p>
          </div>
        </div>
      ) : null}

      {!isCompleted && onPredictMatch && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPredictMatch(match.id);
          }}
          className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-emerald-300 hover:text-white hover:bg-emerald-500/25 active:scale-[0.98] transition-all duration-200"
        >
          Predict Match
        </button>
      )}
    </div>
  );
}

interface MatchweekSliderProps {
  currentMatchweek: number;
  totalRounds: number;
  fixtures: LeagueMatch[];
  teamsById: Record<string, Team>;
  onMatchweekChange: (matchweek: number) => void;
  onSimulateMatchweek: () => void;
  isMatchweekCompleted: boolean;
  onPredictMatch?: (matchId: string) => void;
}

export default function MatchweekSlider({
  currentMatchweek,
  totalRounds,
  fixtures,
  teamsById,
  onMatchweekChange,
  onSimulateMatchweek,
  isMatchweekCompleted,
  onPredictMatch,
}: MatchweekSliderProps) {
  const matchweekFixtures = fixtures.filter((m) => m.matchweek === currentMatchweek);

  return (
    <div className="bg-emerald-950/20 backdrop-blur-md rounded-2xl p-6 border border-emerald-500/15 shadow-[0_8px_32px_rgba(0,0,0,0.37)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <span>📅</span> Matchweek {currentMatchweek}
        </h2>
        {!isMatchweekCompleted && (
          <button
            onClick={onSimulateMatchweek}
            className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl active:scale-95 border border-emerald-400/25 flex items-center gap-2"
          >
            Simulate Matchweek {currentMatchweek}
          </button>
        )}
        {isMatchweekCompleted && (
          <span className="px-4 py-2 bg-emerald-500/20 text-emerald-300 font-semibold rounded-xl border border-emerald-500/30">
            Completed
          </span>
        )}
      </div>

      {/* Matchweek Selector */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => onMatchweekChange(Math.max(1, currentMatchweek - 1))}
            disabled={currentMatchweek === 1}
            className="px-3 py-2 bg-emerald-500/10 text-emerald-300 rounded-lg hover:bg-emerald-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors border border-emerald-500/10"
          >
            ←
          </button>
          <div className="flex-1 flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-emerald-500/20">
            {Array.from({ length: totalRounds }, (_, i) => i + 1).map((mw) => {
              const isCompleted = fixtures
                .filter((f) => f.matchweek === mw)
                .every((f) => f.status === 'completed');
              const isCurrent = mw === currentMatchweek;

              return (
                <button
                  key={mw}
                  onClick={() => onMatchweekChange(mw)}
                  className={`px-3.5 py-2 rounded-lg font-bold transition-all text-sm shrink-0 border ${isCurrent
                    ? 'bg-emerald-500 text-emerald-950 border-emerald-400 shadow-md shadow-emerald-500/20 scale-105'
                    : isCompleted
                      ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/20 hover:bg-emerald-900/30'
                      : 'bg-white/5 text-white/50 border-white/5 hover:bg-white/10 hover:text-white'
                    }`}
                >
                  {mw}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => onMatchweekChange(Math.min(totalRounds, currentMatchweek + 1))}
            disabled={currentMatchweek === totalRounds}
            className="px-3 py-2 bg-emerald-500/10 text-emerald-300 rounded-lg hover:bg-emerald-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors border border-emerald-500/10"
          >
            →
          </button>
        </div>
      </div>

      {/* Fixtures List */}
      <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2">
        {matchweekFixtures.map((match) => {
          const homeTeam = teamsById[match.homeTeamId];
          const awayTeam = teamsById[match.awayTeamId];

          return (
            <LeagueMatchCard
              key={match.id}
              match={match}
              homeTeam={homeTeam}
              awayTeam={awayTeam}
              onPredictMatch={onPredictMatch}
            />
          );
        })}
      </div>
    </div>
  );
}
