/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Canvas & Surfaces
        canvas: '#EBEAE8',        // Warm off-white / light neutral canvas background
        surface: '#FFFFFF',       // Clean pure white card surface
        surfaceHover: '#F7F7F6',
        surfaceMuted: '#F2F1EF',  // Muted card sections & inactive calendar cells
        
        // Borders & Dividers
        border: {
          DEFAULT: '#E5E4E2',     // Ultra-subtle card & container borders
          subtle: '#EFEFEF',
          active: '#5D5FEF',      // Purple/Indigo active focus state
        },

        // Primary Accent (TradeZella / Cypher Purple)
        primary: {
          DEFAULT: '#5D5FEF',     // Signature royal purple / indigo
          hover: '#4F51D8',
          subtle: '#EEF0FF',      // Soft lilac pill background
          text: '#5D5FEF',
        },

        // Typography
        textPrimary: '#111827',   // Crisp near-black for numbers, titles, and data
        textSecondary: '#6B7280', // Slate/gray for micro-labels, headers, dates
        textMuted: '#9CA3AF',     // Low-contrast helper text

        // Trading Semantics (Wins vs Losses)
        trading: {
          // Losses
          loss: '#DC2626',            // Crimson / red for negative P&L & loss badges
          lossBg: '#FEE2E2',          // Pastel rose background for loss calendar cells & tags
          lossBorder: '#FCA5A5',
          // Wins
          win: '#059669',             // Emerald / forest green for positive P&L & win badges
          winBg: '#DCFCE7',           // Pastel mint background for winning calendar cells & tags
          winBorder: '#86EFAC',
          // Open / Long / Short
          long: '#0284C7',            // Soft sky blue badge for Long positions
          longBg: '#E0F2FE',
          short: '#D97706',           // Amber badge for Short positions
          shortBg: '#FEF3C7',
          neutral: '#5D5FEF',
        },

        // TradeZella Dark Tokens
        tz: {
          canvas: '#0B0C0E',
          card: '#131418',
          cardHover: '#181A20',
          cardMuted: '#0F1013',
          border: '#1E2026',
          divider: '#252830',
          textPrimary: '#FFFFFF',
          textSecondary: '#8E95A5',
          textMuted: '#525866',
          purple: '#6366F1',
          purpleHover: '#4F46E5',
          purpleSubtle: 'rgba(99, 102, 241, 0.15)',
          win: '#10B981',
          winBg: '#0E291E',
          winBorder: '#144634',
          loss: '#F87171',
          lossBg: '#2D1416',
          lossBorder: '#4C1D24',
          lossHeavy: '#B91C1C',
        },
      },
    },
  },
  plugins: [],
};
