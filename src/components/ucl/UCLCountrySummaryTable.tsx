import { useMemo } from 'react';
import type { Team } from '../../types/tournament';
import { getClubTheme } from '../../data/competitions/ucl2627/clubThemes';
import patchUclImg from '../../img/CUP COMPETITION/UCL/patch_ucl.png';

interface UCLCountrySummaryTableProps {
  teams: Team[];
  eliminatedTeamIds: Set<string>;
}

export const UCLCountrySummaryTable: React.FC<UCLCountrySummaryTableProps> = ({ teams, eliminatedTeamIds }) => {
  const countryGroups = useMemo(() => {
    const groups = new Map<string, { code: string; name: string; teams: Team[] }>();
    teams.forEach((team) => {
      const theme = getClubTheme(team.id);
      const group = groups.get(theme.countryCode) || {
        code: theme.countryCode,
        name: theme.countryName,
        teams: [],
      };
      group.teams.push(team);
      groups.set(theme.countryCode, group);
    });

    return [...groups.values()].sort((left, right) =>
      right.teams.length - left.teams.length || left.name.localeCompare(right.name),
    );
  }, [teams]);

  return (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#071329] via-[#050d1d] to-[#020817] shadow-[0_22px_65px_rgba(0,6,20,0.36)]" aria-labelledby="ucl-country-summary-title">
      <header className="flex items-center gap-3 border-b border-white/10 px-4 py-4 sm:px-6 sm:py-5">
        <img src={patchUclImg} alt="" className="h-8 w-8 object-contain" />
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.26em] text-cyan-300">Nation tracker</p>
          <h2 id="ucl-country-summary-title" className="mt-0.5 text-lg font-black text-white sm:text-2xl">Clubs remaining by country</h2>
        </div>
      </header>

      <div className="space-y-2 p-3 sm:hidden">
        {countryGroups.map((country) => {
          const remaining = country.teams.filter((team) => !eliminatedTeamIds.has(team.id)).length;
          const theme = getClubTheme(country.teams[0].id);
          return (
            <article key={country.code} className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-3">
              <div className="flex items-center justify-between gap-3">
                <span className={`inline-flex rounded-xl border px-3 py-1.5 text-xs font-black ${theme.countryBg} ${theme.countryText} ${theme.countryBorder}`}>{country.name}</span>
                <span className={`rounded-xl border px-2.5 py-1 font-mono text-sm font-black ${remaining > 0 ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300' : 'border-rose-400/20 bg-rose-400/[0.07] text-rose-300/70'}`}>{remaining}/{country.teams.length}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {country.teams.map((team) => {
                  const eliminated = eliminatedTeamIds.has(team.id);
                  return <span key={team.id} className={`inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.035] px-2 py-1 ${eliminated ? 'opacity-35 grayscale' : ''}`}>{team.logo && <img src={team.logo} alt="" className="h-4 w-4 object-contain" />}<span className={`text-[10px] font-semibold ${eliminated ? 'line-through text-white/40' : 'text-white/85'}`}>{team.shortName}</span></span>;
                })}
              </div>
            </article>
          );
        })}
      </div>
      <div className="hidden overflow-x-auto overscroll-x-contain [scrollbar-color:#38BDF833_transparent] sm:block">
        <table className="w-full min-w-[900px] text-left" aria-label="UCL clubs remaining by country">
          <thead>
            <tr className="border-b border-white/10 bg-black/20 text-[10px] font-black uppercase tracking-[0.18em] text-white/45">
              <th className="px-5 py-3">Country</th>
              <th className="px-4 py-3 text-center">Entered</th>
              <th className="px-4 py-3 text-center">Remaining</th>
              <th className="px-5 py-3">Clubs</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {countryGroups.map((country) => {
              const remaining = country.teams.filter((team) => !eliminatedTeamIds.has(team.id)).length;
              const theme = getClubTheme(country.teams[0].id);
              return (
                <tr key={country.code} className="transition-colors hover:bg-white/[0.035]">
                  <th scope="row" className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-black ${theme.countryBg} ${theme.countryText} ${theme.countryBorder}`}>
                      {country.name}
                    </span>
                  </th>
                  <td className="px-4 py-3.5 text-center font-mono text-base font-black text-white/70">{country.teams.length}</td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`inline-flex min-w-14 justify-center rounded-xl border px-2.5 py-1 font-mono text-sm font-black ${remaining > 0 ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300' : 'border-rose-400/20 bg-rose-400/[0.07] text-rose-300/70'}`}>
                      {remaining}/{country.teams.length}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-wrap gap-2">
                      {country.teams.map((team) => {
                        const eliminated = eliminatedTeamIds.has(team.id);
                        return (
                          <span key={team.id} className={`inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.035] px-2.5 py-1.5 transition ${eliminated ? 'opacity-35 grayscale' : 'opacity-100'}`}>
                            {team.logo && <img src={team.logo} alt="" className="h-5 w-5 object-contain" />}
                            <span className={`text-xs font-semibold ${eliminated ? 'text-white/40 line-through' : 'text-white/85'}`}>{team.shortName}</span>
                            <span className={eliminated ? 'text-rose-300/70' : 'text-emerald-300'} aria-label={eliminated ? 'Eliminated' : 'Still competing'}>{eliminated ? '×' : '✓'}</span>
                          </span>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};
