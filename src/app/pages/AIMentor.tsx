import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bot,
  Brain,
  CheckCircle2,
  CircleDashed,
  ClipboardList,
  MessageSquare,
  Send,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
  User,
  Zap,
} from 'lucide-react';
import { useTradesContext } from '../data/TradesContext';
import { useTheme } from '../data/ThemeContext';
import { answerTradingQuestion, generateMentorReport } from '../utils/aiMentor';
import { AIInsightFeed } from '../components/AIInsightFeed';

type Severity = 'success' | 'warning' | 'danger' | 'info';

const severityStyles: Record<Severity, { color: string; icon: typeof CheckCircle2 }> = {
  success: { color: '#10b981', icon: CheckCircle2 },
  warning: { color: '#f59e0b', icon: AlertTriangle },
  danger: { color: '#ef4444', icon: ShieldAlert },
  info: { color: '#3b82f6', icon: Brain },
};

const promptSuggestions = [
  'What repeated mistake is costing me the most?',
  'Which setup should I focus on this week?',
  'Where is my risk discipline weakest?',
  'What should I avoid before my next trade?',
];

export default function AIMentor() {
  const { trades } = useTradesContext();
  const { colors } = useTheme();
  const [question, setQuestion] = useState('What should I focus on before my next trade?');
  const [submittedQuestion, setSubmittedQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [answerSource, setAnswerSource] = useState<'groq' | 'local-fallback' | ''>('');
  const [answerError, setAnswerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const report = useMemo(() => generateMentorReport(trades), [trades]);
  const closedTrades = trades.filter((trade) => trade.status === 'CLOSED' && trade.result);
  const psychologyReviewed = closedTrades.filter((trade) => trade.psychologicalMetrics).length;
  const latestInsights = report.insights.slice(0, 4);

  const askMentor = async (overrideQuestion?: string) => {
    const nextQuestion = (overrideQuestion || question).trim();
    if (!nextQuestion || isLoading) return;

    setIsLoading(true);
    setSubmittedQuestion(nextQuestion);
    setAnswer('');
    setAnswerError('');
    setAnswerSource('');

    try {
      const response = await answerTradingQuestion(nextQuestion, trades);
      setAnswer(response.answer);
      setAnswerSource(response.source);
      setAnswerError(response.error || '');
    } catch (error: any) {
      setAnswer('');
      setAnswerError(error.message || 'AI Mentor failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const usePrompt = (prompt: string) => {
    setQuestion(prompt);
    askMentor(prompt);
  };

  const sourceLabel = answerSource === 'groq' ? 'Groq AI Mentor' : 'Local Mentor Fallback';

  return (
    <div className="mentor-shell" style={{ background: colors.appBg, color: colors.text, minHeight: '100vh', padding: '1.5rem' }}>
      <style>{`
        @media (max-width: 980px) {
          .mentor-header {
            align-items: flex-start !important;
            flex-direction: column !important;
          }
          .mentor-main {
            grid-template-columns: 1fr !important;
          }
          .mentor-chat {
            min-height: 620px !important;
          }
        }

        @media (max-width: 640px) {
          .mentor-shell {
            padding: 0.85rem !important;
          }
          .mentor-chat {
            min-height: 560px !important;
          }
          .mentor-composer {
            grid-template-columns: 1fr !important;
          }
          .mentor-send {
            width: 100% !important;
          }
        }
      `}</style>
      <div style={{ maxWidth: 1500, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <header
          className="mentor-header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '1rem',
            alignItems: 'center',
            padding: '1rem 1.15rem',
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 8,
                background: 'linear-gradient(135deg, rgba(245,158,11,0.22), rgba(59,130,246,0.16))',
                border: '1px solid rgba(245,158,11,0.26)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Sparkles size={21} style={{ color: '#f59e0b' }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <h1 style={{ fontSize: '1.35rem', fontWeight: 760, marginBottom: '0.2rem' }}>AI Mentor</h1>
              <p style={{ color: colors.textMuted, fontSize: '0.9rem' }}>Trade journal intelligence for risk, psychology, and execution patterns.</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <StatusPill label="Confidence" value={`${report.confidence}%`} tone={report.confidence >= 70 ? '#10b981' : '#f59e0b'} />
            <StatusPill label="Closed" value={closedTrades.length.toString()} tone="#3b82f6" />
            <StatusPill label="Psychology" value={`${psychologyReviewed}/${closedTrades.length}`} tone="#8b5cf6" />
          </div>
        </header>

        <AIInsightFeed trades={trades} />

        <main className="mentor-main" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: '1rem', alignItems: 'start' }}>
          <section
            className="mentor-chat"
            style={{
              minHeight: 680,
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: 8,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '0.95rem 1.1rem',
                borderBottom: `1px solid ${colors.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Bot size={18} style={{ color: '#f59e0b' }} />
                <span style={{ fontWeight: 700 }}>Mentor Chat</span>
              </div>
              <div style={{ color: answerSource === 'groq' ? '#10b981' : colors.textMuted, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {isLoading ? <CircleDashed size={14} className="animate-spin" /> : answerSource === 'groq' ? <CheckCircle2 size={14} /> : <Zap size={14} />}
                {isLoading ? 'Thinking' : answerSource ? sourceLabel : 'Ready'}
              </div>
            </div>

            <div style={{ flex: 1, padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <AssistantMessage colors={colors}>
                <p style={{ marginBottom: '0.8rem' }}>{report.summary}</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.65rem' }}>
                  <MiniStat icon={Target} label="Best setup" value={report.bestSetup || 'Collecting data'} colors={colors} />
                  <MiniStat icon={ShieldAlert} label="Main risk" value={report.worstPattern || 'Not enough data'} colors={colors} />
                </div>
              </AssistantMessage>

              {submittedQuestion && (
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div
                    style={{
                      maxWidth: 760,
                      background: '#f59e0b',
                      color: '#111827',
                      borderRadius: 8,
                      padding: '0.9rem 1rem',
                      fontWeight: 600,
                      lineHeight: 1.55,
                      display: 'flex',
                      gap: '0.65rem',
                    }}
                  >
                    <User size={17} style={{ marginTop: 2, flexShrink: 0 }} />
                    <span>{submittedQuestion}</span>
                  </div>
                </div>
              )}

              {isLoading && (
                <AssistantMessage colors={colors}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: colors.textSub }}>
                    <CircleDashed size={17} className="animate-spin" style={{ color: '#f59e0b' }} />
                    Reading trade history, risk profile, and psychology flags...
                  </div>
                </AssistantMessage>
              )}

              {answer && (
                <AssistantMessage colors={colors} source={sourceLabel} sourceType={answerSource}>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{answer}</div>
                  {answerError && (
                    <p style={{ marginTop: '0.8rem', color: '#f59e0b', fontSize: '0.82rem' }}>{answerError}</p>
                  )}
                </AssistantMessage>
              )}

              {!answer && answerError && !isLoading && (
                <AssistantMessage colors={colors} source="Error" sourceType="local-fallback">
                  <p style={{ color: '#f87171' }}>{answerError}</p>
                </AssistantMessage>
              )}
            </div>

            <div style={{ borderTop: `1px solid ${colors.border}`, padding: '1rem', background: colors.inputBg }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.8rem' }}>
                {promptSuggestions.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => usePrompt(prompt)}
                    disabled={isLoading}
                    style={{
                      padding: '0.45rem 0.65rem',
                      borderRadius: 8,
                      border: `1px solid ${colors.border}`,
                      background: colors.surface,
                      color: colors.textSub,
                      fontSize: '0.78rem',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
              <div className="mentor-composer" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.75rem', alignItems: 'end' }}>
                <textarea
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  onKeyDown={(event) => {
                    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
                      askMentor();
                    }
                  }}
                  placeholder="Ask about your trading data..."
                  style={{
                    width: '100%',
                    minHeight: 96,
                    resize: 'vertical',
                    padding: '0.9rem 1rem',
                    background: colors.surface,
                    color: colors.text,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 8,
                    fontFamily: 'inherit',
                    outline: 'none',
                    lineHeight: 1.55,
                  }}
                />
                <button
                  className="mentor-send"
                  onClick={() => askMentor()}
                  disabled={isLoading || !question.trim()}
                  aria-label="Ask mentor"
                  title="Ask mentor"
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 8,
                    border: 'none',
                    background: isLoading || !question.trim() ? colors.border : '#f59e0b',
                    color: '#111827',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: isLoading || !question.trim() ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isLoading ? <CircleDashed size={19} className="animate-spin" /> : <Send size={19} />}
                </button>
              </div>
            </div>
          </section>

          <aside style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Panel title="Mentor Context" icon={ClipboardList} colors={colors}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                <MetricCard title="Closed Trades" value={closedTrades.length.toString()} icon={TrendingUp} colors={colors} />
                <MetricCard title="Confidence" value={`${report.confidence}%`} icon={Brain} colors={colors} />
                <MetricCard title="Psychology" value={`${psychologyReviewed}/${closedTrades.length}`} icon={MessageSquare} colors={colors} />
                <MetricCard title="Risk Pattern" value={report.worstPattern || 'Not enough data'} icon={ShieldAlert} colors={colors} />
              </div>
            </Panel>

            <Panel title="Strengths" icon={CheckCircle2} colors={colors}>
              <ListBlock items={report.strengths} accent="#10b981" colors={colors} />
            </Panel>

            <Panel title="Watchlist" icon={AlertTriangle} colors={colors}>
              <ListBlock items={report.weaknesses} accent="#ef4444" colors={colors} />
            </Panel>

            <Panel title="Actionable Insights" icon={Zap} colors={colors}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                {latestInsights.map((insight, index) => {
                  const style = severityStyles[insight.severity];
                  const Icon = style.icon;
                  return (
                    <div key={`${insight.title}-${index}`} style={{ paddingBottom: '0.7rem', borderBottom: index === latestInsights.length - 1 ? 'none' : `1px solid ${colors.border}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <Icon size={15} style={{ color: style.color }} />
                        <h3 style={{ fontWeight: 700, fontSize: '0.9rem' }}>{insight.title}</h3>
                      </div>
                      <p style={{ color: colors.textMuted, fontSize: '0.8rem', lineHeight: 1.55 }}>{insight.action}</p>
                    </div>
                  );
                })}
              </div>
            </Panel>
          </aside>
        </main>
      </div>
    </div>
  );
}

function StatusPill({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div style={{ border: `1px solid ${tone}45`, background: `${tone}14`, borderRadius: 8, padding: '0.45rem 0.65rem', minWidth: 96 }}>
      <p style={{ color: tone, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.1rem' }}>{label}</p>
      <p style={{ fontWeight: 760, fontSize: '0.95rem' }}>{value}</p>
    </div>
  );
}

function AssistantMessage({
  children,
  colors,
  source,
  sourceType,
}: {
  children: React.ReactNode;
  colors: any;
  source?: string;
  sourceType?: 'groq' | 'local-fallback' | '';
}) {
  return (
    <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-start' }}>
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 8,
          background: 'rgba(245,158,11,0.14)',
          border: '1px solid rgba(245,158,11,0.22)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Bot size={17} style={{ color: '#f59e0b' }} />
      </div>
      <div
        style={{
          maxWidth: 880,
          width: '100%',
          border: `1px solid ${colors.border}`,
          background: colors.inputBg,
          borderRadius: 8,
          padding: '1rem',
          color: colors.textSub,
          lineHeight: 1.65,
          fontSize: '0.94rem',
        }}
      >
        {source && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.7rem', color: sourceType === 'groq' ? '#10b981' : '#f59e0b', fontSize: '0.72rem', fontWeight: 760, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {sourceType === 'groq' ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
            {source}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

function Panel({ title, icon: Icon, colors, children }: { title: string; icon: typeof Brain; colors: any; children: React.ReactNode }) {
  return (
    <section style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 8, padding: '1rem' }}>
      <h2 style={{ fontSize: '0.95rem', fontWeight: 760, marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Icon size={16} style={{ color: '#f59e0b' }} /> {title}
      </h2>
      {children}
    </section>
  );
}

function MiniStat({ label, value, icon: Icon, colors }: { label: string; value: string; icon: typeof Brain; colors: any }) {
  return (
    <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 8, padding: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: colors.textMuted, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>
        <Icon size={13} style={{ color: '#f59e0b' }} /> {label}
      </div>
      <p style={{ color: colors.text, fontWeight: 700, fontSize: '0.9rem', lineHeight: 1.35 }}>{value}</p>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, colors }: { title: string; value: string; icon: typeof Brain; colors: any }) {
  return (
    <div style={{ background: colors.inputBg, border: `1px solid ${colors.border}`, borderRadius: 8, padding: '0.75rem', minHeight: 86 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'flex-start' }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ color: colors.textMuted, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.45rem' }}>{title}</p>
          <p style={{ fontSize: '0.92rem', fontWeight: 740, lineHeight: 1.35, overflowWrap: 'anywhere' }}>{value}</p>
        </div>
        <Icon size={17} style={{ color: '#f59e0b', flexShrink: 0 }} />
      </div>
    </div>
  );
}

function ListBlock({ items, accent, colors }: { items: string[]; accent: string; colors: any }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      {items.map((item) => (
        <div key={item} style={{ display: 'flex', gap: '0.55rem', alignItems: 'flex-start' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: accent, marginTop: 8, flexShrink: 0 }} />
          <p style={{ color: colors.textSub, fontSize: '0.85rem', lineHeight: 1.55 }}>{item}</p>
        </div>
      ))}
    </div>
  );
}
