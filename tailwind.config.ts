import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#0B0F17',
        surface: '#121824',
        'surface-light': '#1A2234',
        'surface-lighter': '#243048',
        border: '#2A364F',
        primary: {
          DEFAULT: '#F59E0B', // Warm Cinema Gold / Amber
          hover: '#D97706',
          light: '#FDE68A',
        },
        accent: {
          DEFAULT: '#E11D48', // Cinema Crimson / Ruby
          hover: '#BE123C',
          light: '#FDA4AF',
        },
        cinema: {
          gold: '#F59E0B',
          red: '#E11D48',
          cyan: '#06B6D4',
          purple: '#8B5CF6',
          emerald: '#10B981',
          dark: '#080C14',
        },
        seat: {
          available: '#334155',
          selected: '#F59E0B',
          held: '#854D0E',
          booked: '#1E293B',
          vip: '#8B5CF6',
          recliner: '#06B6D4',
          accessible: '#10B981',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-gold': '0 0 25px -5px rgba(245, 158, 11, 0.4)',
        'glow-red': '0 0 25px -5px rgba(225, 29, 72, 0.4)',
        'glow-cyan': '0 0 25px -5px rgba(6, 182, 212, 0.4)',
        'card-elevated': '0 10px 30px -10px rgba(0, 0, 0, 0.7)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ticket-tear': 'tear 0.5s ease-in-out forwards',
      }
    },
  },
  plugins: [],
};

export default config;
