import React, { useEffect, useMemo } from 'react';
import { Star, X } from 'lucide-react';
import type { LeagueMatch } from '../../types/leagueConfig';
import type { TwoLegMatch } from '../../types/uclConfig';
import type { Team } from '../../types/tournament';
import uclBallImg from '../../img/CUP COMPETITION/UCL/ball/ucl_ball_26-27.png';

interface UCLPlayerGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  leagueMatches: LeagueMatch[];
  knockoutMatches: TwoLegMatch[];
  teamsById: Record<string, Team>;
}

interface MatchGoalEntry {
  matchId: string;
  stageName: string;
  opponentId: string;
  opponentName: string;
  minutes: Array<{
    displayMinute: string;
    sortMinute: number;
    isPenalty: boolean;
    isExtraTime?: boolean;
  }>;
  isMotm: boolean;
}

export const UCLPlayerGoalModal: React.FC<UCLPlayerGoalModalProps> = ({
  isOpen,
  onClose,
  playerId,
  playerName,
  teamId,
  teamName,
  leagueMatches,
  knockoutMatches,
  teamsById,
}) => {
  const { goalEntries, totalGoals, totalMotm } = useMemo(() => {
    const entries: MatchGoalEntry[] = [];
    let goals = 0;
    let motmCount = 0;

    // 1. Scan League Phase Matches
    for (const match of leagueMatches) {
      if (match.status !== 'completed') continue;
      const isHome = match.homeTeamId === teamId;
      const isAway = match.awayTeamId === teamId;
      if (!isHome && !isAway) continue;

      const isMotm =
        Boolean(match.motm) &&
        match.motm?.playerId === playerId &&
        match.motm.teamId === teamId;
      if (isMotm) motmCount++;

      const opponentId = isHome ? match.awayTeamId : match.homeTeamId;
      const oppTeam = teamsById[opponentId];
      const minutes: MatchGoalEntry['minutes'] = [];

      if (match.timeline && match.timeline.length > 0) {
        for (const evt of match.timeline) {
          if (evt.playerId === playerId && evt.teamId === teamId) {
            minutes.push({
              displayMinute: evt.displayMinute,
              sortMinute: evt.sortMinute,
              isPenalty: Boolean(evt.isPenalty),
            });
          }
        }
      } else if (match.scorers) {
        const side = isHome ? match.scorers.home : match.scorers.away;
        for (const s of side) {
          if (s.playerId === playerId) {
            minutes.push({
              displayMinute: `${s.minute}'`,
              sortMinute: s.minute,
              isPenalty: false,
            });
          }
        }
      }

      if (minutes.length > 0) {
        minutes.sort((a, b) => a.sortMinute - b.sortMinute);
        goals += minutes.length;
        entries.push({
          matchId: match.id,
          stageName: `Matchday ${match.matchweek}`,
          opponentId,
          opponentName: oppTeam?.name || opponentId,
          minutes,
          isMotm,
        });
      }
    }

    // 2. Scan Knockout Matches (Leg 1 & Leg 2)
    for (const tie of knockoutMatches) {
      const isHomeTie = tie.homeTeamId === teamId;
      const isAwayTie = tie.awayTeamId === teamId;
      if (!isHomeTie && !isAwayTie) continue;

      const opponentId = isHomeTie ? tie.awayTeamId : tie.homeTeamId;
      const oppTeam = teamsById[opponentId];

      const roundLabel =
        tie.round === 'playoffs'
          ? 'Play-offs'
          : tie.round === 'roundOf16'
          ? 'Round of 16'
          : tie.round === 'quarterfinals'
          ? 'Quarter-Final'
          : tie.round === 'semifinals'
          ? 'Semi-Final'
          : 'Final';

      // Check Leg 1
      if (tie.leg1.status === 'completed') {
        const leg1Mins: MatchGoalEntry['minutes'] = [];
        if (tie.leg1.timeline) {
          for (const evt of tie.leg1.timeline) {
            if (evt.playerId === playerId && evt.teamId === teamId) {
              leg1Mins.push({
                displayMinute: evt.displayMinute,
                sortMinute: evt.sortMinute,
                isPenalty: Boolean(evt.isPenalty),
              });
            }
          }
        } else if (tie.leg1.scorers) {
          const side = isAwayTie ? tie.leg1.scorers.home : tie.leg1.scorers.away;
          for (const s of side) {
            if (s.playerId === playerId) {
              leg1Mins.push({
                displayMinute: `${s.minute}'`,
                sortMinute: s.minute,
                isPenalty: false,
              });
            }
          }
        }

        const isLeg1Motm = Boolean(tie.leg1.motm && tie.leg1.motm.playerId === playerId);
        if (isLeg1Motm) motmCount++;

        if (leg1Mins.length > 0) {
          leg1Mins.sort((a, b) => a.sortMinute - b.sortMinute);
          goals += leg1Mins.length;
          entries.push({
            matchId: `${tie.id}-leg1`,
            stageName: `${roundLabel} · Leg 1`,
            opponentId,
            opponentName: oppTeam?.name || opponentId,
            minutes: leg1Mins,
            isMotm: isLeg1Motm,
          });
        }
      }

      // Check Leg 2
      if (tie.leg2.status === 'completed') {
        const leg2Mins: MatchGoalEntry['minutes'] = [];
        const leg2Timeline = [...(tie.leg2.timeline || []), ...(tie.leg2.etTimeline || [])];
        if (leg2Timeline.length > 0) {
          for (const evt of leg2Timeline) {
            if (evt.playerId === playerId && evt.teamId === teamId) {
              leg2Mins.push({
                displayMinute: evt.displayMinute,
                sortMinute: evt.sortMinute,
                isPenalty: Boolean(evt.isPenalty),
                isExtraTime: evt.phase === 'extra-time',
              });
            }
          }
        } else if (tie.leg2.scorers) {
          const side = isHomeTie ? tie.leg2.scorers.home : tie.leg2.scorers.away;
          for (const s of side) {
            if (s.playerId === playerId) {
              leg2Mins.push({
                displayMinute: `${s.minute}'`,
                sortMinute: s.minute,
                isPenalty: false,
              });
            }
          }
          const extraSide = isHomeTie ? tie.leg2.etScorers?.home : tie.leg2.etScorers?.away;
          for (const s of extraSide || []) {
            if (s.playerId === playerId) {
              leg2Mins.push({
                displayMinute: `${s.minute}'`,
                sortMinute: s.minute,
                isPenalty: Boolean(s.isPenalty),
                isExtraTime: true,
              });
            }
          }
        }

        const isLeg2Motm = Boolean(tie.leg2.motm && tie.leg2.motm.playerId === playerId);
        if (isLeg2Motm) motmCount++;

        if (leg2Mins.length > 0) {
          leg2Mins.sort((a, b) => a.sortMinute - b.sortMinute);
          goals += leg2Mins.length;
          entries.push({
            matchId: `${tie.id}-leg2`,
            stageName: `${roundLabel} · Leg 2`,
            opponentId,
            opponentName: oppTeam?.name || opponentId,
            minutes: leg2Mins,
            isMotm: isLeg2Motm,
          });
        }
      }
    }

    return { goalEntries: entries, totalGoals: goals, totalMotm: motmCount };
  }, [playerId, teamId, leagueMatches, knockoutMatches, teamsById]);

  useEffect(() => {
    if (!isOpen) return;
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
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentTeam = teamsById[teamId];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-xl transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ucl-player-goals-title"
        className="relative z-20 flex max-h-[82dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[28px] border-t border-cyan-400/25 bg-gradient-to-b from-[#00143D] via-[#000B29] to-[#00081E] shadow-[0_-18px_60px_rgba(0,6,20,0.7)] sm:max-h-[85vh] sm:rounded-[32px] sm:border"
      >
        <div className="mx-auto mt-3 h-1 w-12 shrink-0 rounded-full bg-white/20 sm:hidden" />
        {/* Header */}
        <div className="relative flex items-center justify-between border-b border-white/10 bg-white/[0.02] p-4 sm:p-7">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            {currentTeam?.logo && (
              <img
                src={currentTeam.logo}
                alt={teamName}
                className="h-10 w-10 shrink-0 object-contain drop-shadow-[0_0_12px_rgba(255,255,255,0.3)] sm:h-14 sm:w-14"
              />
            )}
            <div className="min-w-0">
              <h3 id="ucl-player-goals-title" className="truncate text-lg font-black text-white sm:text-2xl">{playerName}</h3>
              <p className="text-xs sm:text-sm text-white/60 font-semibold">{teamName}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full bg-white/10 p-2 text-white/70 transition-colors hover:bg-white/20 hover:text-white sm:p-2.5"
            aria-label="Close player goal details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Summary Bar */}
        <div className="grid grid-cols-2 gap-2 border-b border-white/10 bg-black/30 px-4 py-2.5 sm:gap-3 sm:px-6 sm:py-3.5">
          <div className="flex items-center gap-2">
            <img src={uclBallImg} alt="Goals" className="w-5 h-5 object-contain animate-ball-float" />
            <span className="text-[10px] font-bold uppercase text-white/60 sm:text-xs">Goals:</span>
            <span className="text-lg font-mono font-black text-cyan-300">{totalGoals}</span>
          </div>

          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="text-[10px] font-bold uppercase text-white/60 sm:text-xs">MOTM:</span>
            <span className="text-lg font-mono font-black text-amber-300">{totalMotm}</span>
          </div>
        </div>

        {/* Matches List */}
        <div className="flex-1 space-y-2.5 overflow-y-auto overscroll-contain p-4 sm:space-y-3 sm:p-6">
          {goalEntries.length === 0 ? (
            <div className="text-center py-10 text-white/40 text-sm italic">
              No registered goals for this player yet.
            </div>
          ) : (
            goalEntries.map((entry) => {
              const oppLogo = teamsById[entry.opponentId]?.logo;
              return (
                <div
                  key={entry.matchId}
                  className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 transition-all hover:border-cyan-400/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    {oppLogo && (
                      <img
                        src={oppLogo}
                        alt={entry.opponentName}
                        className="h-11 w-11 shrink-0 object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"
                      />
                    )}
                    <div>
                      <div className="text-xs font-mono font-bold text-cyan-400 uppercase">
                        {entry.stageName}
                      </div>
                      <div className="text-sm font-bold text-white">
                        vs {entry.opponentName}
                      </div>
                    </div>
                  </div>

                  <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
                    <div className="flex flex-wrap items-center gap-1.5 justify-end">
                      {entry.minutes.map((m, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-cyan-500/20 text-cyan-200 border border-cyan-400/30 text-xs font-mono font-bold"
                        >
                          <img src={uclBallImg} alt="" className="w-3.5 h-3.5 object-contain" />
                          <span>{m.displayMinute}</span>
                          {m.isPenalty && (
                            <span className="text-[9px] px-1 rounded bg-amber-500/40 text-amber-300 font-bold">
                              PEN
                            </span>
                          )}
                          {m.isExtraTime && (
                            <span className="rounded bg-amber-400/15 px-1 text-[9px] font-black text-amber-200">ET</span>
                          )}
                        </span>
                      ))}
                    </div>

                    {entry.isMotm && (
                      <div
                        className="p-1.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300"
                        title="Player of the Match"
                      >
                        <Star className="h-4 w-4 fill-amber-400" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
