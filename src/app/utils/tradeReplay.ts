/**
 * Trade Replay Utilities
 * Issue #3: Trade Replay Functionality
 * Manages trade replay sessions, annotations, and playback logic
 */

import type { Trade } from '../data/types-enhanced';

// ─── Replay Session Types ──────────────────────────────────────────────────
export type ReplayPhase = 'setup' | 'entry' | 'management' | 'exit' | 'review';

export interface ReplayAnnotation {
  phase: ReplayPhase;
  timestamp: string;
  note: string;
  keyLearning?: string;
}

export interface TradeReplaySession {
  tradeId: string;
  currentPhase: ReplayPhase;
  annotations: ReplayAnnotation[];
  playbackSpeed: number;
  isPlaying: boolean;
  completedPhases: ReplayPhase[];
}

// ─── Trade Replay Data ─────────────────────────────────────────────────────
export interface TradeReplayData {
  trade: Trade;
  screenshots: {
    setup: string[];      // Before entry screenshots
    entry: string[];      // Entry point screenshots
    management: string[]; // During trade screenshots
    exit: string[];       // Exit point screenshots
  };
  videoUrl?: string;
  annotations: ReplayAnnotation[];
}

// ─── Phase Descriptions ────────────────────────────────────────────────────
export const PHASE_DESCRIPTIONS: Record<ReplayPhase, { title: string; description: string }> = {
  setup: {
    title: '📋 Setup Phase',
    description: 'Review your pre-trade analysis and decision-making process. What was your bias? What confluences did you identify?',
  },
  entry: {
    title: '🎯 Entry Phase',
    description: 'Analyze your entry point. Was it aligned with your strategy? Did you follow your rules?',
  },
  management: {
    title: '📊 Management Phase',
    description: 'Review how you managed the trade. Did you stick to your plan? How did you respond to market moves?',
  },
  exit: {
    title: '🚪 Exit Phase',
    description: 'Evaluate your exit decision. Was it based on your rules or emotions? What would you do differently?',
  },
  review: {
    title: '🔍 Review & Learning',
    description: 'Summarize your key learnings. What did you do well? What can you improve?',
  },
};

// ─── Screenshot Organization ──────────────────────────────────────────────
export function organizeScreenshots(trade: Trade): TradeReplayData['screenshots'] {
  return {
    setup: [trade.screenshotBefore, trade.screenshotBefore2].filter(Boolean) as string[],
    entry: [],
    management: [],
    exit: [trade.screenshotAfter, trade.screenshotAfter2].filter(Boolean) as string[],
  };
}

// ─── Initialize Replay Session ─────────────────────────────────────────────
export function initializeReplaySession(tradeId: string): TradeReplaySession {
  return {
    tradeId,
    currentPhase: 'setup',
    annotations: [],
    playbackSpeed: 1,
    isPlaying: false,
    completedPhases: [],
  };
}

// ─── Add Annotation ────────────────────────────────────────────────────────
export function addAnnotation(
  session: TradeReplaySession,
  phase: ReplayPhase,
  note: string,
  keyLearning?: string
): TradeReplaySession {
  const annotation: ReplayAnnotation = {
    phase,
    timestamp: new Date().toISOString(),
    note,
    keyLearning,
  };

  return {
    ...session,
    annotations: [...session.annotations, annotation],
  };
}

// ─── Move to Next Phase ────────────────────────────────────────────────────
export function moveToNextPhase(session: TradeReplaySession): TradeReplaySession {
  const phases: ReplayPhase[] = ['setup', 'entry', 'management', 'exit', 'review'];
  const currentIndex = phases.indexOf(session.currentPhase);

  if (currentIndex < phases.length - 1) {
    const nextPhase = phases[currentIndex + 1];
    return {
      ...session,
      currentPhase: nextPhase,
      completedPhases: [...new Set([...session.completedPhases, session.currentPhase])],
    };
  }

  return session;
}

// ─── Move to Previous Phase ────────────────────────────────────────────────
export function moveToPreviousPhase(session: TradeReplaySession): TradeReplaySession {
  const phases: ReplayPhase[] = ['setup', 'entry', 'management', 'exit', 'review'];
  const currentIndex = phases.indexOf(session.currentPhase);

  if (currentIndex > 0) {
    const previousPhase = phases[currentIndex - 1];
    return {
      ...session,
      currentPhase: previousPhase,
    };
  }

  return session;
}

// ─── Get Phase Progress ────────────────────────────────────────────────────
export function getPhaseProgress(session: TradeReplaySession): number {
  const phases: ReplayPhase[] = ['setup', 'entry', 'management', 'exit', 'review'];
  const currentIndex = phases.indexOf(session.currentPhase);
  return Math.round(((currentIndex + 1) / phases.length) * 100);
}

// ─── Generate Replay Summary ───────────────────────────────────────────────
export interface ReplaySummary {
  tradeId: string;
  totalPhases: number;
  completedPhases: number;
  annotations: ReplayAnnotation[];
  keyLearnings: string[];
  completionPercentage: number;
}

export function generateReplaySummary(session: TradeReplaySession, trade: Trade): ReplaySummary {
  const phases: ReplayPhase[] = ['setup', 'entry', 'management', 'exit', 'review'];
  const keyLearnings = session.annotations
    .filter((a) => a.keyLearning)
    .map((a) => a.keyLearning as string);

  return {
    tradeId: trade.id,
    totalPhases: phases.length,
    completedPhases: session.completedPhases.length,
    annotations: session.annotations,
    keyLearnings,
    completionPercentage: (session.completedPhases.length / phases.length) * 100,
  };
}

// ─── Export Replay Report ──────────────────────────────────────────────────
export function generateReplayReport(summary: ReplaySummary, trade: Trade): string {
  const report = `
# Trade Replay Report
**Trade ID:** ${trade.id}
**Date:** ${trade.date}
**Pair:** ${trade.pair}
**Result:** ${trade.result}

## Trade Details
- **Entry Price:** ${trade.entryPrice || 'N/A'}
- **Exit Price:** ${trade.exitPrice || 'N/A'}
- **PnL:** ${trade.pnl || 'N/A'}
- **Strategy:** ${trade.strategy}
- **Session:** ${trade.session}

## Replay Progress
- **Phases Completed:** ${summary.completedPhases}/${summary.totalPhases}
- **Completion:** ${summary.completionPercentage.toFixed(1)}%

## Annotations
${summary.annotations.map((a) => `- **${a.phase}:** ${a.note}`).join('\n')}

## Key Learnings
${summary.keyLearnings.length > 0 ? summary.keyLearnings.map((l) => `- ${l}`).join('\n') : 'No key learnings recorded yet.'}

---
*Generated on ${new Date().toLocaleString()}*
  `;

  return report;
}
