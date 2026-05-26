import { useState, useMemo, useRef, useCallback } from 'react';
import { Trophy, TrendingUp, HelpCircle } from 'lucide-react';
import type { LeagueStanding, LeagueMatch } from '../../types/leagueConfig';

interface TitleRaceChartProps {
  standings: LeagueStanding[];
  fixtures: LeagueMatch[];
  totalRounds: number;
  logoMap?: Record<string, string>;
}

interface TeamPointsHistory {
  teamId: string;
  teamName: string;
  color: string;
  points: number[];
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

export default function TitleRaceChart({ standings, fixtures, totalRounds, logoMap }: TitleRaceChartProps) {
  const [hoveredMw, setHoveredMw] = useState<number | null>(null);
  const [hoveredTeam, setHoveredTeam] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const completedMatches = useMemo(() => fixtures.filter((f) => f.status === 'completed'), [fixtures]);
  
  // Highest matchweek that has completed matches
  const currentMaxMw = useMemo(() => {
    if (completedMatches.length === 0) return 0;
    return Math.max(...completedMatches.map((f) => f.matchweek));
  }, [completedMatches]);

  const chartData = useMemo(() => {
    // Use ALL teams from standings (not just top 4)
    if (standings.length === 0) return [];

    // Calculate points history for each team
    const history: TeamPointsHistory[] = standings.map((standing, index) => {
      const pointsHistory: number[] = [0]; // Week 0: 0 points

      // Calculate cumulative points after each matchweek
      for (let mw = 1; mw <= totalRounds; mw++) {
        // Only show up to the current completed matchweek
        if (mw > currentMaxMw) break;

        const teamMatches = completedMatches.filter(
          (f) =>
            f.matchweek <= mw &&
            (f.homeTeamId === standing.teamId || f.awayTeamId === standing.teamId)
        );

        let totalPoints = 0;
        for (const match of teamMatches) {
          const isHome = match.homeTeamId === standing.teamId;
          const teamScore = isHome ? match.homeScore! : match.awayScore!;
          const opponentScore = isHome ? match.awayScore! : match.homeScore!;

          if (teamScore > opponentScore) totalPoints += 3;
          else if (teamScore === opponentScore) totalPoints += 1;
        }

        pointsHistory.push(totalPoints);
      }

      return {
        teamId: standing.teamId,
        teamName: standing.teamName,
        color: CLUB_COLORS[standing.teamId] || CHART_COLORS[index % CHART_COLORS.length],
        points: pointsHistory,
      };
    });

    return history;
  }, [standings, completedMatches, totalRounds, currentMaxMw]);

  if (chartData.length === 0 || currentMaxMw === 0) {
    return (
      <div className="relative overflow-hidden rounded-[32px] border border-[#38003c]/30 bg-[#15001a]/40 p-8 backdrop-blur-md">
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

  // Calculate scales
  const maxPoints = Math.max(...chartData.flatMap((d) => d.points), 10);
  // Pad the max points to leave space at the top of the chart
  const yAxisMax = Math.ceil((maxPoints + 5) / 10) * 10; 

  const xScale = (mw: number) => (mw / currentMaxMw) * chartWidth;
  const yScale = (pts: number) => chartHeight - (pts / yAxisMax) * chartHeight;

  // Generate SVG path for a team
  const generatePath = (points: number[]) => {
    const pathParts = points.map((p, i) => {
      const x = xScale(i);
      const y = yScale(p);
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

    // Convert X position to closest matchweek
    const mw = Math.round((chartX / chartWidth) * currentMaxMw);

    if (mw >= 0 && mw <= currentMaxMw) {
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

  // Determine line opacity and width based on hover state
  const getLineStyle = (teamId: string) => {
    if (hoveredTeam === null) {
      // No team hovered — all lines subtle
      return { opacity: 0.3, strokeWidth: 1.8, filter: '' };
    }
    if (hoveredTeam === teamId) {
      // This team is hovered — full highlight
      return { opacity: 1, strokeWidth: 3.5, filter: 'url(#neon-glow)' };
    }
    // Other teams — fade out
    return { opacity: 0.06, strokeWidth: 1, filter: '' };
  };

  // Sort teams by points at the hovered matchweek for tooltip display
  const hoveredMwData = hoveredMw !== null
    ? chartData
        .map((team) => ({
          teamId: team.teamId,
          teamName: team.teamName,
          color: team.color,
          points: team.points[hoveredMw] !== undefined ? team.points[hoveredMw] : 0,
        }))
        .sort((a, b) => b.points - a.points)
        .slice(0, 6) // Show top 6 in tooltip for readability
    : [];

  // Generate Y-axis grid values
  const yGridValues = Array.from({ length: 6 }, (_, i) => Math.round((i * yAxisMax) / 5));

  // Generate X-axis matchweek ticks (show up to 15 ticks)
  const xGridValues = (() => {
    const ticks = [];
    const step = Math.max(1, Math.ceil(currentMaxMw / 12));
    for (let i = 0; i <= currentMaxMw; i += step) {
      ticks.push(i);
    }
    if (ticks[ticks.length - 1] !== currentMaxMw) {
      ticks.push(currentMaxMw);
    }
    return ticks;
  })();

  return (
    <div className="relative space-y-6">
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e11d8f]/10 border border-[#e11d8f]/20 text-[#e11d8f]">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-widest text-white sm:text-2xl">Title Race</h2>
            <p className="text-xs text-white/50">Full points progression for all {standings.length} teams • Hover lines or legend to highlight</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-white/5 bg-white/5 px-3 py-1 text-xs text-white/60 font-semibold backdrop-blur-md">
          <HelpCircle className="h-3.5 w-3.5 text-[#e11d8f]" />
          <span>Hover to inspect</span>
        </div>
      </div>

      {/* SVG Chart Wrapper */}
      <div className="relative overflow-hidden rounded-2xl border border-[#38003c]/20 bg-[#15001a]/40 p-4 backdrop-blur-md">
        <div className="relative overflow-x-auto">
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
              {/* Horizontal Y-Grid lines */}
              {yGridValues.map((pts) => (
                <g key={pts} className="opacity-40 transition-opacity hover:opacity-100">
                  <line
                    x1={0}
                    y1={yScale(pts)}
                    x2={chartWidth}
                    y2={yScale(pts)}
                    stroke="rgba(255, 255, 255, 0.08)"
                    strokeWidth={1}
                    strokeDasharray="4 4"
                  />
                  <text
                    x={-12}
                    y={yScale(pts)}
                    fill="rgba(255, 255, 255, 0.55)"
                    fontSize={11}
                    fontFamily="monospace"
                    fontWeight="bold"
                    textAnchor="end"
                    dominantBaseline="middle"
                  >
                    {pts} pts
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
                    key={`text-${mw}`}
                    x={xScale(mw)}
                    y={chartHeight + 20}
                    fill="rgba(255, 255, 255, 0.5)"
                    fontSize={11}
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {mw === 0 ? 'Start' : `W${mw}`}
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
                  stroke="#e11d8f"
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  className="opacity-75"
                />
              )}

              {/* Main Paths (Lines) for ALL teams — with hover highlight */}
              {chartData.map((team) => {
                const style = getLineStyle(team.teamId);
                return (
                  <g key={team.teamId}>
                    {/* Invisible wider hit area for easier hover targeting */}
                    <path
                      d={generatePath(team.points)}
                      fill="none"
                      stroke="transparent"
                      strokeWidth={14}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredTeam(team.teamId)}
                      onMouseLeave={() => setHoveredTeam(null)}
                    />
                    {/* Visible line */}
                    <path
                      d={generatePath(team.points)}
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

              {/* Circles / Dots on hover points (show only for hovered team or top 4 if no team hovered) */}
              {hoveredMw !== null &&
                chartData
                  .filter((team) => hoveredTeam === null ? chartData.indexOf(team) < 4 : team.teamId === hoveredTeam)
                  .map((team) => {
                    const pts = team.points[hoveredMw] !== undefined ? team.points[hoveredMw] : 0;
                    return (
                      <g key={`hover-pt-${team.teamId}`}>
                        <circle
                          cx={xScale(hoveredMw)}
                          cy={yScale(pts)}
                          r={6}
                          fill={team.color}
                          stroke="white"
                          strokeWidth={2}
                        />
                        {hoveredTeam === team.teamId && (
                          <circle
                            cx={xScale(hoveredMw)}
                            cy={yScale(pts)}
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
                .filter((team) => hoveredTeam === null ? chartData.indexOf(team) < 4 : team.teamId === hoveredTeam)
                .map((team) => {
                  const lastIdx = team.points.length - 1;
                  const lastPts = team.points[lastIdx];
                  const logo = logoMap?.[team.teamId];

                  return (
                    <g key={`end-${team.teamId}`} transform={`translate(${xScale(lastIdx)}, ${yScale(lastPts)})`}>
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
              className="absolute z-50 pointer-events-none rounded-xl border border-[#e11d8f]/30 bg-[#15001a]/95 p-3.5 shadow-2xl backdrop-blur-md transition-all duration-75 flex flex-col gap-2 min-w-[200px]"
              style={{
                left: `${tooltipPos.x}px`,
                top: `${tooltipPos.y}px`,
              }}
            >
              <div className="flex items-center justify-between border-b border-[#38003c]/20 pb-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#e11d8f]">
                  {hoveredMw === 0 ? 'Before Season' : `Matchweek ${hoveredMw}`}
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
                      <span className="font-black text-white shrink-0">{t.points} pts</span>
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
          const lastPts = team.points[team.points.length - 1];
          const isHighlighted = hoveredTeam === team.teamId;

          return (
            <div
              key={team.teamId}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-bold cursor-pointer transition-all duration-200 ${
                isHighlighted
                  ? 'border-white/30 bg-white/15 scale-105 shadow-lg'
                  : hoveredTeam === null
                    ? 'border-white/5 bg-white/5 hover:bg-white/10'
                    : 'border-white/3 bg-white/2 opacity-40'
              }`}
              onMouseEnter={() => setHoveredTeam(team.teamId)}
              onMouseLeave={() => setHoveredTeam(null)}
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
              <span className="font-black text-[#e11d8f]">{lastPts} pts</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
