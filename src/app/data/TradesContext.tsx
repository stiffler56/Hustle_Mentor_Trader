import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import type { Trade } from './types';
import { useAuthContext, SERVER_BASE } from './AuthContext';

const STORAGE_KEY = 'hustle_trading_v1'; // only used for guest mode

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

// ── Types ────────────────────────────────────────────────────────────────────
interface TradesContextType {
  trades: Trade[];
  tradesLoading: boolean;
  addTrade:     (trade: Trade) => void;
  updateTrade:  (id: string, updates: Partial<Trade>) => void;
  deleteTrade:  (id: string) => void;
  clearTrades:  () => void;
  importTrades: (incoming: Trade[], mode: 'replace' | 'merge') => number;
  syncStatus: SyncStatus;
  lastSynced: Date | null;
  syncNow:    () => Promise<void>;
  syncError:  string;
}

const TradesContext = createContext<TradesContextType | null>(null);

// ── Provider ─────────────────────────────────────────────────────────────────
export function TradesProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isGuest, accessToken } = useAuthContext();

  // ── Initial state ─────────────────────────────────────────────────────────
  // Guests: load from localStorage | Authenticated: always start empty, cloud loads next
  const [trades, setTrades] = useState<Trade[]>(() => {
    if (isGuest) {
      try {
        const s = localStorage.getItem(STORAGE_KEY);
        if (s) return JSON.parse(s);
      } catch {}
    }
    return [];
  });

  const [tradesLoading, setTradesLoading] = useState(isAuthenticated);
  const [syncStatus,    setSyncStatus]    = useState<SyncStatus>('idle');
  const [lastSynced,    setLastSynced]    = useState<Date | null>(null);
  const [syncError,     setSyncError]     = useState('');

  const syncTimer      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSyncing      = useRef(false);
  const cloudLoaded    = useRef(false);

  // ── Guest: persist to localStorage ───────────────────────────────────────
  useEffect(() => {
    if (isGuest) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trades));
    }
  }, [trades, isGuest]);

  // ── Authenticated: load from cloud once token is available ────────────────
  useEffect(() => {
    if (isAuthenticated && accessToken && !cloudLoaded.current) {
      cloudLoaded.current = true;
      pullFromCloud(accessToken);
    }
  }, [isAuthenticated, accessToken]); // eslint-disable-line

  // ── Reset trades when user logs out ──────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated && !isGuest) {
      setTrades([]);
      cloudLoaded.current = false;
      setSyncStatus('idle');
      setLastSynced(null);
      setSyncError('');
    }
  }, [isAuthenticated, isGuest]);

  // ── Auto-sync 4 s after every trade change (authenticated only) ───────────
  useEffect(() => {
    if (!isAuthenticated || !accessToken || tradesLoading) return;
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => pushToCloud(trades, accessToken), 4000);
    return () => { if (syncTimer.current) clearTimeout(syncTimer.current); };
  }, [trades, isAuthenticated, accessToken, tradesLoading]); // eslint-disable-line

  // ── Cloud push ────────────────────────────────────────────────────────────
  const pushToCloud = useCallback(async (currentTrades: Trade[], token: string) => {
    if (!token || isSyncing.current) return;
    isSyncing.current = true;
    setSyncStatus('syncing');
    try {
      const res = await fetch(`${SERVER_BASE}/trades`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ trades: currentTrades }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `HTTP ${res.status}`);
      }
      setSyncStatus('synced');
      setLastSynced(new Date());
      setSyncError('');
    } catch (err: any) {
      setSyncError(err.message?.includes('fetch') ? 'No internet connection' : err.message || 'Sync failed');
      setSyncStatus('error');
    } finally {
      isSyncing.current = false;
    }
  }, []);

  // ── Cloud pull ────────────────────────────────────────────────────────────
  const pullFromCloud = useCallback(async (token: string) => {
    setTradesLoading(true);
    setSyncStatus('syncing');
    try {
      const res = await fetch(`${SERVER_BASE}/trades`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `HTTP ${res.status}`);
      }
      const { trades: cloudTrades } = await res.json();
      setTrades(Array.isArray(cloudTrades) ? cloudTrades : []);
      setSyncStatus('synced');
      setLastSynced(new Date());
      setSyncError('');
    } catch (err: any) {
      setSyncError(err.message?.includes('fetch') ? 'No internet connection' : err.message || 'Failed to load trades');
      setSyncStatus('error');
    } finally {
      setTradesLoading(false);
    }
  }, []);

  const syncNow = useCallback(async () => {
    if (!accessToken) return;
    if (syncTimer.current) clearTimeout(syncTimer.current);
    await pushToCloud(trades, accessToken);
  }, [accessToken, trades, pushToCloud]);

  // ── Trade CRUD ────────────────────────────────────────────────────────────
  const addTrade    = (trade: Trade) => setTrades(prev => [trade, ...prev]);
  const updateTrade = (id: string, updates: Partial<Trade>) =>
    setTrades(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  const deleteTrade = (id: string) =>
    setTrades(prev => prev.filter(t => t.id !== id));
  const clearTrades = () => setTrades([]);

  const importTrades = (incoming: Trade[], mode: 'replace' | 'merge'): number => {
    if (mode === 'replace') { setTrades(incoming); return incoming.length; }
    let added = 0;
    setTrades(prev => {
      const ids = new Set(prev.map(t => t.id));
      const fresh = incoming.filter(t => !ids.has(t.id));
      added = fresh.length;
      return [...fresh, ...prev];
    });
    return added;
  };

  return (
    <TradesContext.Provider value={{
      trades, tradesLoading,
      addTrade, updateTrade, deleteTrade, clearTrades, importTrades,
      syncStatus, lastSynced, syncNow, syncError,
    }}>
      {children}
    </TradesContext.Provider>
  );
}

export function useTradesContext() {
  const ctx = useContext(TradesContext);
  if (!ctx) throw new Error('useTradesContext must be inside TradesProvider');
  return ctx;
}
