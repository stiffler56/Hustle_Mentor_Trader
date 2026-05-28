import React from 'react';
import { Link } from 'react-router';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from 'recharts';
import { TrendingUp, TrendingDown, Zap, Target, Activity, ArrowRight, Sun, Moon } from 'lucide-react';
import { useTradesContext } from '../data/TradesContext';
import { useTheme } from '../data/ThemeContext';
import type { Trade } from '../data/types';

function StatCard({
  label, value, sub, positive, icon: Icon,
}: {
  label: string;
  value: string;
  sub?: string;
  positive?: boolean;
  icon: React.ElementType;
}) {
  const { colors } = useTheme();
  return (
    <div className="rounded-xl p-4" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: colors.textMuted }}>{label}</p>
          <p className="text-2xl" style={{ color: positive === undefined ? colors.text : positive ? '#10b981' : '#f87171' }}>
            {value}
          </p>
          {sub && <p className="text-xs mt-1" style={{ color: colors.textMuted }}>{sub}</p>}
        </div>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.1)' }}>
          <Icon size={18} style={{ color: '#f59e0b' }} />
        </div>
      </div>
    </div>
  );
}

function DecisionBadge({ decision }: { decision: string }) {
  const colorMap: Record<string, { bg: string; color: string }> = {
    TAKE: { bg: 'rgba(16,185,129,0.15)', color: '#10b981' },
    WAIT: { bg: 'rgba(234,179,8,0.15)', color: '#eab308' },
    PASS: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444' },
  };
  const c = colorMap[decision] ?? colorMap.PASS;
  return (
    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: c.bg, color: c.color }}>
      {decision}
    </span>
  );
}

function ResultBadge({ result }: { result?: string }) {
  const { colors } = useTheme();
  if (!result) return <span className="text-xs" style={{ color: colors.textMuted }}>-</span>;
  const colorMap: Record<string, { bg: string; color: string }> = {
    WIN: { bg: 'rgba(16,185,129,0.15)', color: '#10b981' },
    LOSS: { bg: 'rgba(239,68,68,0.15)', color: '#f87171' },
    BE: { bg: 'rgba(96,165,250,0.15)', color: '#60a5fa' },
  };
  const c = colorMap[result] ?? colorMap.BE;
  return (
    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: c.bg, color: c.color }}>
      {result}
    </span>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  const { colors } = useTheme();
  if (active && payload?.length) {
    return (
      <div className="rounded-lg p-3 text-xs" style={{ background: colors.surface, border: `1px solid ${colors.border}`, color: colors.text }}>
        <p style={{ color: colors.textSub }} className="mb-1">{label}</p>
        <p style={{ color: payload[0].value >= 0 ? '#10b981' : '#f87171' }}>
          P&L: ${payload[0].value >= 0 ? '+' : ''}{payload[0].value}
        </p>
      </div>
    );
  }
  return null;
}

export default function Dashboard() {
  const { trades } = useTradesContext();
  const { isDayMode, toggleTheme, colors } = useTheme();

  const closed = trades.filter(t => t.status === 'CLOSED' && t.result);
  const totalPnL = closed.reduce((acc, t) => acc + (t.pnl ?? 0), 0);
  const wins = closed.filter(t => t.result === 'WIN').length;
  const winRate = closed.length ? Math.round((wins / closed.length) * 100) : 0;
  const avgScore = closed.length ? Math.round(closed.reduce((a, t) => a + t.score, 0) / closed.length) : 0;

  // Cumulative P&L chart
  const sorted = [...closed].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  let cum = 0;
  const pnlChartData = sorted.map((t, idx) => {
    cum += t.pnl ?? 0;
    return {
      idx,
      label: new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      pnl: Math.round(cum),
    };
  });

  // Session win rates
  const sessions = ['New York', 'London', 'Tokyo', 'Sydney'] as const;
  const sessionData = sessions.map(s => {
    const st = closed.filter(t => t.session === s);
    const sw = st.filter(t => t.result === 'WIN').length;
    return { session: s === 'New York' ? 'NY' : s === 'London' ? 'LDN' : s.slice(0, 3), wr: st.length ? Math.round((sw / st.length) * 100) : 0, count: st.length };
  }).filter(d => d.count > 0);

  const recentTrades = trades.slice(0, 6);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* ── Header (selected element) ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl" style={{ color: colors.text }}>Performance Dashboard</h1>
          <p className="text-sm" style={{ color: colors.textMuted }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Day / Night toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all hover:opacity-90 hidden sm:flex"
            style={{
              background: isDayMode ? 'rgba(251,191,36,0.1)' : 'rgba(96,165,250,0.08)',
              border: `1px solid ${isDayMode ? 'rgba(251,191,36,0.3)' : 'rgba(96,165,250,0.2)'}`,
              color: isDayMode ? '#f59e0b' : '#93c5fd',
            }}
            title={isDayMode ? 'Switch to Night Mode' : 'Switch to Day Mode'}
          >
            {isDayMode ? <Sun size={14} /> : <Moon size={14} />}
            <span>{isDayMode ? 'Day' : 'Night'}</span>
          </button>

          <Link
            to="/scorer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#000' }}
          >
            <Zap size={14} />
            Score a Trade
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total P&L"
          value={`${totalPnL >= 0 ? '+' : ''}$${totalPnL.toLocaleString()}`}
          sub={`${closed.length} closed trades`}
          positive={totalPnL >= 0}
          icon={TrendingUp}
        />
        <StatCard
          label="Win Rate"
          value={`${winRate}%`}
          sub={`${wins}W / ${closed.length - wins}L`}
          positive={winRate >= 50}
          icon={Target}
        />
        <StatCard
          label="Total Trades"
          value={`${trades.length}`}
          sub={`${trades.filter(t => t.status === 'OPEN').length} open`}
          icon={Activity}
        />
        <StatCard
          label="Avg Score"
          value={`${avgScore}`}
          sub={`/ 100 quality`}
          positive={avgScore >= 70}
          icon={TrendingDown}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* P&L Curve */}
        <div className="lg:col-span-2 rounded-xl p-4" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
          <p className="text-sm mb-4" style={{ color: colors.textSub }}>Cumulative P&L</p>
          {pnlChartData.length > 1 ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={pnlChartData}>
                <XAxis
                  dataKey="idx"
                  tickFormatter={(v: number) => pnlChartData[v]?.label ?? ''}
                  tick={{ fontSize: 10, fill: colors.textMuted }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 10, fill: colors.textMuted }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone" dataKey="pnl" stroke={totalPnL >= 0 ? '#10b981' : '#f87171'}
                  strokeWidth={2} dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex items-center justify-center" style={{ color: colors.textMuted }}>
              <p className="text-sm">Log more trades to see your curve</p>
            </div>
          )}
        </div>

        {/* Session Win Rate */}
        <div className="rounded-xl p-4" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
          <p className="text-sm mb-4" style={{ color: colors.textSub }}>Win Rate by Session</p>
          {sessionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={sessionData} layout="vertical">
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: colors.textMuted }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                <YAxis type="category" dataKey="session" tick={{ fontSize: 11, fill: colors.textSub }} axisLine={false} tickLine={false} width={30} />
                <Tooltip formatter={(v: any) => [`${v}%`, 'Win Rate']} contentStyle={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 12, color: colors.text }} />
                <Bar dataKey="wr" radius={[0, 4, 4, 0]}>
                  {sessionData.map((entry) => (
                    <Cell key={`session-${entry.session}`} fill={entry.wr >= 55 ? '#10b981' : entry.wr >= 40 ? '#f59e0b' : '#f87171'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex items-center justify-center" style={{ color: colors.textMuted }}>
              <p className="text-sm">No data yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Trades */}
      <div className="rounded-xl" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${colors.border}` }}>
          <p className="text-sm" style={{ color: colors.textSub }}>Recent Trades</p>
          <Link to="/journal" className="flex items-center gap-1 text-xs hover:opacity-80" style={{ color: '#f59e0b' }}>
            View all <ArrowRight size={12} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                {['Date', 'Pair', 'Session', 'Score', 'Decision', 'Result', 'P&L'].map(h => (
                  <th key={h} className="px-4 py-2 text-left text-xs uppercase tracking-wider" style={{ color: colors.textMuted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentTrades.map((t: Trade) => (
                <tr key={t.id} style={{ borderBottom: `1px solid ${colors.rowBorder}` }} className="hover:bg-black/[0.02] transition-colors">
                  <td className="px-4 py-3 text-xs" style={{ color: colors.textSub }}>{t.date}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: colors.text }}>{t.pair}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: colors.textSub }}>{t.session}</td>
                  <td className="px-4 py-3">
                    <span className="text-sm" style={{ color: t.score >= 75 ? '#10b981' : t.score >= 55 ? '#eab308' : '#f87171' }}>
                      {t.score}
                    </span>
                  </td>
                  <td className="px-4 py-3"><DecisionBadge decision={t.decision} /></td>
                  <td className="px-4 py-3"><ResultBadge result={t.result} /></td>
                  <td className="px-4 py-3 text-sm" style={{ color: (t.pnl ?? 0) >= 0 ? '#10b981' : '#f87171' }}>
                    {t.pnl !== undefined ? `${t.pnl >= 0 ? '+' : ''}$${t.pnl}` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
