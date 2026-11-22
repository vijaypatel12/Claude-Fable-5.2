import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        paper:      { DEFAULT: '#f5f0e8', light: '#faf6ee', dark: '#e8dcc8' },
        warmGold:   { DEFAULT: '#c4a35a', light: '#d4b97a', dark: '#a8893e' },
        stoneWhite: { DEFAULT: '#f0e6d3', dark: '#c8b89c' },
        stoneBlack: { DEFAULT: '#2d2d2d', light: '#4a4a4a' },
        claim:      { white: '#e8dcc8', black: '#6b6460' },
        grid:       '#d4c8b0',
      },
      animation: {
        'stone-place':    'stonePlace 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards',
        'shadow-spread':  'shadowSpread 0.35s ease-out forwards',
        'fade-in':        'fadeIn 0.2s ease-out forwards',
        'slide-up':       'slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards',
        'pulse-soft':     'pulseSoft 1.5s ease-in-out infinite',
      },
      keyframes: {
        stonePlace:   { '0%': { transform: 'scale(0)', opacity: '0' },   '100%': { transform: 'scale(1)', opacity: '1' } },
        shadowSpread: { '0%': { opacity: '0', transform: 'scale(0.6)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        fadeIn:       { '0%': { opacity: '0' },                          '100%': { opacity: '1' } },
        slideUp:      { '0%': { transform: 'translateY(16px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        pulseSoft:    { '0%,100%': { opacity: '0.5' },                   '50%': { opacity: '0.9' } },
      },
    },
  },
  plugins: [],
};

export default config;
