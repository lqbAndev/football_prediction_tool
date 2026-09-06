import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CircleCheck, Shield, X, XCircle } from 'lucide-react';
import type { TwoLegMatch } from '../../types/uclConfig';
import type { Team } from '../../types/tournament';
import uclBallImg from '../../img/CUP COMPETITION/UCL/ball/ucl_ball_26-27.png';

interface UCLPenaltyModalProps {
  tie: TwoLegMatch | null;
  teamsById: Record<string, Team>;
  onClose: () => void;
}

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
  const homeKeeper = homeTeam.players.find((player) => player.position === 'GK')?.name || 'Goalkeeper';
  const awayKeeper = awayTeam.players.find((player) => player.position === 'GK')?.name || 'Goalkeeper';

  return createPortal(
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 cursor-default bg-black/80 backdrop-blur-md"
        onClick={onClose}
        aria-label="Close penalty shootout details"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="ucl-penalty-title"
        className="fixed inset-x-0 bottom-0 z-50 flex max-h-[82dvh] flex-col overflow-hidden rounded-t-[28px] border-t border-cyan-400/25 bg-[#00081E] shadow-[0_-20px_70px_rgba(0,6,20,0.7)] sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-h-[86vh] sm:w-[min(680px,calc(100vw-2rem))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[32px] sm:border"
      >
        <div className="mx-auto mt-3 h-1 w-12 rounded-full bg-white/20 sm:hidden" />

        <header className="relative border-b border-white/10 bg-[#000B29] px-4 pb-4 pt-3 sm:px-7 sm:pb-5 sm:pt-6">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-2 rounded-full border border-white/10 bg-white/5 p-2 text-white/60 transition hover:border-cyan-400/40 hover:text-white sm:right-4 sm:top-4"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          <p className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-[#FF005A]">
            Penalty shootout · {tie.round === 'final' ? 'Madrid 27 Final' : tie.round}
          </p>
          <h2 id="ucl-penalty-title" className="mt-1 text-center text-lg font-black text-white sm:text-2xl">
            Decided from the spot
          </h2>

          <div className="mx-auto mt-3 grid max-w-md grid-cols-[1fr_auto_1fr] items-center gap-2 sm:mt-5 sm:gap-4">
            <div className="text-center">
              <img src={homeTeam.logo} alt={homeTeam.name} className="mx-auto h-11 w-11 object-contain sm:h-20 sm:w-20" />
              <p className="mt-1 truncate text-xs font-black text-white sm:mt-2 sm:text-sm">{homeTeam.name}</p>
            </div>
            <div className="rounded-xl border border-cyan-400/25 bg-cyan-400/10 px-3 py-1.5 font-mono text-xl font-black text-cyan-200 sm:rounded-2xl sm:px-4 sm:py-2 sm:text-2xl">
              {penalties.homeScore}–{penalties.awayScore}
            </div>
            <div className="text-center">
              <img src={awayTeam.logo} alt={awayTeam.name} className="mx-auto h-11 w-11 object-contain sm:h-20 sm:w-20" />
              <p className="mt-1 truncate text-xs font-black text-white sm:mt-2 sm:text-sm">{awayTeam.name}</p>
            </div>
          </div>
        </header>

        <div className="overflow-y-auto overscroll-contain p-3 sm:p-6">
          <div className="space-y-1.5 sm:space-y-2">
            {penalties.kicks.map((kick, index) => {
              const kickingTeam = kick.team === 'home' ? homeTeam : awayTeam;
              const goalkeeper = kick.team === 'home' ? awayKeeper : homeKeeper;
              const suddenDeath = kick.round > 5;

              return (
                <div
                  key={`${kick.team}-${kick.round}-${index}`}
                  className={`grid grid-cols-[auto_auto_1fr_auto] items-center gap-2 rounded-xl border px-2.5 py-2 sm:gap-3 sm:rounded-2xl sm:px-4 sm:py-2.5 ${
                    kick.scored
                      ? 'border-emerald-400/20 bg-emerald-400/[0.06]'
                      : 'border-[#FF005A]/25 bg-[#FF005A]/[0.07]'
                  }`}
                >
                  <span className="w-6 text-center font-mono text-[10px] font-bold text-white/45 sm:w-8 sm:text-[11px]">R{kick.round}</span>
                  {kick.scored ? (
                    <div className="relative">
                      <img src={uclBallImg} alt="Scored" className="h-5 w-5 object-contain sm:h-6 sm:w-6" />
                      <CircleCheck className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-[#00081E] text-emerald-400" />
                    </div>
                  ) : (
                    <XCircle className="h-6 w-6 text-[#FF005A]" aria-label="Missed" />
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <img src={kickingTeam.logo} alt="" className="h-5 w-5 shrink-0 object-contain" />
                      <span className="truncate text-xs font-bold text-white sm:text-sm">{kick.playerName}</span>
                      {suddenDeath && (
                        <span className="rounded-full border border-amber-400/25 bg-amber-400/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-wider text-amber-300">
                          Sudden death
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 hidden items-center gap-1 text-[10px] text-white/40 min-[390px]:flex">
                      <Shield className="h-3 w-3" /> vs {goalkeeper}
                    </p>
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-wider ${kick.scored ? 'text-emerald-300' : 'text-[#FF005A]'}`}>
                    {kick.scored ? 'Goal' : 'Miss'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>,
    document.body,
  );
};
