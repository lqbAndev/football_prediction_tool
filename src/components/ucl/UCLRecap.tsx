import { useEffect, useState } from 'react';
import { Activity, Award, Flame, Shield, Star, Target, X } from 'lucide-react';
import type { Team } from '../../types/tournament';
import type { BestXIPlayer } from '../../utils/bestXI';
import type { UCLRecapStats } from '../../utils/uclRecapStats';
import uclBallImg from '../../img/CUP COMPETITION/UCL/ball/ucl_ball_26-27.png';
import uclCupImg from '../../img/CUP COMPETITION/UCL/ucl_cup.png';
import badgeUclImg from '../../img/CUP COMPETITION/UCL/badge_ucl.png';

interface UCLRecapProps {
  stats: UCLRecapStats;
  champion: Team | null;
  runnerUp: Team | null;
}

const PlayerPin: React.FC<{
  player: BestXIPlayer;
  accent: 'cyan' | 'pink' | 'amber';
  onSelect: (player: BestXIPlayer) => void;
}> = ({ player, accent, onSelect }) => {
  const accentClass = accent === 'pink'
    ? 'border-pink-400/55 bg-pink-400/15 shadow-[0_0_20px_rgba(255,0,90,0.24)]'
    : accent === 'amber'
    ? 'border-amber-400/55 bg-amber-400/15 shadow-[0_0_20px_rgba(245,158,11,0.22)]'
    : 'border-cyan-400/55 bg-cyan-400/15 shadow-[0_0_20px_rgba(0,240,255,0.22)]';

  return (
    <button
      type="button"
      onClick={() => onSelect(player)}
      className="group flex min-w-0 flex-col items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
    >
      <span className={`flex h-10 w-10 items-center justify-center rounded-full border transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-y-1 sm:h-12 sm:w-12 ${accentClass}`}>
        {player.teamLogo ? (
          <img src={player.teamLogo} alt="" className="h-7 w-7 object-contain sm:h-8 sm:w-8" />
        ) : (
          <span className="text-[10px] font-black text-white">{player.playerName.slice(0, 2).toUpperCase()}</span>
        )}
      </span>
      <span className="mt-1 max-w-[76px] truncate rounded-full bg-black/70 px-2 py-0.5 text-[9px] font-black text-white sm:max-w-[110px] sm:text-[10px]">
        {player.playerName}
      </span>
      <span className="max-w-[74px] truncate text-[8px] text-white/45 sm:max-w-[100px]">{player.teamName}</span>
      <span className="font-mono text-[9px] font-black text-cyan-300">{player.totalScore} pts</span>
    </button>
  );
};

export const UCLRecap: React.FC<UCLRecapProps> = ({ stats, champion, runnerUp }) => {
  const [selectedPlayer, setSelectedPlayer] = useState<BestXIPlayer | null>(null);

  useEffect(() => {
    if (!selectedPlayer) return;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedPlayer(null);
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedPlayer]);

  if (!champion) return null;

  const goldenBoot = stats.topScorers[0] || null;
  const bestXI = stats.bestXI;

  return (
    <>
    <article className="relative overflow-hidden rounded-[36px] border border-white/10 bg-gradient-to-b from-[#071329] via-[#050d1d] to-[#020817] text-white shadow-[0_30px_90px_rgba(0,6,20,0.42)]" aria-labelledby="ucl-recap-title">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(125,211,252,0.1),transparent_36%),radial-gradient(circle_at_85%_18%,rgba(30,64,175,0.08),transparent_30%)]" />
      <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-8 sm:py-14">
        <header className="mb-12 flex items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="flex min-w-0 items-center gap-3">
            <img src={badgeUclImg} alt="UEFA Champions League" className="h-11 w-11 shrink-0 object-contain drop-shadow-[0_0_18px_rgba(0,240,255,0.35)]" />
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-cyan-300">UEFA technical report</p>
              <h1 id="ucl-recap-title" className="truncate text-xl font-black tracking-wide sm:text-3xl">Season Recap 2026/27</h1>
            </div>
          </div>
          <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.22em] text-amber-200">Unlocked</span>
        </header>

        <section className="mb-16" aria-labelledby="podium-title">
          <div className="mb-7 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.32em] text-amber-300">Madrid 27 honours</p>
            <h2 id="podium-title" className="mt-2 text-3xl font-black sm:text-5xl">Champions of Europe</h2>
          </div>

          <div className="mx-auto grid max-w-4xl grid-cols-1 items-end gap-5 md:grid-cols-[1.25fr_0.85fr]">
            <div className="rounded-[34px] border border-cyan-400/25 bg-white/[0.04] p-1.5 shadow-[0_0_80px_rgba(0,240,255,0.14)]">
              <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-b from-cyan-400/15 via-[#000B29] to-[#00081E] px-6 py-9 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)]">
                <div className="absolute inset-x-12 top-1/2 h-24 rounded-full bg-cyan-400/15 blur-3xl" />
                <span className="relative inline-flex rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.25em] text-amber-300">#1 Champion</span>
                <div className="relative mx-auto mt-5 flex h-36 w-36 items-center justify-center">
                  <img src={uclCupImg} alt="UEFA Champions League trophy" className="absolute h-36 w-36 object-contain opacity-35" />
                  <img src={champion.logo} alt={champion.name} className="relative h-24 w-24 object-contain drop-shadow-[0_0_24px_rgba(255,255,255,0.4)]" />
                </div>
                <h3 className="relative mt-3 text-3xl font-black text-white">{champion.name}</h3>
                <p className="relative mt-1 text-xs uppercase tracking-widest text-cyan-300">Winner · Madrid 27</p>
              </div>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-white/[0.025] p-1.5 opacity-70">
              <div className="rounded-[24px] bg-[#000B29] px-6 py-7 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
                <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[9px] font-black uppercase tracking-[0.25em] text-white/45">#2 Runner-up</span>
                {runnerUp ? (
                  <>
                    <img src={runnerUp.logo} alt={runnerUp.name} className="mx-auto mt-5 h-20 w-20 object-contain grayscale-[0.25]" />
                    <h3 className="mt-4 text-xl font-black text-white/75">{runnerUp.name}</h3>
                    <p className="mt-1 text-[10px] uppercase tracking-widest text-white/35">Finalist</p>
                  </>
                ) : (
                  <p className="py-12 text-sm text-white/35">Runner-up unavailable</p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="mb-16" aria-labelledby="awards-title">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FF005A]">Individual honours</p>
              <h2 id="awards-title" className="mt-1 text-2xl font-black sm:text-3xl">Season Awards</h2>
            </div>
            <Award className="h-7 w-7 text-amber-300" />
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <div className="rounded-[30px] border border-cyan-400/20 bg-white/[0.035] p-1.5">
              <div className="h-full rounded-[24px] bg-gradient-to-br from-cyan-400/12 to-[#000B29] p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
                <div className="flex items-center justify-between text-cyan-300"><Star className="h-5 w-5 fill-cyan-300" /><span className="text-[9px] font-black uppercase tracking-[0.22em]">POTS</span></div>
                <h3 className="mt-7 text-xl font-black">{stats.playerOfTheSeason?.playerName || '—'}</h3>
                <p className="mt-1 text-xs text-white/45">{stats.playerOfTheSeason?.teamName || 'No data'}</p>
                <div className="mt-5 flex items-end justify-between border-t border-white/10 pt-4">
                  <span className="text-[10px] uppercase tracking-wider text-white/40">Performance score</span>
                  <span className="font-mono text-2xl font-black text-cyan-300">{stats.playerOfTheSeason?.points ?? '—'} pts</span>
                </div>
              </div>
            </div>

            <div className="rounded-[30px] border border-amber-400/20 bg-white/[0.035] p-1.5">
              <div className="h-full rounded-[24px] bg-gradient-to-br from-amber-400/10 to-[#000B29] p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
                <div className="flex items-center justify-between text-amber-300"><Flame className="h-5 w-5" /><span className="text-[9px] font-black uppercase tracking-[0.22em]">Golden Boot</span></div>
                <h3 className="mt-7 text-xl font-black">{goldenBoot?.playerName || '—'}</h3>
                <p className="mt-1 text-xs text-white/45">{goldenBoot?.teamName || 'No data'}</p>
                <div className="mt-5 flex items-end justify-between border-t border-white/10 pt-4">
                  <span className="text-[10px] uppercase tracking-wider text-white/40">League + knockout</span>
                  <span className="font-mono text-2xl font-black text-amber-300">{goldenBoot?.goals ?? '—'} G</span>
                </div>
              </div>
            </div>

            <div className="rounded-[30px] border border-emerald-400/20 bg-white/[0.035] p-1.5">
              <div className="h-full rounded-[24px] bg-gradient-to-br from-emerald-400/10 to-[#000B29] p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
                <div className="flex items-center justify-between text-emerald-300"><Shield className="h-5 w-5" /><span className="text-[9px] font-black uppercase tracking-[0.22em]">Golden Glove</span></div>
                <h3 className="mt-7 text-xl font-black">{stats.goldenGlove?.playerName || '—'}</h3>
                <p className="mt-1 text-xs text-white/45">{stats.goldenGlove?.teamName || 'No data'}</p>
                <div className="mt-5 flex items-end justify-between border-t border-white/10 pt-4">
                  <span className="text-[10px] uppercase tracking-wider text-white/40">Clean sheets</span>
                  <span className="font-mono text-2xl font-black text-emerald-300">{stats.goldenGlove?.cleanSheets ?? '—'}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-16" aria-labelledby="best-xi-title">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-300">Technical selection</p>
              <h2 id="best-xi-title" className="mt-1 text-2xl font-black sm:text-3xl">Best XI · 4-3-3</h2>
            </div>
            <img src={uclBallImg} alt="" className="h-9 w-9 object-contain" />
          </div>
          <p className="-mt-3 mb-5 text-[10px] leading-5 text-white/40">
            Performance points: goal FW +2 · MF +3 · DF/GK +5 · clean sheet +2 · MOTM +5 · League win +0.5 · knockout win +1 · champion +3 / runner-up +2. Tap a player for the full calculation.
          </p>

          {bestXI ? (
            <div className="rounded-[34px] border border-cyan-400/20 bg-white/[0.035] p-1.5">
              <div className="relative mx-auto min-h-[560px] overflow-hidden rounded-[28px] bg-[#00081E] px-3 py-8 shadow-[inset_0_0_80px_rgba(0,240,255,0.09)] sm:px-8">
                <div className="pointer-events-none absolute inset-5 rounded-[24px] border border-cyan-200/15" />
                <div className="pointer-events-none absolute inset-x-5 top-1/2 h-px bg-cyan-200/15" />
                <div className="pointer-events-none absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-200/15" />
                <div className="relative z-10 flex min-h-[500px] flex-col justify-between">
                  <div className="grid grid-cols-3 gap-2">{bestXI.attackers.map((player) => <PlayerPin key={player.playerId} player={player} accent="pink" onSelect={setSelectedPlayer} />)}</div>
                  <div className="grid grid-cols-3 gap-2">{bestXI.midfielders.map((player) => <PlayerPin key={player.playerId} player={player} accent="cyan" onSelect={setSelectedPlayer} />)}</div>
                  <div className="grid grid-cols-4 gap-1">{bestXI.defenders.map((player) => <PlayerPin key={player.playerId} player={player} accent="cyan" onSelect={setSelectedPlayer} />)}</div>
                  <div className="flex justify-center"><PlayerPin player={bestXI.goalkeeper} accent="amber" onSelect={setSelectedPlayer} /></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-white/10 py-20 text-center text-sm text-white/35">Best XI data unavailable.</div>
          )}
        </section>

        <section className="mb-12" aria-labelledby="tournament-stats-title">
          <div className="mb-6">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-300">Competition intelligence</p>
            <h2 id="tournament-stats-title" className="mt-1 text-2xl font-black sm:text-3xl">Tournament Statistics</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-3xl border border-cyan-400/15 bg-white/[0.035] p-5"><Target className="h-5 w-5 text-cyan-300" /><p className="mt-5 text-[10px] uppercase tracking-wider text-white/40">Most goals scored</p><h3 className="mt-1 text-lg font-black">{stats.bestAttackingTeam?.teamName || '—'}</h3><p className="mt-3 font-mono text-2xl font-black text-cyan-300">{stats.bestAttackingTeam?.goals ?? '—'}</p></div>
            <div className="rounded-3xl border border-emerald-400/15 bg-white/[0.035] p-5"><Shield className="h-5 w-5 text-emerald-300" /><p className="mt-5 text-[10px] uppercase tracking-wider text-white/40">Fewest conceded</p><h3 className="mt-1 text-lg font-black">{stats.bestDefensiveTeam?.teamName || '—'}</h3><p className="mt-3 font-mono text-2xl font-black text-emerald-300">{stats.bestDefensiveTeam?.conceded ?? '—'}</p></div>
            <div className="rounded-3xl border border-[#FF005A]/20 bg-white/[0.035] p-5"><Flame className="h-5 w-5 text-pink-300" /><p className="mt-5 text-[10px] uppercase tracking-wider text-white/40">Highest-scoring match</p><h3 className="mt-1 truncate text-sm font-black">{stats.highestScoringMatch ? `${stats.highestScoringMatch.homeTeamName} — ${stats.highestScoringMatch.awayTeamName}` : '—'}</h3><p className="mt-3 font-mono text-2xl font-black text-pink-300">{stats.highestScoringMatch ? `${stats.highestScoringMatch.homeScore}–${stats.highestScoringMatch.awayScore}` : '—'}</p></div>
            <div className="rounded-3xl border border-amber-400/15 bg-white/[0.035] p-5"><Activity className="h-5 w-5 text-amber-300" /><p className="mt-5 text-[10px] uppercase tracking-wider text-white/40">Goals per match</p><h3 className="mt-1 text-lg font-black">{stats.tournamentGoalAnalysis.totalMatches} matches</h3><p className="mt-3 font-mono text-2xl font-black text-amber-300">{stats.tournamentGoalAnalysis.averagePerMatch}</p></div>
          </div>
        </section>

      </div>
    </article>

      {selectedPlayer && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 sm:items-center sm:p-4" onClick={() => setSelectedPlayer(null)}>
          <div role="dialog" aria-modal="true" aria-labelledby="ucl-score-title" className="flex max-h-[82dvh] w-full max-w-md flex-col overflow-hidden rounded-t-[28px] border-t border-cyan-400/25 bg-[#000B29] p-1.5 sm:rounded-[30px] sm:border" onClick={(event) => event.stopPropagation()}>
            <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-white/20 sm:hidden" />
            <div className="overflow-y-auto rounded-t-[22px] bg-[#00081E] p-4 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] sm:rounded-[24px] sm:p-6">
              <button type="button" onClick={() => setSelectedPlayer(null)} aria-label="Close player details" className="ml-auto block rounded-full p-2 text-white/45 hover:bg-white/5 hover:text-white"><X className="h-4 w-4" /></button>
              {selectedPlayer.teamLogo && <img src={selectedPlayer.teamLogo} alt={`${selectedPlayer.teamName} crest`} className="mx-auto h-12 w-12 object-contain sm:h-16 sm:w-16" />}
              <h3 id="ucl-score-title" className="mt-2 text-lg font-black sm:text-xl">{selectedPlayer.playerName}</h3>
              <p className="mt-1 text-xs text-cyan-300 sm:text-sm">{selectedPlayer.teamName}</p>

              <div className="mt-4 grid grid-cols-3 gap-2 border-y border-white/10 py-3 text-center">
                <div><p className="text-[8px] uppercase tracking-wider text-white/35">Points</p><p className="font-mono text-lg font-black text-cyan-300">{selectedPlayer.totalScore}</p></div>
                <div><p className="text-[8px] uppercase tracking-wider text-white/35">Avg rating</p><p className="font-mono text-lg font-black">{selectedPlayer.averageRating?.toFixed(2) || '—'}</p></div>
                <div><p className="text-[8px] uppercase tracking-wider text-white/35">MOTM</p><p className="font-mono text-lg font-black text-amber-300">{selectedPlayer.motmCount}</p></div>
              </div>

              <div className="mt-4 text-left">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45">Score breakdown</p>
                <div className="mt-2 space-y-2">
                  {[
                    { label: `Goals · ${selectedPlayer.goals} × ${selectedPlayer.naturalPosition === 'ATT' ? 2 : selectedPlayer.naturalPosition === 'MID' ? 3 : 5}`, value: selectedPlayer.scoreBreakdown?.goalPoints || 0 },
                    { label: `Clean sheets · ${selectedPlayer.cleanSheets} × 2`, value: selectedPlayer.scoreBreakdown?.cleanSheetPoints || 0 },
                    { label: `MOTM · ${selectedPlayer.motmCount} × 5`, value: selectedPlayer.scoreBreakdown?.motmPoints || 0 },
                    { label: 'Team wins · League +0.5 / Knockout +1', value: selectedPlayer.scoreBreakdown?.teamWinPoints || 0 },
                    { label: 'Final standing · Champion +3 / Runner-up +2', value: selectedPlayer.scoreBreakdown?.achievementPoints || 0 },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.035] px-3 py-2 text-xs">
                      <span className="text-white/60">{item.label}</span>
                      <span className="shrink-0 font-mono font-black text-cyan-200">+{item.value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between rounded-xl border border-cyan-300/20 bg-cyan-300/[0.07] px-3 py-2.5">
                  <span className="text-xs font-black uppercase tracking-wider text-white">Total performance score</span>
                  <span className="font-mono text-xl font-black text-cyan-200">{selectedPlayer.totalScore} pts</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
