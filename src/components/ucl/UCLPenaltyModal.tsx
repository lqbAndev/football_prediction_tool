import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CircleCheck, X, XCircle } from 'lucide-react';
import type { TwoLegMatch, UCLPenaltyKick } from '../../types/uclConfig';
import type { Team } from '../../types/tournament';
import uclBallImg from '../../img/CUP COMPETITION/UCL/ball/ucl_ball_26-27.png';

interface UCLPenaltyModalProps {
  tie: TwoLegMatch | null;
  teamsById: Record<string, Team>;
  onClose: () => void;
}

const KickBall = ({ kick }: { kick: UCLPenaltyKick }) => (
  <span
    title={`${kick.playerName}: ${kick.scored ? 'Goal' : 'Miss'}`}
    className={`relative inline-flex h-7 w-7 items-center justify-center transition-transform hover:scale-110 ${kick.scored ? 'opacity-100' : 'opacity-25 grayscale'}`}
  >
    <img src={uclBallImg} alt="" className="h-6 w-6 object-contain" />
  </span>
);

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
  const rounds = [...new Set(penalties.kicks.map((kick) => kick.round))].sort((left, right) => left - right);
  const homeKeeper = homeTeam.players.find((player) => player.position === 'GK')?.name || 'Goalkeeper';
  const awayKeeper = awayTeam.players.find((player) => player.position === 'GK')?.name || 'Goalkeeper';
  const firstKicker = penalties.kicks[0]?.team === 'home' ? homeTeam.shortName : awayTeam.shortName;

  const renderKickRow = (kick: UCLPenaltyKick, index: number) => {
    const kickingTeam = kick.team === 'home' ? homeTeam : awayTeam;
    const goalkeeper = kick.team === 'home' ? awayKeeper : homeKeeper;

    return (
      <div
        key={`${kick.team}-${kick.round}-${index}`}
        className={`grid grid-cols-[30px_24px_minmax(0,1fr)_auto] items-center gap-2 rounded-xl border px-2.5 py-2.5 sm:grid-cols-[36px_28px_minmax(0,1fr)_auto] sm:gap-3 sm:px-4 ${kick.scored ? 'border-emerald-400/15 bg-emerald-400/[0.045]' : 'border-rose-400/20 bg-rose-400/[0.055]'}`}
      >
        <span className="font-mono text-[10px] font-black text-white/35">R{kick.round}</span>
        <img src={kickingTeam.logo} alt="" className="h-6 w-6 object-contain sm:h-7 sm:w-7" />
        <div className="min-w-0">
          <p className={`truncate text-xs font-bold sm:text-sm ${kick.scored ? 'text-white/90' : 'text-white/55'}`}>{kick.playerName}</p>
          <p className="truncate text-[9px] text-white/35 sm:text-[10px]">vs {goalkeeper}</p>
        </div>
        <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider sm:text-[10px] ${kick.scored ? 'text-emerald-300' : 'text-rose-300'}`}>
          {kick.scored ? <CircleCheck className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          {kick.scored ? 'Goal' : 'Miss'}
        </span>
      </div>
    );
  };

  return createPortal(
    <>
      <button type="button" className="fixed inset-0 z-40 cursor-default bg-black/80 backdrop-blur-md" onClick={onClose} aria-label="Close penalty shootout details" />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="ucl-penalty-title"
        className="fixed inset-x-0 bottom-0 z-50 flex max-h-[82dvh] flex-col overflow-hidden rounded-t-[28px] border-t border-cyan-400/25 bg-[#00081E] shadow-[0_-20px_70px_rgba(0,6,20,0.7)] sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-h-[88vh] sm:w-[min(680px,calc(100vw-2rem))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[32px] sm:border"
      >
        <div className="mx-auto mt-3 h-1 w-12 shrink-0 rounded-full bg-white/20 sm:hidden" />

        <header className="relative shrink-0 border-b border-white/10 bg-[radial-gradient(circle_at_50%_0%,rgba(56,189,248,0.12),transparent_58%),#000B29] px-4 pb-4 pt-3 sm:px-7 sm:pb-5 sm:pt-6">
          <button type="button" onClick={onClose} className="absolute right-3 top-2 rounded-full border border-white/10 bg-white/5 p-2 text-white/60 transition hover:border-cyan-400/40 hover:text-white sm:right-4 sm:top-4" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
          <p className="text-center text-[9px] font-black uppercase tracking-[0.28em] text-cyan-300 sm:text-[10px]">
            Penalty shootout · {tie.round === 'final' ? 'Madrid 27 Final' : tie.round}
          </p>
          <h2 id="ucl-penalty-title" className="mt-1 text-center text-lg font-black text-white sm:text-2xl">Decided from the spot</h2>

          <div className="mx-auto mt-3 grid max-w-md grid-cols-[1fr_auto_1fr] items-center gap-3 sm:mt-5 sm:gap-6">
            <div className="min-w-0 text-center">
              <img src={homeTeam.logo} alt={homeTeam.name} className="mx-auto h-12 w-12 object-contain sm:h-20 sm:w-20" />
              <p className="mt-1 truncate text-xs font-black text-white sm:text-sm">{homeTeam.shortName}</p>
            </div>
            <div className="rounded-2xl border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 font-mono text-2xl font-black tabular-nums text-cyan-100 sm:px-5 sm:text-3xl">
              {penalties.homeScore}<span className="mx-1.5 text-white/25">–</span>{penalties.awayScore}
            </div>
            <div className="min-w-0 text-center">
              <img src={awayTeam.logo} alt={awayTeam.name} className="mx-auto h-12 w-12 object-contain sm:h-20 sm:w-20" />
              <p className="mt-1 truncate text-xs font-black text-white sm:text-sm">{awayTeam.shortName}</p>
            </div>
          </div>
        </header>

        <div className="overflow-y-auto overscroll-contain p-3 sm:p-6">
          {penalties.kicks.length > 0 ? (
            <div className="space-y-5">
              <section aria-label="Penalty kick summary">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-[9px] font-black uppercase tracking-[0.22em] text-white/40">Shot summary</p>
                  <span className="rounded-lg border border-amber-300/20 bg-amber-300/[0.07] px-2 py-1 text-[8px] font-black uppercase tracking-wider text-amber-200">{firstKicker} kicks first</span>
                </div>
                <div className="space-y-2 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-3 sm:p-4">
                  <div className="grid grid-cols-[52px_1fr] items-center gap-3">
                    <span className="truncate text-right text-[10px] font-black text-emerald-300/80">{homeTeam.shortName}</span>
                    <div className="flex min-h-7 flex-wrap items-center gap-1.5">{homeKicks.map((kick, index) => <KickBall key={`home-${kick.round}-${index}`} kick={kick} />)}</div>
                  </div>
                  <div className="h-px bg-white/[0.07]" />
                  <div className="grid grid-cols-[52px_1fr] items-center gap-3">
                    <span className="truncate text-right text-[10px] font-black text-sky-300/80">{awayTeam.shortName}</span>
                    <div className="flex min-h-7 flex-row-reverse flex-wrap items-center justify-end gap-1.5">{awayKicks.map((kick, index) => <KickBall key={`away-${kick.round}-${index}`} kick={kick} />)}</div>
                  </div>
                </div>
              </section>

              <section aria-label="Penalty shootout turn-by-turn timeline">
                <p className="mb-2 text-[9px] font-black uppercase tracking-[0.22em] text-white/40">Turn-by-turn timeline</p>
                <div className="space-y-3">
                  {rounds.map((round) => {
                    const roundKicks = penalties.kicks.filter((kick) => kick.round === round);
                    return (
                      <div key={round} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-2.5 sm:p-3">
                        <div className="mb-2 flex items-center justify-between px-1">
                          <span className="font-mono text-[10px] font-black uppercase tracking-wider text-white/40">Round {round}</span>
                          {round > 5 && <span className="rounded-lg border border-amber-400/25 bg-amber-400/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-wider text-amber-300">Sudden death</span>}
                        </div>
                        <div className="space-y-1.5">{roundKicks.map(renderKickRow)}</div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-white/35">No detailed shootout data is available.</p>
          )}
        </div>
      </section>
    </>,
    document.body,
  );
};
