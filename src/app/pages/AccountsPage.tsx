import React, { useState, useMemo } from 'react';
import {
  Building2,
  Plus,
  Award,
  ShieldCheck,
  Globe,
  Edit3,
  Server,
  Search,
  Filter,
  CheckCircle2,
  ChevronRight,
  Menu,
  X,
  TrendingUp,
  TrendingDown,
  Layers,
  Zap,
  RefreshCw,
  Sliders,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import { useAccountsContext } from '../data/PropAccountsContext';
import { useTradesContext } from '../data/TradesContext';
import { useTheme } from '../data/ThemeContext';
import type { Account, AccountCategory } from '../data/accountTypes';
import { AccountMetricCard } from '../components/prop-firm/AccountMetricCard';
import { AccountDrawdownChart } from '../components/prop-firm/AccountDrawdownChart';
import { DailyDrawdownTracker } from '../components/prop-firm/DailyDrawdownTracker';
import { AccountTradesTable } from '../components/prop-firm/AccountTradesTable';
import { NewAccountModal } from '../components/prop-firm/NewAccountModal';
import { EditAccountModal } from '../components/prop-firm/EditAccountModal';
import { QuickTradeModal } from '../components/prop-firm/QuickTradeModal';
import { BrokerSyncModal } from '../components/prop-firm/BrokerSyncModal';

type FilterTab = 'ALL' | 'REAL' | 'DEMO';

export default function AccountsPage() {
  const {
    accounts,
    selectedAccount,
    selectedAccountId,
    setSelectedAccountId,
    addAccount,
    updateAccount,
    deleteAccount,
    resetAccount,
    advancePhase,
    clearAllPreviousData,
    accountTrades,
  } = useAccountsContext();

  const { syncBrokerAccount, isBrokerSyncing } = useTradesContext();
  const { isDayMode } = useTheme();

  const [isNewAccountOpen, setIsNewAccountOpen] = useState(false);
  const [isEditAccountOpen, setIsEditAccountOpen] = useState(false);
  const [isQuickTradeOpen, setIsQuickTradeOpen] = useState(false);
  const [isBrokerSyncOpen, setIsBrokerSyncOpen] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<FilterTab>('ALL');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleManualSync = async () => {
    if (!selectedAccount?.connection) {
      setIsBrokerSyncOpen(true);
      return;
    }
    try {
      const res = await syncBrokerAccount(selectedAccount);
      const msg = `Synced ${res.newTradesCount} new, ${res.updatedTradesCount} updated trades.`;
      setSyncFeedback(msg);
      updateAccount(selectedAccount.id, {
        currentBalance: res.balance ?? selectedAccount.currentBalance,
        currentEquity: res.equity ?? selectedAccount.currentEquity,
        connection: {
          ...selectedAccount.connection,
          lastSyncedAt: new Date().toISOString(),
          syncStatus: 'connected',
        },
      });
      setTimeout(() => setSyncFeedback(null), 4000);
    } catch (err: any) {
      setSyncFeedback(err.message || 'Sync failed');
      setTimeout(() => setSyncFeedback(null), 4000);
    }
  };

  const handleToggleAutoSync = () => {
    if (!selectedAccount?.connection) return;
    const next = !selectedAccount.isAutoSyncEnabled;
    updateAccount(selectedAccount.id, {
      isAutoSyncEnabled: next,
    });
  };

  // Filter accounts for left master list (Divided into Real vs Demo)
  const filteredAccounts = useMemo(() => {
    return accounts.filter(acc => {
      const mode = acc.accountMode || (acc.connection?.syncStatus === 'connected' || acc.name?.toLowerCase().includes('real') ? 'real' : 'demo');
      // Tab filter
      if (filterTab === 'REAL' && mode !== 'real') return false;
      if (filterTab === 'DEMO' && mode !== 'demo') return false;

      // Search filter
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        acc.name.toLowerCase().includes(query) ||
        acc.accountNumber.toLowerCase().includes(query) ||
        acc.provider.toLowerCase().includes(query) ||
        acc.platform.toLowerCase().includes(query)
      );
    });
  }, [accounts, filterTab, searchQuery]);

  if (!selectedAccount) {
    return (
      <div className="p-8 text-center min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="max-w-md mx-auto p-8 rounded-2xl bg-white border border-slate-200 shadow-sm text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4 border border-blue-200">
            <Building2 size={28} className="text-blue-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">No Trading Accounts Found</h2>
          <p className="text-xs text-slate-500 mb-6 font-medium">
            Create an evaluation challenge, funded account, or personal broker account to start tracking performance and risk.
          </p>
          <button
            onClick={() => setIsNewAccountOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all"
          >
            <Plus size={16} />
            <span>Add Account</span>
          </button>
        </div>
        <NewAccountModal
          isOpen={isNewAccountOpen}
          onClose={() => setIsNewAccountOpen(false)}
          onAddAccount={addAccount}
        />
      </div>
    );
  }

  // Active account calculations
  const isProp = selectedAccount.category.startsWith('prop');
  const isMaster = selectedAccount.propDetails?.phase === 'Master' || selectedAccount.propDetails?.phase === 'Funded';
  const profitTargetPct = selectedAccount.propDetails?.profitTargetPct || 0;
  const dailyLimitPct = selectedAccount.propDetails?.dailyDrawdownLimitPct || 5;
  const maxLossLimitPct = selectedAccount.propDetails?.maxDrawdownLimitPct || 10;

  const targetProfitDollar = (selectedAccount.initialBalance * profitTargetPct) / 100;
  const maxDailyLossDollar = (selectedAccount.initialBalance * dailyLimitPct) / 100;
  const maxLossDollar = (selectedAccount.initialBalance * maxLossLimitPct) / 100;

  const currentDailyLoss = selectedAccount.propDetails?.currentDailyLoss || 0;
  const currentMaxDrawdown = selectedAccount.propDetails?.currentMaxDrawdown || 0;
  const currentProfitPct = (selectedAccount.totalPnl / selectedAccount.initialBalance) * 100;

  const distinctDays = new Set(accountTrades.map(t => t.date)).size;
  const minDaysRequired = selectedAccount.propDetails?.minTradingDays || 0;

  const profitStatus =
    selectedAccount.status === 'Passed' || (profitTargetPct > 0 && currentProfitPct >= profitTargetPct)
      ? 'passed'
      : selectedAccount.isBreached
      ? 'breached'
      : 'ongoing';

  const dailyStatus =
    currentDailyLoss >= maxDailyLossDollar
      ? 'breached'
      : currentDailyLoss >= maxDailyLossDollar * 0.7
      ? 'warning'
      : 'ongoing';

  const maxDdStatus =
    currentMaxDrawdown >= maxLossDollar
      ? 'breached'
      : currentMaxDrawdown >= maxLossDollar * 0.7
      ? 'warning'
      : 'ongoing';

  const closedTrades = accountTrades.filter(t => t.status === 'CLOSED');
  const wins = closedTrades.filter(t => t.result === 'WIN').length;
  const winRate = selectedAccount.consistencyMetrics?.winRate ?? (closedTrades.length > 0 ? Math.round((wins / closedTrades.length) * 100) : 65);
  const avgRR = selectedAccount.consistencyMetrics?.riskReward ?? (closedTrades.length > 0 ? Number((closedTrades.reduce((s, t) => s + t.rrRatio, 0) / closedTrades.length).toFixed(2)) : 2.2);
  const consistencyScore = selectedAccount.consistencyScore ?? 2.08;

  const getStatusBadge = (acc: Account) => {
    if (acc.status === 'Passed') {
      return {
        text: 'Passed',
        bg: isDayMode ? '#DCFCE7' : '#0E291E',
        color: isDayMode ? '#059669' : '#10B981',
        border: isDayMode ? '#86EFAC' : '#144634',
      };
    }
    if (acc.status === 'Breached' || acc.status === 'Not Passed' || acc.isBreached) {
      return {
        text: 'Breached',
        bg: isDayMode ? '#FEE2E2' : '#2D1416',
        color: isDayMode ? '#DC2626' : '#F87171',
        border: isDayMode ? '#FCA5A5' : '#4C1D24',
      };
    }
    if (acc.category === 'broker_live') {
      return {
        text: 'Live',
        bg: isDayMode ? '#DCFCE7' : '#0E291E',
        color: isDayMode ? '#059669' : '#10B981',
        border: isDayMode ? '#86EFAC' : '#144634',
      };
    }
    if (acc.category === 'prop_funded') {
      return {
        text: 'Funded',
        bg: isDayMode ? '#EEF0FF' : '#181A20',
        color: '#5D5FEF',
        border: isDayMode ? '#5D5FEF/30' : '#6366F1/30',
      };
    }
    return {
      text: acc.propDetails?.phase || 'Ongoing',
      bg: isDayMode ? '#EEF0FF' : '#181A20',
      color: '#5D5FEF',
      border: isDayMode ? '#E5E4E2' : '#1E2026',
    };
  };

  const cardBg = isDayMode ? 'bg-white border-[#E5E4E2]' : 'bg-[#131418] border-[#1E2026]';
  const subCardBg = isDayMode ? 'bg-[#F9FAFB] border-[#E5E4E2]' : 'bg-[#0F1013] border-[#1E2026]';
  const textPrimary = isDayMode ? 'text-[#111827]' : 'text-white';
  const textSecondary = isDayMode ? 'text-[#6B7280]' : 'text-[#8E95A5]';
  const textMuted = isDayMode ? 'text-[#9CA3AF]' : 'text-[#525866]';
  const divider = isDayMode ? 'border-[#E5E4E2]' : 'border-[#1E2026]';

  return (
    <div className={`flex flex-col lg:flex-row h-full min-h-[calc(100vh-4rem)] ${isDayMode ? 'bg-[#EBEAE8] text-[#111827]' : 'bg-[#0B0C0E] text-white'}`}>
      {/* ── Mobile Sidebar Toggle Bar ── */}
      <div className={`lg:hidden flex items-center justify-between p-4 border-b ${isDayMode ? 'bg-white border-[#E5E4E2]' : 'bg-[#131418] border-[#1E2026]'}`}>
        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border ${isDayMode ? 'bg-[#F2F1EF] text-[#111827] border-[#E5E4E2]' : 'bg-[#0F1013] text-white border-[#1E2026]'}`}
        >
          <Menu size={15} />
          <span>Accounts List ({accounts.length})</span>
        </button>

        <div className={`flex items-center gap-1.5 text-xs font-bold ${textPrimary}`}>
          <span className="w-2 h-2 rounded-full bg-[#5D5FEF]" />
          <span>{selectedAccount.name}</span>
        </div>

        <button
          onClick={() => setIsNewAccountOpen(true)}
          className="p-2 rounded-xl bg-[#5D5FEF] text-white"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* ── Left Column: Accounts Permanent Sidebar List ── */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 lg:z-auto w-84 sm:w-96 shrink-0 border-r flex flex-col transition-transform duration-300 ${
          isDayMode ? 'bg-white border-[#E5E4E2]' : 'bg-[#131418] border-[#1E2026]'
        } ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Sidebar Header */}
        <div className={`p-4 border-b space-y-3 ${divider}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className={`text-base font-extrabold tracking-tight ${textPrimary}`}>Accounts</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${isDayMode ? 'bg-[#F2F1EF] text-[#5D5FEF] border-[#E5E4E2]' : 'bg-[#181A20] text-[#8E95A5] border-[#1E2026]'}`}>
                {accounts.length}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Delete all previous data, remove fake trades, and reset clean slate?')) {
                    clearAllPreviousData();
                  }
                }}
                title="Wipe previous data and start fresh"
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  isDayMode
                    ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                    : 'bg-rose-950/30 hover:bg-rose-900/40 text-rose-400 border-rose-900/40'
                }`}
              >
                <RotateCcw size={12} />
                <span>Reset</span>
              </button>

              <button
                onClick={() => setIsNewAccountOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-[#5D5FEF] hover:bg-[#4F51D8] shadow-xs transition-all cursor-pointer"
              >
                <Plus size={13} />
                <span>New Account</span>
              </button>

              <button
                onClick={() => setMobileSidebarOpen(false)}
                className={`lg:hidden p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 ${textSecondary}`}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Quick Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search account name, #, platform..."
              className={`w-full pl-9 pr-3.5 py-2 text-xs border rounded-xl font-medium focus:border-[#5D5FEF] outline-none transition-all ${
                isDayMode
                  ? 'bg-[#F9FAFB] border-[#E5E4E2] text-[#111827] placeholder:text-[#9CA3AF]'
                  : 'bg-[#0F1013] border-[#1E2026] text-white placeholder:text-[#525866]'
              }`}
            />
          </div>

          {/* Filter Tabs - Divided into Real vs Demo */}
          <div className={`flex items-center gap-1.5 p-1 rounded-xl border ${isDayMode ? 'bg-[#F2F1EF] border-[#E5E4E2]' : 'bg-[#0F1013] border-[#1E2026]'}`}>
            {[
              { id: 'ALL', label: 'All Accounts' },
              { id: 'REAL', label: '🟢 Real' },
              { id: 'DEMO', label: '🟣 Demo' },
            ].map(tab => {
              const isTabActive = filterTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilterTab(tab.id as FilterTab)}
                  className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all text-center cursor-pointer ${
                    isTabActive
                      ? isDayMode
                        ? 'bg-white text-[#5D5FEF] shadow-xs'
                        : 'bg-[#1E2026] text-white shadow-xs'
                      : textSecondary
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Accounts List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 divide-y-0">
          {filteredAccounts.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Layers size={28} className="text-[#9CA3AF] mx-auto mb-2" />
              <p className={`text-xs font-semibold ${textSecondary}`}>No accounts match your filter</p>
              <p className={`text-[11px] mt-0.5 ${textMuted}`}>Try changing the search keyword or filter tab.</p>
            </div>
          ) : (
            filteredAccounts.map(acc => {
              const isSelected = acc.id === selectedAccountId;
              const badge = getStatusBadge(acc);
              const isProfit = acc.totalPnl >= 0;
              const profitPct = (acc.totalPnl / acc.initialBalance) * 100;
              const isChallenge = acc.category.startsWith('prop');
              const targetPct = acc.propDetails?.profitTargetPct || 0;
              const progressPct = targetPct > 0 ? Math.min(100, Math.max(0, (profitPct / targetPct) * 100)) : 0;

              return (
                <div
                  key={acc.id}
                  onClick={() => {
                    setSelectedAccountId(acc.id);
                    setMobileSidebarOpen(false);
                  }}
                  className={`p-3.5 rounded-xl text-left transition-all cursor-pointer relative group border ${
                    isSelected
                      ? isDayMode
                        ? 'bg-[#EEF0FF]/70 border-[#5D5FEF] shadow-xs'
                        : 'bg-[#181A20] border-[#6366F1] shadow-xs'
                      : isDayMode
                      ? 'bg-white hover:bg-[#F7F7F6] border-[#E5E4E2]'
                      : 'bg-[#0F1013] hover:bg-[#181A20] border-[#1E2026]'
                  }`}
                >
                  {/* Active Left Indicator Bar */}
                  {isSelected && (
                    <div className="absolute top-3 bottom-3 left-0 w-1 bg-[#5D5FEF] rounded-r-full" />
                  )}

                  {/* Top Row: Provider Avatar + Name & Account # + Status Badge */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-extrabold text-xs shrink-0 shadow-sm ${
                          isSelected
                            ? 'bg-[#5D5FEF] text-white'
                            : isDayMode
                            ? 'bg-[#F2F1EF] text-[#5D5FEF]'
                            : 'bg-[#1E2026] text-[#8E95A5]'
                        }`}
                      >
                        {acc.provider.substring(0, 2).toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className={`text-xs font-bold truncate group-hover:text-[#5D5FEF] transition-colors ${textPrimary}`}>
                            {acc.name}
                          </h4>
                          {acc.accountMode === 'real' ? (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                              REAL
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-purple-500/15 text-purple-400 border border-purple-500/30 shrink-0">
                              DEMO
                            </span>
                          )}
                        </div>
                        <span className={`text-[11px] font-mono ${textSecondary}`}>
                          {acc.accountNumber}
                        </span>
                      </div>
                    </div>

                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-bold shrink-0"
                      style={{
                        background: badge.bg,
                        color: badge.color,
                        border: `1px solid ${badge.border}`,
                      }}
                    >
                      {badge.text}
                    </span>
                  </div>

                  {/* Subtitle: Category & Platform */}
                  <div className={`flex items-center gap-1.5 text-[11px] font-medium mb-2.5 truncate ${textSecondary}`}>
                    <span className="truncate">
                      {acc.accountMode === 'real' ? '🟢 Live Server' : '🟣 Simulated'} • {acc.serverType || acc.platform}
                    </span>
                    {acc.connection?.syncStatus === 'connected' && (
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border shrink-0 ${
                        isDayMode
                          ? 'bg-[#DCFCE7] text-[#059669] border-[#86EFAC]'
                          : 'bg-[#0E291E] text-[#10B981] border-[#144634]'
                      }`}>
                        <span className={`w-1 h-1 rounded-full animate-pulse ${isDayMode ? 'bg-[#059669]' : 'bg-[#10B981]'}`} />
                        <span>{acc.connection.platform}</span>
                      </span>
                    )}
                  </div>

                  {/* Metrics Row: Balance + Net PnL & Return % */}
                  <div className={`flex items-baseline justify-between pt-2 border-t ${divider}`}>
                    <div>
                      <span className={`text-[10px] font-medium uppercase block ${textMuted}`}>Balance</span>
                      <span className={`text-xs font-bold font-mono ${textPrimary}`}>
                        ${acc.currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className={`text-[10px] font-medium uppercase block ${textMuted}`}>Net P&L</span>
                      <div className="flex items-center justify-end gap-1">
                        <span
                          className={`text-xs font-black font-mono ${
                            isProfit
                              ? isDayMode ? 'text-[#059669]' : 'text-[#10B981]'
                              : isDayMode ? 'text-[#DC2626]' : 'text-[#F87171]'
                          }`}
                        >
                          {isProfit ? '+' : ''}${acc.totalPnl.toFixed(2)}
                        </span>
                        <span
                          className={`text-[10px] font-bold ${
                            isProfit
                              ? isDayMode ? 'text-[#059669]' : 'text-[#10B981]'
                              : isDayMode ? 'text-[#DC2626]' : 'text-[#F87171]'
                          }`}
                        >
                          ({profitPct >= 0 ? '+' : ''}{profitPct.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progress bar towards target if challenge */}
                  {isChallenge && targetPct > 0 && acc.status !== 'Passed' && (
                    <div className="mt-2.5">
                      <div className="flex items-center justify-between text-[10px] mb-1 font-medium text-[#6B7280]">
                        <span>Target Progress</span>
                        <span className={`font-bold ${textPrimary}`}>{progressPct.toFixed(0)}%</span>
                      </div>
                      <div className={`w-full h-1.5 rounded-full overflow-hidden border ${isDayMode ? 'bg-[#E5E4E2] border-[#E5E4E2]' : 'bg-[#0B0C0E] border-[#1E2026]'}`}>
                        <div
                          className={`h-full rounded-full transition-all ${isDayMode ? 'bg-[#059669]' : 'bg-[#10B981]'}`}
                          style={{
                            width: `${progressPct}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* ── Right Column: Selected Account Detail Dashboard ── */}
      <main className={`flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-4 overflow-y-auto ${isDayMode ? 'bg-[#EBEAE8]' : 'bg-[#0B0C0E]'}`}>
        {/* Breadcrumb & Static Account Header */}
        <div
          className={`rounded-xl p-5 border shadow-xs ${cardBg}`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Account Title & Tags */}
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center font-extrabold text-white text-base bg-[#5D5FEF] shadow-md shadow-indigo-500/20">
                {selectedAccount.provider.substring(0, 2).toUpperCase()}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className={`text-lg sm:text-xl font-extrabold tracking-tight ${textPrimary}`}>
                    {selectedAccount.name}
                  </h1>
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${isDayMode ? 'bg-[#F2F1EF] text-[#5D5FEF] border-[#E5E4E2]' : 'bg-[#0F1013] text-[#6366F1] border-[#1E2026]'}`}>
                    {selectedAccount.accountNumber}
                  </span>
                  {selectedAccount.accountMode === 'real' ? (
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Real Live Server</span>
                    </span>
                  ) : (
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                      <span>Demo Practice</span>
                    </span>
                  )}
                  <span
                    className="text-xs px-2.5 py-0.5 rounded-full font-bold"
                    style={{
                      background:
                        selectedAccount.status === 'Passed'
                          ? isDayMode ? '#DCFCE7' : '#0E291E'
                          : selectedAccount.status === 'Breached' || selectedAccount.isBreached
                          ? isDayMode ? '#FEE2E2' : '#2D1416'
                          : isDayMode ? '#EEF0FF' : '#181A20',
                      color:
                        selectedAccount.status === 'Passed'
                          ? isDayMode ? '#059669' : '#10B981'
                          : selectedAccount.status === 'Breached' || selectedAccount.isBreached
                          ? isDayMode ? '#DC2626' : '#F87171'
                          : '#5D5FEF',
                      border: `1px solid ${
                        selectedAccount.status === 'Passed'
                          ? isDayMode ? '#86EFAC' : '#144634'
                          : selectedAccount.status === 'Breached' || selectedAccount.isBreached
                          ? isDayMode ? '#FCA5A5' : '#4C1D24'
                          : isDayMode ? '#E5E4E2' : '#1E2026'
                      }`,
                    }}
                  >
                    {isProp && selectedAccount.propDetails ? `${selectedAccount.propDetails.phase} • ` : ''}{selectedAccount.status}
                  </span>
                </div>

                <div className={`flex flex-wrap items-center gap-2 text-xs font-medium mt-1 ${textSecondary}`}>
                  <span className="flex items-center gap-1">
                    <Server size={12} className="text-[#5D5FEF]" />
                    <span>{selectedAccount.serverType || selectedAccount.platform}</span>
                  </span>
                  <span>•</span>
                  <span>{selectedAccount.provider}</span>
                  <span>•</span>
                  <span>Started {selectedAccount.startDate}</span>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsQuickTradeOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-[#5D5FEF] hover:bg-[#4F51D8] transition-all shadow-xs cursor-pointer"
              >
                <Plus size={14} />
                <span>Log Trade</span>
              </button>

              {isProp && selectedAccount.propDetails?.phase !== 'Master' && selectedAccount.status === 'Passed' && (
                <button
                  type="button"
                  onClick={() => advancePhase(selectedAccount.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                    isDayMode
                      ? 'bg-[#DCFCE7] text-[#059669] border-[#86EFAC] hover:bg-[#bbf7d0]'
                      : 'bg-[#0E291E] text-[#10B981] border-[#144634] hover:bg-[#144634]/50'
                  }`}
                >
                  <Award size={14} />
                  <span>Advance Phase</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsBrokerSyncOpen(true)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  selectedAccount.connection?.syncStatus === 'connected'
                    ? isDayMode
                      ? 'bg-[#DCFCE7] text-[#059669] border-[#86EFAC]'
                      : 'bg-[#0E291E] text-[#10B981] border-[#144634]'
                    : isDayMode
                    ? 'bg-white text-[#111827] border-[#E5E4E2] hover:bg-[#F7F7F6]'
                    : 'bg-[#181A20] text-white border-[#1E2026] hover:bg-[#252830]'
                }`}
              >
                <Zap size={14} className={selectedAccount.connection?.syncStatus === 'connected' ? (isDayMode ? 'text-[#059669]' : 'text-[#10B981]') : 'text-[#5D5FEF]'} />
                <span>{selectedAccount.connection?.syncStatus === 'connected' ? `${selectedAccount.connection.platform} Sync` : 'Connect MT4/MT5'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsEditAccountOpen(true)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                  isDayMode
                    ? 'bg-white border-[#E5E4E2] text-[#111827] hover:bg-[#F7F7F6]'
                    : 'bg-[#181A20] border-[#1E2026] text-white hover:bg-[#252830]'
                }`}
              >
                <Edit3 size={14} className="text-[#5D5FEF]" />
                <span>Manage / Edit</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Demo Practice Control Banner (only for demo accounts) ── */}
        {selectedAccount.accountMode === 'demo' && (
          <div className="p-4 rounded-xl border bg-purple-500/10 border-purple-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/30">
                <Sliders size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-white text-xs">
                    Simulated Demo Challenge • {selectedAccount.provider}
                  </span>
                  <span className="px-2 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-400 border border-purple-500/30">
                    PRACTICE
                  </span>
                </div>
                <p className="text-[11px] text-[#8E95A5] font-medium mt-0.5">
                  Starting Balance: <strong className="text-white">${selectedAccount.initialBalance.toLocaleString()}</strong> • Freely test setups and risk management without risking real capital.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Reset this demo balance back to starting capital?')) {
                    resetAccount(selectedAccount.id);
                  }
                }}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 shadow-xs transition-all cursor-pointer"
              >
                Reset Demo Money
              </button>
              <button
                type="button"
                onClick={() => setIsEditAccountOpen(true)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#8E95A5] hover:text-white border border-[#1E2026] hover:bg-[#181A20] transition-all cursor-pointer"
              >
                Change Money / Rules
              </button>
            </div>
          </div>
        )}

        {/* ── MT4 / MT5 Investor Sync Ribbon ── */}
        <div
          className={`rounded-xl p-4 border flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs ${cardBg}`}
        >
          {selectedAccount.connection ? (
            <div className="flex flex-wrap items-center gap-3">
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center text-[#5D5FEF] font-extrabold text-xs ${subCardBg}`}>
                {selectedAccount.connection.platform}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`font-extrabold text-xs ${textPrimary}`}>
                    {selectedAccount.connection.platform} Investor Bridge
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isBrokerSyncing
                        ? 'bg-[#EEF0FF] text-[#5D5FEF] border border-[#5D5FEF]/30'
                        : selectedAccount.connection.syncStatus === 'connected'
                        ? isDayMode
                          ? 'bg-[#DCFCE7] text-[#059669] border border-[#86EFAC]'
                          : 'bg-[#0E291E] text-[#10B981] border border-[#144634]'
                        : isDayMode
                        ? 'bg-[#FEE2E2] text-[#DC2626] border border-[#FCA5A5]'
                        : 'bg-[#2D1416] text-[#F87171] border border-[#4C1D24]'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isBrokerSyncing
                          ? 'bg-[#5D5FEF] animate-ping'
                          : selectedAccount.connection.syncStatus === 'connected'
                          ? isDayMode ? 'bg-[#059669]' : 'bg-[#10B981]'
                          : isDayMode ? 'bg-[#DC2626]' : 'bg-[#F87171]'
                      }`}
                    />
                    {isBrokerSyncing
                      ? 'Syncing trades...'
                      : selectedAccount.connection.syncStatus === 'connected'
                      ? 'Live Sync Connected'
                      : 'Connection Failed'}
                  </span>
                </div>
                <p className={`text-[11px] font-medium ${textSecondary}`}>
                  {selectedAccount.connection.server} • #{selectedAccount.connection.login} • Read-only
                  {selectedAccount.connection.lastSyncedAt
                    ? ` • Last synced: ${new Date(selectedAccount.connection.lastSyncedAt).toLocaleTimeString()}`
                    : ''}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center text-[#5D5FEF] ${subCardBg}`}>
                <Zap size={18} />
              </div>
              <div>
                <h4 className={`text-xs font-bold ${textPrimary}`}>Automated MT4 / MT5 Sync</h4>
                <p className={`text-[11px] font-medium ${textSecondary}`}>
                  Connect your account via read-only Investor Password to sync positions and trades automatically.
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {syncFeedback && (
              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border ${isDayMode ? 'bg-[#EEF0FF] text-[#5D5FEF] border-[#5D5FEF]/30' : 'bg-[#181A20] text-[#6366F1] border border-[#1E2026]'}`}>
                {syncFeedback}
              </span>
            )}

            {selectedAccount.connection ? (
              <>
                <button
                  type="button"
                  onClick={handleToggleAutoSync}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    selectedAccount.isAutoSyncEnabled
                      ? isDayMode
                        ? 'bg-[#DCFCE7] text-[#059669] border-[#86EFAC]'
                        : 'bg-[#0E291E] text-[#10B981] border-[#144634]'
                      : isDayMode
                      ? 'bg-white text-[#6B7280] border-[#E5E4E2]'
                      : 'bg-[#181A20] text-[#8E95A5] border-[#1E2026] hover:text-white'
                  }`}
                  title="Toggle automated background synchronization"
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      selectedAccount.isAutoSyncEnabled
                        ? isDayMode ? 'bg-[#059669] animate-pulse' : 'bg-[#10B981] animate-pulse'
                        : 'bg-[#9CA3AF]'
                    }`}
                  />
                  <span>
                    Auto-Sync: {selectedAccount.isAutoSyncEnabled ? `ON (${selectedAccount.connection.autoSyncIntervalSec || 30}s)` : 'OFF'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleManualSync}
                  disabled={isBrokerSyncing}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-[#5D5FEF] hover:bg-[#4F51D8] transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw size={13} className={isBrokerSyncing ? 'animate-spin' : ''} />
                  <span>Sync Now</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsBrokerSyncOpen(true)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    isDayMode
                      ? 'bg-white border-[#E5E4E2] text-[#6B7280] hover:text-[#111827]'
                      : 'bg-[#181A20] border-[#1E2026] text-[#8E95A5] hover:text-white'
                  }`}
                >
                  Configure
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsBrokerSyncOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#5D5FEF] hover:bg-[#4F51D8] transition-all shadow-xs cursor-pointer"
              >
                <Zap size={14} />
                <span>Connect MT4 / MT5</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Top Metrics Ribbon ── */}
        <div
          className={`rounded-xl p-4 border shadow-xs ${cardBg}`}
        >
          <div className={`grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 divide-y sm:divide-y-0 sm:divide-x ${divider}`}>
            {/* Balance */}
            <div className="pt-2 sm:pt-0 sm:px-3 first:px-0">
              <span className={`text-[10px] font-bold uppercase tracking-wider block mb-0.5 ${textSecondary}`}>Balance</span>
              <span className={`text-lg font-black font-mono block ${textPrimary}`}>
                ${selectedAccount.currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className={`text-[10px] font-medium ${textMuted}`}>
                Start: ${(selectedAccount.initialBalance / 1000).toFixed(0)}k
              </span>
            </div>

            {/* Equity */}
            <div className="pt-2 sm:pt-0 sm:px-3">
              <span className={`text-[10px] font-bold uppercase tracking-wider block mb-0.5 ${textSecondary}`}>Equity</span>
              <span className={`text-lg font-black font-mono block ${textPrimary}`}>
                ${(selectedAccount.currentEquity || selectedAccount.currentBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className={`text-[10px] font-medium ${textMuted}`}>Live Floating</span>
            </div>

            {/* Today's PnL */}
            <div className="pt-2 sm:pt-0 sm:px-3">
              <span className={`text-[10px] font-bold uppercase tracking-wider block mb-0.5 ${textSecondary}`}>Today's P&L</span>
              <span
                className={`text-lg font-black font-mono block ${
                  selectedAccount.todayPnl >= 0
                    ? isDayMode ? 'text-[#059669]' : 'text-[#10B981]'
                    : isDayMode ? 'text-[#DC2626]' : 'text-[#F87171]'
                }`}
              >
                {selectedAccount.todayPnl >= 0 ? '+' : ''}${selectedAccount.todayPnl.toFixed(2)}
              </span>
              <span className={`text-[10px] font-medium ${textMuted}`}>
                {((selectedAccount.todayPnl / selectedAccount.initialBalance) * 100).toFixed(2)}%
              </span>
            </div>

            {/* Total PnL */}
            <div className="pt-2 sm:pt-0 sm:px-3">
              <span className={`text-[10px] font-bold uppercase tracking-wider block mb-0.5 ${textSecondary}`}>Total P&L</span>
              <span
                className={`text-lg font-black font-mono block ${
                  selectedAccount.totalPnl >= 0
                    ? isDayMode ? 'text-[#059669]' : 'text-[#10B981]'
                    : isDayMode ? 'text-[#DC2626]' : 'text-[#F87171]'
                }`}
              >
                {selectedAccount.totalPnl >= 0 ? '+' : ''}${selectedAccount.totalPnl.toFixed(2)}
              </span>
              <span
                className={`text-[10px] font-bold ${
                  selectedAccount.totalPnl >= 0
                    ? isDayMode ? 'text-[#059669]' : 'text-[#10B981]'
                    : isDayMode ? 'text-[#DC2626]' : 'text-[#F87171]'
                }`}
              >
                {currentProfitPct >= 0 ? '+' : ''}{currentProfitPct.toFixed(2)}%
              </span>
            </div>

            {/* Consistency Score */}
            <div className="pt-2 sm:pt-0 sm:px-3">
              <span className={`text-[10px] font-bold uppercase tracking-wider block mb-0.5 ${textSecondary}`}>Consistency</span>
              <span className="text-lg font-black font-mono text-[#5D5FEF] block">
                {consistencyScore.toFixed(2)}
              </span>
              <span className={`text-[10px] font-medium ${textMuted}`}>Std Dev Ratio</span>
            </div>

            {/* Win Rate */}
            <div className="pt-2 sm:pt-0 sm:px-3">
              <span className={`text-[10px] font-bold uppercase tracking-wider block mb-0.5 ${textSecondary}`}>Win Rate</span>
              <span className={`text-lg font-black font-mono block ${isDayMode ? 'text-[#059669]' : 'text-[#10B981]'}`}>
                {winRate}%
              </span>
              <span className={`text-[10px] font-medium ${textMuted}`}>{wins} Wins</span>
            </div>

            {/* Avg R:R */}
            <div className="pt-2 sm:pt-0 sm:px-3">
              <span className={`text-[10px] font-bold uppercase tracking-wider block mb-0.5 ${textSecondary}`}>Avg R:R</span>
              <span className={`text-lg font-black font-mono block ${textPrimary}`}>
                1:{avgRR}
              </span>
              <span className={`text-[10px] font-medium ${textMuted}`}>Risk to Reward</span>
            </div>
          </div>
        </div>

        {/* ── Challenge Objectives or Broker Info Matrix ── */}
        {isProp ? (
          <div>
            <h3 className="text-xs uppercase tracking-widest text-[#8E95A5] font-bold mb-3">
              Evaluation Objectives & Risk Parameters
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <AccountMetricCard
                type="profit-target"
                title="Profit Target"
                subtitle={isMaster ? 'No target ceiling' : `Target: ${profitTargetPct}% ($${targetProfitDollar.toLocaleString()})`}
                currentValue={selectedAccount.totalPnl}
                targetValue={targetProfitDollar}
                currentPct={currentProfitPct}
                limitPct={profitTargetPct}
                status={profitStatus}
                isMaster={isMaster}
              />

              <AccountMetricCard
                type="daily-drawdown"
                title="Maximum Daily Loss"
                subtitle={`Limit: ${dailyLimitPct}% ($${maxDailyLossDollar.toLocaleString()})`}
                currentValue={currentDailyLoss}
                targetValue={maxDailyLossDollar}
                currentPct={(currentDailyLoss / selectedAccount.initialBalance) * 100}
                limitPct={dailyLimitPct}
                status={dailyStatus}
                isLossMetric
              />

              <AccountMetricCard
                type="max-drawdown"
                title="Maximum Overall Loss"
                subtitle={`Limit: ${maxLossLimitPct}% ($${maxLossDollar.toLocaleString()})`}
                currentValue={currentMaxDrawdown}
                targetValue={maxLossDollar}
                currentPct={(currentMaxDrawdown / selectedAccount.initialBalance) * 100}
                limitPct={maxLossLimitPct}
                status={maxDdStatus}
                isLossMetric
              />

              <AccountMetricCard
                type="trading-days"
                title="Minimum Trading Days"
                subtitle={`Logged: ${distinctDays} of ${minDaysRequired} days`}
                currentValue={distinctDays}
                targetValue={minDaysRequired}
                currentPct={(distinctDays / (minDaysRequired || 1)) * 100}
                limitPct={100}
                status={distinctDays >= minDaysRequired ? 'passed' : 'ongoing'}
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`rounded-xl p-5 border shadow-xs ${cardBg}`}>
              <div className="flex items-center gap-2 mb-2">
                <Globe size={18} className="text-[#5D5FEF]" />
                <h4 className={`text-xs uppercase tracking-wider font-bold ${textPrimary}`}>Execution Type</h4>
              </div>
              <p className={`text-lg font-black ${textPrimary}`}>{selectedAccount.serverType || 'ECN Raw Spread'}</p>
              <p className={`text-xs mt-1 font-medium ${textSecondary}`}>Real-time market depth with direct STP execution</p>
            </div>

            <div className={`rounded-xl p-5 border shadow-xs ${cardBg}`}>
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck size={18} className={isDayMode ? 'text-[#059669]' : 'text-[#10B981]'} />
                <h4 className={`text-xs uppercase tracking-wider font-bold ${textPrimary}`}>Account Safety</h4>
              </div>
              <p className={`text-lg font-black ${isDayMode ? 'text-[#059669]' : 'text-[#10B981]'}`}>Negative Balance Protected</p>
              <p className={`text-xs mt-1 font-medium ${textSecondary}`}>Segregated client funds Tier-1 banking</p>
            </div>

            <div className={`rounded-xl p-5 border shadow-xs ${cardBg}`}>
              <div className="flex items-center gap-2 mb-2">
                <Award size={18} className="text-[#5D5FEF]" />
                <h4 className={`text-xs uppercase tracking-wider font-bold ${textPrimary}`}>Trading Leverage</h4>
              </div>
              <p className={`text-lg font-black ${textPrimary}`}>1:100 Dynamic</p>
              <p className={`text-xs mt-1 font-medium ${textSecondary}`}>Standard margin requirements on Forex & Metals</p>
            </div>
          </div>
        )}

        {/* ── Daily Loss Tracker (Only for Prop Accounts) ── */}
        {isProp && (
          <DailyDrawdownTracker
            account={selectedAccount}
            trades={accountTrades}
          />
        )}

        {/* ── Equity Curve Visualizer ── */}
        <AccountDrawdownChart
          account={selectedAccount}
          trades={accountTrades}
        />

        {/* ── Trades Log Table ── */}
        <AccountTradesTable
          account={selectedAccount}
          trades={accountTrades}
          onOpenQuickTrade={() => setIsQuickTradeOpen(true)}
        />
      </main>

      {/* ── Modals ── */}
      <NewAccountModal
        isOpen={isNewAccountOpen}
        onClose={() => setIsNewAccountOpen(false)}
        onAddAccount={addAccount}
      />

      <EditAccountModal
        account={selectedAccount}
        isOpen={isEditAccountOpen}
        onClose={() => setIsEditAccountOpen(false)}
        onUpdate={updateAccount}
        onDelete={deleteAccount}
        onReset={resetAccount}
        onAdvancePhase={advancePhase}
      />

      <QuickTradeModal
        account={selectedAccount}
        isOpen={isQuickTradeOpen}
        onClose={() => setIsQuickTradeOpen(false)}
      />

      <BrokerSyncModal
        account={selectedAccount}
        isOpen={isBrokerSyncOpen}
        onClose={() => setIsBrokerSyncOpen(false)}
        onUpdateAccount={updateAccount}
      />
    </div>
  );
}
