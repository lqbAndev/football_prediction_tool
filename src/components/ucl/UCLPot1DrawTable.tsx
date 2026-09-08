import { useMemo } from 'react';
import type { LeagueMatch } from '../../types/leagueConfig';
import type { Team } from '../../types/tournament';
import uclLogoImg from '../../img/CUP COMPETITION/UCL/tournaments_uefa-champions-league_128x128.football-logos.cc.png';

interface UCLPot1DrawTableProps {
  leagueMatches: LeagueMatch[];
  teams: Team[];
}

type VenueSide = 'home' | 'away';

const POT_1_BROADCAST_ORDER = [
  'psg',
  'bayern',
  'real-madrid',
  'liverpool',
  'inter',
  'man-city',
  'arsenal',
  'barcelona',
  'atletico',
] as const;

const POT_COLUMNS = [
  { pot: 1, home: 'bg-purple-700/30', away: 'bg-pink-600/25' },
  { pot: 2, home: 'bg-sky-600/25', away: 'bg-cyan-600/20' },
  { pot: 3, home: 'bg-rose-600/25', away: 'bg-rose-400/20' },
  { pot: 4, home: 'bg-emerald-600/25', away: 'bg-green-500/20' },
] as const;

export const UCLPot1DrawTable: React.FC<UCLPot1DrawTableProps> = ({ leagueMatches, teams }) => {
  const teamsById = useMemo(
    () => new Map(teams.map((team) => [team.id, team])),
    [teams],
  );

  const pot1Teams = useMemo(
    () => POT_1_BROADCAST_ORDER
      .map((teamId) => teamsById.get(teamId))
      .filter((team): team is Team => Boolean(team?.pot === 1)),
    [teamsById],
  );

  const opponentsByTeam = useMemo(() => {
    const result = new Map<string, Map<string, Team>>();
    const recordOpponent = (teamId: string, opponentId: string, side: VenueSide) => {
      const opponent = teamsById.get(opponentId);
      if (!opponent?.pot) return;
      const key = `${opponent.pot}-${side}`;
      const teamOpponents = result.get(teamId) || new Map<string, Team>();
      if (!teamOpponents.has(key)) teamOpponents.set(key, opponent);
      result.set(teamId, teamOpponents);
    };

    [...leagueMatches]
      .sort((left, right) => left.matchweek - right.matchweek)
      .forEach((match) => {
        if (teamsById.get(match.homeTeamId)?.pot === 1) {
          recordOpponent(match.homeTeamId, match.awayTeamId, 'home');
        }
        if (teamsById.get(match.awayTeamId)?.pot === 1) {
          recordOpponent(match.awayTeamId, match.homeTeamId, 'away');
        }
      });

    return result;
  }, [leagueMatches, teamsById]);

  const renderOpponent = (teamId: string, pot: number, side: VenueSide) => {
    const opponent = opponentsByTeam.get(teamId)?.get(`${pot}-${side}`);
    if (!opponent) return <span className="text-white/20">—</span>;

    return (
      <span className="inline-flex items-center gap-2">
        {opponent.logo && <img src={opponent.logo} alt="" className="h-5 w-5 shrink-0 object-contain" />}
        <span className="font-mono text-[11px] font-black text-white sm:text-xs">{opponent.shortName}</span>
      </span>
    );
  };

  return (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#071329] to-[#020817] shadow-[0_20px_60px_rgba(0,6,20,0.34)]" aria-labelledby="ucl-pot1-draw-title">
      <header className="flex items-center gap-3 border-b border-white/10 px-4 py-4 sm:px-6">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.055]">
          <img src={uclLogoImg} alt="" className="h-7 w-7 object-contain brightness-0 invert" />
        </span>
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.25em] text-sky-300">UEFA broadcast matrix</p>
          <h3 id="ucl-pot1-draw-title" className="mt-0.5 text-base font-black tracking-tight text-white sm:text-xl">
            LEAGUE PHASE DRAW: POT 1 TEAMS
          </h3>
        </div>
      </header>

      <div className="overflow-x-auto overscroll-x-contain [scrollbar-color:#38BDF833_transparent]">
        <table className="w-full min-w-[980px] border-collapse text-left" aria-label="Pot 1 home and away opponents by pot">
          <thead>
            <tr className="border-b border-white/10 bg-black/20">
              <th rowSpan={2} className="sticky left-0 z-20 min-w-[190px] border-r border-white/10 bg-[#061126] px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white/45">
                Pot 1 club
              </th>
              {POT_COLUMNS.map((column) => (
                <th key={column.pot} colSpan={2} className="border-r border-white/10 px-3 py-2 text-center text-[10px] font-black uppercase tracking-[0.22em] text-white/65 last:border-r-0">
                  Pot {column.pot}
                </th>
              ))}
            </tr>
            <tr className="border-b border-white/10 text-[9px] font-black uppercase tracking-[0.2em] text-white/55">
              {POT_COLUMNS.flatMap((column) => [
                <th key={`${column.pot}-home`} className={`min-w-[92px] border-r border-white/10 px-3 py-2.5 text-center ${column.home}`}>Home</th>,
                <th key={`${column.pot}-away`} className={`min-w-[92px] border-r border-white/10 px-3 py-2.5 text-center ${column.away}`}>Away</th>,
              ])}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {pot1Teams.map((team) => (
              <tr key={team.id} className="transition-colors hover:bg-white/[0.035]">
                <th scope="row" className="sticky left-0 z-10 border-r border-white/10 bg-[#050f22] px-4 py-3">
                  <span className="flex items-center gap-3">
                    {team.logo && <img src={team.logo} alt={`${team.name} crest`} className="h-7 w-7 shrink-0 object-contain" />}
                    <span className="truncate text-sm font-bold text-white">{team.shortName}</span>
                  </span>
                </th>
                {POT_COLUMNS.flatMap((column) => [
                  <td key={`${team.id}-${column.pot}-home`} className={`border-r border-white/[0.06] px-3 py-3 text-center ${column.home}`}>{renderOpponent(team.id, column.pot, 'home')}</td>,
                  <td key={`${team.id}-${column.pot}-away`} className={`border-r border-white/[0.06] px-3 py-3 text-center ${column.away}`}>{renderOpponent(team.id, column.pot, 'away')}</td>,
                ])}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
