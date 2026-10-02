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

const WHITE_BLUE: ThemeColors = {
  appBg:     '#FFFFFF',
  surface:   '#FFFFFF',
  sidebar:   '#FFFFFF',
  border:    '#DBEAFE',
  text:      '#1E3A8A',
  textSub:   '#2563EB',
  textMuted: '#3B82F6',
  textFaint: '#60A5FA',
  rowBorder: '#EFF6FF',
  inputBg:   '#F8FAFC',
  accent:    '#2563EB',
};

const NIGHT: ThemeColors = {
  ...WHITE_BLUE,
  surface:   '#F8FAFC',
  inputBg:   '#F1F5F9',
  border:    '#BFDBFE',
};

const DAY: ThemeColors = {
  ...WHITE_BLUE,
  surface:   '#FFFFFF',
  inputBg:   '#F8FAFC',
  border:    '#DBEAFE',
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
    document.documentElement.classList.toggle('day-mode', isDayMode);
  }, [isDayMode]);

  return (
    <ThemeContext.Provider value={{
      isDayMode,
      toggleTheme: () => setIsDayMode((p: boolean) => !p),
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
