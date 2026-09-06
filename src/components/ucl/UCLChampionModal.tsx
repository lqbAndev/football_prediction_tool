import { useEffect, useRef, useState } from 'react';
import { Award, Sparkles, X } from 'lucide-react';
import ReactConfetti from 'react-confetti';
import type { Team } from '../../types/tournament';
import uclCupImg from '../../img/CUP COMPETITION/UCL/ucl_cup.png';
import uclBallImg from '../../img/CUP COMPETITION/UCL/ball/ucl_ball_26-27.png';
import uclLogoImg from '../../img/CUP COMPETITION/UCL/tournaments_uefa-champions-league_128x128.football-logos.cc.png';

interface UCLChampionModalProps {
  champion: Team | null;
  isOpen: boolean;
  onClose: () => void;
  onViewRecap?: () => void;
}

const FOCUSABLE_ELEMENTS = 'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

export const UCLChampionModal: React.FC<UCLChampionModalProps> = ({
  champion,
  isOpen,
  onClose,
  onViewRecap,
}) => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen || !champion) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    const updateDimensions = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;

      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENTS));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    window.requestAnimationFrame(() => closeButtonRef.current?.focus());

    return () => {
      window.removeEventListener('resize', updateDimensions);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [champion, isOpen, onClose]);

  if (!isOpen || !champion) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4" aria-live="polite">
      <div className="pointer-events-none absolute inset-0 z-10 motion-reduce:hidden">
        <ReactConfetti
          width={dimensions.width}
          height={dimensions.height}
          recycle={false}
          numberOfPieces={dimensions.width > 0 && dimensions.width < 640 ? 160 : 300}
          gravity={0.12}
          tweenDuration={9000}
          colors={['#7DD3FC', '#FEBE10', '#FFFFFF', '#94A3B8', '#1D4ED8']}
        />
      </div>

      <button type="button" tabIndex={-1} aria-label="Close champion celebration" className="fixed inset-0 z-0 bg-[#00030D]/90 backdrop-blur-xl" onClick={onClose} />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ucl-champion-title"
        aria-describedby="ucl-champion-description"
        className="relative z-20 max-h-[88dvh] w-full max-w-xl overflow-y-auto rounded-t-[28px] border-t border-white/10 bg-[#050d1d] p-1.5 text-white shadow-[0_32px_120px_rgba(0,6,20,0.8),0_0_50px_rgba(125,211,252,0.12)] sm:rounded-[32px] sm:border"
      >
        <div className="relative overflow-hidden rounded-t-[22px] bg-[radial-gradient(circle_at_50%_0%,rgba(125,211,252,0.18),transparent_42%),linear-gradient(180deg,#071329_0%,#020817_100%)] px-4 pb-5 pt-4 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] sm:rounded-[26px] sm:px-10 sm:pb-10 sm:pt-6">
          <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-white/20 sm:hidden" />
          <img src={uclBallImg} alt="" className="pointer-events-none absolute -right-16 -top-14 h-52 w-52 object-contain opacity-[0.045]" />

          <div className="flex items-center justify-between">
            <img src={uclLogoImg} alt="UEFA Champions League" className="h-9 w-9 rounded-lg bg-white p-1 object-contain sm:h-11 sm:w-11 sm:rounded-xl" />
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              aria-label="Close champion celebration"
              className="rounded-full border border-white/10 bg-white/5 p-2 text-white/55 transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-sky-300/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 sm:p-2.5"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="relative mx-auto mt-1 flex h-40 w-40 items-center justify-center sm:mt-3 sm:h-56 sm:w-56">
            <div className="absolute inset-10 rounded-full bg-sky-300/15 blur-3xl" />
            <img src={uclCupImg} alt="UEFA Champions League trophy" className="relative h-36 w-36 object-contain drop-shadow-[0_18px_30px_rgba(0,0,0,0.55)] sm:h-52 sm:w-52" />
            <div className="absolute bottom-1 right-0 flex h-16 w-16 items-center justify-center rounded-[18px] border border-amber-200/30 bg-white p-2 shadow-[0_16px_42px_rgba(0,0,0,0.55)] sm:bottom-2 sm:h-24 sm:w-24 sm:rounded-[24px]">
              <img src={champion.logo} alt={`${champion.name} crest`} className="h-full w-full object-contain" />
            </div>
          </div>

          <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.24em] text-amber-200">
            <Sparkles className="h-3.5 w-3.5" /> Champions of Europe
          </div>
          <h1 id="ucl-champion-title" className="mx-auto mt-3 max-w-md text-3xl font-black leading-none tracking-[-0.04em] text-white sm:mt-4 sm:text-5xl">{champion.name}</h1>
          <p id="ucl-champion-description" className="mt-3 text-sm text-white/50">UEFA Champions League 2026/27 winners</p>

          {onViewRecap && (
            <button
              type="button"
              onClick={onViewRecap}
              className="group mt-5 inline-flex w-full items-center justify-center gap-3 rounded-full bg-sky-300 py-2 pl-6 pr-2 text-xs font-black uppercase tracking-[0.16em] text-[#020817] transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-sky-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:mt-7"
            >
              View UCL Recap
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#020817]/10 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1">
                <Award className="h-4 w-4" />
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
