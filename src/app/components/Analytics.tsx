import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { Trade } from '../data/trades';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Brain } from 'lucide-react';

interface AnalyticsProps {
  trades: Trade[];
}

const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b'];

function StatCard({ label, value, sub, color = 'text-white' }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-semibold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-white text-sm mb-4 flex items-center gap-2">{children}</h3>;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1a1a27] border border-[#2a2a3d] rounded-xl px-3 py-2 text-xs">
        <p className="text-gray-400 mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }}>{p.name}: {typeof p.value === 'number' && p.value % 1 !== 0 ? p.value.toFixed(1) : p.value}{p.name.includes('%') || p.name === 'Win Rate' ? '%' : ''}</p>
        ))}
      </div>
    );
  }
  return null;
};

export function Analytics({ trades }: AnalyticsProps) {
  const closedTrades = trades.filter(t => t.result !== null);

  const stats = useMemo(() => {
    const wins = closedTrades.filter(t => t.result === 'WIN');
    const losses = closedTrades.filter(t => t.result === 'LOSS');
    const winRate = closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0;
    const totalPnl = closedTrades.reduce((s, t) => s + (t.pnl ?? 0), 0);
    const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + (t.pnl ?? 0), 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? losses.reduce((s, t) => s + (t.pnl ?? 0), 0) / losses.length : 0;
    return { winRate, totalPnl, avgWin, avgLoss, wins: wins.length, losses: losses.length };
  }, [closedTrades]);

  // P&L curve
  const pnlCurve = useMemo(() => {
    let running = 0;
    return [...trades]
      .filter(t => t.pnl !== null)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(t => {
        running += t.pnl ?? 0;
        return { date: new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), PnL: running };
      });
  }, [trades]);

  // By session
  const bySession = useMemo(() => {
    const map: Record<string, { wins: number; total: number; pnl: number }> = {};
    closedTrades.forEach(t => {
      if (!map[t.session]) map[t.session] = { wins: 0, total: 0, pnl: 0 };
      map[t.session].total++;
      if (t.result === 'WIN') map[t.session].wins++;
      map[t.session].pnl += t.pnl ?? 0;
    });
    return Object.entries(map).map(([session, d]) => ({
      session,
      'Win Rate': Math.round((d.wins / d.total) * 100),
      'P&L': d.pnl,
      Trades: d.total,
    }));
  }, [closedTrades]);

  // By confluences
  const byConfluences = useMemo(() => {
    const map: Record<number, { wins: number; total: number }> = {};
    closedTrades.forEach(t => {
      if (!map[t.confluences]) map[t.confluences] = { wins: 0, total: 0 };
      map[t.confluences].total++;
      if (t.result === 'WIN') map[t.confluences].wins++;
    });
    return Object.entries(map)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([conf, d]) => ({
        conf: `${conf} confluence${Number(conf) > 1 ? 's' : ''}`,
        'Win Rate': Math.round((d.wins / d.total) * 100),
        Trades: d.total,
      }));
  }, [closedTrades]);

  // By mental focus range
  const byMentalFocus = useMemo(() => {
    const ranges = [
      { label: '0-9', min: 0, max: 9 },
      { label: '10-19', min: 10, max: 19 },
      { label: '20-30', min: 20, max: 30 },
      { label: '31-40', min: 31, max: 40 },
    ];
    return ranges.map(r => {
      const group = closedTrades.filter(t => t.mentalFocus >= r.min && t.mentalFocus <= r.max);
      const wins = group.filter(t => t.result === 'WIN').length;
      const pnl = group.reduce((s, t) => s + (t.pnl ?? 0), 0);
      return {
        range: r.label,
        'Win Rate': group.length > 0 ? Math.round((wins / group.length) * 100) : 0,
        'Avg P&L': group.length > 0 ? Math.round(pnl / group.length) : 0,
        Trades: group.length,
      };
    }).filter(r => r.Trades > 0);
  }, [closedTrades]);

  // By strategy
  const byStrategy = useMemo(() => {
    const map: Record<string, { wins: number; total: number; pnl: number }> = {};
    closedTrades.forEach(t => {
      if (!map[t.strategy]) map[t.strategy] = { wins: 0, total: 0, pnl: 0 };
      map[t.strategy].total++;
      if (t.result === 'WIN') map[t.strategy].wins++;
      map[t.strategy].pnl += t.pnl ?? 0;
    });
    return Object.entries(map).map(([strategy, d]) => ({
      strategy: strategy.length > 12 ? strategy.slice(0, 12) + '…' : strategy,
      'Win Rate': Math.round((d.wins / d.total) * 100),
      'P&L': d.pnl,
      Trades: d.total,
    }));
  }, [closedTrades]);

  // By score range
  const byScoreRange = useMemo(() => {
    const ranges = [
      { label: '<55 (PASS)', min: 0, max: 54, decision: 'PASS' },
      { label: '55-74 (WAIT)', min: 55, max: 74, decision: 'WAIT' },
      { label: '75+ (TAKE)', min: 75, max: 100, decision: 'TAKE' },
    ];
    return ranges.map(r => {
      const group = closedTrades.filter(t => t.score >= r.min && t.score <= r.max);
      const wins = group.filter(t => t.result === 'WIN').length;
      const pnl = group.reduce((s, t) => s + (t.pnl ?? 0), 0);
      return {
        score: r.label,
        'Win Rate': group.length > 0 ? Math.round((wins / group.length) * 100) : 0,
        'Total P&L': pnl,
        Trades: group.length,
      };
    }).filter(r => r.Trades > 0);
  }, [closedTrades]);

  // Win/Loss pie
  const piData = [
    { name: 'Wins', value: stats.wins },
    { name: 'Losses', value: stats.losses },
    { name: 'Breakeven', value: closedTrades.filter(t => t.result === 'BREAKEVEN').length },
  ].filter(d => d.value > 0);

  // Key insights
  const insights = useMemo(() => {
    const list: { type: 'good' | 'bad' | 'warning'; text: string }[] = [];
    const nyGroup = closedTrades.filter(t => t.session === 'New York');
    const nyWR = nyGroup.length > 0 ? (nyGroup.filter(t => t.result === 'WIN').length / nyGroup.length) * 100 : 0;
    const lonGroup = closedTrades.filter(t => t.session === 'London');
    const lonWR = lonGroup.length > 0 ? (lonGroup.filter(t => t.result === 'WIN').length / lonGroup.length) * 100 : 0;
    const emotionalTrades = closedTrades.filter(t => t.mentalFocus < 10);
    const emotionalLosses = emotionalTrades.filter(t => t.result === 'LOSS').length;
    const highScoreTrades = closedTrades.filter(t => t.score >= 75);
    const highScoreWR = highScoreTrades.length > 0 ? (highScoreTrades.filter(t => t.result === 'WIN').length / highScoreTrades.length) * 100 : 0;
    const tripleConf = closedTrades.filter(t => t.confluences >= 3);
    const tripleWR = tripleConf.length > 0 ? (tripleConf.filter(t => t.result === 'WIN').length / tripleConf.length) * 100 : 0;

    if (nyWR >= 60) list.push({ type: 'good', text: `New York session: ${Math.round(nyWR)}% win rate — This is your edge. Stay here.` });
    if (lonWR < 45) list.push({ type: 'bad', text: `London session: only ${Math.round(lonWR)}% win rate. Stop trading London unless setup is 80+.` });
    if (emotionalTrades.length > 0) list.push({ type: 'bad', text: `${emotionalTrades.length} emotional trades (focus <10): ${emotionalLosses}/${emotionalTrades.length} losses. These are destroying your account.` });
    if (highScoreWR >= 60) list.push({ type: 'good', text: `Trades scored 75+: ${Math.round(highScoreWR)}% win rate — The scoring system works. Trust it.` });
    if (tripleWR >= 60) list.push({ type: 'good', text: `3+ confluences: ${Math.round(tripleWR)}% win rate. Every extra confluence matters.` });
    const xauTrades = closedTrades.filter(t => t.pair === 'XAUUSD');
    const xauWR = xauTrades.length > 0 ? (xauTrades.filter(t => t.result === 'WIN').length / xauTrades.length) * 100 : 0;
    if (xauTrades.length > 3) list.push({ type: xauWR >= 50 ? 'good' : 'warning', text: `XAUUSD: ${Math.round(xauWR)}% win rate across ${xauTrades.length} trades — your main pair.` });
    const highRisk = closedTrades.filter(t => t.riskPercent > 2);
    if (highRisk.length > 0) {
      const highRiskLosses = highRisk.filter(t => t.result === 'LOSS').length;
      list.push({ type: 'bad', text: `${highRisk.length} trades at 2%+ risk: ${highRiskLosses} losses. Optimal risk is 1-1.5%.` });
    }
    return list.slice(0, 6);
  }, [closedTrades]);

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Overall Win Rate"
          value={`${stats.winRate.toFixed(0)}%`}
          sub={`${stats.wins}W / ${stats.losses}L`}
          color={stats.winRate >= 55 ? 'text-emerald-400' : stats.winRate >= 40 ? 'text-amber-400' : 'text-red-400'}
        />
        <StatCard
          label="Total P&L"
          value={`${stats.totalPnl >= 0 ? '+' : ''}$${stats.totalPnl.toFixed(0)}`}
          color={stats.totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}
        />
        <StatCard
          label="Avg Win"
          value={`+$${stats.avgWin.toFixed(0)}`}
          color="text-emerald-400"
        />
        <StatCard
          label="Avg Loss"
          value={`$${stats.avgLoss.toFixed(0)}`}
          color="text-red-400"
        />
      </div>

      {/* P&L Curve */}
      <div className="bg-[#111118] border border-[#1e1e2e] rounded-2xl p-5">
        <SectionTitle><TrendingUp size={15} className="text-amber-400" /> Equity Curve</SectionTitle>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={pnlCurve}>
            <defs>
              <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
            <XAxis dataKey="date" tick={{ fill: '#6b6b7b', fontSize: 11 }} />
            <YAxis tick={{ fill: '#6b6b7b', fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="PnL" stroke="#10b981" strokeWidth={2} fill="url(#pnlGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* 2-col charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* By Session */}
        <div className="bg-[#111118] border border-[#1e1e2e] rounded-2xl p-5">
          <SectionTitle>📅 Win Rate by Session</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={bySession}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
              <XAxis dataKey="session" tick={{ fill: '#6b6b7b', fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fill: '#6b6b7b', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Win Rate" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* By Confluences */}
        <div className="bg-[#111118] border border-[#1e1e2e] rounded-2xl p-5">
          <SectionTitle>⚡ Win Rate by Confluences</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byConfluences}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
              <XAxis dataKey="conf" tick={{ fill: '#6b6b7b', fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fill: '#6b6b7b', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Win Rate" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* By Mental Focus */}
        <div className="bg-[#111118] border border-[#1e1e2e] rounded-2xl p-5">
          <SectionTitle><Brain size={15} className="text-amber-400" /> Mental Focus Impact</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byMentalFocus}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
              <XAxis dataKey="range" tick={{ fill: '#6b6b7b', fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fill: '#6b6b7b', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Win Rate" fill="#a855f7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Win/Loss Pie */}
        <div className="bg-[#111118] border border-[#1e1e2e] rounded-2xl p-5">
          <SectionTitle>🎯 Trade Outcomes</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={piData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3}>
                {piData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
              <Legend
                iconType="circle"
                formatter={(v) => <span style={{ color: '#9ca3af', fontSize: 12 }}>{v}</span>}
              />
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* By Score Range */}
      <div className="bg-[#111118] border border-[#1e1e2e] rounded-2xl p-5">
        <SectionTitle>📊 Score Range vs Win Rate</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {byScoreRange.map(r => {
            const color = r['Win Rate'] >= 60 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
              r['Win Rate'] >= 40 ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
              'text-red-400 bg-red-500/10 border-red-500/20';
            return (
              <div key={r.score} className={`border rounded-xl p-4 ${color}`}>
                <p className="text-xs opacity-70 mb-1">{r.score}</p>
                <p className="text-3xl font-semibold">{r['Win Rate']}%</p>
                <p className="text-xs opacity-70 mt-1">{r.Trades} trades · ${r['Total P&L'] >= 0 ? '+' : ''}{r['Total P&L']}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Strategy */}
      <div className="bg-[#111118] border border-[#1e1e2e] rounded-2xl p-5">
        <SectionTitle>🎨 Win Rate by Strategy</SectionTitle>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={byStrategy} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
            <XAxis type="number" domain={[0, 100]} tick={{ fill: '#6b6b7b', fontSize: 11 }} />
            <YAxis dataKey="strategy" type="category" tick={{ fill: '#9ca3af', fontSize: 11 }} width={90} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="Win Rate" fill="#f59e0b" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Mentor Insights */}
      <div className="bg-[#111118] border border-[#1e1e2e] rounded-2xl p-5">
        <SectionTitle>🎯 Mentor Insights — What Your Data Says</SectionTitle>
        <div className="space-y-3">
          {insights.length === 0 && (
            <p className="text-gray-500 text-sm">Log more trades to unlock mentor insights.</p>
          )}
          {insights.map((ins, i) => (
            <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${
              ins.type === 'good' ? 'bg-emerald-500/5 border-emerald-500/20' :
              ins.type === 'bad' ? 'bg-red-500/5 border-red-500/20' :
              'bg-amber-500/5 border-amber-500/20'
            }`}>
              {ins.type === 'good'
                ? <CheckCircle size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                : ins.type === 'bad'
                ? <AlertTriangle size={15} className="text-red-400 shrink-0 mt-0.5" />
                : <AlertTriangle size={15} className="text-amber-400 shrink-0 mt-0.5" />
              }
              <p className={`text-sm ${ins.type === 'good' ? 'text-gray-300' : ins.type === 'bad' ? 'text-gray-300' : 'text-gray-300'}`}>
                {ins.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
