import React from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon, Clock } from 'lucide-react';
import type { Account } from '../../data/accountTypes';
import type { Trade } from '../../data/types';
import { useTheme } from '../../data/ThemeContext';

interface DailyDrawdownTrackerProps {
  account: Account;
  trades: Trade[];
}

export const DailyDrawdownTracker: React.FC<DailyDrawdownTrackerProps> = ({ account, trades }) => {
  const { isDayMode } = useTheme();
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTrades = trades.filter(t => t.date === todayStr && t.status === 'CLOSED');

  const todayPnl = account.todayPnl !== undefined ? account.todayPnl : todayTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const todayWins = todayTrades.filter(t => t.result === 'WIN').length;
  const todayLosses = todayTrades.filter(t => t.result === 'LOSS').length;

  const currentLoss = todayPnl < 0 ? Math.abs(todayPnl) : 0;
  const currentLossPct = (currentLoss / account.initialBalance) * 100;
  const dailyLimitPct = account.propDetails?.dailyDrawdownLimitPct || 5;
  const dailyLimitDollar = account.initialBalance * (dailyLimitPct / 100);
  const bufferDollar = Math.max(0, dailyLimitDollar - currentLoss);
  const bufferPct = Math.max(0, dailyLimitPct - currentLossPct);

  const usedPctOfLimit = Math.min(100, (currentLoss / dailyLimitDollar) * 100);
  const isBreached = currentLoss >= dailyLimitDollar;
  const isWarning = usedPctOfLimit >= 70 && !isBreached;

  const cardBg = isDayMode ? 'bg-white border-[#E5E4E2] text-[#111827]' : 'bg-[#131418] border-[#1E2026] text-white';
  const subCardBg = isDayMode ? 'bg-[#F9FAFB] border-[#E5E4E2]' : 'bg-[#0F1013] border-[#1E2026]';
  const textPrimary = isDayMode ? 'text-[#111827]' : 'text-white';
  const textSecondary = isDayMode ? 'text-[#6B7280]' : 'text-[#8E95A5]';
  const textMuted = isDayMode ? 'text-[#9CA3AF]' : 'text-[#525866]';

  return (
    <div
      className={`rounded-xl p-5 border shadow-xs transition-all ${cardBg}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: isBreached
                ? isDayMode ? '#FEE2E2' : '#2D1416'
                : isWarning
                ? isDayMode ? '#FEF3C7' : '#2A1D0E'
                : isDayMode ? '#DCFCE7' : '#0E291E',
            }}
          >
            {isBreached ? (
              <AlertOctagon size={16} className={isDayMode ? 'text-[#DC2626]' : 'text-[#F87171]'} />
            ) : isWarning ? (
              <AlertTriangle size={16} className="text-amber-500" />
            ) : (
              <ShieldCheck size={16} className={isDayMode ? 'text-[#059669]' : 'text-[#10B981]'} />
            )}
          </div>
          <div>
            <h3 className={`text-xs font-bold uppercase tracking-wider ${textPrimary}`}>Daily Risk & Drawdown Monitor</h3>
            <p className={`text-[11px] font-medium ${textSecondary}`}>
              Resets every trading day at 00:00 UTC / 17:00 EST
            </p>
          </div>
        </div>

        <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border ${subCardBg} ${textSecondary}`}>
          <Clock size={12} className="text-[#5D5FEF]" />
          <span className="font-mono text-[11px]">{todayStr}</span>
        </div>
      </div>

      {/* Main Barometer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {/* Today's Net PnL */}
        <div className={`p-3.5 rounded-lg border ${subCardBg}`}>
          <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${textSecondary}`}>Today's Net P&L</span>
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-xl font-black font-mono ${textPrimary}`}
            >
              {todayPnl >= 0 ? '+' : ''}${todayPnl.toFixed(2)}
            </span>
            <span
              className={`text-xs font-bold ${
                todayPnl >= 0
                  ? isDayMode ? 'text-[#059669]' : 'text-[#10B981]'
                  : isDayMode ? 'text-[#DC2626]' : 'text-[#F87171]'
              }`}
            >
              ({(todayPnl / account.initialBalance * 100).toFixed(2)}%)
            </span>
          </div>
          <span className={`text-[10px] font-medium mt-0.5 block ${textMuted}`}>
            {todayTrades.length} trades ({todayWins}W / {todayLosses}L)
          </span>
        </div>

        {/* Daily Drawdown Used */}
        <div className={`p-3.5 rounded-lg border ${subCardBg}`}>
          <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${textSecondary}`}>Daily Loss Used</span>
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-xl font-black font-mono ${textPrimary}`}
            >
              -${currentLoss.toFixed(2)}
            </span>
            <span className={`text-[11px] ${textSecondary}`}>
              / max -${dailyLimitDollar.toLocaleString()} ({dailyLimitPct}%)
            </span>
          </div>
          <span className={`text-[10px] font-medium mt-0.5 block ${textMuted}`}>
            {usedPctOfLimit.toFixed(1)}% consumed
          </span>
        </div>

        {/* Safety Buffer Remaining */}
        <div className={`p-3.5 rounded-lg border ${subCardBg}`}>
          <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${textSecondary}`}>Safety Buffer Left</span>
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-xl font-black font-mono ${
                bufferPct <= 1.5
                  ? isDayMode ? 'text-[#DC2626]' : 'text-[#F87171]'
                  : isDayMode ? 'text-[#059669]' : 'text-[#10B981]'
              }`}
            >
              ${bufferDollar.toFixed(2)}
            </span>
            <span
              className={`text-xs font-bold ${
                bufferPct <= 1.5
                  ? isDayMode ? 'text-[#DC2626]' : 'text-[#F87171]'
                  : isDayMode ? 'text-[#059669]' : 'text-[#10B981]'
              }`}
            >
              ({bufferPct.toFixed(2)}%)
            </span>
          </div>
          <span className={`text-[10px] font-medium mt-0.5 block ${textMuted}`}>
            {bufferPct <= 1.5 ? 'Warning: Near daily limit' : 'Safe operating zone'}
          </span>
        </div>
      </div>

      {/* Large Horizontal Gauge Bar */}
      <div>
        <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
          <span className={`text-[11px] ${textSecondary}`}>Daily Drawdown Gauge</span>
          <span
            className="font-bold text-[11px]"
            style={{
              color: isBreached
                ? isDayMode ? '#DC2626' : '#F87171'
                : isWarning
                ? '#D97706'
                : isDayMode ? '#059669' : '#10B981',
            }}
          >
            {isBreached ? 'LIMIT BREACHED' : isWarning ? 'CAUTION: RISK LEVEL HIGH' : 'NORMAL RISK LEVEL'}
          </span>
        </div>
        <div className={`w-full h-2 rounded-full overflow-hidden border ${isDayMode ? 'bg-[#E5E4E2] border-[#E5E4E2]' : 'bg-[#0B0C0E] border-[#1E2026]'}`}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.max(2, Math.min(100, usedPctOfLimit))}%`,
              background: isBreached
                ? isDayMode ? '#DC2626' : '#F87171'
                : isWarning
                ? '#D97706'
                : isDayMode ? '#059669' : '#10B981',
            }}
          />
        </div>
      </div>
    </div>
  );
};
