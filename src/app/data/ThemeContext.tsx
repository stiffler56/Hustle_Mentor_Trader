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
  text:      '#ffffff',       // pure white — clearly readable on dark
  textSub:   '#d1d5db',       // light gray — secondary labels
  textMuted: '#9ca3af',       // medium gray — muted hints
  textFaint: '#6b7280',       // faint — timestamps, placeholders
  rowBorder: '#111827',
  inputBg:   '#0a0e1a',
  accent:    '#f59e0b',
};

const DAY: ThemeColors = {
  appBg:     '#ffffff',       // pure white background
  surface:   '#ffffff',
  sidebar:   '#fafafa',
  border:    '#e5e7eb',
  text:      '#000000',       // near-black — maximum legibility
  textSub:   '#000000',       // dark gray — secondary text
  textMuted: '#374151',       // medium dark — labels
  textFaint: '#6b7280',       // softer — hints & timestamps
  rowBorder: '#f3f4f6',
  inputBg:   '#f9fafb',
  accent:    '#f59e0b',       // gold titles stay in both modes
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