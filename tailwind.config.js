/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#FFFFFF',
          subtle: '#F8FAFC',
        },
        card: {
          DEFAULT: '#FFFFFF',
          hover: '#F8FAFC',
          muted: '#F1F5F9',
        },
        border: {
          DEFAULT: '#DBEAFE',
          subtle: '#EFF6FF',
          active: '#2563EB',
        },
        accent: {
          DEFAULT: '#2563EB',
          blue: '#2563EB',
          'blue-hover': '#1D4ED8',
          'blue-light': '#3B82F6',
        },
        trading: {
          win: '#10B981',
          'win-bg': 'rgba(16, 185, 129, 0.1)',
          loss: '#EF4444',
          'loss-bg': 'rgba(239, 68, 68, 0.1)',
          neutral: '#2563EB',
        },
      },
    },
  },
  plugins: [],
};
