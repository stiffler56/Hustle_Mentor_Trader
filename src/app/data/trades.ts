export interface Trade {
  id: string;
  date: string;
  pair: 'XAUUSD' | 'EURUSD' | 'GBPUSD' | 'USDJPY' | 'USDCAD';
  orderType: 'BUY' | 'SELL';
  trend: 'BULLISH' | 'BEARISH' | 'RANGING';
  session: 'New York' | 'London' | 'Asian';
  strategy: string;
  bais: string;
  mentalFocus: number;
  confluences: number;
  buyLowSellHigh: number;
  biasAlignment: number;
  riskPercent: number;
  score: number;
  decision: 'TAKE' | 'WAIT' | 'PASS';
  result: 'WIN' | 'LOSS' | 'BREAKEVEN' | null;
  pnl: number | null;
  rrRatio: number | null;
  notes: string;
  beforeScreenshot?: string;
  afterScreenshot?: string;
}

export const mockTrades: Trade[] = [
  {
    id: '1',
    date: '2025-04-25',
    pair: 'XAUUSD',
    orderType: 'BUY',
    trend: 'BULLISH',
    session: 'New York',
    strategy: 'D1/H4 FVG',
    bais: 'FVG + OB',
    mentalFocus: 25,
    confluences: 3,
    buyLowSellHigh: 22,
    biasAlignment: 24,
    riskPercent: 1.0,
    score: 82,
    decision: 'TAKE',
    result: 'WIN',
    pnl: 312,
    rrRatio: 2.5,
    notes: 'Clean FVG retest, OB confluence aligned with D1 bias. Patient entry.',
  },
  {
    id: '2',
    date: '2025-04-23',
    pair: 'XAUUSD',
    orderType: 'SELL',
    trend: 'BEARISH',
    session: 'New York',
    strategy: 'Liquidity',
    bais: 'Liquidity Sweep + FVG',
    mentalFocus: 28,
    confluences: 4,
    buyLowSellHigh: 24,
    biasAlignment: 26,
    riskPercent: 1.0,
    score: 91,
    decision: 'TAKE',
    result: 'WIN',
    pnl: 498,
    rrRatio: 3.2,
    notes: 'Liquidity sweep above resistance, perfect structure alignment.',
  },
  {
    id: '3',
    date: '2025-04-21',
    pair: 'XAUUSD',
    orderType: 'BUY',
    trend: 'BULLISH',
    session: 'London',
    strategy: 'Order Block',
    bais: 'OB',
    mentalFocus: 8,
    confluences: 1,
    buyLowSellHigh: 12,
    biasAlignment: 10,
    riskPercent: 2.0,
    score: 28,
    decision: 'PASS',
    result: 'LOSS',
    pnl: -195,
    rrRatio: -1.5,
    notes: 'EMOTIONAL TRADE - should have skipped. London session + single confluence.',
  },
  {
    id: '4',
    date: '2025-04-19',
    pair: 'XAUUSD',
    orderType: 'SELL',
    trend: 'BEARISH',
    session: 'New York',
    strategy: 'D1/H4 FVG',
    bais: 'FVG',
    mentalFocus: 22,
    confluences: 3,
    buyLowSellHigh: 21,
    biasAlignment: 22,
    riskPercent: 1.0,
    score: 79,
    decision: 'TAKE',
    result: 'WIN',
    pnl: 249,
    rrRatio: 2.1,
    notes: 'OB + FVG confluence = took short. Price did exactly what structure predicted.',
  },
  {
    id: '5',
    date: '2025-04-17',
    pair: 'XAUUSD',
    orderType: 'BUY',
    trend: 'BULLISH',
    session: 'London',
    strategy: 'D1/H4 FVG',
    bais: 'FVG',
    mentalFocus: 15,
    confluences: 2,
    buyLowSellHigh: 16,
    biasAlignment: 15,
    riskPercent: 1.5,
    score: 51,
    decision: 'PASS',
    result: 'LOSS',
    pnl: -120,
    rrRatio: -1.0,
    notes: 'London session, weak confluences. Should have waited for NY.',
  },
  {
    id: '6',
    date: '2025-04-15',
    pair: 'XAUUSD',
    orderType: 'SELL',
    trend: 'BEARISH',
    session: 'New York',
    strategy: 'Liquidity',
    bais: 'Liquidity + OB',
    mentalFocus: 30,
    confluences: 4,
    buyLowSellHigh: 25,
    biasAlignment: 28,
    riskPercent: 1.0,
    score: 95,
    decision: 'TAKE',
    result: 'WIN',
    pnl: 578,
    rrRatio: 4.0,
    notes: 'Perfect setup. All confluences aligned. Best trade of the month.',
  },
  {
    id: '7',
    date: '2025-04-14',
    pair: 'XAUUSD',
    orderType: 'BUY',
    trend: 'RANGING',
    session: 'Asian',
    strategy: 'Order Block',
    bais: 'Nothing',
    mentalFocus: 5,
    confluences: 1,
    buyLowSellHigh: 8,
    biasAlignment: 6,
    riskPercent: 2.5,
    score: 18,
    decision: 'PASS',
    result: 'LOSS',
    pnl: -380,
    rrRatio: -2.0,
    notes: 'Asian session FOMO trade. No setup, emotional entry. Biggest loss.',
  },
  {
    id: '8',
    date: '2025-04-11',
    pair: 'XAUUSD',
    orderType: 'SELL',
    trend: 'BEARISH',
    session: 'New York',
    strategy: 'D1/H4 FVG',
    bais: 'FVG + OB + Liquidity',
    mentalFocus: 26,
    confluences: 3,
    buyLowSellHigh: 23,
    biasAlignment: 25,
    riskPercent: 1.2,
    score: 84,
    decision: 'TAKE',
    result: 'WIN',
    pnl: 320,
    rrRatio: 2.3,
    notes: 'Triple confluence, NY session. Textbook setup.',
  },
  {
    id: '9',
    date: '2025-04-09',
    pair: 'EURUSD',
    orderType: 'BUY',
    trend: 'BULLISH',
    session: 'London',
    strategy: 'Order Block',
    bais: 'OB',
    mentalFocus: 18,
    confluences: 2,
    buyLowSellHigh: 17,
    biasAlignment: 16,
    riskPercent: 1.0,
    score: 55,
    decision: 'WAIT',
    result: 'BREAKEVEN',
    pnl: 0,
    rrRatio: 0,
    notes: 'Marginal setup on EURUSD. Not my main pair. Should focus on XAUUSD.',
  },
  {
    id: '10',
    date: '2025-04-07',
    pair: 'XAUUSD',
    orderType: 'BUY',
    trend: 'BULLISH',
    session: 'New York',
    strategy: 'Liquidity',
    bais: 'Liquidity Sweep',
    mentalFocus: 24,
    confluences: 3,
    buyLowSellHigh: 22,
    biasAlignment: 23,
    riskPercent: 1.0,
    score: 80,
    decision: 'TAKE',
    result: 'WIN',
    pnl: 285,
    rrRatio: 2.0,
    notes: 'Liquidity grab at lows, NY session entry. Clean execution.',
  },
  {
    id: '11',
    date: '2025-04-04',
    pair: 'XAUUSD',
    orderType: 'SELL',
    trend: 'BEARISH',
    session: 'London',
    strategy: 'D1/H4 FVG',
    bais: 'FVG',
    mentalFocus: 12,
    confluences: 2,
    buyLowSellHigh: 14,
    biasAlignment: 13,
    riskPercent: 1.5,
    score: 43,
    decision: 'PASS',
    result: 'LOSS',
    pnl: -145,
    rrRatio: -1.2,
    notes: 'London session, rushed entry. Mental focus too low.',
  },
  {
    id: '12',
    date: '2025-04-02',
    pair: 'XAUUSD',
    orderType: 'BUY',
    trend: 'BULLISH',
    session: 'New York',
    strategy: 'D1/H4 FVG',
    bais: 'FVG + OB',
    mentalFocus: 27,
    confluences: 4,
    buyLowSellHigh: 24,
    biasAlignment: 26,
    riskPercent: 1.0,
    score: 90,
    decision: 'TAKE',
    result: 'WIN',
    pnl: 412,
    rrRatio: 3.0,
    notes: 'Perfect FVG + OB confluence. High mental clarity. NY session.',
  },
  {
    id: '13',
    date: '2025-03-31',
    pair: 'XAUUSD',
    orderType: 'SELL',
    trend: 'BEARISH',
    session: 'New York',
    strategy: 'Liquidity',
    bais: 'Liquidity + FVG',
    mentalFocus: 20,
    confluences: 3,
    buyLowSellHigh: 20,
    biasAlignment: 21,
    riskPercent: 1.0,
    score: 76,
    decision: 'TAKE',
    result: 'WIN',
    pnl: 198,
    rrRatio: 1.8,
    notes: 'Solid setup. Slightly cautious entry but worked out.',
  },
  {
    id: '14',
    date: '2025-03-28',
    pair: 'XAUUSD',
    orderType: 'BUY',
    trend: 'RANGING',
    session: 'London',
    strategy: 'Order Block',
    bais: 'Nothing',
    mentalFocus: 7,
    confluences: 1,
    buyLowSellHigh: 9,
    biasAlignment: 8,
    riskPercent: 2.0,
    score: 22,
    decision: 'PASS',
    result: 'LOSS',
    pnl: -220,
    rrRatio: -1.8,
    notes: 'EMOTIONAL TRADE. Wrote skip this. Took it anyway. Classic mistake.',
  },
  {
    id: '15',
    date: '2025-03-25',
    pair: 'XAUUSD',
    orderType: 'SELL',
    trend: 'BEARISH',
    session: 'New York',
    strategy: 'D1/H4 FVG',
    bais: 'FVG + OB + Liquidity',
    mentalFocus: 29,
    confluences: 4,
    buyLowSellHigh: 25,
    biasAlignment: 27,
    riskPercent: 1.0,
    score: 93,
    decision: 'TAKE',
    result: 'WIN',
    pnl: 520,
    rrRatio: 3.5,
    notes: 'Maximum confluence. Perfect execution. This is what trading should look like.',
  },
  {
    id: '16',
    date: '2025-03-22',
    pair: 'XAUUSD',
    orderType: 'BUY',
    trend: 'BULLISH',
    session: 'London',
    strategy: 'Order Block',
    bais: 'OB',
    mentalFocus: 16,
    confluences: 2,
    buyLowSellHigh: 15,
    biasAlignment: 14,
    riskPercent: 1.5,
    score: 47,
    decision: 'PASS',
    result: 'LOSS',
    pnl: -98,
    rrRatio: -0.8,
    notes: 'Weak London setup. Pattern to avoid.',
  },
  {
    id: '17',
    date: '2025-03-19',
    pair: 'XAUUSD',
    orderType: 'SELL',
    trend: 'BEARISH',
    session: 'New York',
    strategy: 'Liquidity',
    bais: 'Liquidity Sweep',
    mentalFocus: 23,
    confluences: 3,
    buyLowSellHigh: 22,
    biasAlignment: 22,
    riskPercent: 1.0,
    score: 79,
    decision: 'TAKE',
    result: 'WIN',
    pnl: 267,
    rrRatio: 2.0,
    notes: 'Liquidity sweep + NY session. Reliable setup.',
  },
  {
    id: '18',
    date: '2025-03-15',
    pair: 'GBPUSD',
    orderType: 'BUY',
    trend: 'BULLISH',
    session: 'London',
    strategy: 'D1/H4 FVG',
    bais: 'FVG',
    mentalFocus: 19,
    confluences: 2,
    buyLowSellHigh: 18,
    biasAlignment: 17,
    riskPercent: 1.0,
    score: 58,
    decision: 'WAIT',
    result: 'LOSS',
    pnl: -85,
    rrRatio: -0.7,
    notes: 'Off-pair trade. Not XAUUSD. Lesson: stay in your lane.',
  },
  {
    id: '19',
    date: '2025-03-12',
    pair: 'XAUUSD',
    orderType: 'BUY',
    trend: 'BULLISH',
    session: 'New York',
    strategy: 'D1/H4 FVG',
    bais: 'FVG + Liquidity',
    mentalFocus: 25,
    confluences: 3,
    buyLowSellHigh: 23,
    biasAlignment: 24,
    riskPercent: 1.0,
    score: 83,
    decision: 'TAKE',
    result: 'WIN',
    pnl: 345,
    rrRatio: 2.5,
    notes: 'Strong FVG + liquidity setup in NY. Clean win.',
  },
  {
    id: '20',
    date: '2025-03-05',
    pair: 'XAUUSD',
    orderType: 'BUY',
    trend: 'RANGING',
    session: 'Asian',
    strategy: 'Order Block',
    bais: 'Nothing',
    mentalFocus: 6,
    confluences: 1,
    buyLowSellHigh: 7,
    biasAlignment: 5,
    riskPercent: 2.0,
    score: 15,
    decision: 'PASS',
    result: 'LOSS',
    pnl: -195,
    rrRatio: -1.5,
    notes: 'EMOTIONAL TRADE AH SKIP. Took it anyway. Mental focus 6. Classic mistake.',
  },
];

export function calculateScore(
  mentalFocus: number,
  confluences: number,
  buyLowSellHigh: number,
  biasAlignment: number,
  riskPercent: number
): number {
  // Mental Focus (0-40): Weight 30%
  let mfScore = 0;
  if (mentalFocus >= 20 && mentalFocus <= 30) mfScore = 100;
  else if (mentalFocus >= 31 && mentalFocus <= 40) mfScore = 75;
  else if (mentalFocus >= 15 && mentalFocus < 20) mfScore = 50;
  else if (mentalFocus >= 10 && mentalFocus < 15) mfScore = 25;
  else mfScore = 0;

  // Confluences (1-4): Weight 25%
  let confScore = 0;
  if (confluences >= 4) confScore = 100;
  else if (confluences === 3) confScore = 80;
  else if (confluences === 2) confScore = 45;
  else confScore = 20;

  // Buy Low / Sell High (0-30): Weight 20%
  let blshScore = 0;
  if (buyLowSellHigh >= 20 && buyLowSellHigh <= 25) blshScore = 100;
  else if (buyLowSellHigh > 25 && buyLowSellHigh <= 30) blshScore = 75;
  else if (buyLowSellHigh >= 15 && buyLowSellHigh < 20) blshScore = 50;
  else if (buyLowSellHigh >= 10 && buyLowSellHigh < 15) blshScore = 25;
  else blshScore = 0;

  // Bias Alignment (0-30): Weight 15%
  let biasScore = 0;
  if (biasAlignment >= 20 && biasAlignment <= 30) biasScore = 100;
  else if (biasAlignment >= 15 && biasAlignment < 20) biasScore = 55;
  else if (biasAlignment >= 10 && biasAlignment < 15) biasScore = 25;
  else biasScore = 0;

  // Risk % (0-3+): Weight 10%
  let riskScore = 0;
  if (riskPercent >= 1.0 && riskPercent <= 1.5) riskScore = 100;
  else if (riskPercent > 1.5 && riskPercent <= 2.0) riskScore = 55;
  else if (riskPercent > 0.5 && riskPercent < 1.0) riskScore = 70;
  else if (riskPercent > 2.0) riskScore = 15;
  else riskScore = 40;

  const totalScore = Math.round(
    mfScore * 0.30 +
    confScore * 0.25 +
    blshScore * 0.20 +
    biasScore * 0.15 +
    riskScore * 0.10
  );

  return totalScore;
}

export function getDecision(score: number): 'TAKE' | 'WAIT' | 'PASS' {
  if (score >= 75) return 'TAKE';
  if (score >= 55) return 'WAIT';
  return 'PASS';
}
