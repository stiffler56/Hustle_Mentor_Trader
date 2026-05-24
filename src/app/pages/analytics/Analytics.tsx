import React from 'react';
import { NavLink } from 'react-router';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, Cell,
} from 'recharts';
import { Brain, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';
import { useTradesContext } from '../../data/TradesContext';
import { useTheme } from '../../data/ThemeContext';

function winRatePct(trades: ReturnType<typeof useTradesContext>['trades']) {
  const w = trades.filter(t => t.result === 'WIN').length;
  return trades.length ? Math.round((w / trades.length) * 100) : 0;
}

function InsightCard({ icon: Icon, title, body, type }: {
  icon: React.ElementType; title: string; body: string; type: 'good' | 'warn' | 'bad';
}) {
  const { colors } = useTheme();
  const statusColors = { good: '#10b981', warn: '#f59e0b', bad: '#f87171' };
  const c = statusColors[type];
  return (
    <div className="rounded-xl p-4" style={{ background: colors.surface, border: `1px solid ${c}25` }}>
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${c}15` }}>
          <Icon size={16} style={{ color: c }} />
        </div>
        <div>
          <p className="text-sm mb-1" style={{ color: c }}>{title}</p>
          <p className="text-xs leading-relaxed" style={{ color: colors.textSub }}>{body}</p>
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value, color }: { label: string; value: string; color?: string }) {
  const { colors } = useTheme();
  return (
    <div className="flex justify-between items-center py-2" style={{ borderBottom: `1px solid ${colors.rowBorder}` }}>
      <span className="text-xs" style={{ color: colors.textSub }}>{label}</span>
      <span className="text-sm" style={{ color: color ?? colors.text }}>{value}</span>
    </div>
  );
}

export default function Analytics() {
  const { trades } = useTradesContext();
  const { colors } = useTheme();
  const closed = trades.filter(t => t.status === 'CLOSED' && t.result);

  const barTooltipStyle = {
    contentStyle: { background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 12, color: colors.text },
  };

  // Win rate by session
  const sessions = ['New York', 'London', 'Tokyo', 'Sydney'];
  const sessionData = sessions
    .map(s => {
      const st = closed.filter(t => t.session === s);
      return { name: s, wr: st.length ? Math.round((st.filter(t => t.result === 'WIN').length / st.length) * 100) : 0, count: st.length };
    })
    .filter(d => d.count > 0);

  const focusBuckets = [
    { label: '<10 (Emotional)', min: 0, max: 9 },
    { label: '10–19', min: 10, max: 19 },
    { label: '20–30 (Optimal)', min: 20, max: 30 },
  ];
  const focusData = focusBuckets.map(b => {
    const bt = closed.filter(t => t.mentalFocus >= b.min && t.mentalFocus <= b.max);
    return { name: b.label, wr: bt.length ? Math.round((bt.filter(t => t.result === 'WIN').length / bt.length) * 100) : 0, count: bt.length };
  }).filter(d => d.count > 0);

  const confData = [1, 2, 3, 4].map(c => {
    const ct = closed.filter(t => t.confluences === c);
    return { name: `${c} conf.`, wr: ct.length ? Math.round((ct.filter(t => t.result === 'WIN').length / ct.length) * 100) : 0, count: ct.length };
  }).filter(d => d.count > 0);

  const strategies = ['D1/H4 FVG', 'Liquidity', 'Order Block', 'ICT Concept', 'Support/Resistance', 'Other'];
  const stratData = strategies.map(s => {
    const st = closed.filter(t => t.strategy === s);
    const pnl = st.reduce((a, t) => a + (t.pnl ?? 0), 0);
    return { name: s === 'Support/Resistance' ? 'S/R' : s === 'ICT Concept' ? 'ICT' : s, pnl, count: st.length, wr: st.length ? Math.round((st.filter(t => t.result === 'WIN').length / st.length) * 100) : 0 };
  }).filter(d => d.count > 0);

  const byMonth: Record<string, number> = {};
  [...closed].sort((a, b) => a.date.localeCompare(b.date)).forEach(t => {
    const m = t.date.slice(0, 7);
    byMonth[m] = (byMonth[m] ?? 0) + (t.pnl ?? 0);
  });
  const monthlyData = Object.entries(byMonth).map(([m, pnl]) => ({
    month: new Date(m + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    pnl: Math.round(pnl),
  }));

  const totalPnL = closed.reduce((a, t) => a + (t.pnl ?? 0), 0);
  const overallWR = winRatePct(closed);
  const nyTrades = closed.filter(t => t.session === 'New York');
  const nyWR = winRatePct(nyTrades);
  const highFocus = closed.filter(t => t.mentalFocus >= 20);
  const hfWR = winRatePct(highFocus);
  const lowFocus = closed.filter(t => t.mentalFocus < 10);
  const lfWR = winRatePct(lowFocus);
  const threeConf = closed.filter(t => t.confluences >= 3);
  const tcWR = winRatePct(threeConf);

  const scoreRanges = [
    { min: 0, max: 54, label: 'PASS (<55)' },
    { min: 55, max: 74, label: 'WAIT (55–74)' },
    { min: 75, max: 100, label: 'TAKE (75+)' },
  ];
  const scoreWrData = scoreRanges.map(r => {
    const rt = closed.filter(t => t.score >= r.min && t.score <= r.max);
    return { name: r.label, wr: rt.length ? Math.round((rt.filter(t => t.result === 'WIN').length / rt.length) * 100) : 0, count: rt.length };
  }).filter(d => d.count > 0);

  const insights: Array<{ icon: React.ElementType; title: string; body: string; type: 'good' | 'warn' | 'bad' }> = [];
  if (nyWR > overallWR + 10) insights.push({ icon: CheckCircle2, title: 'New York Is Your Session', body: `Your NY win rate is ${nyWR}% vs your overall ${overallWR}%. Trade ONLY New York session for maximum edge.`, type: 'good' });
  if (hfWR > overallWR + 15) insights.push({ icon: Brain, title: 'Mental Focus = Your Edge', body: `Trades with focus 20+ win ${hfWR}% of the time. Low focus (<10) trades win only ${lfWR}%. Your mental state IS the indicator.`, type: 'good' });
  if (lfWR < 30 && lowFocus.length >= 3) insights.push({ icon: AlertTriangle, title: 'Emotional Trades Destroy You', body: `Your mental focus <10 trades have a ${lfWR}% win rate. ${lowFocus.length} emotional trades cost you money. When focus is low — close the app.`, type: 'bad' });
  if (tcWR > overallWR + 10 && threeConf.length >= 3) insights.push({ icon: TrendingUp, title: '3+ Confluences Activate Your Edge', body: `Setups with 3+ confluences win ${tcWR}% vs your ${overallWR}% average. Always wait for at least 3 confirmations.`, type: 'good' });
  if (sessionData.find(s => s.name === 'London' && s.wr < 45)) {
    const ldnWR = sessionData.find(s => s.name === 'London')?.wr ?? 0;
    insights.push({ icon: AlertTriangle, title: 'London Session Kills Your Profits', body: `Your London win rate is only ${ldnWR}% vs ${nyWR}% in New York. Avoid London unless the setup is exceptional (score 85+).`, type: 'warn' });
  }

  const noDataMsg = (h: number) => (
    <p className="text-sm text-center flex items-center justify-center" style={{ color: colors.textMuted, height: h }}>Not enough data</p>
  );

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-xl" style={{ color: colors.text }}>Analytics</h1>
          <p className="text-sm mt-0.5" style={{ color: colors.textMuted }}>Pattern analysis from {closed.length} closed trades</p>
        </div>
        <div className="flex gap-2">
          {[
            { to: '/analytics', label: 'Overview' },
            { to: '/analytics/advanced', label: 'Advanced' },
          ].map(tab => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.to === '/analytics'}
              className="px-3 py-1.5 rounded-lg text-sm"
              style={({ isActive }) => ({
                background: isActive ? 'rgba(245,158,11,0.14)' : colors.surface,
                color: isActive ? '#f59e0b' : colors.textSub,
                border: `1px solid ${isActive ? 'rgba(245,158,11,0.3)' : colors.border}`,
              })}
            >
              {tab.label}
            </NavLink>
          ))}
        </div>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Overall WR', value: `${overallWR}%`, color: overallWR >= 50 ? '#10b981' : '#f87171' },
          { label: 'NY WR', value: `${nyWR}%`, color: nyWR >= 55 ? '#10b981' : '#f87171' },
          { label: 'Focus 20+ WR', value: `${hfWR}%`, color: hfWR >= 55 ? '#10b981' : '#f87171' },
          { label: '3+ Conf WR', value: `${tcWR}%`, color: tcWR >= 60 ? '#10b981' : '#f87171' },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-4 text-center" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: colors.textMuted }}>{s.label}</p>
            <p className="text-2xl" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl p-5" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
          <p className="text-sm mb-4" style={{ color: colors.textSub }}>Win Rate by Session</p>
          {sessionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={sessionData}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: colors.textSub }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: colors.textMuted }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                <Tooltip {...barTooltipStyle} formatter={(v: any) => [`${v}%`, 'Win Rate']} />
                <Bar dataKey="wr" radius={[4, 4, 0, 0]}>
                  {sessionData.map(e => <Cell key={`session-${e.name}`} fill={e.wr >= 55 ? '#10b981' : e.wr >= 40 ? '#f59e0b' : '#f87171'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : noDataMsg(200)}
        </div>

        <div className="rounded-xl p-5" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
          <p className="text-sm mb-4" style={{ color: colors.textSub }}>Win Rate by Mental Focus</p>
          {focusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={focusData}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: colors.textSub }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: colors.textMuted }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                <Tooltip {...barTooltipStyle} formatter={(v: any) => [`${v}%`, 'Win Rate']} />
                <Bar dataKey="wr" radius={[4, 4, 0, 0]}>
                  {focusData.map(e => <Cell key={`focus-${e.name}`} fill={e.wr >= 55 ? '#10b981' : e.wr >= 35 ? '#f59e0b' : '#f87171'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : noDataMsg(200)}
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl p-5" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
          <p className="text-sm mb-4" style={{ color: colors.textSub }}>Win Rate by Confluences</p>
          {confData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={confData}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: colors.textSub }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: colors.textMuted }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                <Tooltip {...barTooltipStyle} formatter={(v: any) => [`${v}%`, 'Win Rate']} />
                <Bar dataKey="wr" radius={[4, 4, 0, 0]}>
                  {confData.map(e => <Cell key={`conf-${e.name}`} fill={e.wr >= 60 ? '#10b981' : e.wr >= 40 ? '#f59e0b' : '#f87171'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : noDataMsg(200)}
        </div>

        <div className="rounded-xl p-5" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
          <p className="text-sm mb-4" style={{ color: colors.textSub }}>P&L by Strategy</p>
          {stratData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stratData}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: colors.textSub }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: colors.textMuted }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip {...barTooltipStyle} formatter={(v: any) => [`$${v}`, 'P&L']} />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                  {stratData.map(e => <Cell key={`strat-${e.name}`} fill={e.pnl >= 0 ? '#10b981' : '#f87171'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : noDataMsg(200)}
        </div>
      </div>

      {/* Charts row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl p-5" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
          <p className="text-sm mb-4" style={{ color: colors.textSub }}>Win Rate by Score Range</p>
          {scoreWrData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={scoreWrData}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: colors.textSub }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: colors.textMuted }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                <Tooltip {...barTooltipStyle} formatter={(v: any, _: any, p: any) => [`${v}% (${p.payload.count} trades)`, 'Win Rate']} />
                <Bar dataKey="wr" radius={[4, 4, 0, 0]}>
                  {scoreWrData.map(e => <Cell key={`score-${e.name}`} fill={e.wr >= 60 ? '#10b981' : e.wr >= 40 ? '#f59e0b' : '#f87171'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : noDataMsg(180)}
        </div>

        <div className="rounded-xl p-5" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
          <p className="text-sm mb-4" style={{ color: colors.textSub }}>Monthly P&L</p>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={monthlyData}>
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: colors.textSub }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: colors.textMuted }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip {...barTooltipStyle} formatter={(v: any) => [`$${v}`, 'P&L']} />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                  {monthlyData.map(e => <Cell key={`month-${e.month}`} fill={e.pnl >= 0 ? '#10b981' : '#f87171'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : noDataMsg(180)}
        </div>
      </div>

      {/* Mentor Insights */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Brain size={16} style={{ color: '#f59e0b' }} />
          <p className="text-sm" style={{ color: '#f59e0b' }}>Mentor Insights</p>
          <span className="text-xs" style={{ color: colors.textMuted }}>— Based on your trade history</span>
        </div>
        {insights.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map((insight, i) => <InsightCard key={i} {...insight} />)}
          </div>
        ) : (
          <div className="rounded-xl p-6 text-center" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
            <p className="text-sm" style={{ color: colors.textMuted }}>Log more trades to unlock mentor insights from your patterns.</p>
          </div>
        )}
      </div>

      {/* Strategy breakdown table */}
      <div className="rounded-xl" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
        <div className="px-4 py-3" style={{ borderBottom: `1px solid ${colors.border}` }}>
          <p className="text-sm" style={{ color: colors.textSub }}>Strategy Breakdown</p>
        </div>
        <div className="p-4">
          {stratData.length > 0 ? (
            <div className="space-y-0">
              {stratData.map(s => (
                <StatRow key={s.name} label={s.name} value={`${s.wr}% WR · $${s.pnl >= 0 ? '+' : ''}${s.pnl} P&L · ${s.count} trades`} color={s.pnl >= 0 ? '#10b981' : '#f87171'} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-center py-4" style={{ color: colors.textMuted }}>No data yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
