import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { Account, AccountStatus, PropPhase } from './accountTypes';
import { useTradesContext } from './TradesContext';
import type { Trade } from './types';

const STORAGE_KEY = 'hustle_accounts_v2';
const SELECTED_KEY = 'hustle_selected_account_v2';

const defaultAccounts: Account[] = [
  {
    id: 'acc-fp-50k-real',
    accountNumber: '#20823275',
    name: 'FundingPips Real $50k',
    accountMode: 'real',
    category: 'prop_evaluation',
    provider: 'FundingPips',
    platform: 'MetaTrader 5',
    serverType: 'FundingPips-Server',
    initialBalance: 50000,
    currentBalance: 50000,
    currentEquity: 50000,
    currency: 'USD',
    status: 'Ongoing',
    startDate: '2026-03-01',
    propDetails: {
      modelType: '2 Step Standard',
      phase: 'Phase 1',
      profitTargetPct: 8,
      dailyDrawdownLimitPct: 5,
      maxDrawdownLimitPct: 10,
      minTradingDays: 0,
      tradingDaysLogged: 0,
      consistencyRulePct: 33,
      profitSplitPct: 85,
      currentDailyLoss: 0,
      currentMaxDrawdown: 0,
    },
    todayPnl: 0,
    totalPnl: 0,
    consistencyScore: 2.08,
    consistencyMetrics: {
      riskReward: 2.0,
      stopLossUsagePct: 100,
      winRate: 0,
    },
    notes: 'Real live server account on Funding Pips with read-only investor MT5 sync.',
    isBreached: false,
  },
  {
    id: 'acc-demo-100k-practice',
    accountNumber: '#99482011',
    name: 'FTMO Demo $100k Practice',
    accountMode: 'demo',
    category: 'prop_evaluation',
    provider: 'FTMO',
    platform: 'MetaTrader 5',
    serverType: 'Demo Server',
    initialBalance: 100000,
    currentBalance: 100000,
    currentEquity: 100000,
    currency: 'USD',
    status: 'Ongoing',
    startDate: '2026-03-01',
    propDetails: {
      modelType: '2 Step Challenge',
      phase: 'Phase 1',
      profitTargetPct: 10,
      dailyDrawdownLimitPct: 5,
      maxDrawdownLimitPct: 10,
      minTradingDays: 4,
      tradingDaysLogged: 0,
      consistencyRulePct: 40,
      profitSplitPct: 80,
      currentDailyLoss: 0,
      currentMaxDrawdown: 0,
    },
    todayPnl: 0,
    totalPnl: 0,
    consistencyScore: 2.00,
    consistencyMetrics: {
      riskReward: 2.0,
      stopLossUsagePct: 100,
      winRate: 0,
    },
    notes: 'Simulated demo challenge with custom starting money for edge testing.',
    isBreached: false,
  },
];

interface AccountsContextType {
  accounts: Account[];
  selectedAccountId: string | null;
  selectedAccount: Account | null;
  setSelectedAccountId: (id: string) => void;
  addAccount: (accountData: Omit<Account, 'id' | 'startDate'> & { id?: string; startDate?: string }) => Account;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  resetAccount: (id: string) => void;
  advancePhase: (id: string) => void;
  markStatus: (id: string, status: AccountStatus, isBreached?: boolean) => void;
  syncAccountMetricsFromTrades: (accountId: string) => void;
  clearAllPreviousData: () => void;
  accountTrades: Trade[];
}

const AccountsContext = createContext<AccountsContextType | null>(null);

export function AccountsProvider({ children }: { children: React.ReactNode }) {
  const { trades, clearTrades } = useTradesContext();

  const [accounts, setAccounts] = useState<Account[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const filtered = parsed.map((a: any) => {
            const mode = a.accountMode || (a.connection?.syncStatus === 'connected' || a.name?.toLowerCase().includes('real') || a.category === 'broker_live' ? 'real' : 'demo');
            return {
              ...a,
              accountMode: mode,
            };
          }).filter((a: any) => {
            // Remove legacy dead accounts
            const isOldFtmo = a.id === 'acc-ftmo-100k-phase2';
            const isOldIcMarkets = a.id === 'acc-icmarkets-live';
            return !isOldFtmo && !isOldIcMarkets;
          });
          if (filtered.length > 0) return filtered;
        }
      }
    } catch {}
    return defaultAccounts;
  });

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem(SELECTED_KEY);
      if (saved && saved !== 'acc-ftmo-100k-phase2' && saved !== 'acc-icmarkets-live') {
        return saved;
      }
    } catch {}
    return defaultAccounts[0]?.id || 'acc-fp-50k-real';
  });

  // Save accounts to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
    } catch {}
  }, [accounts]);

  // Sync from outside updates (e.g. background broker sync)
  useEffect(() => {
    const handleUpdate = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const filtered = parsed.filter((a: any) => {
              const nameLower = (a.name || '').toLowerCase();
              const providerLower = (a.provider || '').toLowerCase();
              const isFtmo = a.id === 'acc-ftmo-100k-phase2' || providerLower.includes('ftmo') || nameLower.includes('ftmo');
              const isIcMarkets = a.id === 'acc-icmarkets-live' || providerLower.includes('ic market') || nameLower.includes('ic market');
              return !isFtmo && !isIcMarkets;
            });
            setAccounts(filtered.length > 0 ? filtered : defaultAccounts);
          }
        }
      } catch {}
    };
    window.addEventListener('hustle_accounts_updated', handleUpdate);
    return () => window.removeEventListener('hustle_accounts_updated', handleUpdate);
  }, []);

  // Save selected account ID
  useEffect(() => {
    if (selectedAccountId) {
      try {
        localStorage.setItem(SELECTED_KEY, selectedAccountId);
      } catch {}
    }
  }, [selectedAccountId]);

  // Active account
  const selectedAccount = useMemo(() => {
    if (!accounts.length) return null;
    return accounts.find(a => a.id === selectedAccountId) || accounts[0] || null;
  }, [accounts, selectedAccountId]);

  // Account trades
  const accountTrades = useMemo(() => {
    if (!selectedAccount) return [];
    return trades.filter(t => t.accountId === selectedAccount.id);
  }, [trades, selectedAccount]);

  // Recalculate metrics from trades
  const syncAccountMetricsFromTrades = useCallback((accountId: string) => {
    setAccounts(prev => prev.map(acc => {
      if (acc.id !== accountId) return acc;

      const accTrades = trades.filter(t => t.accountId === accountId && t.status === 'CLOSED');
      if (accTrades.length === 0) return acc;

      const totalPnl = accTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
      const currentBalance = acc.initialBalance + totalPnl;
      const currentEquity = currentBalance;

      const todayStr = new Date().toISOString().split('T')[0];
      const todayTrades = accTrades.filter(t => t.date === todayStr);
      const todayPnl = todayTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
      const currentDailyLoss = todayPnl < 0 ? Math.abs(todayPnl) : 0;

      // Max drawdown calculation
      let peak = acc.initialBalance;
      let runningBalance = acc.initialBalance;
      let maxDd = 0;

      const sorted = [...accTrades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      for (const t of sorted) {
        runningBalance += (t.pnl || 0);
        if (runningBalance > peak) peak = runningBalance;
        const dd = peak - runningBalance;
        if (dd > maxDd) maxDd = dd;
      }

      const wins = accTrades.filter(t => t.result === 'WIN').length;
      const winRate = accTrades.length > 0 ? Math.round((wins / accTrades.length) * 100) : 0;
      const avgRR = accTrades.length > 0 ? Number((accTrades.reduce((s, t) => s + t.rrRatio, 0) / accTrades.length).toFixed(2)) : 2.0;

      let isBreached = false;
      let status = acc.status;

      let updatedPropDetails = acc.propDetails;
      if (acc.propDetails) {
        const dailyLimitDollars = acc.initialBalance * (acc.propDetails.dailyDrawdownLimitPct / 100);
        const maxDdLimitDollars = acc.initialBalance * (acc.propDetails.maxDrawdownLimitPct / 100);
        isBreached = currentDailyLoss > dailyLimitDollars || maxDd >= maxDdLimitDollars;

        const currentProfitPct = (totalPnl / acc.initialBalance) * 100;
        if (isBreached) {
          status = 'Breached';
        } else if (acc.propDetails.phase !== 'Master' && acc.propDetails.profitTargetPct > 0 && currentProfitPct >= acc.propDetails.profitTargetPct) {
          status = 'Passed';
        } else if (status === 'Breached' && !isBreached) {
          status = 'Ongoing';
        }

        const distinctDays = new Set(accTrades.map(t => t.date)).size;

        updatedPropDetails = {
          ...acc.propDetails,
          currentDailyLoss: Number(currentDailyLoss.toFixed(2)),
          currentMaxDrawdown: Number(maxDd.toFixed(2)),
          tradingDaysLogged: distinctDays,
        };
      }

      return {
        ...acc,
        currentBalance,
        currentEquity,
        totalPnl,
        todayPnl,
        status,
        isBreached,
        propDetails: updatedPropDetails,
        consistencyMetrics: {
          riskReward: avgRR,
          stopLossUsagePct: 100,
          winRate,
        },
      };
    }));
  }, [trades]);

  useEffect(() => {
    if (!accounts.length || !trades.length) return;
    const accountIdsWithTrades = new Set(trades.map(t => t.accountId).filter(Boolean));
    for (const accId of accountIdsWithTrades) {
      syncAccountMetricsFromTrades(accId!);
    }
  }, [trades, syncAccountMetricsFromTrades]);

  const addAccount = (accountData: Omit<Account, 'id' | 'startDate'> & { id?: string; startDate?: string }): Account => {
    const id = accountData.id || `acc-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const accountMode = accountData.accountMode || (accountData.category === 'broker_live' || accountData.connection?.syncStatus === 'connected' ? 'real' : 'demo');
    const newAcc: Account = {
      ...accountData,
      id,
      accountMode,
      startDate: accountData.startDate || new Date().toISOString().split('T')[0],
      currentEquity: accountData.currentEquity ?? accountData.currentBalance,
      todayPnl: accountData.todayPnl ?? 0,
      totalPnl: accountData.totalPnl ?? (accountData.currentBalance - accountData.initialBalance),
      consistencyScore: accountData.consistencyScore ?? 2.08,
      consistencyMetrics: accountData.consistencyMetrics ?? {
        riskReward: 2.2,
        stopLossUsagePct: 100,
        winRate: 65,
      },
    };

    setAccounts(prev => [newAcc, ...prev]);
    setSelectedAccountId(newAcc.id);
    return newAcc;
  };

  const clearAllPreviousData = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(SELECTED_KEY);
      localStorage.removeItem('hustle_trading_v1');
    } catch {}
    clearTrades();
    setAccounts(defaultAccounts);
    setSelectedAccountId(defaultAccounts[0].id);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hustle_accounts_updated', { detail: { accountId: defaultAccounts[0].id } }));
    }
  }, [clearTrades]);

  const updateAccount = (id: string, updates: Partial<Account>) => {
    setAccounts(prev => prev.map(acc => {
      if (acc.id !== id) return acc;
      const updated = { ...acc, ...updates };
      if (updates.currentBalance !== undefined) {
        updated.currentEquity = updates.currentBalance;
        updated.totalPnl = updated.currentBalance - updated.initialBalance;
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
        currentEquity: acc.initialBalance,
        totalPnl: 0,
        todayPnl: 0,
        isBreached: false,
        status: acc.category.startsWith('prop') ? 'Ongoing' : 'Active',
        propDetails: acc.propDetails ? {
          ...acc.propDetails,
          currentDailyLoss: 0,
          currentMaxDrawdown: 0,
          tradingDaysLogged: 0,
        } : undefined,
      };
    }));
  };

  const advancePhase = (id: string) => {
    setAccounts(prev => prev.map(acc => {
      if (acc.id !== id || !acc.propDetails) return acc;

      let nextPhase: PropPhase = 'Phase 2';
      let nextTarget = 5;
      let nextModelType = acc.propDetails.modelType;
      let nextCategory = acc.category;

      if (acc.propDetails.phase === 'Phase 1') {
        nextPhase = 'Phase 2';
        nextTarget = 5;
      } else if (acc.propDetails.phase === 'Phase 2') {
        nextPhase = 'Master';
        nextTarget = 0;
        nextModelType = 'Master Funded';
        nextCategory = 'prop_funded';
      }

      return {
        ...acc,
        category: nextCategory,
        status: 'Ongoing',
        currentBalance: acc.initialBalance,
        currentEquity: acc.initialBalance,
        totalPnl: 0,
        todayPnl: 0,
        isBreached: false,
        propDetails: {
          ...acc.propDetails,
          phase: nextPhase,
          modelType: nextModelType,
          profitTargetPct: nextTarget,
          currentDailyLoss: 0,
          currentMaxDrawdown: 0,
          tradingDaysLogged: 0,
        },
      };
    }));
  };

  const markStatus = (id: string, status: AccountStatus, isBreached?: boolean) => {
    setAccounts(prev => prev.map(acc => {
      if (acc.id !== id) return acc;
      return {
        ...acc,
        status,
        isBreached: isBreached !== undefined ? isBreached : status === 'Breached' || status === 'Not Passed',
      };
    }));
  };

  return (
    <AccountsContext.Provider
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
        clearAllPreviousData,
        accountTrades,
      }}
    >
      {children}
    </AccountsContext.Provider>
  );
}

export function useAccountsContext() {
  const ctx = useContext(AccountsContext);
  if (!ctx) {
    throw new Error('useAccountsContext must be inside AccountsProvider');
  }
  return ctx;
}

// Backward compatibility alias
export const PropAccountsProvider = AccountsProvider;
export const usePropAccountsContext = useAccountsContext;
