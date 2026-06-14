import { useEffect, useRef, useState } from 'react';
import { X, Shield } from 'lucide-react';
import type { Team, PlayerProfile, PlayerPosition } from '../types/tournament';
import { Flag } from './Flag';
import { getTeamLogoSrc } from '../data/logoMap';

interface TeamRosterModalProps {
  isOpen: boolean;
  team: Team | null;
  onClose: () => void;
}

const POSITION_ORDER: PlayerPosition[] = ['FW', 'MF', 'DF', 'GK'];

const POSITION_CONFIG: Record<PlayerPosition, { label: string; color: string; bgColor: string; borderColor: string }> = {
  FW: { label: 'Forward', color: 'text-rose-300', bgColor: 'bg-rose-500/10', borderColor: 'border-rose-400/20' },
  MF: { label: 'Midfielder', color: 'text-amber-300', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-400/20' },
  DF: { label: 'Defender', color: 'text-sky-300', bgColor: 'bg-sky-500/10', borderColor: 'border-sky-400/20' },
  GK: { label: 'Goalkeeper', color: 'text-emerald-300', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-400/20' },
};

const groupByPosition = (players: PlayerProfile[]): Record<PlayerPosition, PlayerProfile[]> => {
  const grouped: Record<PlayerPosition, PlayerProfile[]> = { FW: [], MF: [], DF: [], GK: [] };
  for (const player of players) {
    grouped[player.position].push(player);
  }
  return grouped;
};

export const TeamRosterModal = ({ isOpen, team, onClose }: TeamRosterModalProps) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [logoError, setLogoError] = useState(false);

  // Reset logo error state when team changes
  useEffect(() => {
    setLogoError(false);
  }, [team?.id]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen || !team) return null;

  const logoSrc = getTeamLogoSrc(team.name);
  const grouped = groupByPosition(team.players);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/65 backdrop-blur-md"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="relative mx-3 flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[rgba(8,14,28,0.97)] shadow-[0_12px_60px_rgba(0,0,0,0.6)] sm:mx-4">
        {/* ── Header ─────────────────────────────────────── */}
        <div className="relative flex items-center gap-5 border-b border-white/[0.06] px-5 py-5 sm:px-6">
          {/* Decorative gradient backdrop */}
          <div className="absolute inset-0 bg-gradient-to-r from-host-usa/10 via-transparent to-host-mexico/10" />

          <div className="relative flex items-center gap-4 sm:gap-5">
            {/* Team Logo (Badge) */}
            {logoSrc && !logoError ? (
              <img
                src={logoSrc}
                alt={`Logo ${team.name}`}
                className="h-16 w-16 sm:h-20 sm:w-20 shrink-0 object-contain drop-shadow-[0_2px_12px_rgba(255,255,255,0.15)]"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5">
                <Shield className="h-8 w-8 text-white/30" />
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <Flag teamName={team.name} size={24} />
                <h3 className="text-xl font-bold text-white sm:text-2xl tracking-wide">{team.name}</h3>
              </div>
              <p className="mt-1 text-xs sm:text-sm text-white/45">
                Group {team.group} · {team.players.length} players
              </p>
            </div>
          </div>
        </div>

        {/* ── Body ─────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 lg:px-7">
          <div className="space-y-4">
            {POSITION_ORDER.map((pos) => {
              const players = grouped[pos];
              if (players.length === 0) return null;
              const config = POSITION_CONFIG[pos];

              return (
                <div key={pos}>
                  {/* Position header */}
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${config.color} ${config.bgColor} ${config.borderColor}`}
                    >
                      {pos}
                    </span>
                    <span className="text-xs font-medium text-white/40">{config.label}</span>
                    <span className="text-[11px] text-white/25">({players.length})</span>
                  </div>

                  {/* Player grid */}
                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4">
                    {players.map((player) => (
                      <div
                        key={player.id}
                        className={`rounded-xl border px-3 py-2 text-sm text-white/80 transition hover:bg-white/[0.04] ${config.borderColor} bg-white/[0.02]`}
                      >
                        <span className="block leading-snug break-words">{player.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Footer ────────────────────────────────────── */}
        <div className="border-t border-white/[0.06] px-5 py-3 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
