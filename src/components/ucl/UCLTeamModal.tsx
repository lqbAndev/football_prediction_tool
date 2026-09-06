import React, { useEffect } from 'react';
import { X, Shield, User, MapPin } from 'lucide-react';
import type { Team, PlayerProfile, PlayerPosition } from '../../types/tournament';
import { getClubTheme } from '../../data/competitions/ucl2627/clubThemes';
import patchUclImg from '../../img/CUP COMPETITION/UCL/patch_ucl.png';

interface UCLTeamModalProps {
  isOpen: boolean;
  team: Team | null;
  onClose: () => void;
}

const POSITION_ORDER: PlayerPosition[] = ['FW', 'MF', 'DF', 'GK'];

const POSITION_LABELS: Record<PlayerPosition, { label: string; color: string; bg: string; border: string }> = {
  FW: { label: 'Forwards', color: 'text-rose-300', bg: 'bg-rose-500/15', border: 'border-rose-500/40' },
  MF: { label: 'Midfielders', color: 'text-cyan-300', bg: 'bg-cyan-500/15', border: 'border-cyan-500/40' },
  DF: { label: 'Defenders', color: 'text-indigo-300', bg: 'bg-indigo-500/15', border: 'border-indigo-500/40' },
  GK: { label: 'Goalkeepers', color: 'text-amber-300', bg: 'bg-amber-500/15', border: 'border-amber-500/40' },
};

export const UCLTeamModal: React.FC<UCLTeamModalProps> = ({ isOpen, team, onClose }) => {
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen || !team) return null;

  const theme = getClubTheme(team.id);

  // Group players
  const grouped: Record<PlayerPosition, PlayerProfile[]> = { FW: [], MF: [], DF: [], GK: [] };
  (team.players || []).forEach((p) => {
    if (grouped[p.position]) {
      grouped[p.position].push(p);
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-xl transition-opacity"
        onClick={onClose}
      />

      {/* Modal Window */}
      <div className="relative z-20 flex max-h-[82dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-[28px] border-t border-white/15 bg-gradient-to-b from-[#00133B] via-[#000B29] to-[#00081E] shadow-[0_-18px_60px_rgba(0,6,20,0.65)] sm:max-h-[88vh] sm:rounded-3xl sm:border">
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-white/20 sm:hidden" />
        {/* Top Club Header with Glow */}
        <div className="relative flex items-start justify-between border-b border-white/10 bg-white/[0.02] p-4 sm:items-center sm:p-8">
          {/* Subtle Ambient Background Light */}
          <div
            className="absolute -top-20 left-1/4 w-80 h-80 rounded-full blur-3xl opacity-25 pointer-events-none"
            style={{ backgroundColor: theme.primary }}
          />

          <div className="relative z-10 flex min-w-0 items-center gap-3 sm:gap-6">
            {/* Large Club Logo */}
            <div className="relative">
              <div
                className="absolute inset-0 rounded-2xl blur-lg opacity-40 scale-110"
                style={{ backgroundColor: theme.primary }}
              />
              <img
                src={team.logo}
                alt={team.name}
                className="relative h-14 w-14 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] sm:h-24 sm:w-24"
              />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="rounded-full border border-cyan-400/40 bg-cyan-500/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-cyan-300 sm:px-3 sm:py-1 sm:text-xs">
                  Pot {(team as any).pot || 1}
                </span>
                <span className="rounded-full border border-amber-400/40 bg-amber-500/20 px-2 py-0.5 font-mono text-[9px] font-bold text-amber-300 sm:px-3 sm:py-1 sm:text-xs">
                  Tier {team.tier}
                </span>
                <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold sm:px-3 sm:py-1 sm:text-xs ${theme.countryBg} ${theme.countryText}`}>
                  {theme.countryName}
                </span>
              </div>

              <h2 className="truncate text-xl font-black tracking-wide text-white sm:text-4xl">
                {team.name}
              </h2>

              <div className="mt-1.5 flex flex-col gap-1 text-[10px] text-white/65 sm:mt-2 sm:flex-row sm:flex-wrap sm:gap-4 sm:text-sm">
                <div className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-cyan-400" />
                  <span>
                    Manager: <strong className="text-white font-semibold">{team.manager || 'N/A'}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-pink-400" />
                  <span>
                    Stadium: <strong className="text-white font-semibold">{team.stadium || 'Home Arena'}</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="shrink-0 rounded-full bg-white/10 p-2 text-white/70 transition-colors hover:bg-white/20 hover:text-white sm:p-2.5"
            aria-label="Close team details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Roster Body */}
        <div className="flex-1 space-y-4 overflow-y-auto overscroll-contain p-4 sm:space-y-6 sm:p-8">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-sm uppercase tracking-[0.2em] text-cyan-400 font-bold flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              Official Squad Roster ({team.players.length} Players)
            </h3>
            <span className="hidden text-xs font-mono text-white/40 sm:inline">2026/27 UEFA Registered List A</span>
          </div>

          <div className="space-y-4 sm:space-y-6">
            {POSITION_ORDER.map((pos) => {
              const players = grouped[pos];
              if (!players || players.length === 0) return null;
              const cfg = POSITION_LABELS[pos];

              return (
                <div key={pos} className="space-y-3">
                  <div className="flex items-center gap-2.5">
                    <span className={`px-3 py-1 rounded-xl text-xs font-black font-mono border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                      {pos}
                    </span>
                    <span className="text-sm uppercase tracking-wider font-bold text-white/70">
                      {cfg.label} ({players.length})
                    </span>
                  </div>

                  {/* Clean, Roomy Cards without 2-letter abbreviation as requested */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {players.map((p, idx) => (
                      <div
                        key={p.id || idx}
                        className="space-y-1 rounded-2xl border border-white/10 bg-white/[0.04] p-3 transition-all hover:border-cyan-400/40 hover:bg-white/[0.08] sm:p-4"
                      >
                        <div className="text-sm font-bold text-white sm:text-lg">
                          {p.name}
                        </div>
                        <div className="text-xs text-white/50 font-mono flex items-center justify-between">
                          <span>{pos}</span>
                          {pos === 'GK' && idx === 0 && (
                            <span className="text-amber-400 text-xs font-bold">★ Starter</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-white/10 bg-black/30 p-3 sm:justify-between sm:p-5">
          <div className="hidden items-center gap-2 text-xs text-white/50 sm:flex">
            <img src={patchUclImg} alt="UCL" className="w-5 h-5 object-contain" />
            <span>UEFA Champions League 2026/27 Registered Squad</span>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
