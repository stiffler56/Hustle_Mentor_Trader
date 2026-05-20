/**
 * Trade Replay Page
 * Issue #3: Trade Replay Functionality
 * Allows users to step through trades with screenshots, videos, and annotations
 */

import { useState, useEffect } from 'react';
import { useTradesContext } from '../data/TradesContext';
import { useTheme } from '../data/ThemeContext';
import {
  ChevronLeft, ChevronRight, Play, Pause, Volume2, VolumeX, Download, MessageSquare,
  Image as ImageIcon, Video, CheckCircle2, Clock, TrendingUp, TrendingDown,
} from 'lucide-react';
import type { Trade } from '../data/types-enhanced';
import {
  initializeReplaySession,
  addAnnotation,
  moveToNextPhase,
  moveToPreviousPhase,
  getPhaseProgress,
  generateReplaySummary,
  generateReplayReport,
  PHASE_DESCRIPTIONS,
  organizeScreenshots,
} from '../utils/tradeReplay';
import type { ReplayPhase, TradeReplaySession } from '../utils/tradeReplay';

export default function TradeReplay() {
  const { trades } = useTradesContext();
  const { colors } = useTheme();

  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);
  const [replaySession, setReplaySession] = useState<TradeReplaySession | null>(null);
  const [annotationText, setAnnotationText] = useState('');
  const [keyLearningText, setKeyLearningText] = useState('');
  const [showAnnotationForm, setShowAnnotationForm] = useState(false);

  const selectedTrade = selectedTradeId ? trades.find((t) => t.id === selectedTradeId) : null;
  const closedTrades = trades.filter((t) => t.status === 'CLOSED' && t.result);

  // Initialize replay session when trade is selected
  useEffect(() => {
    if (selectedTradeId && !replaySession) {
      setReplaySession(initializeReplaySession(selectedTradeId));
    }
  }, [selectedTradeId, replaySession]);

  // Handle phase navigation
  const handleNextPhase = () => {
    if (replaySession) {
      setReplaySession(moveToNextPhase(replaySession));
      setShowAnnotationForm(false);
    }
  };

  const handlePreviousPhase = () => {
    if (replaySession) {
      setReplaySession(moveToPreviousPhase(replaySession));
      setShowAnnotationForm(false);
    }
  };

  // Handle adding annotation
  const handleAddAnnotation = () => {
    if (replaySession && annotationText.trim()) {
      const updated = addAnnotation(
        replaySession,
        replaySession.currentPhase,
        annotationText,
        keyLearningText || undefined
      );
      setReplaySession(updated);
      setAnnotationText('');
      setKeyLearningText('');
      setShowAnnotationForm(false);
    }
  };

  // Handle export report
  const handleExportReport = () => {
    if (replaySession && selectedTrade) {
      const summary = generateReplaySummary(replaySession, selectedTrade);
      const report = generateReplayReport(summary, selectedTrade);

      const blob = new Blob([report], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trade-replay-${selectedTrade.id}-${new Date().toISOString().split('T')[0]}.md`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const phaseInfo = replaySession ? PHASE_DESCRIPTIONS[replaySession.currentPhase] : null;
  const phaseProgress = replaySession ? getPhaseProgress(replaySession) : 0;
  const screenshots = selectedTrade ? organizeScreenshots(selectedTrade) : null;

  return (
    <div style={{ background: colors.background, color: colors.text, minHeight: '100vh', padding: '2rem' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            🎬 Trade Replay
          </h1>
          <p style={{ color: colors.textMuted }}>
            Step through your trades, review your decisions, and capture key learnings for improvement.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem' }}>
          {/* Trade List Sidebar */}
          <div
            style={{
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: '0.75rem',
              padding: '1.5rem',
              maxHeight: '600px',
              overflowY: 'auto',
            }}
          >
            <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>Closed Trades</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {closedTrades.length === 0 ? (
                <p style={{ color: colors.textMuted, fontSize: '0.875rem' }}>No closed trades yet.</p>
              ) : (
                closedTrades.map((trade) => (
                  <button
                    key={trade.id}
                    onClick={() => {
                      setSelectedTradeId(trade.id);
                      setReplaySession(null);
                    }}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      border: selectedTradeId === trade.id ? `2px solid #3b82f6` : `1px solid ${colors.border}`,
                      background: selectedTradeId === trade.id ? '#3b82f615' : colors.background,
                      color: colors.text,
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: '0.875rem',
                    }}
                  >
                    <div style={{ fontWeight: '600' }}>{trade.pair}</div>
                    <div style={{ color: colors.textMuted, fontSize: '0.75rem' }}>{trade.date}</div>
                    <div
                      style={{
                        color: trade.result === 'WIN' ? '#10b981' : '#ef4444',
                        fontSize: '0.75rem',
                        marginTop: '0.25rem',
                      }}
                    >
                      {trade.result} • ${trade.pnl?.toFixed(2) || '0.00'}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Main Replay Area */}
          {selectedTrade && replaySession && phaseInfo ? (
            <div>
              {/* Trade Header */}
              <div
                style={{
                  background: colors.surface,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  marginBottom: '1.5rem',
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                      {selectedTrade.pair} - {selectedTrade.date}
                    </h2>
                    <p style={{ color: colors.textMuted, fontSize: '0.875rem' }}>
                      {selectedTrade.strategy} • {selectedTrade.session} • {selectedTrade.orderType}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        color: selectedTrade.result === 'WIN' ? '#10b981' : '#ef4444',
                        marginBottom: '0.5rem',
                      }}
                    >
                      {selectedTrade.result} • ${selectedTrade.pnl?.toFixed(2) || '0.00'}
                    </div>
                    <button
                      onClick={handleExportReport}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                      }}
                    >
                      <Download size={16} /> Export Report
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.875rem', color: colors.textMuted }}>Replay Progress</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>{phaseProgress}%</span>
                  </div>
                  <div
                    style={{
                      width: '100%',
                      height: '8px',
                      background: colors.background,
                      borderRadius: '4px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${phaseProgress}%`,
                        height: '100%',
                        background: '#3b82f6',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Phase Content */}
              <div
                style={{
                  background: colors.surface,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  marginBottom: '1.5rem',
                }}
              >
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                    {phaseInfo.title}
                  </h3>
                  <p style={{ color: colors.textMuted, fontSize: '0.875rem' }}>{phaseInfo.description}</p>
                </div>

                {/* Screenshots */}
                {screenshots && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '1rem', color: colors.textMuted }}>
                      📸 Screenshots
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                      {replaySession.currentPhase === 'setup' && screenshots.setup.length > 0 ? (
                        screenshots.setup.map((img, idx) => (
                          <img
                            key={idx}
                            src={img}
                            alt={`Setup ${idx + 1}`}
                            style={{
                              width: '100%',
                              height: '200px',
                              objectFit: 'cover',
                              borderRadius: '0.5rem',
                              border: `1px solid ${colors.border}`,
                            }}
                          />
                        ))
                      ) : replaySession.currentPhase === 'exit' && screenshots.exit.length > 0 ? (
                        screenshots.exit.map((img, idx) => (
                          <img
                            key={idx}
                            src={img}
                            alt={`Exit ${idx + 1}`}
                            style={{
                              width: '100%',
                              height: '200px',
                              objectFit: 'cover',
                              borderRadius: '0.5rem',
                              border: `1px solid ${colors.border}`,
                            }}
                          />
                        ))
                      ) : (
                        <p style={{ color: colors.textMuted, fontSize: '0.875rem', gridColumn: '1 / -1' }}>
                          No screenshots for this phase.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Video */}
                {selectedTrade.reviewVideoUrl && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '1rem', color: colors.textMuted }}>
                      🎥 Review Video
                    </h4>
                    <iframe
                      width="100%"
                      height="400"
                      src={selectedTrade.reviewVideoUrl.includes('youtube') ? selectedTrade.reviewVideoUrl.replace('watch?v=', 'embed/') : selectedTrade.reviewVideoUrl}
                      title="Trade Review"
                      style={{ borderRadius: '0.5rem', border: `1px solid ${colors.border}` }}
                      allowFullScreen
                    />
                  </div>
                )}

                {/* Annotations for this phase */}
                {replaySession.annotations.filter((a) => a.phase === replaySession.currentPhase).length > 0 && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '1rem', color: colors.textMuted }}>
                      📝 Notes
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {replaySession.annotations
                        .filter((a) => a.phase === replaySession.currentPhase)
                        .map((annotation, idx) => (
                          <div
                            key={idx}
                            style={{
                              padding: '1rem',
                              background: colors.background,
                              borderRadius: '0.5rem',
                              borderLeft: '3px solid #3b82f6',
                            }}
                          >
                            <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>{annotation.note}</p>
                            {annotation.keyLearning && (
                              <p style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: '600' }}>
                                💡 Key Learning: {annotation.keyLearning}
                              </p>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Add Annotation Form */}
                {!showAnnotationForm ? (
                  <button
                    onClick={() => setShowAnnotationForm(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1rem',
                      background: colors.background,
                      border: `1px solid ${colors.border}`,
                      borderRadius: '0.375rem',
                      color: colors.text,
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                    }}
                  >
                    <MessageSquare size={16} /> Add Note
                  </button>
                ) : (
                  <div style={{ padding: '1rem', background: colors.background, borderRadius: '0.5rem' }}>
                    <textarea
                      value={annotationText}
                      onChange={(e) => setAnnotationText(e.target.value)}
                      placeholder="Write your observation or note for this phase..."
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: `1px solid ${colors.border}`,
                        borderRadius: '0.375rem',
                        background: colors.surface,
                        color: colors.text,
                        marginBottom: '0.75rem',
                        fontFamily: 'inherit',
                        minHeight: '80px',
                      }}
                    />
                    <input
                      type="text"
                      value={keyLearningText}
                      onChange={(e) => setKeyLearningText(e.target.value)}
                      placeholder="Key learning (optional)..."
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: `1px solid ${colors.border}`,
                        borderRadius: '0.375rem',
                        background: colors.surface,
                        color: colors.text,
                        marginBottom: '1rem',
                        fontFamily: 'inherit',
                      }}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => setShowAnnotationForm(false)}
                        style={{
                          flex: 1,
                          padding: '0.5rem',
                          background: colors.border,
                          border: 'none',
                          borderRadius: '0.375rem',
                          color: colors.text,
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddAnnotation}
                        style={{
                          flex: 1,
                          padding: '0.5rem',
                          background: '#10b981',
                          border: 'none',
                          borderRadius: '0.375rem',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                        }}
                      >
                        Save Note
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Phase Navigation */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1.5rem',
                  background: colors.surface,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '0.75rem',
                }}
              >
                <button
                  onClick={handlePreviousPhase}
                  disabled={replaySession.currentPhase === 'setup'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    background: replaySession.currentPhase === 'setup' ? colors.border : '#3b82f6',
                    color: replaySession.currentPhase === 'setup' ? colors.textMuted : 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: replaySession.currentPhase === 'setup' ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                  }}
                >
                  <ChevronLeft size={16} /> Previous
                </button>

                <div style={{ textAlign: 'center' }}>
                  <p style={{ color: colors.textMuted, fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                    Phase {['setup', 'entry', 'management', 'exit', 'review'].indexOf(replaySession.currentPhase) + 1} of 5
                  </p>
                  <p style={{ fontWeight: '600' }}>{replaySession.currentPhase.toUpperCase()}</p>
                </div>

                <button
                  onClick={handleNextPhase}
                  disabled={replaySession.currentPhase === 'review'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    background: replaySession.currentPhase === 'review' ? colors.border : '#10b981',
                    color: replaySession.currentPhase === 'review' ? colors.textMuted : 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: replaySession.currentPhase === 'review' ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                  }}
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div
              style={{
                background: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: '0.75rem',
                padding: '3rem',
                textAlign: 'center',
              }}
            >
              <p style={{ color: colors.textMuted, fontSize: '1rem' }}>
                Select a closed trade from the list to begin the replay.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
