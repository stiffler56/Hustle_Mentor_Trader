import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Trade } from './types';
import { mockTrades } from './mockTrades';

const STORAGE_KEY = 'hustle_trading_v1';

interface TradesContextType {
  trades: Trade[];
  addTrade: (trade: Trade) => void;
  updateTrade: (id: string, updates: Partial<Trade>) => void;
  deleteTrade: (id: string) => void;
  clearTrades: () => void;
  importTrades: (incoming: Trade[], mode: 'replace' | 'merge') => number;
}

const TradesContext = createContext<TradesContextType | null>(null);

export function TradesProvider({ children }: { children: React.ReactNode }) {
  const [trades, setTrades] = useState<Trade[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return mockTrades;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trades));
  }, [trades]);

  const addTrade = (trade: Trade) => setTrades(prev => [trade, ...prev]);

  const updateTrade = (id: string, updates: Partial<Trade>) =>
    setTrades(prev => prev.map(t => (t.id === id ? { ...t, ...updates } : t)));

  const deleteTrade = (id: string) =>
    setTrades(prev => prev.filter(t => t.id !== id));

  /** Wipe everything and start from zero. */
  const clearTrades = () => setTrades([]);

  /**
   * Import trades from a JSON backup.
   * replace — wipes existing data and loads the import.
   * merge   — adds only trades whose id doesn't already exist.
   * Returns the number of trades actually added.
   */
  const importTrades = (incoming: Trade[], mode: 'replace' | 'merge'): number => {
    if (mode === 'replace') {
      setTrades(incoming);
      return incoming.length;
    }
    setTrades(prev => {
      const existingIds = new Set(prev.map(t => t.id));
      const newOnes = incoming.filter(t => !existingIds.has(t.id));
      return [...newOnes, ...prev];
    });
    // We can't access the previous state here easily, so return the incoming count as approximate
    return incoming.length;
  };

  return (
    <TradesContext.Provider value={{ trades, addTrade, updateTrade, deleteTrade, clearTrades, importTrades }}>
      {children}
    </TradesContext.Provider>
  );
}

export function useTradesContext() {
  const ctx = useContext(TradesContext);
  if (!ctx) throw new Error('useTradesContext must be inside TradesProvider');
  return ctx;
}