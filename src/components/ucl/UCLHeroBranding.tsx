import React from 'react';
import { Sparkles, Layers, Calendar, ShieldCheck, ArrowRight, Lock } from 'lucide-react';
import uclCupImg from '../../img/CUP COMPETITION/UCL/ucl_cup.png';
import uclBallImg from '../../img/CUP COMPETITION/UCL/ball/ucl_ball_26-27.png';
import uclBallSide1Img from '../../img/CUP COMPETITION/UCL/ball/ucl_ball_26-27_side.png';
import uclBallSide2Img from '../../img/CUP COMPETITION/UCL/ball/ucl_ball_26-27_side_2.png';
import patchUclImg from '../../img/CUP COMPETITION/UCL/patch_ucl.png';
import uclLogoImg from '../../img/CUP COMPETITION/UCL/tournaments_uefa-champions-league_128x128.football-logos.cc.png';
import badgeUclImg from '../../img/CUP COMPETITION/UCL/badge_ucl.png';

interface UCLHeroBrandingProps {
  completedLeagueMatches: number;
  totalLeagueMatches: number;
  completedKnockoutMatches: number;
  isRecapUnlocked: boolean;
  onNavigateSection?: (sectionId: 'league-phase' | 'standings-scorers' | 'knockout-stage' | 'ucl-recap') => void;
}

export const UCLHeroBranding: React.FC<UCLHeroBrandingProps> = ({
  completedLeagueMatches,
  totalLeagueMatches,
  completedKnockoutMatches,
  isRecapUnlocked,
  onNavigateSection,
}) => {
  return (
    <div className="w-full space-y-6">
      {/* ── Main Hero Shell ── */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-[#060d1a] via-[#030a18] to-[#071329] p-6 shadow-[0_28px_80px_rgba(0,6,20,0.4)] sm:p-8 lg:p-10">
        {/* Ambient Floating Ball Watermarks */}
        <img
          src={uclBallSide1Img}
          alt=""
          className="absolute -top-12 -left-12 w-64 h-64 object-contain opacity-5 pointer-events-none -rotate-12 blur-[1px]"
        />
        <img
          src={uclBallSide2Img}
          alt=""
          className="absolute -bottom-16 right-1/3 w-80 h-80 object-contain opacity-5 pointer-events-none rotate-45 blur-[1px]"
        />

        {/* Ambient Radial Lights */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 right-1/4 w-96 h-96 bg-blue-700/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
          {/* Left: Official Pure White Tournament Logo & Typography */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6 flex-1 min-w-0">
            {/* Pure White UCL Starball Emblem (Single clean logo, no overlapping badges!) */}
            <div className="relative shrink-0 flex items-center justify-center p-3 rounded-2xl bg-white/[0.04] border border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.15)]">
              <img
                src={uclLogoImg}
                alt="UEFA Champions League"
                className="w-24 h-24 sm:w-28 sm:h-28 object-contain brightness-0 invert drop-shadow-[0_0_20px_rgba(255,255,255,0.75)]"
              />
            </div>

            {/* Typography */}
            <div className="space-y-3 min-w-0">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-xs font-bold uppercase tracking-[0.25em]">
                <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                <span>Season 2026/27 · Swiss System & Knockout</span>
              </div>

              <h1 className="text-3xl sm:text-5xl xl:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-400 drop-shadow-[0_0_30px_rgba(0,240,255,0.3)]">
                UEFA CHAMPIONS LEAGUE
              </h1>

              {/* Slogan Banner */}
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500/20 via-cyan-500/15 to-amber-500/20 border border-amber-400/40 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                <img src={uclCupImg} alt="" className="h-5 w-5 shrink-0 object-contain" />
                <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-white to-cyan-200">
                  FINAL: MADRID 27 - ROAD TO Estadio Metropolitano
                </span>
              </div>
            </div>
          </div>

          {/* Right: Majestic UCL Trophy & Floating Ball */}
          <div className="flex items-center gap-6 sm:gap-10 shrink-0">
            {/* The Prestigious Big Trophy */}
            <div className="relative group flex flex-col items-center">
              <div className="absolute inset-0 bg-cyan-400/25 blur-3xl rounded-full scale-125 group-hover:bg-cyan-400/40 transition-all" />
              <img
                src={uclCupImg}
                alt="UEFA Champions League Trophy"
                className="relative h-36 sm:h-44 lg:h-52 object-contain drop-shadow-[0_0_35px_rgba(0,240,255,0.7)] group-hover:scale-105 transition-transform duration-300"
              />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-300 mt-2">
                Coupe des Clubs Champions
              </span>
            </div>

            {/* Floating Official Ball & Sleeve Patch */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative group">
                <div className="absolute inset-0 bg-pink-500/20 blur-xl rounded-full scale-110" />
                <img
                  src={uclBallImg}
                  alt="UCL Official Ball 26/27"
                  className="relative w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-[0_0_20px_rgba(255,0,90,0.5)] animate-ball-float"
                />
              </div>

              {/* Sleeve Patch Badge */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 shadow-sm">
                <img src={patchUclImg} alt="Patch" className="w-5 h-5 object-contain" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/70">Starball 26/27</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4 Key Competition Status Counters (Clickable Interactive Cards) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. League Phase Matches (Clicks to scroll to League Phase) */}
        <div
          onClick={() => onNavigateSection?.('league-phase')}
          className="group cursor-pointer rounded-3xl border border-sky-300/20 bg-[#060d1a]/70 p-5 shadow-[0_18px_45px_rgba(0,6,20,0.3)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:border-sky-300/45"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span>League Phase</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-400/15 text-cyan-300">
              8 Matchdays
            </span>
          </div>
          <div className="mt-3 text-3xl sm:text-4xl font-black text-white font-mono flex items-center justify-between">
            <span>
              {completedLeagueMatches} <span className="text-lg text-white/40">/ {totalLeagueMatches}</span>
            </span>
            <ArrowRight className="w-5 h-5 text-white/30 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
          </div>
          <p className="mt-1 text-xs text-white/50">Click to view 144 Fixtures</p>
        </div>

        {/* 2. 36 Elite Clubs (Clicks to scroll to Standings & Scorers) */}
        <div
          onClick={() => onNavigateSection?.('standings-scorers')}
          className="group cursor-pointer rounded-3xl border border-white/10 bg-[#060d1a]/70 p-5 shadow-[0_18px_45px_rgba(0,6,20,0.3)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:border-sky-300/35"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-white/70">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>36 Elite Clubs</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-white/60">
              4 Pots
            </span>
          </div>
          <div className="mt-3 text-3xl sm:text-4xl font-black text-white font-mono flex items-center justify-between">
            <span>Standings</span>
            <ArrowRight className="w-5 h-5 text-white/30 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
          </div>
          <p className="mt-1 text-xs text-white/50">Click to view Table & Top Scorers</p>
        </div>

        {/* 3. Knockout Stage (Clicks to scroll to Knockout Stage) */}
        <div
          onClick={() => onNavigateSection?.('knockout-stage')}
          className="group cursor-pointer rounded-3xl border border-white/10 bg-[#060d1a]/70 p-5 shadow-[0_18px_45px_rgba(0,6,20,0.3)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:border-sky-300/35"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-sky-300">
              <ShieldCheck className="w-4 h-4 text-sky-300" />
              <span>Knockout Stage</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-white/55">
              Two Legs
            </span>
          </div>
          <div className="mt-3 text-3xl sm:text-4xl font-black text-white font-mono flex items-center justify-between">
            <span>
              {completedKnockoutMatches} <span className="text-lg text-white/40">/ 29 Ties</span>
            </span>
            <ArrowRight className="w-5 h-5 text-white/30 group-hover:text-sky-300 group-hover:translate-x-1 transition-all" />
          </div>
          <p className="mt-1 text-xs text-white/50">Click to view Play-offs & Bracket</p>
        </div>

        {/* 4. Inline UCL Recap */}
        <div
          onClick={() => onNavigateSection?.('ucl-recap')}
          className={`group cursor-pointer rounded-3xl border bg-[#060d1a]/70 p-5 shadow-[0_18px_45px_rgba(0,6,20,0.3)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 ${isRecapUnlocked ? 'border-amber-300/30 hover:border-amber-300/60' : 'border-white/10 hover:border-white/20'}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-amber-400">
              <img src={badgeUclImg} alt="" className="h-5 w-5 object-contain" />
              <span>UCL Recap</span>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isRecapUnlocked ? 'bg-amber-400/20 text-amber-300' : 'bg-white/10 text-white/40'}`}>
              {isRecapUnlocked ? 'UNLOCKED' : 'LOCKED'}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <div>
              <div className="text-xl font-black text-white sm:text-2xl">Season report</div>
              <p className="mt-1 text-xs text-white/50">Podium · Awards · Best XI · Stats</p>
            </div>
            {isRecapUnlocked ? <ArrowRight className="h-5 w-5 text-amber-300 transition-transform group-hover:translate-x-1" /> : <Lock className="h-5 w-5 text-white/25" />}
          </div>
        </div>
      </div>
    </div>
  );
};
