import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Trophy, BarChart3 } from 'lucide-react';

// Logos
import wc26Logo from '../img/tournaments_fifa-world-cup-2026--white_128x128.football-logos.cc.png';
import uclLogo from '../img/CUP COMPETITION/UCL/tournaments_uefa-champions-league--no-text-white_64x64.football-logos.cc.png';
import uelLogo from '../img/CUP COMPETITION/UEL/tournaments_uefa-europa-league_64x64.football-logos.cc.png';
import uclcLogo from '../img/CUP COMPETITION/Conference/tournaments_uefa-conference-league_64x64.football-logos.cc.png';

import eplLogo from '../img/LEAGUE COMPETITION/EPL/england_english-premier-league.football-logos.cc.svg';
import laligaLogo from '../img/LEAGUE COMPETITION/LALIGA/spain_la-liga_64x64.football-logos.cc.png';
import bundesligaLogo from '../img/LEAGUE COMPETITION/Bundesliga/germany_bundesliga_64x64.football-logos.cc.png';
import serieaLogo from '../img/LEAGUE COMPETITION/SerieA/italy_serie-a_64x64.football-logos.cc.png';
import ligue1Logo from '../img/LEAGUE COMPETITION/League1/france_ligue-1--white_64x64.football-logos.cc.png';

/* ─────────────────────────────────────────────
   Competition Card
   ───────────────────────────────────────────── */
interface CompetitionCardProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  gradient: string;
  borderColor: string;
  onClick?: () => void;
  locked?: boolean;
}

function CompetitionCard({
  title,
  subtitle,
  icon,
  gradient,
  borderColor,
  onClick,
  locked = false,
}: CompetitionCardProps) {
  return (
    <button
      type="button"
      onClick={locked ? undefined : onClick}
      disabled={locked}
      className="hub-card group"
      style={
        {
          '--card-gradient': gradient,
          '--card-border': borderColor,
        } as React.CSSProperties
      }
    >
      {/* glow ring */}
      <div className="hub-card__glow" />

      <div className="hub-card__inner">
        {/* icon */}
        <div className="hub-card__icon">{icon}</div>

        {/* text */}
        <div className="hub-card__text">
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>

        {/* status badge */}
        {locked ? (
          <span className="hub-card__badge hub-card__badge--locked">
            <Lock size={13} />
            Coming Soon
          </span>
        ) : (
          <span className="hub-card__badge hub-card__badge--active">
            Open
          </span>
        )}
      </div>
    </button>
  );
}

/* ══════════════════════════════════════════════
   COMPETITION HUB
   ══════════════════════════════════════════════ */
export default function CompetitionHub() {
  const navigate = useNavigate();

  return (
    <div className="hub-root">
      {/* ── ambient BG ── */}
      <div className="hub-bg" />

      {/* ── Header ── */}
      <header className="hub-header">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="hub-back-btn"
        >
          <ArrowLeft size={18} />
          <span>Home</span>
        </button>

        <h1 className="hub-title">
          <span className="hub-title__icon">⚽</span>
          Competition Hub
        </h1>

        <div className="hub-header__spacer" />
      </header>

      {/* ── Main content ── */}
      <main className="hub-main">
        {/* CUP COMPETITIONS */}
        <section className="hub-section">
          <div className="hub-section__header">
            <Trophy size={20} className="hub-section__icon hub-section__icon--gold" />
            <h2>CUP COMPETITIONS</h2>
          </div>

          <div className="hub-grid">
            <div
              className="hub-card group"
              style={
                {
                  '--card-gradient': 'linear-gradient(135deg, rgba(34,79,151,0.35), rgba(24,115,91,0.25), rgba(165,52,72,0.2))',
                  '--card-border': 'rgba(248,214,109,0.3)',
                  cursor: 'default',
                  opacity: 0.85
                } as React.CSSProperties
              }
            >
              <div className="hub-card__glow" />
              <div className="hub-card__ribbon">FINISHED</div>

              <div className="hub-card__inner">
                <div className="hub-card__icon">
                  <img src={wc26Logo} alt="WC26" style={{ width: 44, height: 44, objectFit: 'contain' }} />
                </div>

                <div className="hub-card__text">
                  <h3>FIFA World Cup 2026</h3>
                  <p>PREDICT THE FIFA WORLD CUP 2026</p>
                  <div className="hub-card__champion">
                    <img src="/flags/spain.svg" alt="Spain" />
                    <span>SPAIN</span>
                  </div>
                </div>

                <span className="hub-card__badge hub-card__badge--closed">
                  CLOSED
                </span>
              </div>
            </div>

            {/* Test Cup (dev-only) */}
            {import.meta.env.DEV && (
              <CompetitionCard
                title="Vibe Test Cup"
                subtitle="8 Teams • 2 Groups • Dev Mode"
                icon={
                  <div style={{ fontSize: 32, lineHeight: 1 }}>🧪</div>
                }
                gradient="linear-gradient(135deg, rgba(168,85,247,0.3), rgba(139,92,246,0.2))"
                borderColor="rgba(168,85,247,0.25)"
                onClick={() => navigate('/competition/test-cup')}
              />
            )}

            <CompetitionCard
              title="UEFA Champions League"
              subtitle="Europe's Premier Club Competition"
              icon={<img src={uclLogo} alt="UCL" style={{ width: 44, height: 44, objectFit: 'contain' }} />}
              gradient="linear-gradient(135deg, rgba(30,64,175,0.3), rgba(99,102,241,0.2))"
              borderColor="rgba(99,102,241,0.25)"
              onClick={() => navigate('/competition/ucl')}
            />

            <CompetitionCard
              title="UEFA Europa League"
              subtitle="European Secondary Club Competition"
              icon={<img src={uelLogo} alt="UEL" style={{ width: 64, height: 64, objectFit: 'contain', filter: 'invert(1) hue-rotate(180deg)' }} />}
              gradient="linear-gradient(135deg, rgba(239,104,22,0.25), rgba(146,64,14,0.15))"
              borderColor="rgba(239,104,22,0.2)"
              locked
            />

            <CompetitionCard
              title="UEFA Conference League"
              subtitle="European Tertiary Club Competition"
              icon={<img src={uclcLogo} alt="Conference" style={{ width: 64, height: 64, objectFit: 'contain', filter: 'invert(1) hue-rotate(180deg)' }} />}
              gradient="linear-gradient(135deg, rgba(16,185,129,0.25), rgba(6,95,70,0.15))"
              borderColor="rgba(16,185,129,0.2)"
              locked
            />
          </div>
        </section>

        {/* LEAGUE COMPETITIONS */}
        <section className="hub-section">
          <div className="hub-section__header">
            <BarChart3 size={20} className="hub-section__icon hub-section__icon--blue" />
            <h2>LEAGUE COMPETITIONS</h2>
          </div>

          <div className="hub-grid">
            <CompetitionCard
              title="Premier League"
              subtitle="English Premier League 26/27"
              icon={
                <div className="bg-white p-1 rounded-xl shadow-md flex items-center justify-center w-12 h-12 border border-[#00ff87]/30">
                  <img src={eplLogo} alt="EPL" style={{ width: 34, height: 34, objectFit: 'contain' }} />
                </div>
              }
              gradient="linear-gradient(135deg, rgba(61,25,91,0.4), rgba(54,13,58,0.3))"
              borderColor="rgba(0,255,135,0.25)"
              onClick={() => navigate('/competition/epl')}
            />

            <CompetitionCard
              title="La Liga"
              subtitle="Spanish First Division"
              icon={<img src={laligaLogo} alt="La Liga" style={{ width: 44, height: 44, objectFit: 'contain' }} />}
              gradient="linear-gradient(135deg, rgba(239,68,68,0.3), rgba(249,115,22,0.2))"
              borderColor="rgba(239,68,68,0.25)"
              locked
            />

            <CompetitionCard
              title="Bundesliga"
              subtitle="German First Division"
              icon={<img src={bundesligaLogo} alt="Bundesliga" style={{ width: 44, height: 44, objectFit: 'contain' }} />}
              gradient="linear-gradient(135deg, rgba(220,38,38,0.35), rgba(127,29,29,0.2))"
              borderColor="rgba(220,38,38,0.2)"
              locked
            />

            <CompetitionCard
              title="Serie A"
              subtitle="Italian First Division"
              icon={<img src={serieaLogo} alt="Serie A" style={{ width: 44, height: 44, objectFit: 'contain' }} />}
              gradient="linear-gradient(135deg, rgba(59,130,246,0.3), rgba(30,58,138,0.2))"
              borderColor="rgba(59,130,246,0.2)"
              locked
            />

            <CompetitionCard
              title="Ligue 1"
              subtitle="French First Division"
              icon={<img src={ligue1Logo} alt="Ligue 1" style={{ width: 44, height: 44, objectFit: 'contain' }} />}
              gradient="linear-gradient(135deg, rgba(14,116,144,0.3), rgba(21,94,117,0.2))"
              borderColor="rgba(14,116,144,0.2)"
              locked
            />

            {/* Test League (dev-only) */}
            {import.meta.env.DEV && (
              <CompetitionCard
                title="Vibe Test League"
                subtitle="8 Teams • Round-Robin • Dev Mode"
                icon={
                  <div style={{ fontSize: 32, lineHeight: 1 }}>🧪</div>
                }
                gradient="linear-gradient(135deg, rgba(168,85,247,0.3), rgba(59,130,246,0.2))"
                borderColor="rgba(168,85,247,0.25)"
                onClick={() => navigate('/competition/test-league')}
              />
            )}
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="hub-footer">
        <p>Football Prediction Tool v2 — Multi-tournament simulation platform</p>
      </footer>
    </div>
  );
}
