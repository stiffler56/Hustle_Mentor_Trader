export type AccountStatus = 'Ongoing' | 'Passed' | 'Not Passed';
export type AccountPhase = 'Phase 1' | 'Phase 2' | 'Master' | 'Instant';

export interface PropAccount {
  id: string;
  accountNumber: string; // e.g., "#20823275"
  firmName: string; // e.g., "FundingPips", "FTMO", "Custom"
  accountSize: number; // e.g., 50000, 10000, etc.
  currentBalance: number;
  initialBalance: number;
  modelType: string; // e.g., "2 Step Standard"
  phase: AccountPhase;
  status: AccountStatus;
  profitTargetPct: number; // e.g., 8%
  currentProfitPct: number;
  pnl: number;
  dailyDrawdownLimitPct: number; // e.g., 5%
  maxDrawdownLimitPct: number; // e.g., 10%
  currentDailyLoss: number;
  currentMaxDrawdown: number;
  createdAt: string;
  isBreached?: boolean;

  // Additional detail fields
  platform?: string; // e.g. "cTrader", "Match-Trader", "MetaTrader 5"
  minTradingDays?: number; // e.g. 0, 3, 5
  consistencyRulePct?: number; // e.g. 33 (max % profit in single day)
  profitSplitPct?: number; // e.g. 80, 90 (for Master/Funded)
  notes?: string;
  lastUpdated?: string;
}

export interface PropFirmPreset {
  id: string;
  name: string;
  modelType: string;
  phases: {
    phase: AccountPhase;
    profitTargetPct: number;
    dailyDrawdownLimitPct: number;
    maxDrawdownLimitPct: number;
    minTradingDays: number;
  }[];
  defaultSizes: number[];
  platformOptions: string[];
  description: string;
}

export const PROP_FIRM_PRESETS: PropFirmPreset[] = [
  {
    id: 'fundingpips-2step',
    name: 'FundingPips',
    modelType: '2-Step Evaluation',
    phases: [
      { phase: 'Phase 1', profitTargetPct: 8, dailyDrawdownLimitPct: 5, maxDrawdownLimitPct: 10, minTradingDays: 0 },
      { phase: 'Phase 2', profitTargetPct: 5, dailyDrawdownLimitPct: 5, maxDrawdownLimitPct: 10, minTradingDays: 0 },
      { phase: 'Master', profitTargetPct: 0, dailyDrawdownLimitPct: 5, maxDrawdownLimitPct: 10, minTradingDays: 0 },
    ],
    defaultSizes: [5000, 10000, 25000, 50000, 100000],
    platformOptions: ['cTrader', 'Match-Trader', 'TradeLocker'],
    description: 'FundingPips 2-step evaluation: 8% Student, 5% Practitioner, 10% max static loss, 5% daily loss.',
  },
  {
    id: 'fundingpips-1step',
    name: 'FundingPips',
    modelType: '1-Step Evaluation',
    phases: [
      { phase: 'Phase 1', profitTargetPct: 12, dailyDrawdownLimitPct: 3, maxDrawdownLimitPct: 6, minTradingDays: 0 },
      { phase: 'Master', profitTargetPct: 0, dailyDrawdownLimitPct: 3, maxDrawdownLimitPct: 6, minTradingDays: 0 },
    ],
    defaultSizes: [5000, 10000, 25000, 50000, 100000],
    platformOptions: ['cTrader', 'Match-Trader'],
    description: 'FundingPips 1-step challenge: 12% profit target with 6% trailing drawdown and 3% daily loss.',
  },
  {
    id: 'ftmo-standard',
    name: 'FTMO',
    modelType: '2-Step Challenge',
    phases: [
      { phase: 'Phase 1', profitTargetPct: 10, dailyDrawdownLimitPct: 5, maxDrawdownLimitPct: 10, minTradingDays: 4 },
      { phase: 'Phase 2', profitTargetPct: 5, dailyDrawdownLimitPct: 5, maxDrawdownLimitPct: 10, minTradingDays: 4 },
      { phase: 'Master', profitTargetPct: 0, dailyDrawdownLimitPct: 5, maxDrawdownLimitPct: 10, minTradingDays: 0 },
    ],
    defaultSizes: [10000, 25000, 50000, 100000, 200000],
    platformOptions: ['MetaTrader 5', 'cTrader', 'DXtrade'],
    description: 'FTMO Challenge: 10% Phase 1, 5% Phase 2, 5% max daily loss, 10% max total loss.',
  },
  {
    id: 'fundednext-stellar',
    name: 'FundedNext',
    modelType: 'Stellar 2-Step',
    phases: [
      { phase: 'Phase 1', profitTargetPct: 8, dailyDrawdownLimitPct: 5, maxDrawdownLimitPct: 10, minTradingDays: 5 },
      { phase: 'Phase 2', profitTargetPct: 5, dailyDrawdownLimitPct: 5, maxDrawdownLimitPct: 10, minTradingDays: 5 },
      { phase: 'Master', profitTargetPct: 0, dailyDrawdownLimitPct: 5, maxDrawdownLimitPct: 10, minTradingDays: 0 },
    ],
    defaultSizes: [6000, 15000, 25000, 50000, 100000, 200000],
    platformOptions: ['MetaTrader 5', 'cTrader'],
    description: 'FundedNext Stellar 2-Step: Balance-based daily drawdown, 8% and 5% targets.',
  },
  {
    id: 'custom',
    name: 'Custom Prop Firm',
    modelType: 'Custom Model',
    phases: [
      { phase: 'Phase 1', profitTargetPct: 8, dailyDrawdownLimitPct: 5, maxDrawdownLimitPct: 10, minTradingDays: 0 },
    ],
    defaultSizes: [10000, 25000, 50000, 100000, 200000],
    platformOptions: ['cTrader', 'MetaTrader 5', 'TradingView', 'Custom'],
    description: 'Custom account with configurable profit targets and risk limits.',
  },
];
