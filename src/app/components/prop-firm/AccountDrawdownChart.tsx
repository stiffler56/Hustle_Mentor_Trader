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

interface AccountDrawdownChartProps {
  account: Account;
  trades: Trade[];
}

export const AccountDrawdownChart: React.FC<AccountDrawdownChartProps> = ({ account, trades }) => {
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

  return (
    <div
      className="rounded-2xl p-6 bg-white border border-slate-200 shadow-sm"
      style={{
        boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)',
      }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Balance & Equity Curve</h3>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Account performance relative to starting capital (${initialBalance.toLocaleString()})
            {profitTarget ? `, profit target ($${profitTarget.toLocaleString()})` : ''}
            {isProp ? `, and drawdown floor ($${targetFloor.toLocaleString()})` : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <span>Balance Curve</span>
          </div>
          {profitTarget && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <div className="w-3 h-0.5 bg-emerald-600" />
              <span>Target: ${profitTarget.toLocaleString()}</span>
            </div>
          )}
          {isProp && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">
              <div className="w-3 h-0.5 bg-red-600" />
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
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="label"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
            />
            <YAxis
              domain={[yMin, yMax]}
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                fontSize: '12px',
                color: '#0f172a',
                boxShadow: '0 10px 25px rgba(15, 23, 42, 0.1)',
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
              stroke="#94a3b8"
              strokeDasharray="3 3"
              label={{
                value: `Initial: $${initialBalance.toLocaleString()}`,
                fill: '#64748b',
                fontSize: 10,
                position: 'insideBottomLeft',
              }}
            />

            {/* Profit Target Line */}
            {profitTarget && (
              <ReferenceLine
                y={profitTarget}
                stroke="#16a34a"
                strokeDasharray="4 4"
                label={{
                  value: `Target: $${profitTarget.toLocaleString()}`,
                  fill: '#16a34a',
                  fontSize: 10,
                  position: 'insideTopRight',
                }}
              />
            )}

            {/* Max Drawdown Floor Line */}
            {isProp && (
              <ReferenceLine
                y={targetFloor}
                stroke="#dc2626"
                strokeDasharray="4 4"
                label={{
                  value: `Max Loss Floor: $${targetFloor.toLocaleString()}`,
                  fill: '#dc2626',
                  fontSize: 10,
                  position: 'insideBottomRight',
                }}
              />
            )}

            <Area
              type="monotone"
              dataKey="balance"
              stroke="#2563eb"
              strokeWidth={2.5}
              fill="url(#blueBalanceGrad)"
              dot={{ r: 4, fill: '#2563eb', stroke: '#ffffff', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: '#1d4ed8' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
