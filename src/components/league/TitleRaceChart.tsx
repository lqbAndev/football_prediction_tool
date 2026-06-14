import { useState, useMemo, useRef } from 'react';
import { Trophy, TrendingUp, HelpCircle } from 'lucide-react';
import type { LeagueStanding, LeagueMatch } from '../../types/leagueConfig';

interface TitleRaceChartProps {
  standings: LeagueStanding[];
  fixtures: LeagueMatch[];
  totalRounds: number;
  logoMap?: Record<string, string>;
}

interface TeamPositionHistory {
  teamId: string;
  teamName: string;
  color: string;
  positions: number[]; // position per matchweek (index 0 = MW1, index 1 = MW2, etc.)
}

// Official primary colors for Premier League clubs (25/26)
const CLUB_COLORS: Record<string, string> = {
  'arsenal': '#ef4444',       // Arsenal Red
  'man-city': '#00bfff',      // City Sky Blue
  'liverpool': '#d00000',     // Liverpool Red
  'chelsea': '#034694',       // Chelsea Blue
  'man-utd': '#da291c',       // United Red
  'tottenham': '#132257',     // Spurs Navy
  'aston-villa': '#95bfe5',   // Villa Sky Blue
  'newcastle': '#9ca3af',     // Grey (representing Black & White stripes)
  'brighton': '#0057b8',      // Brighton Blue
  'brentford': '#e30613',     // Brentford Red
  'west-ham': '#7a263a',      // West Ham Claret
  'bournemouth': '#e0121a',   // Bournemouth Red
  'crystal-palace': '#1b458f',// Palace Blue
  'fulham': '#cbd5e1',        // Fulham Silver/White
  'nottingham': '#dd0000',    // Forest Red
  'sunderland': '#ff0000',    // Red
  'leeds': '#ffcd00',         // Leeds Yellow
  'burnley': '#6c1d45',       // Burnley Claret
  'wolves': '#fdb913',        // Wolves Gold
  'everton': '#003399',       // Everton Blue
};

// Fallback colors if ID doesn't match (cycle through 20 distinct hues)
const CHART_COLORS = [
  '#00ff87', '#ff007f', '#38bdf8', '#fbbf24', '#a78bfa',
  '#fb923c', '#34d399', '#f87171', '#60a5fa', '#e879f9',
  '#facc15', '#2dd4bf', '#818cf8', '#fb7185', '#4ade80',
  '#c084fc', '#fcd34d', '#67e8f9', '#f472b6', '#a3e635',
];

/** Returns ordinal suffix string, e.g. 1 → '1st', 2 → '2nd', 13 → '13th' */
function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export default function TitleRaceChart({ standings, fixtures, totalRounds, logoMap }: TitleRaceChartProps) {
  const [hoveredMw, setHoveredMw] = useState<number | null>(null);
  const [hoveredTeam, setHoveredTeam] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const completedMatches = useMemo(() => fixtures.filter((f) => f.status === 'completed'), [fixtures]);

  // Highest matchweek that has completed matches
  const currentMaxMw = useMemo(() => {
    if (completedMatches.length === 0) return 0;
    return Math.max(...completedMatches.map((f) => f.matchweek));
  }, [completedMatches]);

  const numTeams = standings.length || 20;

  const chartData = useMemo(() => {
    if (standings.length === 0 || currentMaxMw === 0) return [];

    // For each matchweek, calculate cumulative stats for all teams and derive positions
    // Build a map: teamId → { teamName, color, positions[] }
    const teamColorMap: Record<string, string> = {};
    standings.forEach((s, idx) => {
      teamColorMap[s.teamId] = CLUB_COLORS[s.teamId] || CHART_COLORS[idx % CHART_COLORS.length];
    });

    // positions[teamId] = number[] where index i corresponds to MW (i+1)
    const positionsByTeam: Record<string, number[]> = {};
    standings.forEach((s) => {
      positionsByTeam[s.teamId] = [];
    });

    for (let mw = 1; mw <= currentMaxMw; mw++) {
      // Calculate cumulative points, GD, GF for ALL teams up to this MW
      const teamStats: { teamId: string; points: number; gd: number; gf: number }[] = standings.map((s) => {
        const teamMatches = completedMatches.filter(
          (f) => f.matchweek <= mw && (f.homeTeamId === s.teamId || f.awayTeamId === s.teamId)
        );

        let points = 0;
        let gf = 0;
        let ga = 0;
        for (const match of teamMatches) {
          const isHome = match.homeTeamId === s.teamId;
          const teamScore = isHome ? match.homeScore! : match.awayScore!;
          const opponentScore = isHome ? match.awayScore! : match.homeScore!;

          gf += teamScore;
          ga += opponentScore;

          if (teamScore > opponentScore) points += 3;
          else if (teamScore === opponentScore) points += 1;
        }

        return { teamId: s.teamId, points, gd: gf - ga, gf };
      });

      // Sort by points desc, GD desc, GF desc
      teamStats.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.gd !== a.gd) return b.gd - a.gd;
        return b.gf - a.gf;
      });

      // Assign positions 1..N
      teamStats.forEach((ts, idx) => {
        positionsByTeam[ts.teamId].push(idx + 1);
      });
    }

    // Build final chart data
    const history: TeamPositionHistory[] = standings.map((s) => ({
      teamId: s.teamId,
      teamName: s.teamName,
      color: teamColorMap[s.teamId],
      positions: positionsByTeam[s.teamId],
    }));

    return history;
  }, [standings, completedMatches, currentMaxMw]);

  if (chartData.length === 0 || currentMaxMw === 0) {
    return (
      <div className="relative overflow-hidden rounded-[32px] border border-[#1e1e2e]/50 bg-[#111118]/40 p-8 backdrop-blur-md">
        <div className="flex items-center gap-3 text-white/40 mb-4">
          <Trophy className="h-6 w-6" />
          <h2 className="text-xl font-black uppercase tracking-widest text-white">Title Race Progression</h2>
        </div>
        <p className="text-sm font-semibold text-white/60">
          No matches simulated yet. Complete at least one matchweek to see the title race progression!
        </p>
      </div>
    );
  }

  // Chart dimensions
  const width = 1000;
  const height = 480;
  const padding = { top: 30, right: 60, bottom: 50, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Y-axis: position 1 at TOP, position numTeams at BOTTOM (inverted)
  const yScale = (position: number) => ((position - 1) / (numTeams - 1)) * chartHeight;

  // X-axis: MW 1 to currentMaxMw
  const xScale = (mw: number) => ((mw - 1) / Math.max(currentMaxMw - 1, 1)) * chartWidth;

  // Generate SVG path for a team's position history
  const generatePath = (positions: number[]) => {
    const pathParts = positions.map((pos, i) => {
      const mw = i + 1; // positions[0] = MW1, positions[1] = MW2, ...
      const x = xScale(mw);
      const y = yScale(pos);
      return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    });
    return pathParts.join(' ');
  };

  // Handle Mouse Hover/Movement
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();

    // Scale factor between SVG viewbox coordinate space and actual client bounding rect
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;

    // Position of cursor in SVG coordinate space
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    // Position of cursor relative to the chart drawing area in SVG coordinate space
    const chartX = mouseX - padding.left;

    // Convert X position to closest matchweek (MW starts at 1)
    const mwFloat = 1 + (chartX / chartWidth) * Math.max(currentMaxMw - 1, 1);
    const mw = Math.round(Math.max(1, Math.min(currentMaxMw, mwFloat)));

    if (mw >= 1 && mw <= currentMaxMw) {
      setHoveredMw(mw);

      // Calculate tooltip position in SVG coordinate space
      const tooltipX = xScale(mw) + padding.left;
      const tooltipOffset = tooltipX > width - 200 ? -220 : 20;

      // Convert tooltip position back to physical pixels for absolute positioning of HTML div
      const tooltipXPhysical = (tooltipX + tooltipOffset) / scaleX;
      const tooltipYPhysical = mouseY / scaleY;

      setTooltipPos({
        x: tooltipXPhysical,
        y: tooltipYPhysical - 20,
      });
    } else {
      setHoveredMw(null);
      setTooltipPos(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredMw(null);
    setTooltipPos(null);
  };

  // The active team is either clicked (selectedTeam) or hovered (hoveredTeam)
  const activeTeam = selectedTeam ?? hoveredTeam;

  // Determine line opacity and width based on active (click or hover) state
  const getLineStyle = (teamId: string) => {
    if (activeTeam === null) {
      // No team active — all lines subtle
      return { opacity: 0.3, strokeWidth: 1.8, filter: '' };
    }
    if (activeTeam === teamId) {
      // This team is active — full highlight
      return { opacity: 1, strokeWidth: 3.5, filter: 'url(#neon-glow)' };
    }
    // Other teams — fade out
    return { opacity: 0.06, strokeWidth: 1, filter: '' };
  };

  // Get position for a team at a specific matchweek (mw is 1-indexed)
  const getPositionAt = (team: TeamPositionHistory, mw: number): number | undefined => {
    const idx = mw - 1; // positions array is 0-indexed (index 0 = MW1)
    return team.positions[idx];
  };

  // Sort teams by position at the hovered matchweek for tooltip display (best = lowest position first)
  const hoveredMwData = hoveredMw !== null
    ? chartData
        .map((team) => ({
          teamId: team.teamId,
          teamName: team.teamName,
          color: team.color,
          position: getPositionAt(team, hoveredMw) ?? numTeams,
        }))
        .sort((a, b) => a.position - b.position)
        .slice(0, 6) // Show top 6 in tooltip for readability
    : [];

  // Y-axis grid lines at positions 1, 5, 10, 15, 20
  const yGridPositions = [1, 5, 10, 15, 20].filter((p) => p <= numTeams);

  // Generate X-axis matchweek ticks (show up to 15 ticks)
  const xGridValues = (() => {
    const ticks: number[] = [];
    const step = Math.max(1, Math.ceil(currentMaxMw / 12));
    for (let i = 1; i <= currentMaxMw; i += step) {
      ticks.push(i);
    }
    if (ticks[ticks.length - 1] !== currentMaxMw) {
      ticks.push(currentMaxMw);
    }
    return ticks;
  })();

  return (
    <div className="relative space-y-6" onClick={(e) => { if (e.currentTarget === e.target) setSelectedTeam(null); }}>
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-[#1e1e2e] text-slate-200">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-widest text-white sm:text-2xl">Title Race</h2>
            <p className="text-xs text-white/50">Position progression for all {standings.length} teams • Click or hover legend to highlight</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-white/5 bg-white/5 px-3 py-1 text-xs text-white/60 font-semibold backdrop-blur-md">
          <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
          <span>Hover to inspect</span>
        </div>
      </div>

      {/* SVG Chart Wrapper */}
      <div className="relative overflow-hidden rounded-2xl border border-[#1e1e2e] bg-[#111118]/45 p-4 backdrop-blur-md">
        <div className="relative overflow-x-auto scrollbar-hide">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${width} ${height}`}
            width="100%"
            height="auto"
            className="mx-auto select-none overflow-visible"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {/* Filters for neon glow */}
            <defs>
              <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <g transform={`translate(${padding.left}, ${padding.top})`}>
              {/* Horizontal Y-Grid lines at key positions */}
              {yGridPositions.map((pos) => (
                <g key={pos} className="opacity-40 transition-opacity hover:opacity-100">
                  <line
                    x1={0}
                    y1={yScale(pos)}
                    x2={chartWidth}
                    y2={yScale(pos)}
                    stroke="rgba(255, 255, 255, 0.08)"
                    strokeWidth={1}
                    strokeDasharray="4 4"
                  />
                  <text
                    x={-12}
                    y={yScale(pos)}
                    fill="rgba(255, 255, 255, 0.55)"
                    fontSize={11}
                    fontFamily="monospace"
                    fontWeight="bold"
                    textAnchor="end"
                    dominantBaseline="middle"
                  >
                    {ordinal(pos)}
                  </text>
                </g>
              ))}

              {/* Vertical X-Grid lines (Rounds) */}
              {xGridValues.map((mw) => (
                <g key={mw} className="opacity-40">
                  <line
                    x1={xScale(mw)}
                    y1={0}
                    x2={xScale(mw)}
                    y2={chartHeight}
                    stroke="rgba(255, 255, 255, 0.04)"
                    strokeWidth={1}
                  />
                  <text
                    x={xScale(mw)}
                    y={chartHeight + 20}
                    fill="rgba(255, 255, 255, 0.5)"
                    fontSize={11}
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {`W${mw}`}
                  </text>
                </g>
              ))}

              {/* Hover Matchweek Vertical Guide Line */}
              {hoveredMw !== null && (
                <line
                  x1={xScale(hoveredMw)}
                  y1={0}
                  x2={xScale(hoveredMw)}
                  y2={chartHeight}
                  stroke="#475569"
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  className="opacity-75"
                />
              )}

              {/* Main Paths (Lines) for ALL teams — with click/hover highlight */}
              {chartData.map((team) => {
                const style = getLineStyle(team.teamId);
                return (
                  <g key={team.teamId}>
                    {/* Invisible wider hit area for easier hover targeting */}
                    <path
                      d={generatePath(team.positions)}
                      fill="none"
                      stroke="transparent"
                      strokeWidth={14}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredTeam(team.teamId)}
                      onMouseLeave={() => setHoveredTeam(null)}
                      onClick={(e) => { e.stopPropagation(); setSelectedTeam(prev => prev === team.teamId ? null : team.teamId); }}
                    />
                    {/* Visible line */}
                    <path
                      d={generatePath(team.positions)}
                      fill="none"
                      stroke={team.color}
                      strokeWidth={style.strokeWidth}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      filter={style.filter}
                      opacity={style.opacity}
                      className="transition-all duration-200 pointer-events-none"
                    />
                  </g>
                );
              })}

              {/* Circles / Dots on hover points */}
              {hoveredMw !== null &&
                chartData
                  .filter((team) => activeTeam === null ? chartData.indexOf(team) < 4 : team.teamId === activeTeam)
                  .map((team) => {
                    const pos = getPositionAt(team, hoveredMw);
                    if (pos === undefined) return null;
                    return (
                      <g key={`hover-pt-${team.teamId}`}>
                        <circle
                          cx={xScale(hoveredMw)}
                          cy={yScale(pos)}
                          r={6}
                          fill={team.color}
                          stroke="white"
                          strokeWidth={2}
                        />
                        {activeTeam === team.teamId && (
                          <circle
                            cx={xScale(hoveredMw)}
                            cy={yScale(pos)}
                            r={12}
                            fill="transparent"
                            stroke={team.color}
                            strokeWidth={1}
                            className="animate-ping"
                          />
                        )}
                      </g>
                    );
                  })}

              {/* End of Line logo markers — show for highlighted team or top 4 */}
              {chartData
                .filter((team) => activeTeam === null ? chartData.indexOf(team) < 4 : team.teamId === activeTeam)
                .map((team) => {
                  const lastIdx = team.positions.length - 1;
                  if (lastIdx < 0) return null;
                  const lastPos = team.positions[lastIdx];
                  const lastMw = lastIdx + 1;
                  const logo = logoMap?.[team.teamId];

                  return (
                    <g key={`end-${team.teamId}`} transform={`translate(${xScale(lastMw)}, ${yScale(lastPos)})`}>
                      {logo ? (
                        <g>
                          {/* Ambient glow circle behind logo */}
                          <circle cx={0} cy={0} r={12} fill="white" stroke={team.color} strokeWidth={2} />
                          <image
                            href={logo}
                            x={-8}
                            y={-8}
                            height={16}
                            width={16}
                          />
                        </g>
                      ) : (
                        <circle cx={0} cy={0} r={5} fill={team.color} stroke="white" strokeWidth={1.5} />
                      )}
                    </g>
                  );
                })}
            </g>
          </svg>

          {/* Floating Custom HTML Tooltip inside chart area */}
          {hoveredMw !== null && tooltipPos && (
            <div
              className="absolute z-50 pointer-events-none rounded-xl border border-[#1e1e2e] bg-[#0c0c16]/95 p-3.5 shadow-2xl backdrop-blur-md transition-all duration-75 flex flex-col gap-2 min-w-[200px]"
              style={{
                left: `${tooltipPos.x}px`,
                top: `${tooltipPos.y}px`,
              }}
            >
              <div className="flex items-center justify-between border-b border-[#1e1e2e] pb-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
                  {`Matchweek ${hoveredMw}`}
                </span>
              </div>
              <div className="space-y-1.5">
                {hoveredMwData.map((t) => {
                  const logo = logoMap?.[t.teamId];
                  const isHighlighted = hoveredTeam === t.teamId;
                  return (
                    <div key={t.teamId} className={`flex items-center justify-between gap-3 text-xs font-bold ${isHighlighted ? 'bg-white/10 -mx-1 px-1 rounded' : ''}`}>
                      <div className="flex items-center gap-2 min-w-0">
                        {logo ? (
                          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-white p-0.5 border border-slate-200">
                            <img src={logo} alt="" className="h-full w-full object-contain" />
                          </div>
                        ) : (
                          <div
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: t.color }}
                          />
                        )}
                        <span className="truncate text-white" style={{ borderLeft: `2.5px solid ${t.color}`, paddingLeft: '6px' }}>
                          {t.teamName}
                        </span>
                      </div>
                      <span className="font-black text-white shrink-0">{ordinal(t.position)}</span>
                    </div>
                  );
                })}
                {hoveredMwData.length < chartData.length && (
                  <div className="text-[10px] text-white/30 text-center pt-1 border-t border-white/5">
                    + {chartData.length - hoveredMwData.length} more teams
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Legend below the chart — all teams in scrollable grid */}
      <div className="flex flex-wrap gap-2.5 justify-center items-center py-2 max-h-[180px] overflow-y-auto">
        {chartData.map((team) => {
          const logo = logoMap?.[team.teamId];
          const lastPos = team.positions.length > 0 ? team.positions[team.positions.length - 1] : numTeams;
          const isSelected = selectedTeam === team.teamId;
          const isHighlighted = isSelected || hoveredTeam === team.teamId;

          return (
            <div
              key={team.teamId}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-bold cursor-pointer transition-all duration-200 ${
                isHighlighted
                  ? 'border-white/30 bg-white/15 scale-105 shadow-lg'
                  : activeTeam === null
                    ? 'border-white/5 bg-white/5 hover:bg-white/10'
                    : 'border-white/3 bg-white/2 opacity-40'
              }${isSelected ? ' ring-1 ring-white/25' : ''}`}
              onMouseEnter={() => setHoveredTeam(team.teamId)}
              onMouseLeave={() => setHoveredTeam(null)}
              onClick={(e) => { e.stopPropagation(); setSelectedTeam(prev => prev === team.teamId ? null : team.teamId); }}
            >
              {logo ? (
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-white p-0.5 border border-slate-200 shadow-sm">
                  <img src={logo} alt="" className="h-full w-full object-contain" />
                </div>
              ) : (
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: team.color }}
                />
              )}
              <span className="text-white whitespace-nowrap">{team.teamName}</span>
              <div className="h-3 w-px bg-white/20" />
              <span className="font-black text-slate-200">{ordinal(lastPos)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
