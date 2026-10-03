import React, { createContext, useContext, useState, useEffect } from 'react';

export interface ThemeColors {
  appBg: string;
  surface: string;
  sidebar: string;
  border: string;
  text: string;
  textSub: string;
  textMuted: string;
  textFaint: string;
  rowBorder: string;
  inputBg: string;
  accent: string;
}

const TRADEZELLA_DARK: ThemeColors = {
  appBg:     '#0B0C0E',
  surface:   '#131418',
  sidebar:   '#0B0C0E',
  border:    '#1E2026',
  text:      '#FFFFFF',
  textSub:   '#8E95A5',
  textMuted: '#525866',
  textFaint: '#3E434D',
  rowBorder: '#1E2026',
  inputBg:   '#0F1013',
  accent:    '#6366F1',
};

const TRADEZELLA_LIGHT: ThemeColors = {
  appBg:     '#EBEAE8',
  surface:   '#FFFFFF',
  sidebar:   '#FFFFFF',
  border:    '#E5E4E2',
  text:      '#111827',
  textSub:   '#6B7280',
  textMuted: '#9CA3AF',
  textFaint: '#D1D5DB',
  rowBorder: '#E5E4E2',
  inputBg:   '#F9FAFB',
  accent:    '#5D5FEF',
};

interface ThemeContextType {
  isDayMode: boolean;
  toggleTheme: () => void;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDayMode, setIsDayMode] = useState<boolean>(() => {
    try { return localStorage.getItem('hustle_theme') !== 'night'; } catch { return true; }
  });

  useEffect(() => {
    localStorage.setItem('hustle_theme', isDayMode ? 'day' : 'night');
    document.documentElement.classList.toggle('dark', !isDayMode);
    document.documentElement.classList.toggle('day-mode', isDayMode);
  }, [isDayMode]);

  return (
    <ThemeContext.Provider value={{
      isDayMode,
      toggleTheme: () => setIsDayMode((p: boolean) => !p),
      colors: isDayMode ? TRADEZELLA_LIGHT : TRADEZELLA_DARK,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be inside ThemeProvider');
  return ctx;
}
