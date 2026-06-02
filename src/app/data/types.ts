export type Session = 'New York' | 'London' | 'Tokyo' | 'Sydney';
export type OrderType = 'Buy' | 'Sell';
export type Trend = 'Bullish' | 'Bearish' | 'Ranging';
export type Strategy = 'D1/H4 FVG' | 'Liquidity' | 'Order Block' | 'ICT Concept' | 'Support/Resistance' | 'Other';
export type Decision = 'TAKE' | 'WAIT' | 'PASS';
export type TradeResult = 'WIN' | 'LOSS' | 'BE';
export type TradeStatus = 'OPEN' | 'CLOSED';

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