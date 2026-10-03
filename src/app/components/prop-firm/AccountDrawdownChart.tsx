import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import type { Account } from '../../data/accountTypes';
import type { Trade } from '../../data/types';
import { useTheme } from '../../data/ThemeContext';

interface AccountDrawdownChartProps {
  account: Account;
  trades: Trade[];
}

export const AccountDrawdownChart: React.FC<AccountDrawdownChartProps> = ({ account, trades }) => {
  const { isDayMode } = useTheme();
  const chartData = useMemo(() => {
    const sortedTrades = [...trades]
      .filter(t => t.status === 'CLOSED')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (sortedTrades.length === 0) {
      return [
        { label: 'Start', balance: account.initialBalance, equity: account.initialBalance, pnl: 0, date: account.startDate },
        { label: 'Current', balance: account.currentBalance, equity: account.currentEquity || account.currentBalance, pnl: account.totalPnl, date: 'Now' },
      ];
    }

    let runningBalance = account.initialBalance;
    const points = [
      {
        label: 'Start',
        balance: account.initialBalance,
        equity: account.initialBalance,
        pnl: 0,
        date: account.startDate,
      },
    ];

    sortedTrades.forEach((trade, index) => {
      runningBalance += (trade.pnl || 0);
      points.push({
        label: `T${index + 1}`,
        balance: Number(runningBalance.toFixed(2)),
        equity: Number(runningBalance.toFixed(2)),
        pnl: trade.pnl || 0,
        date: trade.date,
      });
    });

    return points;
  }, [account, trades]);

  const initialBalance = account.initialBalance;
  const isProp = account.category.startsWith('prop');
  const maxDdPct = account.propDetails?.maxDrawdownLimitPct || 10;
  const profitTargetPct = account.propDetails?.profitTargetPct || 0;

  const targetFloor = isProp ? initialBalance * (1 - maxDdPct / 100) : initialBalance * 0.9;
  const profitTarget = isProp && profitTargetPct > 0 ? initialBalance * (1 + profitTargetPct / 100) : null;

  const minBal = Math.min(...chartData.map(d => d.balance), isProp ? targetFloor : initialBalance * 0.95);
  const maxBal = Math.max(...chartData.map(d => d.balance), profitTarget || initialBalance * 1.05);
  const yMin = Math.floor(minBal * 0.98);
  const yMax = Math.ceil(maxBal * 1.02);

  const cardBg = isDayMode ? 'bg-white border-[#E5E4E2] text-[#111827]' : 'bg-[#131418] border-[#1E2026] text-white';
  const textPrimary = isDayMode ? 'text-[#111827]' : 'text-white';
  const textSecondary = isDayMode ? 'text-[#6B7280]' : 'text-[#8E95A5]';
  const gridLineColor = isDayMode ? '#E5E4E2' : '#1E2026';

  return (
    <div
      className={`rounded-xl p-5 border shadow-xs transition-all ${cardBg}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h3 className={`text-xs font-bold uppercase tracking-wider ${textPrimary}`}>Balance & Equity Curve</h3>
          <p className={`text-[11px] mt-0.5 font-medium ${textSecondary}`}>
            Account performance relative to starting capital (${initialBalance.toLocaleString()})
            {profitTarget ? `, profit target ($${profitTarget.toLocaleString()})` : ''}
            {isProp ? `, and drawdown floor ($${targetFloor.toLocaleString()})` : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${isDayMode ? 'bg-[#EEF0FF] text-[#5D5FEF] border-[#5D5FEF]/30' : 'bg-[#181A20] text-white border-[#1E2026]'}`}>
            <div className="w-2 h-2 rounded-full bg-[#5D5FEF]" />
            <span>Balance Curve</span>
          </div>
          {profitTarget && (
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${isDayMode ? 'bg-[#DCFCE7] text-[#059669] border-[#86EFAC]' : 'bg-[#0E291E] text-[#10B981] border-[#144634]'}`}>
              <div className={`w-2.5 h-0.5 ${isDayMode ? 'bg-[#059669]' : 'bg-[#10B981]'}`} />
              <span>Target: ${profitTarget.toLocaleString()}</span>
            </div>
          )}
          {isProp && (
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${isDayMode ? 'bg-[#FEE2E2] text-[#DC2626] border-[#FCA5A5]' : 'bg-[#2D1416] text-[#F87171] border-[#4C1D24]'}`}>
              <div className={`w-2.5 h-0.5 ${isDayMode ? 'bg-[#DC2626]' : 'bg-[#F87171]'}`} />
              <span>Floor: ${targetFloor.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="blueBalanceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#5D5FEF" stopOpacity={0.4} />
                <stop offset="95%" stopColor={isDayMode ? '#FFFFFF' : '#0B0C0E'} stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="label"
              stroke={isDayMode ? '#9CA3AF' : '#525866'}
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: gridLineColor }}
            />
            <YAxis
              domain={[yMin, yMax]}
              stroke={isDayMode ? '#9CA3AF' : '#525866'}
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: gridLineColor }}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: isDayMode ? '#FFFFFF' : '#131418',
                border: `1px solid ${gridLineColor}`,
                borderRadius: '8px',
                fontSize: '12px',
                color: isDayMode ? '#111827' : '#FFFFFF',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                fontWeight: 600,
              }}
              formatter={(val: any, name: any) => {
                if (name === 'balance') return [`$${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Balance'];
                return [val, name];
              }}
              labelFormatter={(label, payload) => {
                const item = payload?.[0]?.payload;
                return item ? `${label} (${item.date})` : label;
              }}
            />

            {/* Starting Balance Line */}
            <ReferenceLine
              y={initialBalance}
              stroke={isDayMode ? '#9CA3AF' : '#525866'}
              strokeDasharray="3 3"
              label={{
                value: `Initial: $${initialBalance.toLocaleString()}`,
                fill: isDayMode ? '#6B7280' : '#8E95A5',
                fontSize: 10,
                position: 'insideBottomLeft',
              }}
            />

            {/* Profit Target Line */}
            {profitTarget && (
              <ReferenceLine
                y={profitTarget}
                stroke={isDayMode ? '#059669' : '#10B981'}
                strokeDasharray="4 4"
                label={{
                  value: `Target: $${profitTarget.toLocaleString()}`,
                  fill: isDayMode ? '#059669' : '#10B981',
                  fontSize: 10,
                  position: 'insideTopLeft',
                }}
              />
            )}

            {/* Max Drawdown Floor Line */}
            {isProp && (
              <ReferenceLine
                y={targetFloor}
                stroke={isDayMode ? '#DC2626' : '#F87171'}
                strokeDasharray="4 4"
                label={{
                  value: `Drawdown Floor: $${targetFloor.toLocaleString()}`,
                  fill: isDayMode ? '#DC2626' : '#F87171',
                  fontSize: 10,
                  position: 'insideBottomLeft',
                }}
              />
            )}

            <Area
              type="monotone"
              dataKey="balance"
              stroke="#5D5FEF"
              strokeWidth={2.5}
              fill="url(#blueBalanceGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
