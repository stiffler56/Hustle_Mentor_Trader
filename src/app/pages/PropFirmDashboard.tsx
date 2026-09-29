import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Award,
  Settings2,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  Shield,
  Layers,
  Edit3,
} from 'lucide-react';
import { usePropAccountsContext } from '../data/PropAccountsContext';
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
  } = usePropAccountsContext();

  const [isNewAccountOpen, setIsNewAccountOpen] = useState(false);
  const [isEditAccountOpen, setIsEditAccountOpen] = useState(false);
  const [isQuickTradeOpen, setIsQuickTradeOpen] = useState(false);

  // Aggregate calculations
  const totalFunding = accounts.reduce((sum, a) => sum + a.accountSize, 0);
  const totalPnl = accounts.reduce((sum, a) => sum + a.pnl, 0);
  const passedCount = accounts.filter(a => a.status === 'Passed').length;
  const activeCount = accounts.filter(a => a.status === 'Ongoing').length;

  if (!selectedAccount) {
    return (
      <div className="p-8 text-center min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="max-w-md mx-auto p-8 rounded-2xl bg-white border border-slate-200 shadow-sm text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4 border border-blue-200">
            <Building2 size={28} className="text-blue-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">No Funding Accounts Found</h2>
          <p className="text-xs text-slate-500 mb-6 font-medium">
            Create an evaluation challenge or funded master account to start tracking drawdown limits and profit targets.
          </p>
          <button
            onClick={() => setIsNewAccountOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm"
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

  // Active account stats
  const isMaster = selectedAccount.phase === 'Master';
  const targetProfitDollar = (selectedAccount.initialBalance * selectedAccount.profitTargetPct) / 100;
  const maxDailyLossDollar = (selectedAccount.initialBalance * selectedAccount.dailyDrawdownLimitPct) / 100;
  const maxLossDollar = (selectedAccount.initialBalance * selectedAccount.maxDrawdownLimitPct) / 100;

  const distinctDays = new Set(accountTrades.map(t => t.date)).size;
  const minDaysRequired = selectedAccount.minTradingDays || 0;

  const profitStatus =
    selectedAccount.status === 'Passed' || (selectedAccount.profitTargetPct > 0 && selectedAccount.currentProfitPct >= selectedAccount.profitTargetPct)
      ? 'passed'
      : selectedAccount.isBreached
      ? 'breached'
      : 'ongoing';

  const dailyStatus =
    selectedAccount.currentDailyLoss >= maxDailyLossDollar
      ? 'breached'
      : selectedAccount.currentDailyLoss >= maxDailyLossDollar * 0.7
      ? 'warning'
      : 'ongoing';

  const maxDdStatus =
    selectedAccount.currentMaxDrawdown >= maxLossDollar
      ? 'breached'
      : selectedAccount.currentMaxDrawdown >= maxLossDollar * 0.7
      ? 'warning'
      : 'ongoing';

  return (
    <div className="min-h-screen bg-slate-50/70 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* ── Top Header & Summary ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Funding Accounts</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              {accounts.length} Active Accounts
            </span>
          </div>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Track evaluation phases, monitor daily drawdown limits, and manage multi-account simulations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Aggregate Capital Stats */}
          <div className="hidden sm:flex items-center gap-4 px-4 py-2 rounded-xl bg-white border border-slate-200 shadow-sm">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Capital</span>
              <span className="text-xs font-extrabold font-mono text-blue-600">
                ${totalFunding.toLocaleString()}
              </span>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Net Return</span>
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

      {/* ── Selected Account Banner ── */}
      <div
        className="rounded-2xl p-6 bg-white border border-slate-200 shadow-sm"
        style={{
          boxShadow: '0 4px 20px rgba(15, 23, 42, 0.05)',
        }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Account Identity */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-white text-base bg-blue-600 shadow-sm shadow-blue-500/30">
                {selectedAccount.firmName.substring(0, 2).toUpperCase()}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                    {selectedAccount.firmName}
                  </h2>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-blue-700 border border-slate-200">
                    {selectedAccount.accountNumber}
                  </span>
                  <span
                    className="text-xs px-2.5 py-0.5 rounded-full font-bold"
                    style={{
                      background:
                        selectedAccount.status === 'Passed'
                          ? '#f0fdf4'
                          : selectedAccount.isBreached
                          ? '#fef2f2'
                          : '#eff6ff',
                      color:
                        selectedAccount.status === 'Passed'
                          ? '#16a34a'
                          : selectedAccount.isBreached
                          ? '#dc2626'
                          : '#2563eb',
                      border: `1px solid ${
                        selectedAccount.status === 'Passed'
                          ? '#bbf7d0'
                          : selectedAccount.isBreached
                          ? '#fecaca'
                          : '#bfdbfe'
                      }`,
                    }}
                  >
                    {selectedAccount.phase} • {selectedAccount.status}
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-500 mt-0.5">
                  {selectedAccount.modelType} • {selectedAccount.platform || 'cTrader'} • Created {selectedAccount.createdAt}
                </p>
              </div>
            </div>
          </div>

          {/* Key Balances */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 lg:border-x lg:border-slate-200 lg:px-6">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Account Balance</span>
              <span className="text-2xl font-extrabold font-mono text-slate-900">
                ${selectedAccount.currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] font-medium text-slate-400 block">
                Start: ${selectedAccount.initialBalance.toLocaleString()}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Net Profit</span>
              <div className="flex items-baseline gap-1.5">
                <span
                  className="text-2xl font-extrabold font-mono"
                  style={{ color: selectedAccount.pnl >= 0 ? '#16a34a' : '#dc2626' }}
                >
                  {selectedAccount.pnl >= 0 ? '+' : ''}${selectedAccount.pnl.toFixed(2)}
                </span>
              </div>
              <span
                className="text-[10px] font-bold"
                style={{ color: selectedAccount.pnl >= 0 ? '#16a34a' : '#dc2626' }}
              >
                {selectedAccount.currentProfitPct >= 0 ? '+' : ''}{selectedAccount.currentProfitPct.toFixed(2)}%
              </span>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Account Size</span>
              <span className="text-2xl font-extrabold font-mono text-blue-600">
                ${(selectedAccount.accountSize / 1000).toFixed(0)}k
              </span>
              <span className="text-[10px] font-medium text-slate-400 block">
                {isMaster ? 'Funded (85% Profit Split)' : `Target: ${selectedAccount.profitTargetPct}%`}
              </span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsQuickTradeOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-sm"
            >
              <Plus size={14} />
              <span>Log Trade</span>
            </button>

            {selectedAccount.phase !== 'Master' && selectedAccount.status === 'Passed' && (
              <button
                type="button"
                onClick={() => advancePhase(selectedAccount.id)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
              >
                <Award size={14} />
                <span>Advance Phase</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsEditAccountOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-200 transition-colors"
            >
              <Edit3 size={14} className="text-blue-600" />
              <span>Rename / Manage</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Challenge Objectives & Risk Cards ── */}
      <div>
        <h3 className="text-xs uppercase tracking-widest text-slate-600 font-bold mb-3">
          Challenge Objectives & Risk Limits
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <AccountMetricCard
            type="profit-target"
            title="Profit Target"
            subtitle={isMaster ? 'No target ceiling' : `Objective: ${selectedAccount.profitTargetPct}%`}
            currentValue={selectedAccount.pnl}
            targetValue={targetProfitDollar}
            currentPct={selectedAccount.currentProfitPct}
            limitPct={selectedAccount.profitTargetPct}
            status={profitStatus}
            isMaster={isMaster}
          />

          <AccountMetricCard
            type="daily-drawdown"
            title="Maximum Daily Loss"
            subtitle={`Limit: ${selectedAccount.dailyDrawdownLimitPct}% ($${maxDailyLossDollar.toLocaleString()})`}
            currentValue={selectedAccount.currentDailyLoss}
            targetValue={maxDailyLossDollar}
            currentPct={(selectedAccount.currentDailyLoss / selectedAccount.initialBalance) * 100}
            limitPct={selectedAccount.dailyDrawdownLimitPct}
            status={dailyStatus}
            isLossMetric
          />

          <AccountMetricCard
            type="max-drawdown"
            title="Maximum Overall Loss"
            subtitle={`Limit: ${selectedAccount.maxDrawdownLimitPct}% ($${maxLossDollar.toLocaleString()})`}
            currentValue={selectedAccount.currentMaxDrawdown}
            targetValue={maxLossDollar}
            currentPct={(selectedAccount.currentMaxDrawdown / selectedAccount.initialBalance) * 100}
            limitPct={selectedAccount.maxDrawdownLimitPct}
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
            <h3 className="text-sm font-extrabold text-slate-900">All Accounts & Challenges</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Click any account below to switch your active dashboard view or rename account labels
            </p>
          </div>
          <button
            onClick={() => setIsNewAccountOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm"
          >
            <Plus size={13} />
            <span>Add Another Account</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map(acc => {
            const isSelected = acc.id === selectedAccountId;
            const isProfit = acc.pnl >= 0;

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
                    <span className="text-sm font-extrabold text-slate-900">{acc.firmName}</span>
                    <span className="text-xs font-mono font-bold text-blue-600">{acc.accountNumber}</span>
                  </div>

                  <span
                    className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
                    style={{
                      background:
                        acc.status === 'Passed'
                          ? '#f0fdf4'
                          : acc.status === 'Not Passed' || acc.isBreached
                          ? '#fef2f2'
                          : '#eff6ff',
                      color:
                        acc.status === 'Passed'
                          ? '#16a34a'
                          : acc.status === 'Not Passed' || acc.isBreached
                          ? '#dc2626'
                          : '#2563eb',
                      border: `1px solid ${
                        acc.status === 'Passed'
                          ? '#bbf7d0'
                          : acc.status === 'Not Passed' || acc.isBreached
                          ? '#fecaca'
                          : '#bfdbfe'
                      }`,
                    }}
                  >
                    {acc.phase} • {acc.status}
                  </span>
                </div>

                <div className="flex items-baseline justify-between mt-2 pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-lg font-extrabold font-mono text-slate-900 block">
                      ${acc.currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-xs font-medium text-slate-500">
                      ${(acc.accountSize / 1000).toFixed(0)}k {acc.modelType}
                    </span>
                  </div>

                  <div className="text-right">
                    <span
                      className="text-sm font-extrabold font-mono block"
                      style={{ color: isProfit ? '#16a34a' : '#dc2626' }}
                    >
                      {isProfit ? '+' : ''}${acc.pnl.toFixed(2)}
                    </span>
                    <span
                      className="text-xs font-bold"
                      style={{ color: isProfit ? '#16a34a' : '#dc2626' }}
                    >
                      ({isProfit ? '+' : ''}{acc.currentProfitPct.toFixed(2)}%)
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-blue-600 pt-2 border-t border-slate-50">
                  <span>{isSelected ? '✓ Currently Selected' : 'Click to view dashboard'}</span>
                  <ChevronRight size={13} />
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
