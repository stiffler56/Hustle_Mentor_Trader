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

export interface InvestorConnectionConfig {
  platform: 'MT4' | 'MT5';
  login: string;
  investorPassword: string; // Read-only password
  server: string;           // e.g., "FundingPips-Server"
  syncStatus: 'connected' | 'syncing' | 'failed' | 'disconnected';
  lastSyncedAt?: string;
  autoSyncIntervalSec: number; // e.g., 30s or live WebSocket
  externalAccountId?: string;  // Cloud bridge ID (e.g. MetaApi account ID)
  metaApiToken?: string;       // MetaApi cloud bridge token for real live sync
  region?: string;             // MetaApi runner region (e.g. "london")
}

export interface Account {
  id: string;
  accountNumber: string; // e.g., "#20823275"
  name: string; // e.g., "FundingPips Real $50k" or "FTMO Demo $100k"
  accountMode: 'real' | 'demo'; // 'real' = connected to real server | 'demo' = simulated challenge practice
  category: AccountCategory;
  provider: string; // e.g., "FundingPips", "FTMO", "FundedNext", etc.
  platform: TradingPlatform;
  serverType?: string; // e.g., "FundingPips-Server", "FundingPips-SIM1"
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

  // Broker Sync
  connection?: InvestorConnectionConfig;
  isAutoSyncEnabled?: boolean;
}

// Backward compatibility aliases
export type PropAccount = Account;
export type AccountPhase = PropPhase;

export interface ProviderPreset {
  id: string;
  name: string;
  accountMode: 'real' | 'demo';
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
    id: 'fundingpips-real',
    name: 'FundingPips Real',
    accountMode: 'real',
    category: 'prop_evaluation',
    defaultPlatform: 'MetaTrader 5',
    platformOptions: ['MetaTrader 5', 'cTrader', 'TradeLocker'],
    serverTypes: ['FundingPips-Server', 'FundingPips-SIM1', 'FundingPips-Demo'],
    defaultSizes: [5000, 10000, 25000, 50000, 100000],
    propConfig: {
      modelType: '2-Step Evaluation',
      phases: [
        { phase: 'Phase 1', profitTargetPct: 8, dailyDrawdownLimitPct: 5, maxDrawdownLimitPct: 10, minTradingDays: 0 },
        { phase: 'Phase 2', profitTargetPct: 5, dailyDrawdownLimitPct: 5, maxDrawdownLimitPct: 10, minTradingDays: 0 },
        { phase: 'Master', profitTargetPct: 0, dailyDrawdownLimitPct: 5, maxDrawdownLimitPct: 10, minTradingDays: 0 },
      ],
    },
    description: 'Real live server account on Funding Pips with read-only investor MT5 sync.',
  },
  {
    id: 'fundingpips-demo',
    name: 'FundingPips Demo',
    accountMode: 'demo',
    category: 'prop_evaluation',
    defaultPlatform: 'MetaTrader 5',
    platformOptions: ['MetaTrader 5', 'cTrader'],
    serverTypes: ['FundingPips-Demo', 'FundingPips-SIM1'],
    defaultSizes: [5000, 10000, 25000, 50000, 100000, 200000],
    propConfig: {
      modelType: '2-Step Evaluation',
      phases: [
        { phase: 'Phase 1', profitTargetPct: 8, dailyDrawdownLimitPct: 5, maxDrawdownLimitPct: 10, minTradingDays: 0 },
        { phase: 'Phase 2', profitTargetPct: 5, dailyDrawdownLimitPct: 5, maxDrawdownLimitPct: 10, minTradingDays: 0 },
        { phase: 'Master', profitTargetPct: 0, dailyDrawdownLimitPct: 5, maxDrawdownLimitPct: 10, minTradingDays: 0 },
      ],
    },
    description: 'Simulated practice challenge on Funding Pips rules with custom money.',
  },
  {
    id: 'ftmo-demo',
    name: 'FTMO Demo',
    accountMode: 'demo',
    category: 'prop_evaluation',
    defaultPlatform: 'MetaTrader 5',
    platformOptions: ['MetaTrader 5', 'MetaTrader 4', 'cTrader'],
    serverTypes: ['FTMO-Demo', 'FTMO-Server'],
    defaultSizes: [10000, 25000, 50000, 100000, 200000],
    propConfig: {
      modelType: '2-Step Challenge',
      phases: [
        { phase: 'Phase 1', profitTargetPct: 10, dailyDrawdownLimitPct: 5, maxDrawdownLimitPct: 10, minTradingDays: 4 },
        { phase: 'Phase 2', profitTargetPct: 5, dailyDrawdownLimitPct: 5, maxDrawdownLimitPct: 10, minTradingDays: 4 },
        { phase: 'Master', profitTargetPct: 0, dailyDrawdownLimitPct: 5, maxDrawdownLimitPct: 10, minTradingDays: 0 },
      ],
    },
    description: 'Simulated FTMO Challenge: 10% Phase 1, 5% Phase 2, 5% max daily, 10% max loss.',
  },
  {
    id: 'fundednext-demo',
    name: 'FundedNext Demo',
    accountMode: 'demo',
    category: 'prop_evaluation',
    defaultPlatform: 'MetaTrader 5',
    platformOptions: ['MetaTrader 5', 'cTrader'],
    serverTypes: ['FundedNext-Demo', 'FundedNext-Server'],
    defaultSizes: [6000, 15000, 25000, 50000, 100000, 200000],
    propConfig: {
      modelType: 'Stellar 2-Step',
      phases: [
        { phase: 'Phase 1', profitTargetPct: 8, dailyDrawdownLimitPct: 5, maxDrawdownLimitPct: 10, minTradingDays: 5 },
        { phase: 'Phase 2', profitTargetPct: 5, dailyDrawdownLimitPct: 5, maxDrawdownLimitPct: 10, minTradingDays: 5 },
        { phase: 'Master', profitTargetPct: 0, dailyDrawdownLimitPct: 5, maxDrawdownLimitPct: 10, minTradingDays: 0 },
      ],
    },
    description: 'Simulated FundedNext Stellar challenge: 8% Phase 1, 5% Phase 2, 10% max loss.',
  },
  {
    id: 'alphacapital-demo',
    name: 'Alpha Capital Demo',
    accountMode: 'demo',
    category: 'prop_evaluation',
    defaultPlatform: 'MetaTrader 5',
    platformOptions: ['MetaTrader 5', 'cTrader'],
    serverTypes: ['AlphaCapital-Demo', 'AlphaCapital-Server'],
    defaultSizes: [10000, 25000, 50000, 100000, 200000],
    propConfig: {
      modelType: 'Alpha 2-Step',
      phases: [
        { phase: 'Phase 1', profitTargetPct: 8, dailyDrawdownLimitPct: 5, maxDrawdownLimitPct: 10, minTradingDays: 0 },
        { phase: 'Phase 2', profitTargetPct: 5, dailyDrawdownLimitPct: 5, maxDrawdownLimitPct: 10, minTradingDays: 0 },
        { phase: 'Master', profitTargetPct: 0, dailyDrawdownLimitPct: 5, maxDrawdownLimitPct: 10, minTradingDays: 0 },
      ],
    },
    description: 'Simulated Alpha Capital Group evaluation with 0 minimum trading days.',
  },
  {
    id: 'the5ers-demo',
    name: 'The 5%ers Demo',
    accountMode: 'demo',
    category: 'prop_evaluation',
    defaultPlatform: 'MetaTrader 5',
    platformOptions: ['MetaTrader 5'],
    serverTypes: ['The5ers-Demo', 'The5ers-Server'],
    defaultSizes: [5000, 10000, 20000, 60000, 100000],
    propConfig: {
      modelType: 'High Stakes 2-Step',
      phases: [
        { phase: 'Phase 1', profitTargetPct: 8, dailyDrawdownLimitPct: 5, maxDrawdownLimitPct: 10, minTradingDays: 3 },
        { phase: 'Phase 2', profitTargetPct: 5, dailyDrawdownLimitPct: 5, maxDrawdownLimitPct: 10, minTradingDays: 3 },
        { phase: 'Master', profitTargetPct: 0, dailyDrawdownLimitPct: 5, maxDrawdownLimitPct: 10, minTradingDays: 0 },
      ],
    },
    description: 'Simulated 5%ers High Stakes Challenge with scaling target.',
  },
  {
    id: 'custom-demo',
    name: 'Custom Demo Account',
    accountMode: 'demo',
    category: 'broker_demo',
    defaultPlatform: 'MetaTrader 5',
    platformOptions: ['MetaTrader 5', 'MetaTrader 4', 'cTrader', 'TradingView', 'Other'],
    serverTypes: ['Demo Server', 'Simulation'],
    defaultSizes: [5000, 10000, 25000, 50000, 100000, 250000, 500000],
    propConfig: {
      modelType: 'Custom Practice',
      phases: [
        { phase: 'Phase 1', profitTargetPct: 8, dailyDrawdownLimitPct: 5, maxDrawdownLimitPct: 10, minTradingDays: 0 },
      ],
    },
    description: 'Custom simulated demo with any starting money, custom prop rules, and free practice.',
  },
];
