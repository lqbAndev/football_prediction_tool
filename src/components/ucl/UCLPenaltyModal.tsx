import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { TwoLegMatch, UCLPenaltyKick } from '../../types/uclConfig';
import type { Team } from '../../types/tournament';
import uclBallImg from '../../img/CUP COMPETITION/UCL/ball/ucl_ball_26-27.png';

interface UCLPenaltyModalProps {
  tie: TwoLegMatch | null;
  teamsById: Record<string, Team>;
  onClose: () => void;
}

const getKickResultLabel = (kick: UCLPenaltyKick) => kick.scored
  ? 'Goal'
  : kick.outcome === 'saved'
  ? 'Saved'
  : kick.outcome === 'off-target'
  ? 'Off target'
  : 'Miss';

export const UCLPenaltyModal: React.FC<UCLPenaltyModalProps> = ({ tie, teamsById, onClose }) => {
  useEffect(() => {
    if (!tie) return;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [tie, onClose]);

  if (!tie?.leg2.penalties) return null;

  const homeTeam = teamsById[tie.homeTeamId];
  const awayTeam = teamsById[tie.awayTeamId];
  if (!homeTeam || !awayTeam) return null;

  const penalties = tie.leg2.penalties;
  const homeKicks = penalties.kicks.filter((kick) => kick.team === 'home');
  const awayKicks = penalties.kicks.filter((kick) => kick.team === 'away');
  const firstKicker = penalties.kicks[0]?.team === 'home' ? homeTeam.shortName : awayTeam.shortName;

  const KickIcon = ({ kick }: { kick: UCLPenaltyKick }) => (
    <span
      className={`inline-flex h-7 w-7 items-center justify-center transition-transform hover:scale-110 ${kick.scored ? '' : 'opacity-25 grayscale'}`}
      title={`${kick.playerName}: ${getKickResultLabel(kick)}`}
      aria-label={`${kick.playerName}: ${getKickResultLabel(kick)}`}
    >
      <img src={uclBallImg} alt="" className="h-6 w-6 object-contain" />
    </span>
  );

  const KickRow = ({ kicks }: { kicks: UCLPenaltyKick[] }) => (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      {kicks.length > 0
        ? kicks.map((kick, index) => <KickIcon key={`${kick.round}-${index}`} kick={kick} />)
        : <span className="text-sm text-white/30">—</span>}
    </div>
  );

  return createPortal(
    <>
      <button
        type="button"
        className="fixed inset-0 z-[9998] cursor-default bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close penalty shootout details"
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="ucl-penalty-title"
        className="fixed bottom-0 left-0 right-0 z-[9999] flex max-h-[88dvh] flex-col overflow-y-auto rounded-t-[24px] border border-white/10 bg-[linear-gradient(160deg,rgba(5,17,48,0.99),rgba(2,8,25,0.99))] shadow-[0_-4px_48px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.04)] sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[min(560px,calc(100vw-2rem))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[24px]"
      >
        <div className="mx-auto mb-1 mt-3 h-1 w-10 shrink-0 rounded-full bg-white/15 sm:hidden" />

        <header className="sticky top-0 z-10 flex items-center gap-3 rounded-t-[24px] border-b border-white/[0.08] bg-[rgba(5,15,42,0.97)] px-4 py-4 backdrop-blur-xl sm:px-6">
          <div className="flex min-w-0 flex-1 items-center justify-center gap-2 overflow-hidden">
            <img src={homeTeam.logo} alt="" className="h-6 w-6 shrink-0 object-contain" />
            <span className="max-w-[72px] truncate text-sm font-bold text-white sm:max-w-none sm:text-base">
              {homeTeam.shortName}
            </span>
            <span className="shrink-0 rounded-xl border border-rose-300/30 bg-rose-300/10 px-3 py-1.5 font-mono text-lg font-extrabold tabular-nums text-rose-100">
              {penalties.homeScore}&thinsp;–&thinsp;{penalties.awayScore}
            </span>
            <span className="max-w-[72px] truncate text-sm font-bold text-white sm:max-w-none sm:text-base">
              {awayTeam.shortName}
            </span>
            <img src={awayTeam.logo} alt="" className="h-6 w-6 shrink-0 object-contain" />
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/50 transition hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="space-y-5 p-4 sm:p-6">
          <div>
            <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
              <h2 id="ucl-penalty-title" className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/40">
                Kick Sequence
              </h2>
              {penalties.kicks.length > 0 && (
                <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-300/80">
                  {firstKicker} kicks first
                </span>
              )}
            </div>

            <div className="space-y-3.5 rounded-[18px] border border-white/[0.08] bg-white/[0.03] px-4 py-5 sm:px-5">
              <div className="flex items-center gap-3">
                <span className="w-16 shrink-0 truncate text-right text-xs font-semibold text-emerald-300/70">
                  {homeTeam.shortName}
                </span>
                <KickRow kicks={homeKicks} />
              </div>
              <div className="h-px bg-white/[0.08]" />
              <div className="flex items-center gap-3">
                <span className="w-16 shrink-0 truncate text-right text-xs font-semibold text-cyan-300/70">
                  {awayTeam.shortName}
                </span>
                <KickRow kicks={awayKicks} />
              </div>
            </div>
          </div>

          {(homeKicks.length > 0 || awayKicks.length > 0) && (
            <div className="grid grid-cols-2 gap-3">
              <section className="min-w-0 rounded-[18px] border border-emerald-400/15 bg-emerald-950/25 p-3 sm:p-4">
                <p className="mb-3 flex min-w-0 items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300/60">
                  <img src={homeTeam.logo} alt="" className="h-4 w-4 shrink-0 object-contain" />
                  <span className="truncate">{homeTeam.shortName}</span>
                </p>
                <div className="space-y-2.5">
                  {homeKicks.map((kick, index) => (
                    <div key={`${kick.round}-${index}`} className="flex min-w-0 items-center gap-1.5">
                      <span className="w-4 shrink-0 text-right font-mono text-[10px] text-white/30">{index + 1}.</span>
                      <span className={`min-w-0 flex-1 truncate text-xs leading-5 ${kick.scored ? 'text-white/90' : 'text-white/30'}`}>
                        {kick.playerName}
                      </span>
                      <KickIcon kick={kick} />
                    </div>
                  ))}
                </div>
              </section>

              <section className="min-w-0 rounded-[18px] border border-cyan-400/15 bg-cyan-950/25 p-3 sm:p-4">
                <p className="mb-3 flex min-w-0 items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-300/60">
                  <img src={awayTeam.logo} alt="" className="h-4 w-4 shrink-0 object-contain" />
                  <span className="truncate">{awayTeam.shortName}</span>
                </p>
                <div className="space-y-2.5">
                  {awayKicks.map((kick, index) => (
                    <div key={`${kick.round}-${index}`} className="flex min-w-0 items-center gap-1.5">
                      <span className="w-4 shrink-0 text-right font-mono text-[10px] text-white/30">{index + 1}.</span>
                      <span className={`min-w-0 flex-1 truncate text-xs leading-5 ${kick.scored ? 'text-white/90' : 'text-white/30'}`}>
                        {kick.playerName}
                      </span>
                      <KickIcon kick={kick} />
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {penalties.kicks.length === 0 && (
            <p className="py-4 text-center text-sm text-white/35">No detailed data for this shootout.</p>
          )}

          <p className="text-center text-xs text-amber-300/55">
            {penalties.kicks.length} total kicks
          </p>
        </div>
      </section>
    </>,
    document.body,
  );
};
