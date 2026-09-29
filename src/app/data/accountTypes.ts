export type AccountCategory = 'prop_evaluation' | 'prop_funded' | 'broker_live' | 'broker_demo';
export type AccountStatus = 'Ongoing' | 'Passed' | 'Not Passed' | 'Active' | 'Breached';
export type TradingPlatform = 'MetaTrader 5' | 'MetaTrader 4' | 'cTrader' | 'TradeLocker' | 'TradingView' | 'Other';
export type PropPhase = 'Phase 1' | 'Phase 2' | 'Master' | 'Funded';

export interface PropDetails {
  modelType: string; // e.g. "2 Step Standard", "1 Step"
  phase: PropPhase;
  profitTargetPct: number; // e.g., 8%
  dailyDrawdownLimitPct: number; // e.g., 5%
  maxDrawdownLimitPct: number; // e.g., 10%
  minTradingDays?: number;
  tradingDaysLogged?: number;
  consistencyRulePct?: number; // e.g., 33%
  profitSplitPct?: number; // e.g., 85%
  currentDailyLoss?: number;
  currentMaxDrawdown?: number;
}

export interface ConsistencyMetrics {
  riskReward: number;
  stopLossUsagePct: number;
  winRate: number;
}

export interface Account {
  id: string;
  accountNumber: string; // e.g., "#20823275"
  name: string; // e.g., "FundingPips $50k" or "IC Markets Raw ECN"
  category: AccountCategory;
  provider: string; // e.g., "FundingPips", "FTMO", "IC Markets", "Pepperstone"
  platform: TradingPlatform;
  serverType?: string; // e.g., "Swap Free", "Standard", "Raw Spread"
  initialBalance: number;
  currentBalance: number;
  currentEquity: number;
  currency: string; // e.g., "USD"
  status: AccountStatus;
  startDate: string;

  // Prop-firm specific rules (optional for broker accounts)
  propDetails?: PropDetails;

  // Metrics
  todayPnl: number;
  totalPnl: number;
  consistencyScore?: number; // e.g., 2.08
  consistencyMetrics?: ConsistencyMetrics;
  notes?: string;
  isBreached?: boolean;
}

// Backward compatibility aliases
export type PropAccount = Account;
export type AccountPhase = PropPhase;

export interface ProviderPreset {
  id: string;
  name: string;
  category: AccountCategory;
  defaultPlatform: TradingPlatform;
  platformOptions: TradingPlatform[];
  serverTypes: string[];
  defaultSizes: number[];
  propConfig?: {
    modelType: string;
    phases: {
      phase: PropPhase;
      profitTargetPct: number;
      dailyDrawdownLimitPct: number;
      maxDrawdownLimitPct: number;
      minTradingDays: number;
    }[];
  };
  description: string;
}

export const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    id: 'fundingpips-2step',
    name: 'FundingPips',
    category: 'prop_evaluation',
    defaultPlatform: 'cTrader',
    platformOptions: ['cTrader', 'TradeLocker', 'MetaTrader 5'],
    serverTypes: ['FundingPips-Live', 'FundingPips-Demo'],
    defaultSizes: [5000, 10000, 25000, 50000, 100000],
    propConfig: {
      modelType: '2-Step Evaluation',
      phases: [
        { phase: 'Phase 1', profitTargetPct: 8, dailyDrawdownLimitPct: 5, maxDrawdownLimitPct: 10, minTradingDays: 0 },
        { phase: 'Phase 2', profitTargetPct: 5, dailyDrawdownLimitPct: 5, maxDrawdownLimitPct: 10, minTradingDays: 0 },
        { phase: 'Master', profitTargetPct: 0, dailyDrawdownLimitPct: 5, maxDrawdownLimitPct: 10, minTradingDays: 0 },
      ],
    },
    description: 'FundingPips 2-step: 8% Phase 1, 5% Phase 2, 5% daily loss, 10% max static drawdown.',
  },
  {
    id: 'ftmo-standard',
    name: 'FTMO',
    category: 'prop_evaluation',
    defaultPlatform: 'MetaTrader 5',
    platformOptions: ['MetaTrader 5', 'MetaTrader 4', 'cTrader'],
    serverTypes: ['FTMO-Server', 'FTMO-Demo'],
    defaultSizes: [10000, 25000, 50000, 100000, 200000],
    propConfig: {
      modelType: '2-Step Challenge',
      phases: [
        { phase: 'Phase 1', profitTargetPct: 10, dailyDrawdownLimitPct: 5, maxDrawdownLimitPct: 10, minTradingDays: 4 },
        { phase: 'Phase 2', profitTargetPct: 5, dailyDrawdownLimitPct: 5, maxDrawdownLimitPct: 10, minTradingDays: 4 },
        { phase: 'Master', profitTargetPct: 0, dailyDrawdownLimitPct: 5, maxDrawdownLimitPct: 10, minTradingDays: 0 },
      ],
    },
    description: 'FTMO Challenge: 10% Phase 1, 5% Phase 2, 5% max daily, 10% max loss, 4 minimum trading days.',
  },
  {
    id: 'ic-markets-live',
    name: 'IC Markets',
    category: 'broker_live',
    defaultPlatform: 'cTrader',
    platformOptions: ['cTrader', 'MetaTrader 5', 'MetaTrader 4', 'TradingView'],
    serverTypes: ['Raw Spread', 'Standard', 'cTrader ECN'],
    defaultSizes: [1000, 5000, 10000, 25000, 50000],
    description: 'IC Markets Raw Spread broker account with true ECN spreads and ultra-fast execution.',
  },
  {
    id: 'pepperstone-live',
    name: 'Pepperstone',
    category: 'broker_live',
    defaultPlatform: 'TradingView',
    platformOptions: ['TradingView', 'cTrader', 'MetaTrader 5'],
    serverTypes: ['Razor ECN', 'Standard'],
    defaultSizes: [1000, 2500, 5000, 10000, 20000],
    description: 'Pepperstone Razor account with TradingView charting and institutional liquidity.',
  },
  {
    id: 'custom-account',
    name: 'Custom Account',
    category: 'broker_live',
    defaultPlatform: 'MetaTrader 5',
    platformOptions: ['MetaTrader 5', 'MetaTrader 4', 'cTrader', 'TradeLocker', 'TradingView', 'Other'],
    serverTypes: ['Standard', 'Live Server', 'Demo Server'],
    defaultSizes: [5000, 10000, 25000, 50000, 100000],
    description: 'Custom Live, Demo, or Prop account with configurable leverage and balance.',
  },
];
