import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import footballImg from '../img/icons8-football-96.png';

/* ─────────────────────────────────────────────
   Particle system for the ball explosion effect
   ───────────────────────────────────────────── */
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  decay: number;
  color: string;
}

const PARTICLE_COLORS = [
  '#f8d66d', '#f3c847', '#d9a91f',
  '#60a5fa', '#3b82f6',
  '#34d399', '#10b981',
  '#f87171', '#ef4444',
  '#ffffff', '#e2e8f0',
];

function randomBetween(a: number, b: number) {
  return a + Math.random() * (b - a);
}

/* ═══════════════════════════════════════════════
   LANDING PAGE — Football Prediction Tool
   ═══════════════════════════════════════════════ */
export default function LandingPage() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);
  const [exploding, setExploding] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  /* particle animation loop */
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particlesRef.current = particlesRef.current.filter((p) => p.alpha > 0.01);

    for (const p of particlesRef.current) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1;
      p.alpha -= p.decay;

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);

      // Draw glowing particles
      const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 2);
      gradient.addColorStop(0, p.color);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (particlesRef.current.length > 0) {
      animFrameRef.current = requestAnimationFrame(animate);
    }
  }, []);

  /* spawn particles from the centre of the ball */
  const spawnParticles = useCallback(
    (cx: number, cy: number) => {
      const newParticles: Particle[] = [];
      for (let i = 0; i < 120; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = randomBetween(2, 16);
        newParticles.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - randomBetween(2, 6),
          radius: randomBetween(1.5, 5),
          alpha: 1,
          decay: randomBetween(0.008, 0.022),
          color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
        });
      }
      particlesRef.current = newParticles;
      animFrameRef.current = requestAnimationFrame(animate);
    },
    [animate],
  );

  /* resize canvas to fill viewport */
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };
    resize();
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  /* handle ball click */
  const handleBallClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (exploding) return;
    setExploding(true);

    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    spawnParticles(cx, cy);

    setTimeout(() => setFadeOut(true), 400);
    setTimeout(() => navigate('/hub'), 1000);
  };

  return (
    <div
      className={`landing-root ${fadeOut ? 'landing-fade-out' : ''}`}
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        zIndex: 50,
      }}
    >
      {/* ── animated gradient background ── */}
      <div className="landing-bg" />

      {/* ── football pitch lines overlay ── */}
      <div className="landing-field" />

      {/* ── subtle grid overlay (stadium feel) ── */}
      <div className="landing-grid" />

      {/* ── floating ambient orbs ── */}
      <div className="landing-orb landing-orb--1" />
      <div className="landing-orb landing-orb--2" />
      <div className="landing-orb landing-orb--3" />
      <div className="landing-orb landing-orb--4" />

      {/* ── stadium floodlight beams ── */}
      <div className="landing-beam landing-beam--1" />
      <div className="landing-beam landing-beam--2" />
      <div className="landing-beam landing-beam--3" />

      {/* ── particle canvas ── */}
      <canvas
        ref={canvasRef}
        style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 60 }}
      />

      {/* ── content ── */}
      <div className="landing-content">
        {/* top badge */}
        <div className="landing-badge">
          <span className="landing-badge__dot" />
          MULTI-COMPETITION PLATFORM
        </div>

        {/* headline */}
        <div style={{ textAlign: 'center' }}>
          <h1 className="landing-headline">
            <span className="landing-headline--top">FOOTBALL</span>
            <span className="landing-headline--accent">PREDICTION TOOL</span>
          </h1>
        </div>

        {/* tagline */}
        <p className="landing-tagline">
          SIMULATE <span className="landing-tagline__sep">·</span> PREDICT <span className="landing-tagline__sep">·</span> CONQUER
        </p>

        {/* ball button */}
        <div className="landing-ball-wrapper">
          <div className="landing-ball-ring landing-ball-ring--outer" />
          <div className="landing-ball-ring landing-ball-ring--inner" />
          <button
            type="button"
            onClick={handleBallClick}
            className={`landing-ball-btn ${exploding ? 'landing-ball-btn--explode' : ''}`}
            aria-label="Start — go to Competition Hub"
          >
            <img
              src={footballImg}
              alt="Football"
              width={160}
              height={160}
              className="landing-ball-img"
              draggable={false}
            />
          </button>
        </div>

        <p className="landing-hint">KICK OFF</p>
      </div>
    </div>

  );
}
