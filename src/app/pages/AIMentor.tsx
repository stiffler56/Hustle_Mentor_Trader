import { useMemo, useState } from 'react';
import { Brain, AlertTriangle, CheckCircle2, MessageSquare, ShieldAlert, Target, TrendingUp, Zap } from 'lucide-react';
import { useTradesContext } from '../data/TradesContext';
import { useTheme } from '../data/ThemeContext';
import { answerTradingQuestion, generateMentorReport } from '../utils/aiMentor';

type Severity = 'success' | 'warning' | 'danger' | 'info';

const severityStyles: Record<Severity, { color: string; icon: typeof CheckCircle2 }> = {
  success: { color: '#10b981', icon: CheckCircle2 },
  warning: { color: '#f59e0b', icon: AlertTriangle },
  danger: { color: '#ef4444', icon: ShieldAlert },
  info: { color: '#3b82f6', icon: Brain },
};

export default function AIMentor() {
  const { trades } = useTradesContext();
  const { colors } = useTheme();
  const [question, setQuestion] = useState('What should I focus on before my next trade?');
  const [answer, setAnswer] = useState('');

  const report = useMemo(() => generateMentorReport(trades), [trades]);
  const closedTrades = trades.filter((trade) => trade.status === 'CLOSED' && trade.result);
  const psychologyReviewed = closedTrades.filter((trade) => trade.psychologicalMetrics).length;

  const askMentor = () => {
    setAnswer(answerTradingQuestion(question, trades));
  };

  return (
    <div style={{ background: colors.background, color: colors.text, minHeight: '100vh', padding: '2rem' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Brain size={30} style={{ color: '#f59e0b' }} /> AI Mentor Insights
            </h1>
            <p style={{ color: colors.textMuted, maxWidth: 760 }}>
              Professional mentor logic that reads your trade history, psychology reviews, risk profile, and strategy patterns to give actionable guidance.
            </p>
          </div>
          <div style={{ minWidth: 170, padding: '1rem', background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '0.75rem', textAlign: 'center' }}>
            <p style={{ color: colors.textMuted, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Mentor Confidence</p>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: report.confidence >= 70 ? '#10b981' : '#f59e0b' }}>{report.confidence}%</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <MetricCard title="Closed Trades" value={closedTrades.length.toString()} icon={TrendingUp} colors={colors} />
          <MetricCard title="Psychology Reviews" value={`${psychologyReviewed}/${closedTrades.length}`} icon={Brain} colors={colors} />
          <MetricCard title="Best Setup" value={report.bestSetup || 'Collecting data'} icon={Target} colors={colors} />
          <MetricCard title="Main Risk Pattern" value={report.worstPattern || 'Not enough data'} icon={ShieldAlert} colors={colors} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '2rem', marginBottom: '2rem' }}>
          <section style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '0.75rem', padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Zap size={18} style={{ color: '#f59e0b' }} /> Mentor Summary
            </h2>
            <p style={{ color: colors.textMuted, lineHeight: 1.7, marginBottom: '1.25rem' }}>{report.summary}</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <ListCard title="Strengths" items={report.strengths} accent="#10b981" colors={colors} />
              <ListCard title="Weaknesses" items={report.weaknesses} accent="#ef4444" colors={colors} />
            </div>
          </section>

          <section style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '0.75rem', padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MessageSquare size={18} style={{ color: '#3b82f6' }} /> Ask Your Data
            </h2>
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask: What is my best session? What strategy works best? Is risk hurting me?"
              style={{ width: '100%', minHeight: 100, padding: '0.9rem', background: colors.background, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: '0.5rem', fontFamily: 'inherit', marginBottom: '1rem' }}
            />
            <button
              onClick={askMentor}
              style={{ width: '100%', padding: '0.85rem 1rem', background: '#f59e0b', color: '#111827', border: 'none', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer', marginBottom: '1rem' }}
            >
              Ask Mentor
            </button>
            {answer && (
              <div style={{ padding: '1rem', background: colors.background, border: `1px solid ${colors.border}`, borderRadius: '0.5rem', color: colors.textMuted, lineHeight: 1.6 }}>
                {answer}
              </div>
            )}
          </section>
        </div>

        <section style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '0.75rem', padding: '1.5rem', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem' }}>Actionable Insights</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
            {report.insights.map((insight, index) => {
              const style = severityStyles[insight.severity];
              const Icon = style.icon;
              return (
                <div key={`${insight.title}-${index}`} style={{ padding: '1rem', background: colors.background, border: `1px solid ${colors.border}`, borderLeft: `4px solid ${style.color}`, borderRadius: '0.65rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                    <Icon size={18} style={{ color: style.color }} />
                    <h3 style={{ fontWeight: 700 }}>{insight.title}</h3>
                  </div>
                  <p style={{ color: colors.textMuted, fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '0.75rem' }}>{insight.description}</p>
                  <p style={{ color: colors.textSub, fontSize: '0.8rem', marginBottom: '0.75rem' }}><strong>Evidence:</strong> {insight.evidence}</p>
                  <p style={{ color: style.color, fontSize: '0.85rem', fontWeight: 600 }}><strong>Action:</strong> {insight.action}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '0.75rem', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem' }}>Next Actions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {report.nextActions.map((action, index) => (
              <div key={action} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', padding: '0.9rem', background: colors.background, border: `1px solid ${colors.border}`, borderRadius: '0.5rem' }}>
                <span style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(245,158,11,0.18)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>{index + 1}</span>
                <p style={{ color: colors.textMuted }}>{action}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, colors }: { title: string; value: string; icon: typeof Brain; colors: any }) {
  return (
    <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '0.75rem', padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center' }}>
        <div>
          <p style={{ color: colors.textMuted, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>{title}</p>
          <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>{value}</p>
        </div>
        <Icon size={22} style={{ color: '#f59e0b' }} />
      </div>
    </div>
  );
}

function ListCard({ title, items, accent, colors }: { title: string; items: string[]; accent: string; colors: any }) {
  return (
    <div style={{ background: colors.background, border: `1px solid ${colors.border}`, borderRadius: '0.65rem', padding: '1rem' }}>
      <h3 style={{ fontWeight: 700, color: accent, marginBottom: '0.75rem' }}>{title}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {items.map((item) => (
          <p key={item} style={{ color: colors.textMuted, fontSize: '0.875rem', lineHeight: 1.5 }}>• {item}</p>
        ))}
      </div>
    </div>
  );
}
