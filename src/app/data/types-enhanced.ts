/**
 * Enhanced Types for HustleDashboard Elevation Phase 1
 * Includes broker integration, psychological metrics, and AI-ready structures
 */

export type Session = 'New York' | 'London' | 'Tokyo' | 'Sydney';
export type OrderType = 'Buy' | 'Sell';
export type Trend = 'Bullish' | 'Bearish' | 'Ranging';
export type Strategy = 'D1/H4 FVG' | 'Liquidity' | 'Order Block' | 'ICT Concept' | 'Support/Resistance' | 'Other';
export type Decision = 'TAKE' | 'WAIT' | 'PASS';
export type TradeResult = 'WIN' | 'LOSS' | 'BE';
export type TradeStatus = 'OPEN' | 'CLOSED';

// ─── Broker Integration Types ───────────────────────────────────────────────
export type BrokerType = 'interactive-brokers' | 'metatrader' | 'ctrader' | 'manual' | 'tradingview';

export interface BrokerAccount {
  id: string;
  brokerType: BrokerType;
  accountNumber: string;
  accountName: string;
  currency: string;
  balance: number;
  equity: number;
  usedMargin: number;
  freeMargin: number;
  marginLevel: number;
  lastSyncedAt: string;
  isActive: boolean;
  apiKey?: string; // Encrypted in production
  apiSecret?: string; // Encrypted in production
}

export interface BrokerTrade {
  id: string;
  brokerOrderId: string;
  brokerAccountId: string;
  pair: string;
  orderType: OrderType;
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  commission: number;
  swap: number;
  pnl: number;
  pnlPercent: number;
  openTime: string;
  closeTime?: string;
  status: TradeStatus;
  notes?: string;
}

// ─── Psychological Metrics ─────────────────────────────────────────────────
export type EmotionalState = 'confident' | 'anxious' | 'neutral' | 'revenge-trading' | 'overconfident' | 'fearful';
export type PsychologicalFactor = 'discipline' | 'patience' | 'greed' | 'fear' | 'overconfidence' | 'revenge';

export interface PsychologicalMetrics {
  preTradeEmotionalState: EmotionalState;
  postTradeEmotionalState: EmotionalState;
  preTradeConfidence: number; // 1-10
  postTradeEmotionalResponse: string; // User notes on emotional reaction
  psychologicalFactorsPresent: PsychologicalFactor[];
  wasRevengeTrading: boolean;
  wasChasing: boolean;
  wasOverconfident: boolean;
}

// ─── Enhanced Trade Interface ──────────────────────────────────────────────
export interface Trade {
  id: string;
  date: string;
  pair: string;
  trend: Trend;
  orderType: OrderType;
  session: Session;
  strategy: Strategy;
  bais: string;
  mentalFocus: number;
  confluences: number;
  buyLowSellHigh: number;
  bias: number;
  risk: number;
  rrRatio: number;
  score: number;
  decision: Decision;
  result?: TradeResult;
  pnl?: number;
  notes?: string;
  status: TradeStatus;
  createdAt: string;
  closedAt?: string;
  screenshotBefore?: string;  // base64
  screenshotBefore2?: string; // base64
  screenshotAfter?: string;   // base64
  screenshotAfter2?: string;  // base64
  reviewVideoUrl?: string;    // YouTube / Loom / TradingView replay URL
  isChallengedTrade?: boolean;

  // ─── NEW: Broker Integration ───────────────────────────────────────────
  brokerTradeId?: string;
  brokerAccountId?: string;
  brokerType?: BrokerType;
  entryPrice?: number;
  exitPrice?: number;
  quantity?: number;
  commission?: number;
  actualPnL?: number; // From broker
  
  // ─── NEW: Psychological Metrics ────────────────────────────────────────
  psychologicalMetrics?: PsychologicalMetrics;
  
  // ─── NEW: AI Analysis ──────────────────────────────────────────────────
  aiAnalysis?: {
    patternMatches: string[];
    suggestedImprovements: string[];
    psychologicalInsights: string[];
    lastAnalyzedAt: string;
  };
}

export interface ScoreBreakdown {
  mentalScore: number;
  confluenceScore: number;
  blshScore: number;
  biasScore: number;
  sessionBonus: number;
  riskBonus: number;
  total: number;
  decision: Decision;
}

export interface ChallengeData {
  isActive: boolean;
  startDate: string | null;
  tradeIds: string[];
  challengeNumber: number;
}

// ─── API Response Types ────────────────────────────────────────────────────
export interface BrokerSyncResponse {
  success: boolean;
  message: string;
  tradesImported: number;
  tradesUpdated: number;
  errors?: string[];
}

export interface AIAnalysisRequest {
  tradeId: string;
  tradeData: Trade;
  historicalTrades: Trade[];
}

export interface AIAnalysisResponse {
  patternMatches: string[];
  suggestedImprovements: string[];
  psychologicalInsights: string[];
  confidence: number;
}
