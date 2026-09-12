import React from 'react';
import type { LeagueMatch } from '../../types/leagueConfig';
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';

interface UCLMatchdaySliderProps {
  currentMatchday: number;
  totalMatchdays: number;
  fixtures: LeagueMatch[];
  onSelectMatchday: (matchday: number) => void;
}

export const UCLMatchdaySlider: React.FC<UCLMatchdaySliderProps> = ({
  currentMatchday,
  totalMatchdays,
  fixtures,
  onSelectMatchday,
}) => {
  const matchdays = Array.from({ length: totalMatchdays }, (_, i) => i + 1);

  return (
    <div className="w-full rounded-3xl border border-white/10 bg-[#060d1a]/70 p-3 shadow-[0_18px_48px_rgba(0,6,20,0.3)] sm:p-6">
      <div className="flex max-w-full items-center gap-2 overflow-x-auto overflow-y-visible px-1 py-2 scrollbar-none sm:gap-3 sm:px-3 sm:py-4">
        <button
          onClick={() => onSelectMatchday(Math.max(1, currentMatchday - 1))}
          disabled={currentMatchday === 1}
          className="my-2 shrink-0 rounded-xl border border-white/10 bg-white/5 p-2.5 text-white/70 transition-all hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-30 sm:rounded-2xl sm:p-3.5"
          title="Previous Matchday"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Full Matchday Buttons with High Sizing and Clear Status */}
        <div className="flex items-center gap-3 flex-1">
          {matchdays.map((md) => {
            const mdMatches = fixtures.filter((m) => m.matchweek === md);
            const mdDone = mdMatches.filter((m) => m.status === 'completed').length;
            const isSelected = md === currentMatchday;
            const isDone = mdMatches.length > 0 && mdDone === mdMatches.length;

            return (
              <button
                key={md}
                onClick={() => onSelectMatchday(md)}
                className={`my-2 flex min-w-[104px] flex-1 shrink-0 flex-col items-center justify-center rounded-xl border px-3 py-2.5 transition-all sm:min-w-[145px] sm:rounded-2xl sm:px-7 sm:py-4 ${
                  isSelected
                    ? 'bg-gradient-to-b from-cyan-500/25 to-blue-600/30 border-cyan-400 text-white shadow-[0_0_25px_rgba(0,240,255,0.4)] scale-105'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-white/70'
                }`}
              >
                <span className="whitespace-nowrap text-xs font-black tracking-wide sm:text-sm">
                  MD {md}<span className="hidden sm:inline"> · Matchday</span>
                </span>
                <div className="flex items-center gap-1 mt-1.5 text-xs font-mono">
                  {isDone ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 inline" /> 18/18
                    </span>
                  ) : (
                    <span className={isSelected ? 'text-cyan-300 font-semibold' : 'text-white/40'}>
                      {mdDone}/18 Matches
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onSelectMatchday(Math.min(totalMatchdays, currentMatchday + 1))}
          disabled={currentMatchday === totalMatchdays}
          className="my-2 shrink-0 rounded-xl border border-white/10 bg-white/5 p-2.5 text-white/70 transition-all hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-30 sm:rounded-2xl sm:p-3.5"
          title="Next Matchday"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
