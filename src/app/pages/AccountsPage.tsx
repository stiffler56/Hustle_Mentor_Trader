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
} from 'lucide-react';
import { useAccountsContext } from '../data/PropAccountsContext';
import type { Account, AccountCategory } from '../data/accountTypes';
import { AccountMetricCard } from '../components/prop-firm/AccountMetricCard';
import { AccountDrawdownChart } from '../components/prop-firm/AccountDrawdownChart';
import { DailyDrawdownTracker } from '../components/prop-firm/DailyDrawdownTracker';
import { AccountTradesTable } from '../components/prop-firm/AccountTradesTable';
import { NewAccountModal } from '../components/prop-firm/NewAccountModal';
import { EditAccountModal } from '../components/prop-firm/EditAccountModal';
import { QuickTradeModal } from '../components/prop-firm/QuickTradeModal';

type FilterTab = 'ALL' | 'PROP' | 'BROKER';

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
    accountTrades,
  } = useAccountsContext();

  const [isNewAccountOpen, setIsNewAccountOpen] = useState(false);
  const [isEditAccountOpen, setIsEditAccountOpen] = useState(false);
  const [isQuickTradeOpen, setIsQuickTradeOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<FilterTab>('ALL');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Filter accounts for left master list
  const filteredAccounts = useMemo(() => {
    return accounts.filter(acc => {
      // Tab filter
      if (filterTab === 'PROP' && !acc.category.startsWith('prop')) return false;
      if (filterTab === 'BROKER' && !acc.category.startsWith('broker')) return false;

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
      return { text: 'Passed', bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' };
    }
    if (acc.status === 'Breached' || acc.status === 'Not Passed' || acc.isBreached) {
      return { text: 'Breached', bg: '#fef2f2', color: '#dc2626', border: '#fecaca' };
    }
    if (acc.category === 'broker_live') {
      return { text: 'Live', bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' };
    }
    if (acc.category === 'prop_funded') {
      return { text: 'Funded', bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' };
    }
    return { text: acc.propDetails?.phase || 'Ongoing', bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' };
  };

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-[calc(100vh-4rem)] bg-slate-50/70">
      {/* ── Mobile Sidebar Toggle Bar ── */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200">
        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200"
        >
          <Menu size={15} />
          <span>Accounts List ({accounts.length})</span>
        </button>

        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
          <span className="w-2 h-2 rounded-full bg-blue-600" />
          <span>{selectedAccount.name}</span>
        </div>

        <button
          onClick={() => setIsNewAccountOpen(true)}
          className="p-2 rounded-xl bg-blue-600 text-white"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* ── Left Column: Accounts Permanent Sidebar List ── */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 lg:z-auto w-84 sm:w-96 shrink-0 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{
          boxShadow: '2px 0 12px rgba(15, 23, 42, 0.03)',
        }}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Accounts</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                {accounts.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsNewAccountOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all"
              >
                <Plus size={13} />
                <span>New Account</span>
              </button>

              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Quick Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search account name, #, platform..."
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 font-medium focus:border-blue-500 focus:bg-white outline-none transition-all"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl">
            {[
              { id: 'ALL', label: 'All' },
              { id: 'PROP', label: 'Prop Challenges' },
              { id: 'BROKER', label: 'Live Brokers' },
            ].map(tab => {
              const isTabActive = filterTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilterTab(tab.id as FilterTab)}
                  className="flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all text-center"
                  style={{
                    background: isTabActive ? '#ffffff' : 'transparent',
                    color: isTabActive ? '#2563eb' : '#64748b',
                    boxShadow: isTabActive ? '0 1px 3px rgba(15, 23, 42, 0.08)' : 'none',
                  }}
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
              <Layers size={28} className="text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">No accounts match your filter</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Try changing the search keyword or filter tab.</p>
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
                  className={`p-3.5 rounded-2xl text-left transition-all cursor-pointer relative group border ${
                    isSelected
                      ? 'bg-blue-50/50 border-blue-500 shadow-sm'
                      : 'bg-white hover:bg-slate-50/80 border-slate-200'
                  }`}
                >
                  {/* Active Left Indicator Bar */}
                  {isSelected && (
                    <div className="absolute top-3 bottom-3 left-0 w-1 bg-blue-600 rounded-r-full" />
                  )}

                  {/* Top Row: Provider Avatar + Name & Account # + Status Badge */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center font-extrabold text-xs shrink-0 shadow-sm"
                        style={{
                          background: isSelected ? '#2563eb' : '#0f172a',
                          color: '#ffffff',
                        }}
                      >
                        {acc.provider.substring(0, 2).toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-extrabold text-slate-900 truncate">{acc.name}</h4>
                          {isSelected && (
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                          )}
                        </div>
                        <span className="text-[10px] font-mono font-bold text-blue-600 block">
                          {acc.accountNumber}
                        </span>
                      </div>
                    </div>

                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
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
                  <p className="text-[11px] text-slate-500 font-medium mb-2.5 truncate">
                    {acc.serverType ? `${acc.serverType} • ` : ''}${acc.platform}
                    {isChallenge && acc.propDetails ? ` • ${acc.propDetails.modelType}` : ''}
                  </p>

                  {/* Metrics Row: Balance + Net PnL & Return % */}
                  <div className="flex items-baseline justify-between pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block text-[10px]">Balance</span>
                      <span className="text-sm font-extrabold font-mono text-slate-900">
                        ${acc.currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block text-[10px]">Net P&L</span>
                      <span
                        className="text-xs font-extrabold font-mono"
                        style={{ color: isProfit ? '#16a34a' : '#dc2626' }}
                      >
                        {isProfit ? '+' : ''}${acc.totalPnl.toFixed(2)} ({isProfit ? '+' : ''}{profitPct.toFixed(1)}%)
                      </span>
                    </div>
                  </div>

                  {/* Prop Challenge Compact Progress Bar */}
                  {isChallenge && targetPct > 0 && !isMaster && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 mb-1">
                        <span>Target: {targetPct}%</span>
                        <span className="text-blue-600 font-mono font-bold">{progressPct.toFixed(0)}% Done</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.max(4, Math.min(100, progressPct))}%`,
                            background: progressPct >= 100 ? '#16a34a' : '#2563eb',
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
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto">
        {/* Breadcrumb & Static Account Header */}
        <div
          className="rounded-2xl p-6 bg-white border border-slate-200 shadow-sm"
          style={{
            boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)',
          }}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Account Title & Tags */}
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-white text-base bg-blue-600 shadow-sm shadow-blue-500/20">
                {selectedAccount.provider.substring(0, 2).toUpperCase()}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                    {selectedAccount.name}
                  </h1>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-blue-700 border border-slate-200">
                    {selectedAccount.accountNumber}
                  </span>
                  <span
                    className="text-xs px-2.5 py-0.5 rounded-full font-bold"
                    style={{
                      background:
                        selectedAccount.status === 'Passed'
                          ? '#f0fdf4'
                          : selectedAccount.status === 'Breached' || selectedAccount.isBreached
                          ? '#fef2f2'
                          : '#eff6ff',
                      color:
                        selectedAccount.status === 'Passed'
                          ? '#16a34a'
                          : selectedAccount.status === 'Breached' || selectedAccount.isBreached
                          ? '#dc2626'
                          : '#2563eb',
                      border: `1px solid ${
                        selectedAccount.status === 'Passed'
                          ? '#bbf7d0'
                          : selectedAccount.status === 'Breached' || selectedAccount.isBreached
                          ? '#fecaca'
                          : '#bfdbfe'
                      }`,
                    }}
                  >
                    {isProp && selectedAccount.propDetails ? `${selectedAccount.propDetails.phase} • ` : ''}{selectedAccount.status}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500 mt-1">
                  <span className="flex items-center gap-1">
                    <Server size={12} className="text-blue-600" />
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
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsQuickTradeOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-sm"
              >
                <Plus size={14} />
                <span>Log Trade</span>
              </button>

              {isProp && selectedAccount.propDetails?.phase !== 'Master' && selectedAccount.status === 'Passed' && (
                <button
                  type="button"
                  onClick={() => advancePhase(selectedAccount.id)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                >
                  <Award size={14} />
                  <span>Advance Phase</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsEditAccountOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-200 transition-colors"
              >
                <Edit3 size={14} className="text-blue-600" />
                <span>Manage / Edit</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Top Metrics Ribbon ── */}
        <div
          className="rounded-2xl p-5 bg-white border border-slate-200 shadow-sm"
          style={{
            boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)',
          }}
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
            {/* Balance */}
            <div className="pt-2 sm:pt-0 sm:px-3 first:px-0">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Balance</span>
              <span className="text-lg font-extrabold font-mono text-slate-900 block">
                ${selectedAccount.currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                Start: ${(selectedAccount.initialBalance / 1000).toFixed(0)}k
              </span>
            </div>

            {/* Equity */}
            <div className="pt-2 sm:pt-0 sm:px-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Equity</span>
              <span className="text-lg font-extrabold font-mono text-slate-900 block">
                ${(selectedAccount.currentEquity || selectedAccount.currentBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Live Floating</span>
            </div>

            {/* Today's PnL */}
            <div className="pt-2 sm:pt-0 sm:px-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Today's P&L</span>
              <span
                className="text-lg font-extrabold font-mono block"
                style={{ color: selectedAccount.todayPnl >= 0 ? '#16a34a' : '#dc2626' }}
              >
                {selectedAccount.todayPnl >= 0 ? '+' : ''}${selectedAccount.todayPnl.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                {((selectedAccount.todayPnl / selectedAccount.initialBalance) * 100).toFixed(2)}%
              </span>
            </div>

            {/* Total PnL */}
            <div className="pt-2 sm:pt-0 sm:px-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Total P&L</span>
              <span
                className="text-lg font-extrabold font-mono block"
                style={{ color: selectedAccount.totalPnl >= 0 ? '#16a34a' : '#dc2626' }}
              >
                {selectedAccount.totalPnl >= 0 ? '+' : ''}${selectedAccount.totalPnl.toFixed(2)}
              </span>
              <span
                className="text-[10px] font-bold"
                style={{ color: selectedAccount.totalPnl >= 0 ? '#16a34a' : '#dc2626' }}
              >
                {currentProfitPct >= 0 ? '+' : ''}{currentProfitPct.toFixed(2)}%
              </span>
            </div>

            {/* Consistency Score */}
            <div className="pt-2 sm:pt-0 sm:px-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Consistency</span>
              <span className="text-lg font-extrabold font-mono text-blue-600 block">
                {consistencyScore.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Std Dev Ratio</span>
            </div>

            {/* Win Rate */}
            <div className="pt-2 sm:pt-0 sm:px-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Win Rate</span>
              <span className="text-lg font-extrabold font-mono text-blue-600 block">
                {winRate}%
              </span>
              <span className="text-[10px] text-slate-400 font-medium">{wins} Wins</span>
            </div>

            {/* Avg R:R */}
            <div className="pt-2 sm:pt-0 sm:px-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Avg R:R</span>
              <span className="text-lg font-extrabold font-mono text-blue-600 block">
                1:{avgRR}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Risk to Reward</span>
            </div>
          </div>
        </div>

        {/* ── Challenge Objectives or Broker Info Matrix ── */}
        {isProp ? (
          <div>
            <h3 className="text-xs uppercase tracking-widest text-slate-600 font-bold mb-3">
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
                title="Trading Days Logged"
                subtitle={minDaysRequired > 0 ? `Minimum ${minDaysRequired} days required` : 'No minimum trading days'}
                currentValue={distinctDays}
                targetValue={minDaysRequired}
                currentPct={minDaysRequired > 0 ? Math.min(100, (distinctDays / minDaysRequired) * 100) : 100}
                limitPct={100}
                status={minDaysRequired > 0 && distinctDays < minDaysRequired ? 'ongoing' : 'passed'}
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">Broker Type</span>
              <span className="text-lg font-extrabold text-slate-900">{selectedAccount.category === 'broker_live' ? 'Live Broker Account' : 'Demo / Paper Trading'}</span>
              <span className="text-xs text-blue-600 font-semibold block mt-1">{selectedAccount.provider} • {selectedAccount.serverType || 'Raw Spread'}</span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">Execution Platform</span>
              <span className="text-lg font-extrabold text-blue-600">{selectedAccount.platform}</span>
              <span className="text-xs text-slate-500 font-medium block mt-1">Direct Market Access</span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">Profitability</span>
              <span className="text-lg font-extrabold font-mono" style={{ color: selectedAccount.totalPnl >= 0 ? '#16a34a' : '#dc2626' }}>
                {selectedAccount.totalPnl >= 0 ? '+' : ''}${selectedAccount.totalPnl.toFixed(2)} ({currentProfitPct.toFixed(2)}%)
              </span>
              <span className="text-xs text-slate-500 font-medium block mt-1">{closedTrades.length} trades recorded</span>
            </div>
          </div>
        )}

        {/* ── Daily Loss Barometer ── */}
        <DailyDrawdownTracker account={selectedAccount} trades={accountTrades} />

        {/* ── Equity & Drawdown Chart ── */}
        <AccountDrawdownChart account={selectedAccount} trades={accountTrades} />

        {/* ── Account Trades Table ── */}
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
    </div>
  );
}
