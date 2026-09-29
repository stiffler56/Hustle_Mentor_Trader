import React from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon, Clock } from 'lucide-react';
import type { PropAccount } from '../../data/accountTypes';
import type { Trade } from '../../data/types';

interface DailyDrawdownTrackerProps {
  account: PropAccount;
  trades: Trade[];
}

export const DailyDrawdownTracker: React.FC<DailyDrawdownTrackerProps> = ({ account, trades }) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTrades = trades.filter(t => t.date === todayStr && t.status === 'CLOSED');

  const todayPnl = todayTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const todayWins = todayTrades.filter(t => t.result === 'WIN').length;
  const todayLosses = todayTrades.filter(t => t.result === 'LOSS').length;

  const currentLoss = todayPnl < 0 ? Math.abs(todayPnl) : 0;
  const currentLossPct = (currentLoss / account.initialBalance) * 100;
  const dailyLimitDollar = account.initialBalance * (account.dailyDrawdownLimitPct / 100);
  const bufferDollar = Math.max(0, dailyLimitDollar - currentLoss);
  const bufferPct = Math.max(0, account.dailyDrawdownLimitPct - currentLossPct);

  const usedPctOfLimit = Math.min(100, (currentLoss / dailyLimitDollar) * 100);
  const isBreached = currentLoss >= dailyLimitDollar;
  const isWarning = usedPctOfLimit >= 70 && !isBreached;

  return (
    <div
      className="rounded-2xl p-6 bg-white border border-slate-200 shadow-sm"
      style={{
        boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)',
      }}
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: isBreached ? '#fef2f2' : isWarning ? '#fffbeb' : '#eff6ff',
            }}
          >
            {isBreached ? (
              <AlertOctagon size={18} className="text-red-600" />
            ) : isWarning ? (
              <AlertTriangle size={18} className="text-amber-600" />
            ) : (
              <ShieldCheck size={18} className="text-blue-600" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Daily Loss Limit Monitor</h3>
            <p className="text-xs text-slate-500 font-medium">
              Resets every trading day at 00:00 UTC / 17:00 EST
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
          <Clock size={13} className="text-blue-600" />
          <span className="font-mono">{todayStr}</span>
        </div>
      </div>

      {/* Main Barometer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        {/* Today's Net PnL */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 block mb-1">Today's Net P&L</span>
          <div className="flex items-baseline gap-1.5">
            <span
              className="text-2xl font-extrabold font-mono"
              style={{ color: todayPnl > 0 ? '#16a34a' : todayPnl < 0 ? '#dc2626' : '#2563eb' }}
            >
              {todayPnl >= 0 ? '+' : ''}${todayPnl.toFixed(2)}
            </span>
            <span
              className="text-xs font-bold"
              style={{ color: todayPnl > 0 ? '#16a34a' : todayPnl < 0 ? '#dc2626' : '#64748b' }}
            >
              ({(todayPnl / account.initialBalance * 100).toFixed(2)}%)
            </span>
          </div>
          <span className="text-[11px] font-medium text-slate-500 mt-1 block">
            {todayTrades.length} trades ({todayWins}W / {todayLosses}L)
          </span>
        </div>

        {/* Daily Drawdown Used */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 block mb-1">Daily Loss Used</span>
          <div className="flex items-baseline gap-1.5">
            <span
              className="text-2xl font-extrabold font-mono"
              style={{ color: currentLoss > 0 ? '#dc2626' : '#2563eb' }}
            >
              -${currentLoss.toFixed(2)}
            </span>
            <span className="text-xs font-medium text-slate-500">
              / max -${dailyLimitDollar.toLocaleString()} ({account.dailyDrawdownLimitPct}%)
            </span>
          </div>
          <span className="text-[11px] font-medium text-slate-500 mt-1 block">
            {usedPctOfLimit.toFixed(1)}% of daily allowance consumed
          </span>
        </div>

        {/* Safety Buffer Remaining */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 block mb-1">Safety Buffer Left Today</span>
          <div className="flex items-baseline gap-1.5">
            <span
              className="text-2xl font-extrabold font-mono"
              style={{ color: bufferPct <= 1.5 ? '#dc2626' : '#2563eb' }}
            >
              ${bufferDollar.toFixed(2)}
            </span>
            <span
              className="text-xs font-bold"
              style={{ color: bufferPct <= 1.5 ? '#dc2626' : '#2563eb' }}
            >
              ({bufferPct.toFixed(2)}% left)
            </span>
          </div>
          <span className="text-[11px] font-medium text-slate-500 mt-1 block">
            {isBreached ? 'RULE BREACHED' : isWarning ? 'WARNING: Low risk buffer' : 'Account in safe territory'}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-semibold text-slate-700">
          <span>Daily Risk Used: {usedPctOfLimit.toFixed(1)}%</span>
          <span>Max Allowed: ${dailyLimitDollar.toLocaleString()} (100%)</span>
        </div>
        <div className="w-full h-2.5 rounded-full overflow-hidden bg-slate-100 border border-slate-200">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.max(3, usedPctOfLimit)}%`,
              background: isBreached
                ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                : isWarning
                ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                : 'linear-gradient(90deg, #3b82f6, #2563eb)',
            }}
          />
        </div>
      </div>
    </div>
  );
};
