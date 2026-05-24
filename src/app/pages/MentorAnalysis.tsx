/**
 * Issue #5: AI Mentor Analysis
 * Coach-style review of winning reasons, losing reasons, repeated mistakes,
 * and next-trade rules.
 */

import React, { useMemo, useState } from 'react';
import { Link } from 'react-router';
import {
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  ClipboardCheck,
  LineChart,
  MessageSquareText,
  Newspaper,
  Radar,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import { useTradesContext } from '../data/TradesContext';
import { useTheme } from '../data/ThemeContext';
import { SERVER_BASE, useAuthContext } from '../data/AuthContext';
import {
  answerMentorQuestion,
  generateMentorAnalysis,
  type MentorCard,
  type MentorSeverity,
  type TradeDiagnosis,
} from '../utils/mentorAnalysis';

interface BackendMentorResponse {
  personalizedFeedback: string[];
  predictiveWarnings: string[];
  patternRecognition: string[];
  riskOptimization: string[];
  strategyRefinement: string[];
  answer: string;
}

const severityColor: Record<MentorSeverity, string> = {
  good: '#10b981',
  warning: '#f59e0b',
  critical: '#ef4444',
};

function CardIcon({ severity }: { severity: MentorSeverity }) {
  if (severity === 'good') return <CheckCircle2 size={17} />;
  if (severity === 'critical') return <XCircle size={17} />;
  return <AlertTriangle size={17} />;
}

function MentorSection({ title, icon: Icon, cards }: { title: string; icon: React.ElementType; cards: MentorCard[] }) {
  const { colors } = useTheme();
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon size={16} style={{ color: '#f59e0b' }} />
        <h2 className="text-sm" style={{ color: colors.text }}>{title}</h2>
      </div>
      {cards.length === 0 ? (
        <div className="rounded-xl p-5 text-sm" style={{ background: colors.surface, border: `1px solid ${colors.border}`, color: colors.textMuted }}>
          Not enough trade history for this section yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {cards.map((card) => {
            const color = severityColor[card.severity];
            return (
              <article key={card.title} className="rounded-xl p-4" style={{ background: colors.surface, border: `1px solid ${color}30` }}>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}18`, color }}>
                    <CardIcon severity={card.severity} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-sm" style={{ color }}>{card.title}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${color}14`, color }}>
                        {card.stat}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed mb-3" style={{ color: colors.textSub }}>{card.description}</p>
                    <p className="text-xs" style={{ color: colors.textMuted }}>{card.action}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function DiagnosisRow({ diagnosis }: { diagnosis: TradeDiagnosis }) {
  const { colors } = useTheme();
  const color = severityColor[diagnosis.severity];
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[120px_1fr_1fr_100px] gap-3 px-4 py-3" style={{ borderBottom: `1px solid ${colors.rowBorder}` }}>
      <div>
        <p className="text-xs" style={{ color: colors.textMuted }}>{diagnosis.date}</p>
        <p className="text-sm" style={{ color: colors.text }}>{diagnosis.pair}</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-widest mb-1" style={{ color }}>Reason</p>
        <p className="text-sm" style={{ color: colors.textSub }}>{diagnosis.reason}</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-widest mb-1" style={{ color: colors.textMuted }}>Lesson</p>
        <p className="text-sm" style={{ color: colors.textSub }}>{diagnosis.lesson}</p>
      </div>
      <div className="lg:text-right">
        <p className="text-xs" style={{ color }}>{diagnosis.result}</p>
        <p className="text-sm" style={{ color: diagnosis.pnl >= 0 ? '#10b981' : '#ef4444' }}>
          {diagnosis.pnl >= 0 ? '+' : ''}${diagnosis.pnl}
        </p>
      </div>
    </div>
  );
}

export default function MentorAnalysis() {
  const { trades } = useTradesContext();
  const { colors } = useTheme();
  const { accessToken, isAuthenticated, isGuest } = useAuthContext();
  const analysis = generateMentorAnalysis(trades);
  const [question, setQuestion] = useState('');
  const [askedQuestion, setAskedQuestion] = useState('What is my biggest repeated mistake?');
  const [backendMentor, setBackendMentor] = useState<BackendMentorResponse | null>(null);
  const [backendModel, setBackendModel] = useState('');
  const [llmLoading, setLlmLoading] = useState(false);
  const [llmError, setLlmError] = useState('');
  const mentorAnswer = useMemo(() => answerMentorQuestion(trades, askedQuestion), [trades, askedQuestion]);

  const ask = () => {
    const q = question.trim();
    if (!q) return;
    setAskedQuestion(q);
    setQuestion('');
  };

  const generateBackendMentor = async () => {
    setLlmError('');
    if (!isAuthenticated || !accessToken) {
      setLlmError(isGuest ? 'Backend LLM requires a signed-in account. Guest mode uses local mentor analysis only.' : 'Sign in to use backend LLM mentor analysis.');
      return;
    }

    setLlmLoading(true);
    try {
      const response = await fetch(`${SERVER_BASE}/mentor/llm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          trades,
          question: askedQuestion,
          localAnalysis: {
            headline: analysis.headline,
            summary: analysis.summary,
            nextTradeRules: analysis.nextTradeRules,
          },
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Backend LLM request failed');
      setBackendMentor(data.mentor);
      setBackendModel(data.model || '');
    } catch (error: any) {
      setLlmError(error.message || 'Backend LLM request failed');
    } finally {
      setLlmLoading(false);
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="rounded-2xl p-5 lg:p-6" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(245,158,11,0.14)', color: '#f59e0b' }}>
              <BrainCircuit size={22} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#f59e0b' }}>Issue #5</p>
              <h1 className="text-xl lg:text-2xl mb-2" style={{ color: colors.text }}>AI Mentor Analysis</h1>
              <p className="text-sm leading-relaxed max-w-3xl" style={{ color: colors.textSub }}>{analysis.headline}</p>
              <p className="text-xs mt-2" style={{ color: colors.textMuted }}>{analysis.summary}</p>
            </div>
          </div>
          <Link
            to="/scorer"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm shrink-0"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#000' }}
          >
            <Target size={14} />
            Score Next Trade
          </Link>
          <button
            onClick={generateBackendMentor}
            disabled={llmLoading}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm shrink-0 disabled:opacity-60"
            style={{ background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.3)', color: '#93c5fd' }}
          >
            <Sparkles size={14} />
            {llmLoading ? 'Generating...' : 'Generate Backend LLM Mentor'}
          </button>
        </div>
      </div>
      {llmError && (
        <div className="rounded-xl p-3 text-sm" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.24)', color: '#f87171' }}>
          {llmError}
        </div>
      )}

      <section className="rounded-xl p-4 lg:p-5" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
        <div className="flex items-center gap-2 mb-4">
          <MessageSquareText size={16} style={{ color: '#f59e0b' }} />
          <h2 className="text-sm" style={{ color: colors.text }}>Natural Language Mentor Query</h2>
        </div>
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <div className="flex-1 flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: colors.inputBg, border: `1px solid ${colors.border}` }}>
            <Search size={14} style={{ color: colors.textMuted }} />
            <input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => { if (event.key === 'Enter') ask(); }}
              placeholder="Ask: Why am I losing money on EURUSD trades?"
              className="w-full bg-transparent outline-none text-sm"
              style={{ color: colors.text }}
            />
          </div>
          <button
            onClick={ask}
            className="px-4 py-2 rounded-lg text-sm"
            style={{ background: 'rgba(245,158,11,0.14)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b' }}
          >
            Ask Mentor
          </button>
        </div>
        <div className="rounded-xl p-4" style={{ background: colors.appBg, border: `1px solid ${colors.border}` }}>
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: colors.textMuted }}>{askedQuestion}</p>
          <p className="text-sm leading-relaxed" style={{ color: colors.textSub }}>{backendMentor?.answer || mentorAnswer}</p>
          {backendMentor && (
            <p className="text-xs mt-3" style={{ color: colors.textMuted }}>
              Backend LLM response{backendModel ? ` from ${backendModel}` : ''}
            </p>
          )}
        </div>
      </section>

      {backendMentor && (
        <section className="rounded-xl p-4 lg:p-5" style={{ background: colors.surface, border: `1px solid rgba(96,165,250,0.26)` }}>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={16} style={{ color: '#93c5fd' }} />
            <h2 className="text-sm" style={{ color: colors.text }}>Backend LLM Mentor Output</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {[
              { title: 'Personalized Feedback', items: backendMentor.personalizedFeedback },
              { title: 'Predictive Warnings', items: backendMentor.predictiveWarnings },
              { title: 'Pattern Recognition', items: backendMentor.patternRecognition },
              { title: 'Risk Optimization', items: backendMentor.riskOptimization },
              { title: 'Strategy Refinement', items: backendMentor.strategyRefinement },
            ].map((group) => (
              <div key={group.title} className="rounded-xl p-4" style={{ background: colors.appBg, border: `1px solid ${colors.border}` }}>
                <p className="text-xs uppercase tracking-widest mb-3" style={{ color: '#93c5fd' }}>{group.title}</p>
                <div className="space-y-2">
                  {group.items.length > 0 ? group.items.map((item) => (
                    <p key={item} className="text-sm leading-relaxed" style={{ color: colors.textSub }}>{item}</p>
                  )) : (
                    <p className="text-sm" style={{ color: colors.textMuted }}>No LLM item returned.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-xl p-4 lg:p-5" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} style={{ color: '#f59e0b' }} />
          <h2 className="text-sm" style={{ color: colors.text }}>Personalized LLM-Style Feedback</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {analysis.llmFeedback.map((feedback) => (
            <div key={feedback} className="rounded-xl p-4 text-sm leading-relaxed" style={{ background: colors.appBg, border: `1px solid ${colors.border}`, color: colors.textSub }}>
              {feedback}
            </div>
          ))}
        </div>
      </section>

      <MentorSection title="Why You Win" icon={TrendingUp} cards={analysis.winningReasons} />
      <MentorSection title="Why You Lose" icon={TrendingDown} cards={analysis.losingReasons} />
      <MentorSection title="Repeated Mistakes" icon={AlertTriangle} cards={analysis.repeatedMistakes} />
      <MentorSection title="Predictive Analytics" icon={LineChart} cards={analysis.predictiveInsights} />
      <MentorSection title="Automated Pattern Recognition" icon={Radar} cards={analysis.patternRecognition} />
      <MentorSection title="Risk Management Optimization" icon={ShieldCheck} cards={analysis.riskOptimization} />
      <MentorSection title="Strategy Refinement Suggestions" icon={SlidersHorizontal} cards={analysis.strategySuggestions} />
      <MentorSection title="Entry and Exit Guidance" icon={Target} cards={analysis.entryExitSuggestions} />
      <MentorSection title="News and Sentiment Context" icon={Newspaper} cards={analysis.sentimentContext} />

      <section className="rounded-xl overflow-hidden" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
        <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: `1px solid ${colors.border}` }}>
          <ClipboardCheck size={16} style={{ color: '#f59e0b' }} />
          <h2 className="text-sm" style={{ color: colors.text }}>Next Trade Rules</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {analysis.nextTradeRules.map((rule, index) => (
            <div key={rule} className="flex items-start gap-3 px-4 py-3" style={{ borderBottom: `1px solid ${colors.rowBorder}` }}>
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0" style={{ background: 'rgba(245,158,11,0.14)', color: '#f59e0b' }}>
                {index + 1}
              </span>
              <p className="text-sm" style={{ color: colors.textSub }}>{rule}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl overflow-hidden" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
        <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: `1px solid ${colors.border}` }}>
          <BrainCircuit size={16} style={{ color: '#f59e0b' }} />
          <h2 className="text-sm" style={{ color: colors.text }}>Recent Trade Diagnoses</h2>
        </div>
        {analysis.diagnoses.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm" style={{ color: colors.textMuted }}>
            Close trades in the journal to unlock mentor diagnoses.
          </div>
        ) : (
          analysis.diagnoses.map((diagnosis) => <DiagnosisRow key={diagnosis.tradeId} diagnosis={diagnosis} />)
        )}
      </section>
    </div>
  );
}
