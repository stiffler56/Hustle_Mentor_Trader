import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { PropAccount, AccountPhase, AccountStatus } from './accountTypes';
import { PROP_FIRM_PRESETS } from './accountTypes';
import { useTradesContext } from './TradesContext';
import type { Trade } from './types';

const STORAGE_KEY = 'hustle_prop_accounts_v1';
const SELECTED_KEY = 'hustle_selected_prop_account_v1';

const defaultAccounts: PropAccount[] = [
  {
    id: 'acc-fp-50k-phase1',
    accountNumber: '#20823275',
    firmName: 'FundingPips',
    accountSize: 50000,
    initialBalance: 50000,
    currentBalance: 52340.50,
    modelType: '2 Step Standard',
    phase: 'Phase 1',
    status: 'Ongoing',
    profitTargetPct: 8,
    currentProfitPct: 4.68,
    pnl: 2340.50,
    dailyDrawdownLimitPct: 5,
    maxDrawdownLimitPct: 10,
    currentDailyLoss: 350.00,
    currentMaxDrawdown: 850.00,
    createdAt: '2026-03-01',
    isBreached: false,
    platform: 'cTrader',
    minTradingDays: 0,
    consistencyRulePct: 33,
    profitSplitPct: 85,
    notes: 'Primary evaluation challenge on FundingPips.',
  },
  {
    id: 'acc-ftmo-100k-phase2',
    accountNumber: '#78219432',
    firmName: 'FTMO',
    accountSize: 100000,
    initialBalance: 100000,
    currentBalance: 105420.00,
    modelType: '2 Step Challenge',
    phase: 'Phase 2',
    status: 'Passed',
    profitTargetPct: 5,
    currentProfitPct: 5.42,
    pnl: 5420.00,
    dailyDrawdownLimitPct: 5,
    maxDrawdownLimitPct: 10,
    currentDailyLoss: 0,
    currentMaxDrawdown: 1200.00,
    createdAt: '2026-02-15',
    isBreached: false,
    platform: 'MetaTrader 5',
    minTradingDays: 4,
    consistencyRulePct: 40,
    profitSplitPct: 80,
    notes: 'Passed Phase 2! Awaiting verification to receive Master funded credentials.',
  },
  {
    id: 'acc-fp-25k-master',
    accountNumber: '#50192841',
    firmName: 'FundingPips',
    accountSize: 25000,
    initialBalance: 25000,
    currentBalance: 26890.25,
    modelType: 'Master Funded',
    phase: 'Master',
    status: 'Ongoing',
    profitTargetPct: 0,
    currentProfitPct: 7.56,
    pnl: 1890.25,
    dailyDrawdownLimitPct: 5,
    maxDrawdownLimitPct: 10,
    currentDailyLoss: 120.00,
    currentMaxDrawdown: 450.00,
    createdAt: '2026-01-10',
    isBreached: false,
    platform: 'cTrader',
    minTradingDays: 0,
    consistencyRulePct: 33,
    profitSplitPct: 85,
    notes: 'Funded master account. Next payout eligible on Friday.',
  },
];

interface PropAccountsContextType {
  accounts: PropAccount[];
  selectedAccountId: string | null;
  selectedAccount: PropAccount | null;
  setSelectedAccountId: (id: string) => void;
  addAccount: (accountData: Omit<PropAccount, 'id' | 'createdAt'> & { id?: string }) => PropAccount;
  updateAccount: (id: string, updates: Partial<PropAccount>) => void;
  deleteAccount: (id: string) => void;
  resetAccount: (id: string) => void;
  advancePhase: (id: string) => void;
  markStatus: (id: string, status: AccountStatus, isBreached?: boolean) => void;
  syncAccountMetricsFromTrades: (accountId: string) => void;
  accountTrades: Trade[];
}

const PropAccountsContext = createContext<PropAccountsContextType | null>(null);

export function PropAccountsProvider({ children }: { children: React.ReactNode }) {
  const { trades } = useTradesContext();

  const [accounts, setAccounts] = useState<PropAccount[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return defaultAccounts;
  });

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem(SELECTED_KEY);
      if (saved) return saved;
    } catch {}
    return accounts[0]?.id || null;
  });

  // Save accounts to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
    } catch {}
  }, [accounts]);

  // Save selected account ID to localStorage
  useEffect(() => {
    if (selectedAccountId) {
      try {
        localStorage.setItem(SELECTED_KEY, selectedAccountId);
      } catch {}
    }
  }, [selectedAccountId]);

  // Get active account object
  const selectedAccount = useMemo(() => {
    if (!accounts.length) return null;
    return accounts.find(a => a.id === selectedAccountId) || accounts[0] || null;
  }, [accounts, selectedAccountId]);

  // Filter trades for selected account
  const accountTrades = useMemo(() => {
    if (!selectedAccount) return [];
    return trades.filter(t => t.accountId === selectedAccount.id);
  }, [trades, selectedAccount]);

  // Recalculate account metrics from trades whenever trades change
  const syncAccountMetricsFromTrades = useCallback((accountId: string) => {
    setAccounts(prev => prev.map(acc => {
      if (acc.id !== accountId) return acc;

      const accTrades = trades.filter(t => t.accountId === accountId && t.status === 'CLOSED');
      if (accTrades.length === 0) return acc;

      const totalPnl = accTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
      const currentBalance = acc.initialBalance + totalPnl;
      const currentProfitPct = (totalPnl / acc.initialBalance) * 100;

      // Group trades by day for daily drawdown
      const todayStr = new Date().toISOString().split('T')[0];
      const todayTrades = accTrades.filter(t => t.date === todayStr);
      const todayPnl = todayTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
      const currentDailyLoss = todayPnl < 0 ? Math.abs(todayPnl) : 0;

      // Calculate max drawdown from peak
      let peak = acc.initialBalance;
      let runningBalance = acc.initialBalance;
      let maxDd = 0;

      // Sort trades chronologically
      const sorted = [...accTrades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      for (const t of sorted) {
        runningBalance += (t.pnl || 0);
        if (runningBalance > peak) peak = runningBalance;
        const dd = peak - runningBalance;
        if (dd > maxDd) maxDd = dd;
      }

      const dailyLimitDollars = acc.initialBalance * (acc.dailyDrawdownLimitPct / 100);
      const maxDdLimitDollars = acc.initialBalance * (acc.maxDrawdownLimitPct / 100);

      const isBreached = currentDailyLoss > dailyLimitDollars || maxDd >= maxDdLimitDollars;
      let status: AccountStatus = acc.status;

      if (isBreached) {
        status = 'Not Passed';
      } else if (acc.phase !== 'Master' && acc.profitTargetPct > 0 && currentProfitPct >= acc.profitTargetPct) {
        status = 'Passed';
      } else if (status === 'Not Passed' && !isBreached) {
        status = 'Ongoing';
      }

      return {
        ...acc,
        currentBalance,
        pnl: totalPnl,
        currentProfitPct: Number(currentProfitPct.toFixed(2)),
        currentDailyLoss: Number(currentDailyLoss.toFixed(2)),
        currentMaxDrawdown: Number(maxDd.toFixed(2)),
        isBreached,
        status,
        lastUpdated: new Date().toISOString(),
      };
    }));
  }, [trades]);

  const addAccount = (accountData: Omit<PropAccount, 'id' | 'createdAt'> & { id?: string }): PropAccount => {
    const id = accountData.id || `acc-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const newAcc: PropAccount = {
      ...accountData,
      id,
      createdAt: new Date().toISOString().split('T')[0],
      pnl: accountData.pnl ?? (accountData.currentBalance - accountData.initialBalance),
      currentProfitPct: accountData.currentProfitPct ?? Number((((accountData.currentBalance - accountData.initialBalance) / accountData.initialBalance) * 100).toFixed(2)),
      currentDailyLoss: accountData.currentDailyLoss ?? 0,
      currentMaxDrawdown: accountData.currentMaxDrawdown ?? 0,
      isBreached: accountData.isBreached ?? false,
    };

    setAccounts(prev => [newAcc, ...prev]);
    setSelectedAccountId(newAcc.id);
    return newAcc;
  };

  const updateAccount = (id: string, updates: Partial<PropAccount>) => {
    setAccounts(prev => prev.map(acc => {
      if (acc.id !== id) return acc;
      const updated = { ...acc, ...updates };

      // Recalculate profit pct and pnl if balances changed
      if (updates.currentBalance !== undefined || updates.initialBalance !== undefined) {
        updated.pnl = updated.currentBalance - updated.initialBalance;
        updated.currentProfitPct = Number(((updated.pnl / updated.initialBalance) * 100).toFixed(2));
      }

      return updated;
    }));
  };

  const deleteAccount = (id: string) => {
    setAccounts(prev => {
      const remaining = prev.filter(a => a.id !== id);
      if (selectedAccountId === id) {
        setSelectedAccountId(remaining[0]?.id || null);
      }
      return remaining;
    });
  };

  const resetAccount = (id: string) => {
    setAccounts(prev => prev.map(acc => {
      if (acc.id !== id) return acc;
      return {
        ...acc,
        currentBalance: acc.initialBalance,
        pnl: 0,
        currentProfitPct: 0,
        currentDailyLoss: 0,
        currentMaxDrawdown: 0,
        isBreached: false,
        status: 'Ongoing',
        lastUpdated: new Date().toISOString(),
      };
    }));
  };

  const advancePhase = (id: string) => {
    setAccounts(prev => prev.map(acc => {
      if (acc.id !== id) return acc;

      let nextPhase: AccountPhase = 'Phase 2';
      let nextTarget = 5;
      let nextModelType = acc.modelType;

      if (acc.phase === 'Phase 1') {
        nextPhase = 'Phase 2';
        nextTarget = 5;
      } else if (acc.phase === 'Phase 2') {
        nextPhase = 'Master';
        nextTarget = 0;
        nextModelType = 'Master Funded';
      }

      return {
        ...acc,
        phase: nextPhase,
        modelType: nextModelType,
        profitTargetPct: nextTarget,
        status: 'Ongoing',
        currentBalance: acc.initialBalance, // Phase reset starts fresh with starting size
        pnl: 0,
        currentProfitPct: 0,
        currentDailyLoss: 0,
        currentMaxDrawdown: 0,
        isBreached: false,
        lastUpdated: new Date().toISOString(),
      };
    }));
  };

  const markStatus = (id: string, status: AccountStatus, isBreached?: boolean) => {
    setAccounts(prev => prev.map(acc => {
      if (acc.id !== id) return acc;
      return {
        ...acc,
        status,
        isBreached: isBreached !== undefined ? isBreached : status === 'Not Passed',
      };
    }));
  };

  return (
    <PropAccountsContext.Provider
      value={{
        accounts,
        selectedAccountId,
        selectedAccount,
        setSelectedAccountId,
        addAccount,
        updateAccount,
        deleteAccount,
        resetAccount,
        advancePhase,
        markStatus,
        syncAccountMetricsFromTrades,
        accountTrades,
      }}
    >
      {children}
    </PropAccountsContext.Provider>
  );
}

export function usePropAccountsContext() {
  const ctx = useContext(PropAccountsContext);
  if (!ctx) {
    throw new Error('usePropAccountsContext must be inside PropAccountsProvider');
  }
  return ctx;
}
