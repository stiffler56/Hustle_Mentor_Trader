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

const NIGHT: ThemeColors = {
  appBg:     '#060912',
  surface:   '#0d1117',
  sidebar:   '#0a0e1a',
  border:    '#1c2333',
  text:      '#e5e7eb',
  textSub:   '#9ca3af',
  textMuted: '#6b7280',
  textFaint: '#4b5563',
  rowBorder: '#111827',
  inputBg:   '#0a0e1a',
  accent:    '#f59e0b',
};

const DAY: ThemeColors = {
  appBg:     '#f0f4f8',
  surface:   '#ffffff',
  sidebar:   '#ffffff',
  border:    '#e2e8f0',
  text:      '#1e293b',
  textSub:   '#475569',
  textMuted: '#64748b',
  textFaint: '#94a3b8',
  rowBorder: '#f1f5f9',
  inputBg:   '#f8fafc',
  accent:    '#f59e0b',
};

interface ThemeContextType {
  isDayMode: boolean;
  toggleTheme: () => void;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDayMode, setIsDayMode] = useState<boolean>(() => {
    try { return localStorage.getItem('hustle_theme') === 'day'; } catch { return false; }
  });

  useEffect(() => {
    localStorage.setItem('hustle_theme', isDayMode ? 'day' : 'night');
    // also set a root class for any future CSS-variable hooks
    document.documentElement.classList.toggle('day-mode', isDayMode);
  }, [isDayMode]);

  return (
    <ThemeContext.Provider value={{
      isDayMode,
      toggleTheme: () => setIsDayMode(p => !p),
      colors: isDayMode ? DAY : NIGHT,
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