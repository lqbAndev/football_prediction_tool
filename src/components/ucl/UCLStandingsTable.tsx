import React from 'react';
import type { LeagueStanding } from '../../types/leagueConfig';
import type { Team } from '../../types/tournament';
import { getClubTheme } from '../../data/competitions/ucl2627/clubThemes';
import uclBallSideImg from '../../img/CUP COMPETITION/UCL/ball/ucl_ball_26-27_side.png';
import patchUclImg from '../../img/CUP COMPETITION/UCL/patch_ucl.png';

interface UCLStandingsTableProps {
  standings: LeagueStanding[];
  teamsById: Record<string, Team>;
  onSelectTeam?: (teamId: string) => void;
}

export const UCLStandingsTable: React.FC<UCLStandingsTableProps> = ({
  standings,
  teamsById,
  onSelectTeam,
}) => {
  const getZoneStyle = (position: number) => {
    if (position <= 8) {
      return {
        rowBorder: 'border-l-4 border-cyan-400 bg-cyan-950/20',
        badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50 shadow-[0_0_12px_rgba(0,240,255,0.3)]',
        zoneLabel: 'Direct to Round of 16',
      };
    }
    if (position <= 24) {
      return {
        rowBorder: 'border-l-4 border-amber-400 bg-amber-950/15',
        badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-400/50 shadow-[0_0_12px_rgba(245,158,11,0.25)]',
        zoneLabel: 'Knockout Play-offs',
      };
    }
    return {
      rowBorder: 'border-l-4 border-rose-500/40 bg-rose-950/10',
      badgeBg: 'bg-rose-500/10 text-rose-400/80 border-rose-500/30',
      zoneLabel: 'Eliminated',
    };
  };

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#071329] via-[#050d1d] to-[#020817] p-4 shadow-[0_24px_70px_rgba(0,6,20,0.38)] sm:p-8">
      {/* Background UCL Ball & Patch Watermark */}
      <img
        src={uclBallSideImg}
        alt=""
        className="absolute -right-20 -bottom-20 w-96 h-96 object-contain opacity-5 pointer-events-none rotate-12 blur-[1px]"
      />

      {/* Header & 3-Zone Legend Bar */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2.5">
            <img src={patchUclImg} alt="UCL" className="w-6 h-6 object-contain" />
            <h3 className="text-xl sm:text-2xl font-black text-white">
              Official League Phase Standings
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-white/50 mt-1">
            Single 36-team table · Top 8 advance to R16 · 9-24 enter Play-offs · 25-36 eliminated
          </p>
        </div>

        {/* 3 Explicit Zone Indicators */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00F0FF]" />
            <span>1-8: Direct to R16</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-400/40 text-amber-300 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#F59E0B]" />
            <span>9-24: Play-offs</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shadow-[0_0_8px_#F43F5E]" />
            <span>25-36: Eliminated</span>
          </div>
        </div>
      </div>

      {/* Table Body with Roomy Spacing and Large Typography */}
      <div className="relative z-10 mt-6 overflow-x-auto overscroll-x-contain [scrollbar-color:#00F0FF33_transparent]">
        <table className="w-full min-w-[1080px] whitespace-nowrap text-left" aria-label="UEFA Champions League league phase standings">
          <thead>
            <tr className="border-b border-white/10 text-base font-extrabold uppercase tracking-wider text-white/50">
              <th className="py-3 px-4 text-center w-14">Pos</th>
              <th className="py-3 px-4 min-w-[240px]">Club</th>
              <th className="py-3 px-3 text-center">Country</th>
              <th className="py-3 px-3 text-center font-mono">Pld</th>
              <th className="py-3 px-3 text-center font-mono">W</th>
              <th className="py-3 px-3 text-center font-mono">D</th>
              <th className="py-3 px-3 text-center font-mono">L</th>
              <th className="py-3 px-3 text-center font-mono">GF</th>
              <th className="py-3 px-3 text-center font-mono">GA</th>
              <th className="py-3 px-3 text-center font-mono font-black">GD</th>
              <th className="py-3 px-4 text-center font-mono font-black text-cyan-400 text-sm">Pts</th>
              <th className="py-3 px-4 text-center hidden md:table-cell">Form</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-lg font-bold">
            {standings.map((row) => {
              const team = teamsById[row.teamId];
              const zone = getZoneStyle(row.position);
              const theme = getClubTheme(row.teamId);

              return (
                <tr
                  key={row.teamId}
                  className={`transition-colors hover:bg-white/[0.06] ${zone.rowBorder}`}
                >
                  {/* Position Badge */}
                  <td className="py-3 px-4 text-center font-mono font-black">
                    <span
                      className={`inline-flex items-center justify-center w-7 h-7 rounded-xl border text-xs font-bold ${zone.badgeBg}`}
                    >
                      {row.position}
                    </span>
                  </td>

                  {/* Club (Logo & Full Name) */}
                  <td className="py-3 px-4">
                    <button
                      onClick={() => onSelectTeam?.(row.teamId)}
                      className="flex items-center gap-3 text-left group transition-all"
                    >
                      {team?.logo ? (
                        <img
                          src={team.logo}
                          alt={team.name}
                          className="h-7 w-7 shrink-0 object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.2)] transition-transform group-hover:scale-110"
                        />
                      ) : (
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xs font-bold text-white">
                          {row.teamId.slice(0, 3).toUpperCase()}
                        </div>
                      )}
                      <span className="text-lg font-black text-white transition-colors group-hover:text-sky-200">
                        {team?.name || row.teamId}
                      </span>
                    </button>
                  </td>

                  {/* Country Badge (Flag & Country Color as requested) */}
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-bold ${theme.countryBg} ${theme.countryText}`}
                    >
                      <span>{theme.countryCode}</span>
                    </span>
                  </td>

                  {/* Played */}
                  <td className="py-3 px-3 text-center font-mono text-white/80 font-semibold">
                    {row.played}
                  </td>
                  {/* Won */}
                  <td className="py-3 px-3 text-center font-mono text-emerald-400 font-bold">
                    {row.wins}
                  </td>
                  {/* Drawn */}
                  <td className="py-3 px-3 text-center font-mono text-amber-300 font-medium">
                    {row.draws}
                  </td>
                  {/* Lost */}
                  <td className="py-3 px-3 text-center font-mono text-rose-400 font-medium">
                    {row.losses}
                  </td>
                  {/* Goals For */}
                  <td className="py-3 px-3 text-center font-mono text-white/70">
                    {row.goalsFor}
                  </td>
                  {/* Goals Against */}
                  <td className="py-3 px-3 text-center font-mono text-white/70">
                    {row.goalsAgainst}
                  </td>
                  {/* Goal Difference */}
                  <td
                    className={`py-3 px-3 text-center font-mono font-black ${
                      row.goalDifference > 0
                        ? 'text-emerald-400'
                        : row.goalDifference < 0
                        ? 'text-rose-400'
                        : 'text-white/60'
                    }`}
                  >
                    {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                  </td>
                  {/* Points */}
                  <td className="px-4 py-3 text-center font-mono text-xl font-black text-sky-200">
                    {row.points}
                  </td>
                  {/* Form */}
                  <td className="py-3 px-4 text-center hidden md:table-cell">
                    <div className="flex items-center justify-center gap-1">
                      {row.form && row.form.length > 0 ? (
                        row.form.slice(-5).map((f, i) => (
                          <span
                            key={i}
                            className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black text-black ${
                              f === 'W'
                                ? 'bg-emerald-400 shadow-[0_0_6px_#34D399]'
                                : f === 'D'
                                ? 'bg-amber-400'
                                : 'bg-rose-500 text-white'
                            }`}
                          >
                            {f}
                          </span>
                        ))
                      ) : (
                        <span className="text-white/30 text-xs">-</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
