import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import type { Trade } from './types';
import type { Account } from './accountTypes';
import { useAuthContext, SERVER_BASE } from './AuthContext';
import { requestBrokerSync } from '../utils/brokerSync';

const STORAGE_KEY = 'hustle_trading_v1'; // only used for guest mode

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

export interface BrokerSyncResult {
  newTradesCount: number;
  updatedTradesCount: number;
  balance?: number;
  equity?: number;
  trades?: Trade[];
}

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
  syncBrokerAccount: (account: Account) => Promise<BrokerSyncResult>;
  isBrokerSyncing: boolean;
  brokerSyncError: string;
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
  const [isBrokerSyncing, setIsBrokerSyncing] = useState(false);
  const [brokerSyncError, setBrokerSyncError] = useState('');

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

  // ── MT4 / MT5 Broker Sync ────────────────────────────────────────────────
  const syncBrokerAccount = useCallback(async (account: Account): Promise<BrokerSyncResult> => {
    if (!account.connection) {
      throw new Error('Account has no broker connection configured.');
    }

    setIsBrokerSyncing(true);
    setBrokerSyncError('');

    try {
      const data = await requestBrokerSync({
        accountId: account.id,
        connection: account.connection,
        accessToken,
      });

      const incomingTrades: Trade[] = Array.isArray(data.trades) ? data.trades : [];

      let newTradesCount = 0;
      let updatedTradesCount = 0;

      setTrades(prev => {
        const cleanPrev = prev.filter(t => !t.notes?.includes('Auto-synced MT ticket'));
        const incomingMap = new Map(incomingTrades.map(t => [t.brokerTradeId || t.id, t]));
        const existingKeys = new Set(cleanPrev.map(t => t.brokerTradeId || t.id));

        const updatedExisting = cleanPrev.map(existing => {
          const key = existing.brokerTradeId || existing.id;
          const inc = incomingMap.get(key);
          if (inc) {
            if (
              existing.status !== inc.status ||
              existing.pnl !== inc.pnl ||
              existing.closedAt !== inc.closedAt ||
              existing.exitPrice !== inc.exitPrice
            ) {
              updatedTradesCount++;
              return { ...existing, ...inc };
            }
            return existing;
          }
          return existing;
        });

        const brandNew: Trade[] = [];
        for (const inc of incomingTrades) {
          const key = inc.brokerTradeId || inc.id;
          if (!existingKeys.has(key)) {
            brandNew.push(inc);
            newTradesCount++;
          }
        }

        return [...brandNew, ...updatedExisting];
      });

      return {
        newTradesCount,
        updatedTradesCount,
        balance: data.balance,
        equity: data.equity,
        trades: incomingTrades,
      };
    } catch (err: any) {
      const msg = err.message || 'Failed to sync broker account';
      setBrokerSyncError(msg);
      throw err;
    } finally {
      setIsBrokerSyncing(false);
    }
  }, [accessToken]);

  // ── Auto-sync polling loop for accounts with isAutoSyncEnabled ────────────
  useEffect(() => {
    const timer = setInterval(() => {
      try {
        const raw = localStorage.getItem('hustle_accounts_v2');
        if (!raw) return;
        const parsed: Account[] = JSON.parse(raw);
        if (!Array.isArray(parsed)) return;

        const autoAccounts = parsed.filter(
          a => a.isAutoSyncEnabled && a.connection && a.connection.syncStatus === 'connected'
        );

        for (const acc of autoAccounts) {
          const intervalMs = (acc.connection?.autoSyncIntervalSec || 30) * 1000;
          const lastSync = acc.connection?.lastSyncedAt ? new Date(acc.connection.lastSyncedAt).getTime() : 0;
          if (Date.now() - lastSync >= intervalMs) {
            syncBrokerAccount(acc).then(res => {
              if (res) {
                try {
                  const currentRaw = localStorage.getItem('hustle_accounts_v2');
                  const currentList: Account[] = currentRaw ? JSON.parse(currentRaw) : parsed;
                  const updated = currentList.map(item => {
                    if (item.id !== acc.id) return item;
                    return {
                      ...item,
                      currentBalance: res.balance ?? item.currentBalance,
                      currentEquity: res.equity ?? item.currentEquity,
                      connection: item.connection ? {
                        ...item.connection,
                        lastSyncedAt: new Date().toISOString(),
                        syncStatus: 'connected' as const,
                      } : undefined,
                    };
                  });
                  localStorage.setItem('hustle_accounts_v2', JSON.stringify(updated));
                  window.dispatchEvent(new CustomEvent('hustle_accounts_updated', { detail: { accountId: acc.id } }));
                } catch {}
              }
            }).catch(() => {});
          }
        }
      } catch {}
    }, 10000);

    return () => clearInterval(timer);
  }, [syncBrokerAccount]);

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
      syncBrokerAccount, isBrokerSyncing, brokerSyncError,
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
