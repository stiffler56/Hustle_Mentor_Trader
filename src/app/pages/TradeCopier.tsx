import React, { useState, useMemo } from 'react';
import {
  Radio,
  Power,
  Zap,
  Activity,
  ArrowRightLeft,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Play,
  Pause,
  Sliders,
  RefreshCw,
  Clock,
  Layers,
  Building2,
  ChevronDown,
  Trash2,
  Plus,
  Send,
} from 'lucide-react';
import { usePropAccountsContext } from '../data/PropAccountsContext';
import { useTheme } from '../data/ThemeContext';

interface OpenPosition {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  lots: number;
  openPrice: number;
  currentPrice: number;
  sl: number;
  tp: number;
  pnl: number;
  openTime: string;
}

interface SlaveAccountConfig {
  id: string;
  accountNumber: string;
  name: string;
  broker: string;
  platform: string;
  isActive: boolean;
  sizingMode: 'RISK_MULTIPLIER' | 'EQUITY_RATIO' | 'FIXED_LOT';
  multiplierValue: number;
  maxSlippagePips: number;
  copySlTp: boolean;
  openPositionsCount: number;
  floatingPnl: number;
}

interface AuditLogEntry {
  id: string;
  timestamp: string;
  symbol: string;
  action: 'BUY' | 'SELL' | 'CLOSE';
  masterLot: number;
  slaveLot: number;
  slaveAccount: string;
  delayMs: number;
  slippagePips: number;
  status: 'COPIED' | 'REJECTED';
  reason?: string;
}

const INITIAL_OPEN_POSITIONS: OpenPosition[] = [
  {
    id: 'pos-1',
    symbol: 'XAUUSD',
    type: 'BUY',
    lots: 0.50,
    openPrice: 2914.50,
    currentPrice: 2921.80,
    sl: 2905.00,
    tp: 2935.00,
    pnl: 365.00,
    openTime: '10:14:22',
  },
  {
    id: 'pos-2',
    symbol: 'EURUSD',
    type: 'SELL',
    lots: 1.00,
    openPrice: 1.08420,
    currentPrice: 1.08310,
    sl: 1.08700,
    tp: 1.07900,
    pnl: 110.00,
    openTime: '11:02:45',
  },
];

const INITIAL_SLAVES: SlaveAccountConfig[] = [
  {
    id: 'slave-1',
    accountNumber: '#20823275',
    name: 'FundingPips $50k Evaluation',
    broker: 'FundingPips',
    platform: 'MetaTrader 5',
    isActive: true,
    sizingMode: 'RISK_MULTIPLIER',
    multiplierValue: 1.0,
    maxSlippagePips: 2.0,
    copySlTp: true,
    openPositionsCount: 2,
    floatingPnl: 475.00,
  },
];

const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'log-1',
    timestamp: '11:02:45.120',
    symbol: 'EURUSD',
    action: 'SELL',
    masterLot: 1.00,
    slaveLot: 1.00,
    slaveAccount: 'FundingPips $50k #20823275',
    delayMs: 11,
    slippagePips: 0.2,
    status: 'COPIED',
  },
  {
    id: 'log-3',
    timestamp: '10:14:22.045',
    symbol: 'XAUUSD',
    action: 'BUY',
    masterLot: 0.50,
    slaveLot: 0.50,
    slaveAccount: 'FundingPips $50k #20823275',
    delayMs: 9,
    slippagePips: 0.1,
    status: 'COPIED',
  },
  {
    id: 'log-5',
    timestamp: '09:45:10.820',
    symbol: 'GBPUSD',
    action: 'BUY',
    masterLot: 1.50,
    slaveLot: 1.50,
    slaveAccount: 'FundingPips $50k #20823275',
    delayMs: 84,
    slippagePips: 2.4,
    status: 'REJECTED',
    reason: 'Max slippage 2.0 pips exceeded (2.4 pips)',
  },
];

export default function TradeCopier() {
  const { accounts } = usePropAccountsContext();

  const [engineOnline, setEngineOnline] = useState<boolean>(true);
  const [selectedMasterId, setSelectedMasterId] = useState<string>('acc-fp-50k-phase1');
  const [openPositions, setOpenPositions] = useState<OpenPosition[]>(INITIAL_OPEN_POSITIONS);
  const [slaves, setSlaves] = useState<SlaveAccountConfig[]>(INITIAL_SLAVES);
  const [logs, setLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const masterAccountOptions = useMemo(() => {
    if (accounts.length > 0) {
      return accounts.map((a) => ({
        id: a.id,
        label: `${a.name} (${a.accountNumber})`,
        platform: a.platform,
        broker: a.provider,
        balance: a.currentBalance,
      }));
    }
    return [
      {
        id: 'acc-fp-50k-phase1',
        label: 'FundingPips $50k Evaluation (#20823275)',
        platform: 'MetaTrader 5',
        broker: 'FundingPips',
        balance: 50000.0,
      },
    ];
  }, [accounts]);

  const selectedMaster = useMemo(() => {
    return (
      masterAccountOptions.find((m) => m.id === selectedMasterId) ||
      masterAccountOptions[0]
    );
  }, [masterAccountOptions, selectedMasterId]);

  const toggleSlaveActive = (slaveId: string) => {
    setSlaves((prev) =>
      prev.map((s) => (s.id === slaveId ? { ...s, isActive: !s.isActive } : s))
    );
  };

  const updateSlaveField = (
    slaveId: string,
    field: keyof SlaveAccountConfig,
    value: unknown
  ) => {
    setSlaves((prev) =>
      prev.map((s) => (s.id === slaveId ? { ...s, [field]: value } : s))
    );
  };

  const handleEmergencyClose = (slave: SlaveAccountConfig) => {
    setSlaves((prev) =>
      prev.map((s) =>
        s.id === slave.id ? { ...s, openPositionsCount: 0, floatingPnl: 0 } : s
      )
    );
    const newEntry: AuditLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString().split('T')[1].slice(0, 12),
      symbol: 'ALL',
      action: 'CLOSE',
      masterLot: 0,
      slaveLot: 0,
      slaveAccount: `${slave.name} ${slave.accountNumber}`,
      delayMs: 15,
      slippagePips: 0.1,
      status: 'COPIED',
      reason: 'Emergency Close All executed manually',
    };
    setLogs((prev) => [newEntry, ...prev]);
    setStatusMessage(`Emergency close executed for ${slave.name}. All positions liquidated.`);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleTriggerTestTrade = () => {
    if (!engineOnline) {
      setStatusMessage('Copier engine is offline. Enable the engine to sync orders.');
      setTimeout(() => setStatusMessage(null), 3500);
      return;
    }

    const testTime = new Date().toISOString().split('T')[1].slice(0, 12);
    const newLogs: AuditLogEntry[] = slaves
      .filter((s) => s.isActive)
      .map((s, idx) => ({
        id: `test-${Date.now()}-${idx}`,
        timestamp: testTime,
        symbol: 'XAUUSD',
        action: 'BUY',
        masterLot: 0.25,
        slaveLot:
          s.sizingMode === 'EQUITY_RATIO'
            ? 0.50
            : s.sizingMode === 'FIXED_LOT'
            ? s.multiplierValue
            : Number((0.25 * s.multiplierValue).toFixed(2)),
        slaveAccount: `${s.name} ${s.accountNumber}`,
        delayMs: Math.floor(Math.random() * 8) + 8,
        slippagePips: Number((Math.random() * 0.4).toFixed(1)),
        status: 'COPIED',
      }));

    if (newLogs.length > 0) {
      setLogs((prev) => [...newLogs, ...prev]);
      setStatusMessage(`Test order (0.25 XAUUSD BUY) synced across ${newLogs.length} active slave accounts!`);
    } else {
      setStatusMessage('No active slave accounts to sync.');
    }
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const { isDayMode } = useTheme();
  const cardBg = isDayMode ? 'bg-white border-[#E5E4E2] text-[#111827]' : 'bg-[#131418] border-[#1E2026] text-white';
  const subCardBg = isDayMode ? 'bg-[#F9FAFB] border-[#E5E4E2]' : 'bg-[#0F1013] border-[#1E2026]';
  const textPrimary = isDayMode ? 'text-[#111827]' : 'text-white';
  const textSecondary = isDayMode ? 'text-[#6B7280]' : 'text-[#8E95A5]';
  const divider = isDayMode ? 'border-[#E5E4E2]' : 'border-[#1E2026]';

  return (
    <div className={`p-4 lg:p-6 max-w-[1600px] mx-auto space-y-6 min-h-full font-sans ${isDayMode ? 'bg-[#EBEAE8] text-[#111827]' : 'bg-[#0B0C0E] text-white'}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#6B7280] dark:text-[#8E95A5] mb-1">
            <span>Trading Utilities</span>
            <span className="text-[#9CA3AF]">/</span>
            <span className={`font-semibold ${textPrimary}`}>Trade Copier</span>
          </div>
          <h1 className={`text-2xl lg:text-3xl font-black tracking-tight flex items-center gap-3 ${textPrimary}`}>
            <span>High-Speed Trade Copier</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold bg-[#5D5FEF]/10 text-[#5D5FEF] border border-[#5D5FEF]/20">
              ULTRA-LOW LATENCY
            </span>
          </h1>
          <p className={`text-sm mt-1 ${textSecondary}`}>
            Mirror live trades seamlessly from your master strategy account to prop firm evaluation accounts.
          </p>
        </div>

        {/* Global Test Order Trigger */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleTriggerTestTrade}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#5D5FEF] hover:bg-[#4F51D8] text-white shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Send size={14} />
            <span>Send Test Sync Order</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className={`px-4 py-3 rounded-xl border text-xs font-medium flex items-center justify-between shadow-xs animate-in fade-in duration-200 ${
          isDayMode ? 'bg-[#EEF0FF] border-[#5D5FEF]/30 text-[#5D5FEF]' : 'bg-[#181A20] border-[#6366F1]/30 text-white'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-[#5D5FEF] shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className={`${textSecondary} hover:${textPrimary}`}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 1. Copier Engine Status Card */}
      <div className={`rounded-xl border p-5 shadow-xs ${cardBg}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Engine Status & Switch */}
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                engineOnline
                  ? isDayMode
                    ? 'bg-[#DCFCE7] border border-[#86EFAC] text-[#059669]'
                    : 'bg-[#0E291E] border border-[#144634] text-[#10B981]'
                  : isDayMode
                  ? 'bg-[#FEE2E2] border border-[#FCA5A5] text-[#DC2626]'
                  : 'bg-[#2D1416] border border-[#4C1D24] text-[#F87171]'
              }`}
            >
              <Radio size={24} className={engineOnline ? 'animate-pulse' : ''} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    engineOnline
                      ? isDayMode ? 'bg-[#059669] animate-ping' : 'bg-[#10B981] animate-ping'
                      : isDayMode ? 'bg-[#DC2626]' : 'bg-[#F87171]'
                  }`}
                />
                <h2 className={`text-lg font-bold ${textPrimary}`}>
                  {engineOnline ? 'Copier Engine Online' : 'Copier Engine Paused'}
                </h2>
              </div>
              <p className={`text-xs mt-0.5 ${textSecondary}`}>
                {engineOnline
                  ? 'Instant sub-millisecond socket bridge active. Orders automatically mirrored.'
                  : 'Order transmission paused. Target accounts will not receive master fills.'}
              </p>
            </div>
          </div>

          {/* Right Metrics & Global Master Toggle */}
          <div className="flex items-center gap-6 flex-wrap md:flex-nowrap">
            {/* Metric 1: Latency */}
            <div className={`px-4 py-2 rounded-xl border ${subCardBg}`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider block ${textSecondary}`}>
                Avg Latency
              </span>
              <span className={`text-sm font-bold font-mono flex items-center gap-1 mt-0.5 ${isDayMode ? 'text-[#059669]' : 'text-[#10B981]'}`}>
                <Zap size={13} />
                {engineOnline ? '12ms' : '—'}
              </span>
            </div>

            {/* Metric 2: Protocol Bridge */}
            <div className={`px-4 py-2 rounded-xl border ${subCardBg}`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider block ${textSecondary}`}>
                Active Protocol
              </span>
              <span className={`text-sm font-bold flex items-center gap-1.5 mt-0.5 ${textPrimary}`}>
                <ArrowRightLeft size={13} className="text-[#5D5FEF]" />
                MT5 &lt;—&gt; cTrader Bridge
              </span>
            </div>

            {/* Master Toggle Button */}
            <button
              type="button"
              onClick={() => setEngineOnline((prev) => !prev)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95 shadow-sm cursor-pointer ${
                engineOnline
                  ? isDayMode
                    ? 'bg-[#059669] hover:bg-[#047857] text-white'
                    : 'bg-[#10B981] hover:bg-[#059669] text-white'
                  : isDayMode
                  ? 'bg-[#DC2626] hover:bg-[#B91C1C] text-white'
                  : 'bg-[#F87171] hover:bg-[#EF4444] text-white'
              }`}
            >
              <Power size={14} />
              <span>{engineOnline ? 'Disable Engine' : 'Enable Engine'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 2. Master Account Setup (Leader) */}
        <div className="lg:col-span-1 space-y-5">
          <div className={`rounded-xl border p-5 shadow-xs ${cardBg}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${
                  isDayMode ? 'bg-[#EEF0FF] text-[#5D5FEF] border-[#5D5FEF]/20' : 'bg-[#181A20] text-[#6366F1] border-[#1E2026]'
                }`}>
                  <ShieldCheck size={16} />
                </div>
                <h3 className={`text-sm font-bold uppercase tracking-wider ${textPrimary}`}>
                  Master Leader Account
                </h3>
              </div>
              <span className={`text-[10px] font-bold font-mono uppercase px-2 py-0.5 rounded border ${
                isDayMode ? 'bg-[#EEF0FF] text-[#5D5FEF] border-[#5D5FEF]/30' : 'bg-[#181A20] text-[#6366F1] border-[#1E2026]'
              }`}>
                SOURCE
              </span>
            </div>

            {/* Select Master Account */}
            <div className="mb-4">
              <label className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${textSecondary}`}>
                Select Lead Account
              </label>
              <div className="relative">
                <select
                  value={selectedMasterId}
                  onChange={(e) => setSelectedMasterId(e.target.value)}
                  className={`w-full appearance-none rounded-xl px-3.5 py-2.5 text-xs font-semibold pr-9 border focus:outline-none focus:border-[#5D5FEF] cursor-pointer ${
                    isDayMode
                      ? 'bg-[#F9FAFB] border-[#E5E4E2] text-[#111827]'
                      : 'bg-[#0F1013] border-[#1E2026] text-white'
                  }`}
                >
                  {masterAccountOptions.map((opt) => (
                    <option key={opt.id} value={opt.id} className={isDayMode ? 'bg-white text-[#111827]' : 'bg-[#131418] text-white'}>
                      {opt.label} — {opt.platform}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={15}
                  className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#9CA3AF]"
                />
              </div>
            </div>

            {/* Master Account Stats Card */}
            <div className={`p-3.5 rounded-xl border mb-4 ${subCardBg}`}>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className={textSecondary}>Account Provider</span>
                <span className={`font-semibold ${textPrimary}`}>{selectedMaster.broker}</span>
              </div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className={textSecondary}>Trading Platform</span>
                <span className={`font-semibold ${textPrimary}`}>{selectedMaster.platform}</span>
              </div>
              <div className={`flex justify-between items-center text-xs pt-1.5 border-t ${divider}`}>
                <span className={textSecondary}>Account Balance</span>
                <span className={`font-mono font-bold ${textPrimary}`}>
                  ${selectedMaster.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Live Open Positions on Master */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-bold uppercase tracking-wider ${textPrimary}`}>
                  Open Positions ({openPositions.length})
                </span>
                <span className={`text-[10px] font-semibold flex items-center gap-1 ${isDayMode ? 'text-[#059669]' : 'text-[#10B981]'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isDayMode ? 'bg-[#059669]' : 'bg-[#10B981]'}`} />
                  Live Sync
                </span>
              </div>

              {openPositions.length === 0 ? (
                <div className={`p-6 text-center text-xs rounded-xl border border-dashed ${subCardBg} ${textSecondary}`}>
                  No open trades detected on master account.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {openPositions.map((pos) => (
                    <div
                      key={pos.id}
                      className={`p-3 rounded-xl border flex items-center justify-between ${subCardBg}`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold ${textPrimary}`}>
                            {pos.symbol}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded font-mono uppercase ${
                              pos.type === 'BUY'
                                ? isDayMode
                                  ? 'bg-[#DCFCE7] text-[#059669] border border-[#86EFAC]'
                                  : 'bg-[#0E291E] text-[#10B981] border border-[#144634]'
                                : isDayMode
                                ? 'bg-[#FEE2E2] text-[#DC2626] border border-[#FCA5A5]'
                                : 'bg-[#2D1416] text-[#F87171] border border-[#4C1D24]'
                            }`}
                          >
                            {pos.type} {pos.lots}L
                          </span>
                        </div>
                        <p className={`text-[11px] font-mono mt-1 ${textSecondary}`}>
                          Entry: {pos.openPrice} • Current: {pos.currentPrice}
                        </p>
                      </div>

                      <div className="text-right">
                        <span
                          className={`text-xs font-bold font-mono ${
                            pos.pnl >= 0
                              ? isDayMode ? 'text-[#059669]' : 'text-[#10B981]'
                              : isDayMode ? 'text-[#DC2626]' : 'text-[#F87171]'
                          }`}
                        >
                          {pos.pnl >= 0 ? `+$${pos.pnl.toFixed(2)}` : `-$${Math.abs(pos.pnl).toFixed(2)}`}
                        </span>
                        <p className={`text-[10px] font-mono mt-0.5 ${textSecondary}`}>{pos.openTime}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. Slave / Follower Accounts Table */}
        <div className="lg:col-span-2 space-y-5">
          <div className={`rounded-xl border p-5 shadow-xs ${cardBg}`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className={`text-sm font-bold uppercase tracking-wider ${textPrimary}`}>
                  Slave / Follower Target Accounts ({slaves.length})
                </h3>
                <p className={`text-xs mt-0.5 ${textSecondary}`}>
                  Configure independent risk sizing, max slippage rules, and emergency liquidation per follower.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono font-semibold px-2 py-1 rounded border ${
                  isDayMode ? 'bg-[#F2F1EF] text-[#6B7280] border-[#E5E4E2]' : 'bg-[#181A20] text-[#8E95A5] border-[#1E2026]'
                }`}>
                  {slaves.filter((s) => s.isActive).length} ACTIVE
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {slaves.map((slave) => (
                <div
                  key={slave.id}
                  className={`p-4 rounded-xl border transition-all ${
                    slave.isActive
                      ? subCardBg
                      : isDayMode
                      ? 'bg-[#F2F1EF] border-[#E5E4E2] opacity-70'
                      : 'bg-[#0B0C0E] border-[#1E2026]/40 opacity-70'
                  }`}
                >
                  {/* Top row: Slave name, status toggle, emergency close */}
                  <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b ${divider}`}>
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => toggleSlaveActive(slave.id)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          slave.isActive
                            ? isDayMode
                              ? 'bg-[#DCFCE7] text-[#059669] hover:bg-[#bbf7d0]'
                              : 'bg-[#0E291E] text-[#10B981] hover:bg-[#144634]'
                            : isDayMode
                            ? 'bg-[#E5E4E2] text-[#6B7280]'
                            : 'bg-[#181A20] text-[#525866] hover:bg-[#252830]'
                        }`}
                        title={slave.isActive ? 'Pause follower' : 'Activate follower'}
                      >
                        {slave.isActive ? <Play size={14} /> : <Pause size={14} />}
                      </button>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className={`text-xs font-bold ${textPrimary}`}>
                            {slave.name}
                          </h4>
                          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                            isDayMode ? 'bg-[#E5E4E2] text-[#111827]' : 'bg-[#181A20] text-[#8E95A5]'
                          }`}>
                            {slave.accountNumber}
                          </span>
                        </div>
                        <p className={`text-[11px] ${textSecondary}`}>
                          {slave.broker} • {slave.platform}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <div className="text-right">
                        <span className={`text-xs font-bold font-mono ${isDayMode ? 'text-[#059669]' : 'text-[#10B981]'}`}>
                          +${slave.floatingPnl.toFixed(2)}
                        </span>
                        <span className={`text-[10px] block ${textSecondary}`}>
                          {slave.openPositionsCount} copied open
                        </span>
                      </div>

                      {/* Emergency Close Button */}
                      <button
                        type="button"
                        onClick={() => handleEmergencyClose(slave)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer ${
                          isDayMode
                            ? 'bg-[#FEE2E2] hover:bg-[#fecaca] text-[#DC2626] border-[#FCA5A5]'
                            : 'bg-[#2D1416] hover:bg-[#2D1416]/80 text-[#F87171] border-[#4C1D24]'
                        }`}
                        title="Immediately close all open positions on this account"
                      >
                        <AlertTriangle size={12} />
                        <span>Close All</span>
                      </button>
                    </div>
                  </div>

                  {/* Bottom row: Configurable controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
                    {/* Sizing Mode */}
                    <div>
                      <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${textSecondary}`}>
                        Lot Sizing Mode
                      </label>
                      <select
                        value={slave.sizingMode}
                        onChange={(e) =>
                          updateSlaveField(
                            slave.id,
                            'sizingMode',
                            e.target.value as SlaveAccountConfig['sizingMode']
                          )
                        }
                        className={`w-full text-xs font-medium rounded-lg px-2.5 py-1.5 border focus:outline-none focus:border-[#5D5FEF] cursor-pointer ${
                          isDayMode
                            ? 'bg-white border-[#E5E4E2] text-[#111827]'
                            : 'bg-[#131418] border-[#1E2026] text-white'
                        }`}
                      >
                        <option value="RISK_MULTIPLIER">Risk Multiplier (1.0x)</option>
                        <option value="EQUITY_RATIO">Equity Proportion Ratio</option>
                        <option value="FIXED_LOT">Fixed Lot Size</option>
                      </select>
                    </div>

                    {/* Max Slippage */}
                    <div>
                      <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${textSecondary}`}>
                        Max Slippage (Pips)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0.5"
                        max="10"
                        value={slave.maxSlippagePips}
                        onChange={(e) =>
                          updateSlaveField(slave.id, 'maxSlippagePips', Number(e.target.value))
                        }
                        className={`w-full text-xs font-mono font-medium rounded-lg px-2.5 py-1.5 border focus:outline-none focus:border-[#5D5FEF] ${
                          isDayMode
                            ? 'bg-white border-[#E5E4E2] text-[#111827]'
                            : 'bg-[#131418] border-[#1E2026] text-white'
                        }`}
                      />
                    </div>

                    {/* Copy SL/TP checkbox */}
                    <div className="flex items-center sm:justify-center pt-2 sm:pt-4">
                      <label className={`flex items-center gap-2 cursor-pointer text-xs font-medium ${textSecondary}`}>
                        <input
                          type="checkbox"
                          checked={slave.copySlTp}
                          onChange={(e) =>
                            updateSlaveField(slave.id, 'copySlTp', e.target.checked)
                          }
                          className="w-4 h-4 rounded text-[#5D5FEF] border-slate-300 dark:border-slate-700 focus:ring-[#5D5FEF]"
                        />
                        <span>Copy SL / TP Levels</span>
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Copier Execution Audit Log */}
      <div className={`rounded-xl border p-5 shadow-xs ${cardBg}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${textPrimary}`}>
              <Clock size={16} className="text-[#5D5FEF]" />
              <span>Copier Execution Audit Log</span>
            </h3>
            <p className={`text-xs mt-0.5 ${textSecondary}`}>
              Live trade replication logs, latency records, and slippage verification.
            </p>
          </div>

          <div className={`text-[11px] font-mono ${textSecondary}`}>
            {logs.length} events logged
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={`border-b text-[10px] font-bold uppercase tracking-wider ${
              isDayMode ? 'bg-[#FAFAFA] border-[#E5E4E2] text-[#6B7280]' : 'bg-[#0F1013] border-[#1E2026] text-[#8E95A5]'
            }`}>
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Symbol</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Master Lot</th>
                <th className="py-2.5 px-3">Slave Lot</th>
                <th className="py-2.5 px-3">Follower Account</th>
                <th className="py-2.5 px-3">Execution Delay</th>
                <th className="py-2.5 px-3">Slippage</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className={`divide-y font-mono ${isDayMode ? 'divide-[#E5E4E2]' : 'divide-[#1E2026]'}`}>
              {logs.map((entry) => (
                <tr
                  key={entry.id}
                  className={`transition-colors ${isDayMode ? 'hover:bg-[#F9FAFB]' : 'hover:bg-[#181A20]'}`}
                >
                  <td className={`py-3 px-3 ${textSecondary}`}>{entry.timestamp}</td>
                  <td className={`py-3 px-3 font-bold ${textPrimary}`}>
                    {entry.symbol}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        entry.action === 'BUY'
                          ? isDayMode
                            ? 'bg-[#DCFCE7] text-[#059669] border border-[#86EFAC]'
                            : 'bg-[#0E291E] text-[#10B981] border border-[#144634]'
                          : entry.action === 'SELL'
                          ? isDayMode
                            ? 'bg-[#FEE2E2] text-[#DC2626] border border-[#FCA5A5]'
                            : 'bg-[#2D1416] text-[#F87171] border border-[#4C1D24]'
                          : isDayMode
                          ? 'bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]'
                          : 'bg-[#181A20] text-amber-400 border border-amber-900/50'
                      }`}
                    >
                      {entry.action}
                    </span>
                  </td>
                  <td className={`py-3 px-3 ${textSecondary}`}>
                    {entry.masterLot ? `${entry.masterLot.toFixed(2)}L` : '—'}
                  </td>
                  <td className={`py-3 px-3 font-bold ${textPrimary}`}>
                    {entry.slaveLot ? `${entry.slaveLot.toFixed(2)}L` : '—'}
                  </td>
                  <td className={`py-3 px-3 font-sans ${textPrimary}`}>
                    {entry.slaveAccount}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`font-semibold ${
                        entry.delayMs < 20
                          ? isDayMode ? 'text-[#059669]' : 'text-[#10B981]'
                          : 'text-amber-500'
                      }`}
                    >
                      {entry.delayMs}ms
                    </span>
                  </td>
                  <td className={`py-3 px-3 ${textSecondary}`}>
                    {entry.slippagePips.toFixed(1)} pips
                  </td>
                  <td className="py-3 px-3 font-sans">
                    <div className="flex items-center gap-1.5">
                      {entry.status === 'COPIED' ? (
                        <span className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          isDayMode ? 'bg-[#DCFCE7] text-[#059669] border-[#86EFAC]' : 'bg-[#0E291E] text-[#10B981] border border-[#144634]'
                        }`}>
                          <CheckCircle2 size={11} />
                          Copied
                        </span>
                      ) : (
                        <span
                          className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            isDayMode ? 'bg-[#FEE2E2] text-[#DC2626] border-[#FCA5A5]' : 'bg-[#2D1416] text-[#F87171] border border-[#4C1D24]'
                          }`}
                          title={entry.reason}
                        >
                          <XCircle size={11} />
                          Rejected
                        </span>
                      )}
                      {entry.reason && (
                        <span className={`text-[10px] italic ${textSecondary}`}>
                          ({entry.reason})
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
