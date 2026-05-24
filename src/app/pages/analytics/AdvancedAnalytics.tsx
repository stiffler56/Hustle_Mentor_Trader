/**
 * Advanced Analytics Page
 * Issue #2: Enhanced Reporting and Customization
 * Professional-grade analytics with Equity Curve, Drawdown analysis, and performance metrics
 */

import { useState } from 'react';
import { NavLink } from 'react-router';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Download, Filter } from 'lucide-react';
import { useTradesContext } from '../../data/TradesContext';
import { useTheme } from '../../data/ThemeContext';
import {
  calculateEquityCurve,
  calculateDrawdown,
  calculateMaxDrawdown,
  calculatePerformanceMetrics,
  calculateMonthlyPerformance,
  calculateConsecutiveStats,
} from '../../utils/advancedAnalytics';

type ChartView = 'equity' | 'drawdown' | 'monthly' | 'metrics';

export default function AdvancedAnalytics() {
  const { trades } = useTradesContext();
  const { colors } = useTheme();
  const [activeView, setActiveView] = useState<ChartView>('equity');
  const [initialBalance, setInitialBalance] = useState(10000);

  // Calculate all analytics
  const equityCurve = calculateEquityCurve(trades, initialBalance);
  const drawdownData = calculateDrawdown(equityCurve, initialBalance);
  const maxDrawdown = calculateMaxDrawdown(drawdownData);
  const performanceMetrics = calculatePerformanceMetrics(trades);
  const monthlyPerformance = calculateMonthlyPerformance(trades);
  const consecutiveStats = calculateConsecutiveStats(trades);

  const currentEquity = initialBalance + (equityCurve.length > 0 ? equityCurve[equityCurve.length - 1].cumulativePnL : 0);
  const totalReturn = ((currentEquity - initialBalance) / initialBalance) * 100;

  // ─── Metric Card Component ────────────────────────────────────────────
  function MetricCard({ label, value, subValue, icon: Icon, color, trend }: {
    label: string;
    value: string | number;
    subValue?: string;
    icon: React.ElementType;
    color: string;
    trend?: 'up' | 'down' | 'neutral';
  }) {
    return (
      <div
        style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: '0.75rem',
          padding: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div>
            <p style={{ fontSize: '0.875rem', color: colors.textMuted, marginBottom: '0.5rem' }}>{label}</p>
            <p style={{ fontSize: '1.875rem', fontWeight: 'bold', color }}>{value}</p>
            {subValue && <p style={{ fontSize: '0.75rem', color: colors.textMuted, marginTop: '0.25rem' }}>{subValue}</p>}
          </div>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '0.5rem',
              background: `${color}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {trend === 'up' ? (
              <TrendingUp size={20} style={{ color }} />
            ) : trend === 'down' ? (
              <TrendingDown size={20} style={{ color }} />
            ) : (
              <Icon size={20} style={{ color }} />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: colors.background, color: colors.text, minHeight: '100vh', padding: '2rem' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Advanced Analytics
            </h1>
            <p style={{ color: colors.textMuted }}>
              Professional-grade performance analysis with Equity Curve, Drawdown, and detailed metrics.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {[
              { to: '/analytics', label: 'Overview' },
              { to: '/analytics/advanced', label: 'Advanced' },
            ].map(tab => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.to === '/analytics'}
                style={({ isActive }) => ({
                  padding: '0.375rem 0.75rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  background: isActive ? 'rgba(245,158,11,0.14)' : colors.surface,
                  color: isActive ? '#f59e0b' : colors.textMuted,
                  border: `1px solid ${isActive ? 'rgba(245,158,11,0.3)' : colors.border}`,
                })}
              >
                {tab.label}
              </NavLink>
            ))}
          </div>
        </div>

        {/* Key Metrics Overview */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <MetricCard
            label="Current Equity"
            value={`$${currentEquity.toFixed(2)}`}
            subValue={`Total Return: ${totalReturn.toFixed(2)}%`}
            icon={TrendingUp}
            color={totalReturn >= 0 ? '#10b981' : '#ef4444'}
            trend={totalReturn >= 0 ? 'up' : 'down'}
          />
          <MetricCard
            label="Max Drawdown"
            value={`$${maxDrawdown.maxDrawdown.toFixed(2)}`}
            subValue={`${maxDrawdown.maxDrawdownPercent.toFixed(2)}% | Date: ${maxDrawdown.maxDrawdownDate}`}
            icon={AlertTriangle}
            color="#f59e0b"
          />
          <MetricCard
            label="Win Rate"
            value={`${performanceMetrics.winRate.toFixed(1)}%`}
            subValue={`${performanceMetrics.winningTrades}W / ${performanceMetrics.losingTrades}L`}
            icon={CheckCircle2}
            color={performanceMetrics.winRate >= 50 ? '#10b981' : '#ef4444'}
          />
          <MetricCard
            label="Profit Factor"
            value={performanceMetrics.profitFactor.toFixed(2)}
            subValue={`Avg Win: $${performanceMetrics.averageWin.toFixed(2)}`}
            icon={TrendingUp}
            color={performanceMetrics.profitFactor >= 1.5 ? '#10b981' : '#f59e0b'}
          />
        </div>

        {/* View Selector */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '2rem',
            flexWrap: 'wrap',
          }}
        >
          {(['equity', 'drawdown', 'monthly', 'metrics'] as const).map((view) => (
            <button
              key={view}
              onClick={() => setActiveView(view)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                border: activeView === view ? `2px solid #3b82f6` : `1px solid ${colors.border}`,
                background: activeView === view ? '#3b82f6' : colors.surface,
                color: activeView === view ? 'white' : colors.text,
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: activeView === view ? '600' : '400',
              }}
            >
              {view === 'equity' && '📈 Equity Curve'}
              {view === 'drawdown' && '📉 Drawdown'}
              {view === 'monthly' && '📅 Monthly'}
              {view === 'metrics' && '🎯 Metrics'}
            </button>
          ))}
        </div>

        {/* Equity Curve Chart */}
        {activeView === 'equity' && (
          <div
            style={{
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: '0.75rem',
              padding: '1.5rem',
              marginBottom: '2rem',
            }}
          >
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Equity Curve</h2>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={equityCurve}>
                <defs>
                  <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                <XAxis dataKey="date" stroke={colors.textMuted} style={{ fontSize: '12px' }} />
                <YAxis stroke={colors.textMuted} style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 8 }}
                  formatter={(value) => `$${value.toFixed(2)}`}
                />
                <Area type="monotone" dataKey="cumulativePnL" stroke="#3b82f6" fillOpacity={1} fill="url(#colorEquity)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Drawdown Chart */}
        {activeView === 'drawdown' && (
          <div
            style={{
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: '0.75rem',
              padding: '1.5rem',
              marginBottom: '2rem',
            }}
          >
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Drawdown Analysis</h2>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={drawdownData}>
                <defs>
                  <linearGradient id="colorDrawdown" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                <XAxis dataKey="date" stroke={colors.textMuted} style={{ fontSize: '12px' }} />
                <YAxis stroke={colors.textMuted} style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 8 }}
                  formatter={(value) => `$${value.toFixed(2)}`}
                />
                <Area type="monotone" dataKey="drawdown" stroke="#ef4444" fillOpacity={1} fill="url(#colorDrawdown)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Monthly Performance */}
        {activeView === 'monthly' && (
          <div
            style={{
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: '0.75rem',
              padding: '1.5rem',
              marginBottom: '2rem',
            }}
          >
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Monthly Performance</h2>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={monthlyPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                <XAxis dataKey="month" stroke={colors.textMuted} style={{ fontSize: '12px' }} />
                <YAxis stroke={colors.textMuted} style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 8 }}
                  formatter={(value) => `$${value.toFixed(2)}`}
                />
                <Bar dataKey="totalPnL" fill="#3b82f6" radius={[8, 8, 0, 0]}>
                  {monthlyPerformance.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.totalPnL >= 0 ? '#10b981' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Detailed Metrics */}
        {activeView === 'metrics' && (
          <div
            style={{
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: '0.75rem',
              padding: '1.5rem',
            }}
          >
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>Performance Metrics</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              <div style={{ padding: '1rem', background: colors.background, borderRadius: '0.5rem' }}>
                <p style={{ fontSize: '0.875rem', color: colors.textMuted, marginBottom: '0.5rem' }}>Total Trades</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{performanceMetrics.totalTrades}</p>
              </div>
              <div style={{ padding: '1rem', background: colors.background, borderRadius: '0.5rem' }}>
                <p style={{ fontSize: '0.875rem', color: colors.textMuted, marginBottom: '0.5rem' }}>Profit Factor</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: performanceMetrics.profitFactor >= 1.5 ? '#10b981' : '#f59e0b' }}>
                  {performanceMetrics.profitFactor.toFixed(2)}
                </p>
              </div>
              <div style={{ padding: '1rem', background: colors.background, borderRadius: '0.5rem' }}>
                <p style={{ fontSize: '0.875rem', color: colors.textMuted, marginBottom: '0.5rem' }}>Risk/Reward Ratio</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{performanceMetrics.riskRewardRatio.toFixed(2)}</p>
              </div>
              <div style={{ padding: '1rem', background: colors.background, borderRadius: '0.5rem' }}>
                <p style={{ fontSize: '0.875rem', color: colors.textMuted, marginBottom: '0.5rem' }}>Expectancy</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: performanceMetrics.expectancy >= 0 ? '#10b981' : '#ef4444' }}>
                  ${performanceMetrics.expectancy.toFixed(2)}
                </p>
              </div>
              <div style={{ padding: '1rem', background: colors.background, borderRadius: '0.5rem' }}>
                <p style={{ fontSize: '0.875rem', color: colors.textMuted, marginBottom: '0.5rem' }}>Sharpe Ratio</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{performanceMetrics.sharpeRatio.toFixed(2)}</p>
              </div>
              <div style={{ padding: '1rem', background: colors.background, borderRadius: '0.5rem' }}>
                <p style={{ fontSize: '0.875rem', color: colors.textMuted, marginBottom: '0.5rem' }}>Max Consecutive Wins</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>{consecutiveStats.maxConsecutiveWins}</p>
              </div>
              <div style={{ padding: '1rem', background: colors.background, borderRadius: '0.5rem' }}>
                <p style={{ fontSize: '0.875rem', color: colors.textMuted, marginBottom: '0.5rem' }}>Max Consecutive Losses</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444' }}>{consecutiveStats.maxConsecutiveLosses}</p>
              </div>
              <div style={{ padding: '1rem', background: colors.background, borderRadius: '0.5rem' }}>
                <p style={{ fontSize: '0.875rem', color: colors.textMuted, marginBottom: '0.5rem' }}>Return on Risk</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{performanceMetrics.returnOnRisk.toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
