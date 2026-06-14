import { X, Trophy, Sparkles, Award } from 'lucide-react';
import ReactConfetti from 'react-confetti';
import { useEffect, useState } from 'react';

interface LeagueChampionModalProps {
  championName: string | null;
  isOpen: boolean;
  onClose: () => void;
  onViewRecap?: () => void;
  points?: number;
  stats?: {
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
  };
}

export default function LeagueChampionModal({
  championName,
  isOpen,
  onClose,
  onViewRecap,
  points = 0,
  stats,
}: LeagueChampionModalProps) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    setDimensions({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }, [isOpen]);

  if (!isOpen || !championName) return null;

  const handleViewRecap = () => {
    onClose();
    onViewRecap?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="pointer-events-none absolute inset-0 z-0">
        <ReactConfetti
          width={dimensions.width}
          height={dimensions.height}
          recycle={true}
          numberOfPieces={250}
        />
      </div>
      <div
        className="fixed inset-0 z-10 bg-black/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      <div className="relative z-20 w-full max-w-xl overflow-hidden rounded-[32px] border border-amber-400/25 bg-[linear-gradient(155deg,rgba(4,24,14,0.95),rgba(2,12,7,0.92))] p-8 text-center shadow-[0_0_40px_rgba(245,158,11,0.2)] backdrop-blur-xl">
        {/* Decorative lights */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.25),transparent_35%),radial-gradient(circle_at_bottom,rgba(245,158,11,0.18),transparent_35%)]" />

        <button
          onClick={onClose}
          aria-label="Close"
          title="Close"
          className="absolute right-5 top-5 z-30 rounded-full bg-white/5 p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white border border-white/10"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="relative z-20">
          <div className="flex items-center justify-center gap-4">
            <div className="relative">
              <div className="absolute -inset-3 bg-amber-400/20 blur-xl rounded-full animate-pulse" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-2 border-amber-400 bg-emerald-950/80 shadow-[0_0_20px_rgba(245,158,11,0.35)]">
                <Trophy className="h-10 w-10 text-amber-400" />
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.35em] text-amber-300">
            <Sparkles className="h-4 w-4 animate-spin text-amber-400" />
            League Champion
            <Sparkles className="h-4 w-4 animate-spin text-amber-400" />
          </div>

          <h3 className="mt-4 bg-gradient-to-r from-amber-200 via-white to-amber-100 bg-clip-text text-4xl font-black text-transparent sm:text-5xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
            {championName}
          </h3>

          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-emerald-200/80">
            Congratulations to {championName} for finishing at the top of the table and becoming the champion of Vibe Test League this season!
          </p>

          {stats && (
            <div className="mt-6 grid grid-cols-3 gap-3 rounded-2xl border border-emerald-500/15 bg-emerald-950/30 p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-300">{points}</div>
                <div className="text-[10px] uppercase tracking-wider text-emerald-300/60 mt-0.5">Points (PTS)</div>
              </div>
              <div className="text-center border-x border-emerald-500/10">
                <div className="text-2xl font-bold text-white">
                  {stats.wins}-{stats.draws}-{stats.losses}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-emerald-300/60 mt-0.5">Record (W-D-L)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-400">
                  {stats.goalsFor - stats.goalsAgainst > 0 ? '+' : ''}
                  {stats.goalsFor - stats.goalsAgainst}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-emerald-300/60 mt-0.5">Goal Diff (GD)</div>
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleViewRecap}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl border border-amber-400/30 bg-gradient-to-r from-amber-500 to-yellow-500 py-4 px-5 text-sm font-bold text-emerald-950 transition hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-amber-500/10"
            >
              <Award className="h-4 w-4" />
              View Season Recap
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-white/10 bg-white/5 py-4 px-6 text-sm font-semibold text-white transition hover:bg-white/10 active:scale-[0.98]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
