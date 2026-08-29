import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      screens: {
        xs: '475px',
      },
      colors: {
        pitch: {
          950: '#06120f',
          900: '#0a1a15',
          800: '#10251d',
          700: '#163228',
          600: '#1f4a39',
          500: '#2b6b51',
        },
        gold: {
          300: '#f8d66d',
          400: '#f3c847',
          500: '#d9a91f',
        },
        host: {
          950: '#071018',
          900: '#0b1420',
          800: '#111d2c',
          usa: '#224f97',
          mexico: '#18735b',
          canada: '#a53448',
          ice: '#dbe7f5',
        },
        epl: {
          purple: '#3D195B',
          'deep-purple': '#360D3A',
          neon: '#00ff87',
          violet: '#963CFF',
          magenta: '#E90052',
        },
      },
      fontFamily: {
        display: ['"Outfit"', '"Inter"', '"Trebuchet MS"', '"Arial Narrow"', 'sans-serif'],
        sans: ['"Inter"', '"Outfit"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(255,255,255,0.08), 0 24px 70px rgba(3, 12, 8, 0.45)',
        brand: '0 0 0 1px rgba(255,255,255,0.07), 0 26px 80px rgba(5, 10, 20, 0.48)',
      },
      keyframes: {
        'winner-rise': {
          '0%': { transform: 'translateY(0px)', boxShadow: '0 0 0 rgba(52, 211, 153, 0)' },
          '50%': { transform: 'translateY(-4px)', boxShadow: '0 18px 30px rgba(24, 115, 91, 0.22)' },
          '100%': { transform: 'translateY(0px)', boxShadow: '0 10px 16px rgba(24, 115, 91, 0.12)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '100% 50%' },
        },
        'ball-float': {
          '0%, 100%': { transform: 'translateY(0px) rotate(-6deg)' },
          '50%': { transform: 'translateY(-10px) rotate(4deg)' },
        },
      },
      animation: {
        'winner-rise': 'winner-rise 700ms ease-out',
        shimmer: 'shimmer 3s linear infinite',
        'ball-float': 'ball-float 5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
