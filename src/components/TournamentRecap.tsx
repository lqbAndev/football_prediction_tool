import { useState } from 'react';
import {
  Award,
  Flame,
  Medal,
  ShieldAlert,
  ShieldCheck,
  ShieldPlus,
  Swords,
  Target,
  ThumbsDown,
  TrendingUp,
  Trophy,
  Zap,
} from 'lucide-react';
import { ChampionCup, TriondaBall, WorldCupLogo } from './BrandAssets';
import { Flag } from './Flag';
import { PlayerProfileModal } from './PlayerProfileModal';
import type { ScorerInfo, TournamentRecapStats } from '../utils/recapStats';
import type { BestXIPlayer } from '../utils/bestXI';
import type { GroupMatch, KnockoutMatch, KnockoutRound } from '../types/tournament';

interface TournamentRecapProps {
  stats: TournamentRecapStats;
  groupMatches: GroupMatch[];
  knockoutMatches: Record<KnockoutRound, KnockoutMatch[]>;
}

const StatCard = ({
  label,
  value,
  sub,
  accent = 'usa',
  flagTeam,
  flagTeams,
  className = '',
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: 'usa' | 'mexico' | 'canada' | 'neutral';
  flagTeam?: string;
  flagTeams?: [string, string];
  className?: string;
}) => {
  const borderMap = {
    usa: 'border-host-usa/22',
    mexico: 'border-host-mexico/24',
    canada: 'border-host-canada/24',
    neutral: 'border-white/12',
  };
  const bgMap = {
    usa: 'bg-host-usa/12',
    mexico: 'bg-host-mexico/12',
    canada: 'bg-host-canada/12',
    neutral: 'bg-white/[0.06]',
  };
  const labelColorMap = {
    usa: 'text-sky-300/80',
    mexico: 'text-host-mexico/80',
    canada: 'text-host-canada/80',
    neutral: 'text-host-ice/65',
  };

  return (
    <div className={`rounded-[28px] border ${borderMap[accent]} ${bgMap[accent]} p-5 transition hover:scale-[1.02] ${className}`}>
      <div className={`text-xs font-bold uppercase tracking-[0.22em] ${labelColorMap[accent]}`}>
        {label}
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          {flagTeam ? <Flag teamName={flagTeam} size={26} /> : null}
          {flagTeams ? <Flag teamName={flagTeams[0]} size={26} /> : null}
          <div className="truncate text-3xl font-bold text-white">{value}</div>
          {flagTeams ? <Flag teamName={flagTeams[1]} size={26} /> : null}
        </div>
      </div>
      {sub ? <div className="mt-1 text-sm text-white/55">{sub}</div> : null}
    </div>
  );
};

const SeasonMOTSCard = ({
  playerName,
  teamName,
  motmCount,
}: {
  playerName: string;
  teamName: string;
  motmCount: number;
}) => (
  <div className="rounded-[28px] border border-host-mexico/24 bg-host-mexico/12 p-5 transition hover:scale-[1.02]">
    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-host-ice/55">
      <Award className="h-4 w-4" /> POTS (Player of the Season)
    </div>
    <div className="mt-3 flex items-center gap-2.5">
      <Flag teamName={teamName} size={28} />
      <span className="truncate text-2xl font-black text-white">{playerName}</span>
    </div>
    <div className="mt-2 text-sm text-white/70">{teamName}</div>
    {motmCount > 0 && (
      <div className="mt-0.5 text-xs text-white/45">{motmCount} MOTM award{motmCount !== 1 ? 's' : ''} throughout tournament</div>
    )}
  </div>
);

const BestXIPlayerCard = ({
  player,
  isBestPlayer,
  onClick,
}: {
  player: BestXIPlayer;
  isBestPlayer: boolean;
  onClick: () => void;
}) => (
  <article
    onClick={onClick}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
    className={`cursor-pointer rounded-2xl border px-3 py-2.5 text-center transition-all duration-200 hover:scale-[1.04] hover:shadow-[0_0_18px_rgba(255,255,255,0.08)] active:scale-[0.97] ${isBestPlayer
      ? 'border-amber-300/45 bg-amber-400/12 shadow-[0_0_22px_rgba(245,158,11,0.22)] hover:border-amber-300/70 hover:shadow-[0_0_28px_rgba(245,158,11,0.35)]'
      : 'border-white/12 bg-white/[0.04] hover:border-white/30 hover:bg-white/[0.08]'
      }`}
  >
    <div className="flex items-center justify-center gap-1.5">
      <Flag teamName={player.teamName} size={16} />
      <span className="text-[10px] uppercase tracking-[0.18em] text-host-ice/65">{player.lineupPosition}</span>
    </div>
    <p className={`mt-1 min-h-[2.25rem] text-[13px] font-semibold leading-tight ${isBestPlayer ? 'text-amber-100' : 'text-white'}`}>
      {player.playerName}
    </p>
    <div className="mt-1 inline-flex items-center gap-1 rounded-full border border-white/12 bg-black/20 px-2 py-0.5 text-[10px] text-white/75">
      {player.lineupPosition === 'GK' ? (
        <span>Clean Sheets {player.cleanSheets}</span>
      ) : (
        <span>G {player.goals}</span>
      )}
      <span>|</span>
      <span>M {player.motmCount}</span>
    </div>
    <div className="mt-1 text-[9px] text-host-ice/35">Tap to view profile</div>
  </article>
);

const BestXISection = ({
  stats,
  groupMatches,
  knockoutMatches,
}: {
  stats: TournamentRecapStats;
  groupMatches: GroupMatch[];
  knockoutMatches: Record<KnockoutRound, KnockoutMatch[]>;
}) => {
  const [selectedPlayer, setSelectedPlayer] = useState<BestXIPlayer | null>(null);

  if (!stats.isComplete || !stats.bestXI) {
    return null;
  }

  const { bestXI } = stats;
  const bestPlayer = bestXI.bestPlayer;

  const handlePlayerClick = (player: BestXIPlayer) => {
    setSelectedPlayer(player);
  };

  return (
    <section className="brand-shell mt-6 w-full overflow-hidden p-5 sm:p-6 lg:p-7">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.1),transparent_36%),radial-gradient(circle_at_bottom,rgba(59,130,246,0.09),transparent_42%)]" />
      <div className="relative">
        <div className="flex items-center gap-2">
          <ShieldPlus className="h-5 w-5 text-host-mexico" />
          <h3 className="text-xl font-bold text-white">Best XI of the Tournament (4-3-3)</h3>
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-300/28 bg-amber-400/10 px-3 py-2 text-sm text-amber-100">
          <Trophy className="h-4 w-4" />
          Best Player: {bestPlayer.playerName} ({bestPlayer.teamName})
        </div>

        <div className="mt-4 w-full rounded-[24px] border border-white/12 bg-[#071223] p-4 sm:p-5 lg:p-6">
          <div className="space-y-4 sm:space-y-5">
            <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-5 xl:gap-6">
              {bestXI.attackers.map((player) => (
                <BestXIPlayerCard
                  key={player.playerId}
                  player={player}
                  isBestPlayer={player.playerId === bestPlayer.playerId}
                  onClick={() => handlePlayerClick(player)}
                />
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-5 xl:gap-6">
              {bestXI.midfielders.map((player) => (
                <BestXIPlayerCard
                  key={player.playerId}
                  player={player}
                  isBestPlayer={player.playerId === bestPlayer.playerId}
                  onClick={() => handlePlayerClick(player)}
                />
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3 lg:gap-5 xl:gap-6">
              {bestXI.defenders.map((player) => (
                <BestXIPlayerCard
                  key={player.playerId}
                  player={player}
                  isBestPlayer={player.playerId === bestPlayer.playerId}
                  onClick={() => handlePlayerClick(player)}
                />
              ))}
            </div>

            <div className="mx-auto w-full max-w-[240px]">
              <BestXIPlayerCard
                key={bestXI.goalkeeper.playerId}
                player={bestXI.goalkeeper}
                isBestPlayer={bestXI.goalkeeper.playerId === bestPlayer.playerId}
                onClick={() => handlePlayerClick(bestXI.goalkeeper)}
              />
            </div>
          </div>
        </div>
      </div>

      <PlayerProfileModal
        isOpen={selectedPlayer !== null}
        onClose={() => setSelectedPlayer(null)}
        playerId={selectedPlayer?.playerId ?? ''}
        teamId={selectedPlayer?.teamId ?? ''}
        playerName={selectedPlayer?.playerName ?? ''}
        position={selectedPlayer?.lineupPosition}
        groupMatches={groupMatches}
        knockoutMatches={knockoutMatches}
      />
    </section>
  );
};

const FeaturedMatchCard = ({
  title,
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  roundLabel,
  penalty,
  homeScorers = [],
  awayScorers = [],
  featured = false,
  icon: Icon = Trophy,
}: {
  title: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  roundLabel: string;
  penalty: { home: number; away: number } | null;
  homeScorers?: ScorerInfo[];
  awayScorers?: ScorerInfo[];
  featured?: boolean;
  icon?: typeof Trophy;
}) => (
  <div
    className={`rounded-[28px] border p-5 transition hover:scale-[1.01] ${featured
      ? 'border-amber-400/30 bg-gradient-to-br from-amber-500/10 via-host-mexico/10 to-host-mexico/[0.03] shadow-[0_0_24px_rgba(245,158,11,0.08)] sm:p-6'
      : 'border-white/10 bg-white/[0.04]'
      }`}
  >
    <div className="flex items-center justify-between">
      <div
        className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] ${featured ? 'text-amber-400/90' : 'text-host-ice/50'
          }`}
      >
        <Icon className="h-3.5 w-3.5" />
        {title}
      </div>
      <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/50">
        {roundLabel}
      </div>
    </div>

    <div className="mt-4 flex items-center justify-between gap-3">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Flag teamName={homeTeam} size={featured ? 32 : 24} />
        <span className={`truncate font-semibold text-white ${featured ? 'text-base sm:text-lg' : 'text-sm'}`}>
          {homeTeam}
        </span>
      </div>

      <div className="flex flex-col items-center">
        <div className={`flex items-baseline gap-1.5 font-black text-white ${featured ? 'text-3xl sm:text-4xl' : 'text-2xl'}`}>
          <span>{homeScore}</span>
          <span className="text-white/30">:</span>
          <span>{awayScore}</span>
        </div>
        {penalty ? (
          <div className="mt-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-sm">
            PEN {penalty.home} - {penalty.away}
          </div>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
        <span className={`truncate text-right font-semibold text-white ${featured ? 'text-base sm:text-lg' : 'text-sm'}`}>
          {awayTeam}
        </span>
        <Flag teamName={awayTeam} size={featured ? 32 : 24} />
      </div>
    </div>

    {homeScorers.length > 0 || awayScorers.length > 0 ? (
      <div className="mt-3 grid grid-cols-2 gap-x-4 border-t border-white/[0.08] pt-3">
        <div className="space-y-0.5">
          {homeScorers.map((scorer, index) => (
            <div key={`${scorer.playerName}-${scorer.displayMinute}-${index}`} className="text-xs text-white/50">
              <span className="text-white/70">{scorer.playerName}</span>{' '}
              <span className="text-host-ice/40">{scorer.displayMinute}</span>
            </div>
          ))}
        </div>
        <div className="space-y-0.5 text-right">
          {awayScorers.map((scorer, index) => (
            <div key={`${scorer.playerName}-${scorer.displayMinute}-${index}`} className="text-xs text-white/50">
              <span className="text-host-ice/40">{scorer.displayMinute}</span>{' '}
              <span className="text-white/70">{scorer.playerName}</span>
            </div>
          ))}
        </div>
      </div>
    ) : null}
  </div>
);

const Podium = ({
  champion,
  runnerUp,
  thirdPlace,
}: {
  champion: string;
  runnerUp: string;
  thirdPlace: string;
}) => (
  <div className="flex items-end justify-center gap-2 py-4 sm:gap-5 lg:gap-8">
    <div className="flex w-[92px] flex-col items-center sm:w-[150px] lg:w-[180px]">
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] sm:h-[72px] sm:w-[72px]">
        <Flag teamName={runnerUp} size={36} />
      </div>
      <div className="mt-2 flex items-center gap-1 text-[10px] uppercase tracking-widest text-host-ice/50 sm:gap-1.5 sm:text-xs">
        <Medal className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Runner-up
      </div>
      <span className="mt-1 text-center text-sm font-bold text-white/80 sm:text-base">{runnerUp}</span>
      <div className="mt-3 flex h-[72px] w-full items-center justify-center rounded-t-2xl border border-b-0 border-white/10 bg-gradient-to-t from-white/[0.03] to-white/[0.08] sm:h-20">
        <span className="text-4xl font-black text-white/[0.08] sm:text-5xl">2</span>
      </div>
    </div>

    <div className="flex w-[110px] flex-col items-center sm:w-[170px] lg:w-[210px]">
      <div className="relative">
        <div className="absolute -inset-4 animate-pulse rounded-full bg-amber-400/15 blur-2xl sm:-inset-5" />
        <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-amber-400/25 to-host-mexico/20 blur-sm sm:-inset-2" />
        <div className="relative flex h-[76px] w-[76px] items-center justify-center rounded-full border-2 border-amber-400/40 bg-host-mexico/14 shadow-[0_0_20px_rgba(245,158,11,0.15)] sm:h-[100px] sm:w-[100px]">
          <Flag teamName={champion} size={48} />
        </div>
      </div>
      <div className="mt-2 sm:mt-3">
        <ChampionCup size={38} />
      </div>
      <div className="mt-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.2em] text-host-mexico/80 sm:gap-1.5 sm:text-xs sm:tracking-[0.25em]">
        <Trophy className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Champion
      </div>
      <span className="mt-1 text-center text-base font-black text-white sm:text-xl">{champion}</span>
      <div className="mt-3 flex h-[100px] w-full items-center justify-center rounded-t-2xl border border-b-0 border-host-mexico/20 bg-gradient-to-t from-host-mexico/[0.04] to-host-mexico/[0.12] sm:h-[120px]">
        <span className="text-5xl font-black text-host-mexico/[0.12] sm:text-6xl">1</span>
      </div>
    </div>

    <div className="flex w-[92px] flex-col items-center sm:w-[150px] lg:w-[180px]">
      <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full border border-white/15 bg-white/[0.06] sm:h-16 sm:w-16">
        <Flag teamName={thirdPlace} size={32} />
      </div>
      <div className="mt-2 flex items-center gap-1 text-[10px] uppercase tracking-widest text-host-ice/50 sm:gap-1.5 sm:text-xs">
        <Award className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Third Place
      </div>
      <span className="mt-1 text-center text-sm font-bold text-white/80 sm:text-base">{thirdPlace}</span>
      <div className="mt-3 flex h-[52px] w-full items-center justify-center rounded-t-2xl border border-b-0 border-white/10 bg-gradient-to-t from-white/[0.02] to-white/[0.06] sm:h-[60px]">
        <span className="text-3xl font-black text-white/[0.06] sm:text-4xl">3</span>
      </div>
    </div>
  </div>
);

export const TournamentRecap = ({ stats, groupMatches, knockoutMatches }: TournamentRecapProps) => {
  if (!stats.isComplete) {
    return (
      <div className="brand-shell p-6 sm:p-8">
        <div className="flex items-center gap-3 text-white/40">
          <WorldCupLogo size={36} />
          <div>
            <p className="field-label">Tournament Recap</p>
            <h3 className="mt-1 text-xl font-bold text-white/50">Complete the entire tournament to view recap</h3>
          </div>
        </div>
      </div>
    );
  }

  const dramaticMatch =
    stats.mostDramaticMatch &&
      !(
        stats.mostDramaticMatch.homeTeamName === stats.highestScoringMatch?.homeTeamName &&
        stats.mostDramaticMatch.awayTeamName === stats.highestScoringMatch?.awayTeamName
      )
      ? stats.mostDramaticMatch
      : null;

  const smallCardCount = [stats.thirdPlaceMatch, stats.highestScoringMatch, dramaticMatch].filter(Boolean).length;

  return (
    <div>
      <div className="brand-shell overflow-hidden p-6 sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(19,78,74,0.24),transparent_30%),radial-gradient(circle_at_left,rgba(30,64,175,0.20),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(165,52,72,0.18),transparent_30%)]" />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-4">
            <WorldCupLogo size={52} />
            <div>
              <p className="field-label">Tournament Recap</p>
              <h2 className="mt-1 text-3xl font-bold text-white sm:text-4xl">World Cup 2026 Recap</h2>
            </div>
            <TriondaBall size={56} className="ml-auto hidden animate-ball-float sm:block" />
          </div>

          <div className="mt-8">
            <Podium champion={stats.champion} runnerUp={stats.runnerUp} thirdPlace={stats.thirdPlace} />
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Goals" value={stats.totalGoals} sub={`${stats.goalsPerMatch} goals/match`} accent="usa" />
        <StatCard label="Total Matches" value={stats.totalMatches} sub="Matches Completed" accent="mexico" />
        <StatCard label="Penalty Shootout" value={stats.totalPenaltyMatches} sub="Penalty Shootout Matches" accent="canada" />
        <StatCard
          label="Top Scorer"
          value={stats.topScorer ? stats.topScorer.playerName : '--'}
          sub={stats.topScorer ? `${stats.topScorer.goals} goals · ${stats.topScorer.teamName}` : undefined}
          accent="neutral"
          flagTeam={stats.topScorer?.teamName}
        />
        {stats.seasonMOTM ? (
          <SeasonMOTSCard
            playerName={stats.seasonMOTM.playerName}
            teamName={stats.seasonMOTM.teamName}
            motmCount={stats.seasonMOTM.motmCount}
          />
        ) : (
          <div className="rounded-[28px] border border-host-mexico/18 bg-host-mexico/8 p-5">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-host-ice/55">
              <Award className="h-4 w-4" /> POTS (Player of the Season)
            </div>
            <div className="mt-3 text-2xl font-black text-white/45">--</div>
            <div className="mt-2 text-sm text-white/55">Complete tournament to determine.</div>
          </div>
        )}

        {/* Golden Glove — next to MOTS */}
        {stats.goldenGlove ? (
          <div className="rounded-[28px] border border-sky-400/24 bg-sky-500/10 p-5 transition hover:scale-[1.02]">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-sky-300/70">
              <ShieldCheck className="h-4 w-4" /> Golden Glove
            </div>
            <div className="mt-3 flex items-center gap-2.5">
              <Flag teamName={stats.goldenGlove.teamName} size={26} />
              <span className="truncate text-2xl font-black text-white">{stats.goldenGlove.playerName}</span>
            </div>
            <div className="mt-2 text-sm text-white/70">{stats.goldenGlove.teamName}</div>
            <div className="mt-0.5 text-xs text-white/45">{stats.goldenGlove.cleanSheets} clean sheets</div>
          </div>
        ) : null}

        <StatCard
          label="Most Goals Scored"
          value={stats.mostGoalsTeam?.teamName ?? '--'}
          sub={stats.mostGoalsTeam ? `${stats.mostGoalsTeam.goals} goals` : undefined}
          accent="usa"
          flagTeam={stats.mostGoalsTeam?.teamName}
        />
        <StatCard
          label="Most Goals Conceded"
          value={stats.mostConcededTeam?.teamName ?? '--'}
          sub={stats.mostConcededTeam ? `${stats.mostConcededTeam.goals} goals` : undefined}
          accent="canada"
          flagTeam={stats.mostConcededTeam?.teamName}
        />

        {/* Cinderella Story */}
        {stats.cinderella ? (
          <div className="rounded-[28px] border border-emerald-400/24 bg-emerald-500/10 p-5 transition hover:scale-[1.02]">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-emerald-300/70">
              <TrendingUp className="h-4 w-4" /> Cinderella Story
            </div>
            <div className="mt-3 flex items-center gap-2.5">
              <Flag teamName={stats.cinderella.teamName} size={26} />
              <span className="truncate text-2xl font-black text-white">{stats.cinderella.teamName}</span>
            </div>
            <div className="mt-2 text-sm text-white/70">Rank {stats.cinderella.rank}/48 teams — Exceeded all expectations</div>
            <div className="mt-0.5 text-xs text-white/45">{stats.cinderella.journey}</div>
          </div>
        ) : null}

        {/* Biggest Flop */}
        {stats.biggestFlop ? (
          <div className="rounded-[28px] border border-red-400/24 bg-red-500/10 p-5 transition hover:scale-[1.02]">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-red-300/70">
              <ThumbsDown className="h-4 w-4" /> Biggest Disappointment
            </div>
            <div className="mt-3 flex items-center gap-2.5">
              <Flag teamName={stats.biggestFlop.teamName} size={26} />
              <span className="truncate text-2xl font-black text-white">{stats.biggestFlop.teamName}</span>
            </div>
            <div className="mt-2 text-sm text-white/70">Rank {stats.biggestFlop.rank}/48 teams</div>
            <div className="mt-0.5 text-xs text-white/45">Top 12 strongest but eliminated in group stage</div>
          </div>
        ) : null}

        {stats.highestScoringMatch ? (
          <div className="sm:col-span-2">
            <StatCard
              label="Highest Scoring Match"
              value={`${stats.highestScoringMatch.homeTeamName} ${stats.highestScoringMatch.homeScore} - ${stats.highestScoringMatch.awayScore} ${stats.highestScoringMatch.awayTeamName}`}
              sub={`${stats.highestScoringMatch.totalGoals} goals · ${stats.highestScoringMatch.roundLabel}`}
              accent="mexico"
              flagTeams={[stats.highestScoringMatch.homeTeamName, stats.highestScoringMatch.awayTeamName]}
              className="h-full"
            />
          </div>
        ) : null}
      </div>

      <BestXISection stats={stats} groupMatches={groupMatches} knockoutMatches={knockoutMatches} />

      <div className="mt-6 space-y-4">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-host-mexico" />
          <h3 className="text-lg font-bold text-white">Featured Matches</h3>
        </div>

        {stats.finalMatch ? (
          <FeaturedMatchCard
            title="Final"
            homeTeam={stats.finalMatch.homeTeamName}
            awayTeam={stats.finalMatch.awayTeamName}
            homeScore={stats.finalMatch.homeScore}
            awayScore={stats.finalMatch.awayScore}
            roundLabel="Final"
            penalty={stats.finalMatch.penalty}
            homeScorers={stats.finalMatch.homeScorers}
            awayScorers={stats.finalMatch.awayScorers}
            featured
            icon={Trophy}
          />
        ) : null}

        {smallCardCount > 0 ? (
          <div className={`grid gap-4 ${smallCardCount >= 3 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2'}`}>
            {stats.thirdPlaceMatch ? (
              <FeaturedMatchCard
                title="Third Place Match"
                homeTeam={stats.thirdPlaceMatch.homeTeamName}
                awayTeam={stats.thirdPlaceMatch.awayTeamName}
                homeScore={stats.thirdPlaceMatch.homeScore}
                awayScore={stats.thirdPlaceMatch.awayScore}
                roundLabel="Third Place"
                penalty={stats.thirdPlaceMatch.penalty}
                homeScorers={stats.thirdPlaceMatch.homeScorers}
                awayScorers={stats.thirdPlaceMatch.awayScorers}
                icon={Medal}
              />
            ) : null}

            {stats.highestScoringMatch ? (
              <FeaturedMatchCard
                title="Highest Scoring Match"
                homeTeam={stats.highestScoringMatch.homeTeamName}
                awayTeam={stats.highestScoringMatch.awayTeamName}
                homeScore={stats.highestScoringMatch.homeScore}
                awayScore={stats.highestScoringMatch.awayScore}
                roundLabel={stats.highestScoringMatch.roundLabel}
                penalty={stats.highestScoringMatch.penalty}
                homeScorers={stats.highestScoringMatch.homeScorers}
                awayScorers={stats.highestScoringMatch.awayScorers}
                icon={TrendingUp}
              />
            ) : null}

            {dramaticMatch ? (
              <FeaturedMatchCard
                title="Most Dramatic Match"
                homeTeam={dramaticMatch.homeTeamName}
                awayTeam={dramaticMatch.awayTeamName}
                homeScore={dramaticMatch.homeScore}
                awayScore={dramaticMatch.awayScore}
                roundLabel={dramaticMatch.roundLabel}
                penalty={dramaticMatch.penalty}
                homeScorers={dramaticMatch.homeScorers}
                awayScorers={dramaticMatch.awayScorers}
                icon={Flame}
              />
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
};
