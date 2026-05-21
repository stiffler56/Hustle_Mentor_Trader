/**
 * Psychology Journal Page
 * Issue #4: Psychological Journaling and Analysis
 * Track emotional state, psychological patterns, and get AI-powered insights
 */

import { useState } from 'react';
import { useTradesContext } from '../data/TradesContext';
import { useTheme } from '../data/ThemeContext';
import {
  Brain, AlertTriangle, CheckCircle2, TrendingUp, Plus, Calendar, BarChart3, Lightbulb,
} from 'lucide-react';
import type { EmotionalState, PsychologicalFactor } from '../data/types';
import {
  analyzeEmotionalPatterns,
  detectPsychologicalBiases,
  generatePsychologyInsights,
  calculatePsychologyScore,
  EMOTIONAL_STATES,
  PSYCHOLOGICAL_FACTORS,
  createPsychologyEntry,
} from '../utils/psychologyJournal';

export default function PsychologyJournal() {
  const { trades, updateTrade } = useTradesContext();
  const { colors } = useTheme();

  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [preEmotionalState, setPreEmotionalState] = useState<EmotionalState>('neutral');
  const [postEmotionalState, setPostEmotionalState] = useState<EmotionalState>('neutral');
  const [preConfidence, setPreConfidence] = useState(5);
  const [postResponse, setPostResponse] = useState('');
  const [selectedFactors, setSelectedFactors] = useState<PsychologicalFactor[]>([]);
  const [wasRevengeTrade, setWasRevengeTrade] = useState(false);
  const [wasChasing, setWasChasing] = useState(false);
  const [wasOverconfident, setWasOverconfident] = useState(false);
  const [stressLevel, setStressLevel] = useState(5);
  const [sleepQuality, setSleepQuality] = useState(5);
  const [externalFactors, setExternalFactors] = useState('');
  const [lessonsLearned, setLessonsLearned] = useState('');
  const [affirmation, setAffirmation] = useState('');

  const closedTrades = trades.filter((t) => t.status === 'CLOSED' && t.result);
  const selectedTrade = selectedTradeId ? trades.find((t) => t.id === selectedTradeId) : null;

  // Analytics
  const patterns = analyzeEmotionalPatterns(trades);
  const biases = detectPsychologicalBiases(trades);
  const insights = generatePsychologyInsights(trades);
  const psychologyScore = calculatePsychologyScore(trades);

  const handleAddFactor = (factor: PsychologicalFactor) => {
    setSelectedFactors((prev) =>
      prev.includes(factor) ? prev.filter((f) => f !== factor) : [...prev, factor]
    );
  };

  const handleSaveEntry = () => {
    if (!selectedTrade) return;

    const entry = createPsychologyEntry(selectedTrade.id, {
      date: selectedTrade.date,
      preTradeEmotionalState: preEmotionalState,
      postTradeEmotionalState: postEmotionalState,
      preTradeConfidence: preConfidence,
      postTradeEmotionalResponse: postResponse,
      psychologicalFactorsPresent: selectedFactors,
      wasRevengeTrading: wasRevengeTrade,
      wasChasing,
      wasOverconfident,
      stressLevel,
      sleepQuality,
      externalFactors,
      lessonsLearned,
      affirmation,
    });

    updateTrade(selectedTrade.id, {
      psychologicalMetrics: {
        preTradeEmotionalState: entry.preTradeEmotionalState,
        postTradeEmotionalState: entry.postTradeEmotionalState,
        preTradeConfidence: entry.preTradeConfidence,
        postTradeEmotionalResponse: entry.postTradeEmotionalResponse,
        psychologicalFactorsPresent: entry.psychologicalFactorsPresent,
        wasRevengeTrading: entry.wasRevengeTrading,
        wasChasing: entry.wasChasing,
        wasOverconfident: entry.wasOverconfident,
        stressLevel: entry.stressLevel,
        sleepQuality: entry.sleepQuality,
        externalFactors: entry.externalFactors,
        lessonsLearned: entry.lessonsLearned,
        affirmation: entry.affirmation,
        updatedAt: entry.createdAt,
      },
    });

    setShowForm(false);
    // Reset form
    setPreEmotionalState('neutral');
    setPostEmotionalState('neutral');
    setPreConfidence(5);
    setPostResponse('');
    setSelectedFactors([]);
    setWasRevengeTrade(false);
    setWasChasing(false);
    setWasOverconfident(false);
    setStressLevel(5);
    setSleepQuality(5);
    setExternalFactors('');
    setLessonsLearned('');
    setAffirmation('');
  };

  return (
    <div style={{ background: colors.background, color: colors.text, minHeight: '100vh', padding: '2rem' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            🧠 Psychology Journal
          </h1>
          <p style={{ color: colors.textMuted }}>
            Track your emotional state, identify psychological patterns, and improve your trading psychology.
          </p>
        </div>

        {/* Psychology Score */}
        <div
          style={{
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: '0.75rem',
            padding: '1.5rem',
            marginBottom: '2rem',
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: '2rem',
            alignItems: 'center',
          }}
        >
          <div>
            <p style={{ fontSize: '0.875rem', color: colors.textMuted, marginBottom: '0.5rem' }}>
              Psychology Score
            </p>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              {psychologyScore}/100
            </p>
            <p style={{ fontSize: '0.875rem', color: colors.textMuted }}>
              Based on emotional patterns, psychological biases, and trading behavior
            </p>
          </div>
          <div
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: `conic-gradient(#3b82f6 0deg ${(psychologyScore / 100) * 360}deg, ${colors.border} ${(psychologyScore / 100) * 360}deg)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              fontWeight: 'bold',
            }}
          >
            <div
              style={{
                width: '110px',
                height: '110px',
                borderRadius: '50%',
                background: colors.surface,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {psychologyScore}%
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
          {/* Emotional Patterns */}
          <div
            style={{
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: '0.75rem',
              padding: '1.5rem',
            }}
          >
            <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
              📊 Emotional Patterns
            </h2>
            {patterns.length === 0 ? (
              <p style={{ color: colors.textMuted, fontSize: '0.875rem' }}>No emotional data yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {patterns.map((pattern) => (
                  <div
                    key={pattern.emotionalState}
                    style={{
                      padding: '1rem',
                      background: colors.background,
                      borderRadius: '0.5rem',
                      borderLeft: `3px solid ${EMOTIONAL_STATES[pattern.emotionalState].color}`,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: '600' }}>{pattern.emotionalState}</span>
                      <span style={{ color: colors.textMuted, fontSize: '0.875rem' }}>
                        {pattern.totalTrades} trades
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                      <span style={{ color: '#10b981' }}>Win Rate: {pattern.averageWinRate.toFixed(1)}%</span>
                      <span style={{ color: pattern.averagePnL >= 0 ? '#10b981' : '#ef4444' }}>
                        Avg PnL: ${pattern.averagePnL.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Psychological Biases */}
          <div
            style={{
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: '0.75rem',
              padding: '1.5rem',
            }}
          >
            <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
              ⚠️ Psychological Biases
            </h2>
            {biases.length === 0 ? (
              <p style={{ color: colors.textMuted, fontSize: '0.875rem' }}>No bias data yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {biases.map((bias) => (
                  <div
                    key={bias.biasType}
                    style={{
                      padding: '1rem',
                      background: colors.background,
                      borderRadius: '0.5rem',
                      borderLeft: `3px solid ${PSYCHOLOGICAL_FACTORS[bias.biasType].impact === 'negative' ? '#ef4444' : '#10b981'}`,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: '600' }}>{bias.biasType}</span>
                      <span style={{ color: colors.textMuted, fontSize: '0.875rem' }}>
                        {bias.occurrences} times
                      </span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: colors.textMuted, marginBottom: '0.5rem' }}>
                      {bias.recommendation}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                      <span style={{ color: bias.winRate >= 50 ? '#10b981' : '#ef4444' }}>
                        Win Rate: {bias.winRate.toFixed(1)}%
                      </span>
                      {bias.averageLoss > 0 && (
                        <span style={{ color: '#ef4444' }}>Avg Loss: ${bias.averageLoss.toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Key Insights */}
        {insights.length > 0 && (
          <div
            style={{
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: '0.75rem',
              padding: '1.5rem',
              marginBottom: '2rem',
            }}
          >
            <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
              💡 Key Insights
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {insights.map((insight, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '1rem',
                    background: colors.background,
                    borderRadius: '0.5rem',
                    borderLeft: `3px solid ${
                      insight.severity === 'critical'
                        ? '#ef4444'
                        : insight.severity === 'warning'
                          ? '#f59e0b'
                          : '#3b82f6'
                    }`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    {insight.severity === 'critical' && <AlertTriangle size={18} style={{ color: '#ef4444' }} />}
                    {insight.severity === 'warning' && <AlertTriangle size={18} style={{ color: '#f59e0b' }} />}
                    {insight.severity === 'info' && <Lightbulb size={18} style={{ color: '#3b82f6' }} />}
                    <div>
                      <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{insight.title}</p>
                      <p style={{ fontSize: '0.875rem', color: colors.textMuted, marginBottom: '0.75rem' }}>
                        {insight.description}
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {insight.actionItems.map((item, i) => (
                          <p key={i} style={{ fontSize: '0.75rem', color: colors.textMuted }}>
                            • {item}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Journal Entry Form */}
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '1rem 1.5rem',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
            }}
          >
            <Plus size={20} /> Add Psychology Entry
          </button>
        ) : (
          <div
            style={{
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: '0.75rem',
              padding: '2rem',
            }}
          >
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
              📝 New Psychology Entry
            </h2>

            {/* Trade Selection */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Select Trade
              </label>
              <select
                value={selectedTradeId || ''}
                onChange={(e) => setSelectedTradeId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '0.375rem',
                  background: colors.background,
                  color: colors.text,
                }}
              >
                <option value="">Choose a trade...</option>
                {closedTrades.map((trade) => (
                  <option key={trade.id} value={trade.id}>
                    {trade.pair} - {trade.date} ({trade.result}){trade.psychologicalMetrics ? ' ✓ Reviewed' : ''}
                  </option>
                ))}
              </select>
            </div>

            {selectedTrade && (
              <>
                {selectedTrade.psychologicalMetrics && (
                  <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#10b98115', border: '1px solid #10b98155', borderRadius: '0.5rem', color: colors.text }}>
                    This trade already has psychology data. Saving will update the existing review.
                  </div>
                )}

                {/* Pre-Trade Emotional State */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Pre-Trade Emotional State
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.75rem' }}>
                    {(Object.keys(EMOTIONAL_STATES) as EmotionalState[]).map((state) => (
                      <button
                        key={state}
                        onClick={() => setPreEmotionalState(state)}
                        style={{
                          padding: '0.75rem',
                          border: preEmotionalState === state ? `2px solid ${EMOTIONAL_STATES[state].color}` : `1px solid ${colors.border}`,
                          borderRadius: '0.375rem',
                          background: preEmotionalState === state ? `${EMOTIONAL_STATES[state].color}15` : colors.background,
                          color: colors.text,
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          fontWeight: preEmotionalState === state ? '600' : '400',
                        }}
                      >
                        {state}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pre-Trade Confidence */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Pre-Trade Confidence: {preConfidence}/10
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={preConfidence}
                    onChange={(e) => setPreConfidence(Number(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>

                {/* Psychological Factors */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Psychological Factors Present
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.75rem' }}>
                    {(Object.keys(PSYCHOLOGICAL_FACTORS) as PsychologicalFactor[]).map((factor) => (
                      <button
                        key={factor}
                        onClick={() => handleAddFactor(factor)}
                        style={{
                          padding: '0.75rem',
                          border: selectedFactors.includes(factor) ? `2px solid #3b82f6` : `1px solid ${colors.border}`,
                          borderRadius: '0.375rem',
                          background: selectedFactors.includes(factor) ? '#3b82f615' : colors.background,
                          color: colors.text,
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          fontWeight: selectedFactors.includes(factor) ? '600' : '400',
                        }}
                      >
                        {factor}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Checkboxes */}
                <div style={{ marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={wasRevengeTrade}
                      onChange={(e) => setWasRevengeTrade(e.target.checked)}
                    />
                    Was this revenge trading?
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={wasChasing} onChange={(e) => setWasChasing(e.target.checked)} />
                    Was I chasing?
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={wasOverconfident}
                      onChange={(e) => setWasOverconfident(e.target.checked)}
                    />
                    Was I overconfident?
                  </label>
                </div>

                {/* Stress & Sleep */}
                <div style={{ marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                      Stress Level: {stressLevel}/10
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={stressLevel}
                      onChange={(e) => setStressLevel(Number(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                      Sleep Quality: {sleepQuality}/10
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={sleepQuality}
                      onChange={(e) => setSleepQuality(Number(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                {/* Text Fields */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    External Factors
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Market news, Personal stress..."
                    value={externalFactors}
                    onChange={(e) => setExternalFactors(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '0.375rem',
                      background: colors.background,
                      color: colors.text,
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Post-Trade Emotional Response
                  </label>
                  <textarea
                    placeholder="How did you feel after the trade?"
                    value={postResponse}
                    onChange={(e) => setPostResponse(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '0.375rem',
                      background: colors.background,
                      color: colors.text,
                      minHeight: '80px',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Lessons Learned
                  </label>
                  <textarea
                    placeholder="What did you learn from this trade?"
                    value={lessonsLearned}
                    onChange={(e) => setLessonsLearned(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '0.375rem',
                      background: colors.background,
                      color: colors.text,
                      minHeight: '80px',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '2rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Affirmation for Next Trade
                  </label>
                  <textarea
                    placeholder="Write an affirmation to carry forward..."
                    value={affirmation}
                    onChange={(e) => setAffirmation(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '0.375rem',
                      background: colors.background,
                      color: colors.text,
                      minHeight: '60px',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    onClick={() => setShowForm(false)}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      background: colors.border,
                      border: 'none',
                      borderRadius: '0.375rem',
                      color: colors.text,
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEntry}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      background: '#10b981',
                      border: 'none',
                      borderRadius: '0.375rem',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                    }}
                  >
                    Save Entry
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
