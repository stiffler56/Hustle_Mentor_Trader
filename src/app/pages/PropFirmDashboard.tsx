import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Award,
  ChevronDown,
  TrendingUp,
  ShieldCheck,
  Globe,
  Edit3,
  Server,
  Zap,
  Activity,
  CheckCircle2,
  BarChart2,
} from 'lucide-react';
import { useAccountsContext } from '../data/PropAccountsContext';
import { AccountMetricCard } from '../components/prop-firm/AccountMetricCard';
import { AccountDrawdownChart } from '../components/prop-firm/AccountDrawdownChart';
import { DailyDrawdownTracker } from '../components/prop-firm/DailyDrawdownTracker';
import { AccountTradesTable } from '../components/prop-firm/AccountTradesTable';
import { NewAccountModal } from '../components/prop-firm/NewAccountModal';
import { EditAccountModal } from '../components/prop-firm/EditAccountModal';
import { QuickTradeModal } from '../components/prop-firm/QuickTradeModal';

export default function PropFirmDashboard() {
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Aggregate stats across all accounts
  const totalFunding = accounts.reduce((sum, a) => sum + a.initialBalance, 0);
  const totalBalance = accounts.reduce((sum, a) => sum + a.currentBalance, 0);
  const totalPnl = accounts.reduce((sum, a) => sum + a.totalPnl, 0);

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

  // Metrics from consistency / trades
  const closedTrades = accountTrades.filter(t => t.status === 'CLOSED');
  const wins = closedTrades.filter(t => t.result === 'WIN').length;
  const winRate = selectedAccount.consistencyMetrics?.winRate ?? (closedTrades.length > 0 ? Math.round((wins / closedTrades.length) * 100) : 65);
  const avgRR = selectedAccount.consistencyMetrics?.riskReward ?? (closedTrades.length > 0 ? Number((closedTrades.reduce((s, t) => s + t.rrRatio, 0) / closedTrades.length).toFixed(2)) : 2.2);
  const consistencyScore = selectedAccount.consistencyScore ?? 2.08;

  return (
    <div className="min-h-screen bg-slate-50/70 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* ── Top Header & Account Switcher ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Account Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-blue-400 transition-all text-left"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-white text-xs bg-blue-600 shadow-sm shadow-blue-500/20">
                {selectedAccount.provider.substring(0, 2).toUpperCase()}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-slate-900">{selectedAccount.name}</span>
                  <span className="text-[11px] font-mono font-bold text-blue-600">{selectedAccount.accountNumber}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                  <Server size={11} className="text-blue-500" />
                  <span>{selectedAccount.serverType || selectedAccount.platform}</span>
                  <span>•</span>
                  <span
                    className="font-bold"
                    style={{
                      color:
                        selectedAccount.status === 'Passed'
                          ? '#16a34a'
                          : selectedAccount.status === 'Breached'
                          ? '#dc2626'
                          : '#2563eb',
                    }}
                  >
                    {isProp && selectedAccount.propDetails ? `${selectedAccount.propDetails.phase} • ` : ''}{selectedAccount.status}
                  </span>
                </div>
              </div>

              <ChevronDown size={16} className="text-slate-400 ml-2" />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-80 rounded-2xl bg-white border border-slate-200 shadow-xl z-30 p-2 space-y-1">
                <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Switch Account
                </div>
                {accounts.map(acc => (
                  <button
                    key={acc.id}
                    onClick={() => {
                      setSelectedAccountId(acc.id);
                      setIsDropdownOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-colors"
                    style={{
                      background: acc.id === selectedAccountId ? '#eff6ff' : 'transparent',
                    }}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900">{acc.name}</span>
                        <span className="text-[10px] font-mono font-bold text-blue-600">{acc.accountNumber}</span>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        ${acc.currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} • {acc.provider}
                      </span>
                    </div>
                    {acc.id === selectedAccountId && (
                      <div className="w-2 h-2 rounded-full bg-blue-600" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            {accounts.length} Total Accounts
          </span>
        </div>

        {/* Global Summary & Add Button */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-4 px-4 py-2 rounded-xl bg-white border border-slate-200 shadow-sm">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Capital</span>
              <span className="text-xs font-extrabold font-mono text-blue-600">
                ${totalFunding.toLocaleString()}
              </span>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Return</span>
              <span
                className="text-xs font-extrabold font-mono"
                style={{ color: totalPnl >= 0 ? '#16a34a' : '#dc2626' }}
              >
                {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsNewAccountOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-sm shrink-0"
          >
            <Plus size={14} />
            <span>New Account</span>
          </button>
        </div>
      </div>

      {/* ── FundingPips Top Metrics Ribbon ── */}
      <div
        className="rounded-2xl p-5 bg-white border border-slate-200 shadow-sm"
        style={{
          boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)',
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

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <span className="font-bold text-slate-900">{selectedAccount.provider}</span>
            <span>•</span>
            <span>{selectedAccount.platform}</span>
            <span>•</span>
            <span className="font-mono text-slate-400">{selectedAccount.startDate}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsQuickTradeOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm"
            >
              <Plus size={13} />
              <span>Log Trade</span>
            </button>

            {isProp && selectedAccount.propDetails?.phase !== 'Master' && selectedAccount.status === 'Passed' && (
              <button
                type="button"
                onClick={() => advancePhase(selectedAccount.id)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
              >
                <Award size={13} />
                <span>Advance Phase</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsEditAccountOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-200"
            >
              <Edit3 size={13} className="text-blue-600" />
              <span>Manage</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Challenge Objectives & Risk Cards ── */}
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
            <span className="text-xl font-extrabold text-slate-900">{selectedAccount.category === 'broker_live' ? 'Live Broker Account' : 'Demo / Paper Trading'}</span>
            <span className="text-xs text-blue-600 font-semibold block mt-1">{selectedAccount.provider} • {selectedAccount.serverType || 'Raw Spread'}</span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">Execution Platform</span>
            <span className="text-xl font-extrabold text-blue-600">{selectedAccount.platform}</span>
            <span className="text-xs text-slate-500 font-medium block mt-1">Direct Market Access</span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">Profitability</span>
            <span className="text-xl font-extrabold font-mono" style={{ color: selectedAccount.totalPnl >= 0 ? '#16a34a' : '#dc2626' }}>
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

      {/* ── Accounts List Placed Below Active Dashboard ── */}
      <div className="pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">All Accounts & Portfolios</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Click any account below to switch your active dashboard view or manage parameters
            </p>
          </div>
          <button
            onClick={() => setIsNewAccountOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm"
          >
            <Plus size={13} />
            <span>Add Account</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map(acc => {
            const isSelected = acc.id === selectedAccountId;
            const isProfit = acc.totalPnl >= 0;
            const profitPct = (acc.totalPnl / acc.initialBalance) * 100;

            const categoryLabel =
              acc.category === 'prop_evaluation'
                ? 'Evaluation'
                : acc.category === 'prop_funded'
                ? 'Funded Master'
                : acc.category === 'broker_live'
                ? 'Live Broker'
                : 'Demo Broker';

            return (
              <div
                key={acc.id}
                onClick={() => setSelectedAccountId(acc.id)}
                className="p-5 rounded-2xl bg-white border text-left transition-all cursor-pointer relative group hover:shadow-md"
                style={{
                  borderColor: isSelected ? '#2563eb' : '#e2e8f0',
                  boxShadow: isSelected ? '0 4px 16px rgba(37, 99, 235, 0.12)' : '0 2px 8px rgba(15, 23, 42, 0.04)',
                }}
              >
                {isSelected && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600 rounded-t-2xl" />
                )}

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-slate-900">{acc.name}</span>
                    <span className="text-xs font-mono font-bold text-blue-600">{acc.accountNumber}</span>
                  </div>

                  <span
                    className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
                    style={{
                      background:
                        acc.status === 'Passed'
                          ? '#f0fdf4'
                          : acc.status === 'Breached' || acc.isBreached
                          ? '#fef2f2'
                          : '#eff6ff',
                      color:
                        acc.status === 'Passed'
                          ? '#16a34a'
                          : acc.status === 'Breached' || acc.isBreached
                          ? '#dc2626'
                          : '#2563eb',
                      border: `1px solid ${
                        acc.status === 'Passed'
                          ? '#bbf7d0'
                          : acc.status === 'Breached' || acc.isBreached
                          ? '#fecaca'
                          : '#bfdbfe'
                      }`,
                    }}
                  >
                    {categoryLabel} • {acc.status}
                  </span>
                </div>

                <div className="flex items-baseline justify-between mt-2 pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-lg font-extrabold font-mono text-slate-900 block">
                      ${acc.currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-xs font-medium text-slate-500">
                      ${(acc.initialBalance / 1000).toFixed(0)}k • {acc.platform}
                    </span>
                  </div>

                  <div className="text-right">
                    <span
                      className="text-sm font-extrabold font-mono block"
                      style={{ color: isProfit ? '#16a34a' : '#dc2626' }}
                    >
                      {isProfit ? '+' : ''}${acc.totalPnl.toFixed(2)}
                    </span>
                    <span
                      className="text-xs font-bold"
                      style={{ color: isProfit ? '#16a34a' : '#dc2626' }}
                    >
                      ({isProfit ? '+' : ''}{profitPct.toFixed(2)}%)
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-blue-600 pt-2 border-t border-slate-50">
                  <span>{isSelected ? '✓ Currently Selected' : 'Click to view dashboard'}</span>
                  <span>{acc.provider}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

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
