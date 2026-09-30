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
    platform: 'cTrader',
    isActive: true,
    sizingMode: 'RISK_MULTIPLIER',
    multiplierValue: 1.0,
    maxSlippagePips: 2.0,
    copySlTp: true,
    openPositionsCount: 2,
    floatingPnl: 475.00,
  },
  {
    id: 'slave-2',
    accountNumber: '#78219432',
    name: 'FTMO $100k Challenge',
    broker: 'FTMO',
    platform: 'MetaTrader 5',
    isActive: true,
    sizingMode: 'EQUITY_RATIO',
    multiplierValue: 2.0,
    maxSlippagePips: 1.5,
    copySlTp: true,
    openPositionsCount: 2,
    floatingPnl: 950.00,
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
    id: 'log-2',
    timestamp: '11:02:45.132',
    symbol: 'EURUSD',
    action: 'SELL',
    masterLot: 1.00,
    slaveLot: 2.00,
    slaveAccount: 'FTMO $100k #78219432',
    delayMs: 14,
    slippagePips: 0.4,
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
    id: 'log-4',
    timestamp: '10:14:22.058',
    symbol: 'XAUUSD',
    action: 'BUY',
    masterLot: 0.50,
    slaveLot: 1.00,
    slaveAccount: 'FTMO $100k #78219432',
    delayMs: 12,
    slippagePips: 0.3,
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
  const [selectedMasterId, setSelectedMasterId] = useState<string>('acc-icmarkets-live');
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
        id: 'acc-icmarkets-live',
        label: 'IC Markets Raw ECN (#91823411)',
        platform: 'cTrader',
        broker: 'IC Markets',
        balance: 11480.0,
      },
      {
        id: 'acc-fp-50k-phase1',
        label: 'FundingPips $50k Evaluation (#20823275)',
        platform: 'cTrader',
        broker: 'FundingPips',
        balance: 52340.5,
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

  return (
    <div className="p-4 lg:p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Page Title & Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
            <span>Trading Utilities</span>
            <span className="text-slate-400">/</span>
            <span className="text-slate-700 dark:text-slate-300 font-semibold">Trade Copier</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-950 dark:text-white flex items-center gap-3">
            <span>High-Speed Trade Copier</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              ULTRA-LOW LATENCY
            </span>
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Mirror live trades seamlessly from your master strategy account to prop firm evaluation accounts.
          </p>
        </div>

        {/* Global Test Order Trigger */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleTriggerTestTrade}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 transition-all active:scale-95 cursor-pointer"
          >
            <Send size={14} />
            <span>Send Test Sync Order</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="px-4 py-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-700 dark:text-blue-300 text-xs font-medium flex items-center justify-between shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-blue-500 shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 1. Copier Engine Status Card */}
      <div className="bg-white dark:bg-[#121826] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Engine Status & Switch */}
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                engineOnline
                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 shadow-md shadow-emerald-500/10'
                  : 'bg-red-500/15 border border-red-500/30 text-red-500'
              }`}
            >
              <Radio size={24} className={engineOnline ? 'animate-pulse' : ''} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    engineOnline ? 'bg-emerald-500 animate-ping' : 'bg-red-500'
                  }`}
                />
                <h2 className="text-lg font-bold text-slate-950 dark:text-white">
                  {engineOnline ? 'Copier Engine Online' : 'Copier Engine Paused'}
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {engineOnline
                  ? 'Instant sub-millisecond socket bridge active. Orders automatically mirrored.'
                  : 'Order transmission paused. Target accounts will not receive master fills.'}
              </p>
            </div>
          </div>

          {/* Right Metrics & Global Master Toggle */}
          <div className="flex items-center gap-6 flex-wrap md:flex-nowrap">
            {/* Metric 1: Latency */}
            <div className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-[#0D121F] border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Avg Latency
              </span>
              <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                <Zap size={13} />
                {engineOnline ? '12ms' : '—'}
              </span>
            </div>

            {/* Metric 2: Protocol Bridge */}
            <div className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-[#0D121F] border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Active Protocol
              </span>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-200 flex items-center gap-1.5 mt-0.5">
                <ArrowRightLeft size={13} className="text-blue-500" />
                MT5 &lt;—&gt; cTrader Bridge
              </span>
            </div>

            {/* Master Toggle Button */}
            <button
              type="button"
              onClick={() => setEngineOnline((prev) => !prev)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95 shadow-sm ${
                engineOnline
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                  : 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/20'
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
          <div className="bg-white dark:bg-[#121826] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <ShieldCheck size={16} />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200">
                  Master Leader Account
                </h3>
              </div>
              <span className="text-[10px] font-bold font-mono uppercase px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                SOURCE
              </span>
            </div>

            {/* Select Master Account */}
            <div className="mb-4">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-800 dark:text-slate-200 mb-1.5">
                Select Lead Account
              </label>
              <div className="relative">
                <select
                  value={selectedMasterId}
                  onChange={(e) => setSelectedMasterId(e.target.value)}
                  className="w-full appearance-none rounded-xl px-3.5 py-2.5 text-xs font-semibold pr-9 bg-slate-50 dark:bg-[#0D121F] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  {masterAccountOptions.map((opt) => (
                    <option key={opt.id} value={opt.id} className="bg-white dark:bg-[#121826]">
                      {opt.label} — {opt.platform}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={15}
                  className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"
                />
              </div>
            </div>

            {/* Master Account Stats Card */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0D121F] border border-slate-200 dark:border-slate-800 mb-4">
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="text-slate-500 dark:text-slate-400">Account Provider</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedMaster.broker}</span>
              </div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="text-slate-500 dark:text-slate-400">Trading Platform</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedMaster.platform}</span>
              </div>
              <div className="flex justify-between items-center text-xs pt-1.5 border-t border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Account Balance</span>
                <span className="font-mono font-bold text-slate-950 dark:text-white">
                  ${selectedMaster.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Live Open Positions on Master */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200">
                  Open Positions ({openPositions.length})
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync
                </span>
              </div>

              {openPositions.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 rounded-xl bg-slate-50 dark:bg-[#0D121F] border border-dashed border-slate-200 dark:border-slate-800">
                  No open trades detected on master account.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {openPositions.map((pos) => (
                    <div
                      key={pos.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-[#0D121F] border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-950 dark:text-white">
                            {pos.symbol}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded font-mono ${
                              pos.type === 'BUY'
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                : 'bg-red-500/15 text-red-600 dark:text-red-400'
                            }`}
                          >
                            {pos.type} {pos.lots}L
                          </span>
                        </div>
                        <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1">
                          Entry: {pos.openPrice} • Current: {pos.currentPrice}
                        </p>
                      </div>

                      <div className="text-right">
                        <span
                          className={`text-xs font-bold font-mono ${
                            pos.pnl >= 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {pos.pnl >= 0 ? `+$${pos.pnl.toFixed(2)}` : `-$${Math.abs(pos.pnl).toFixed(2)}`}
                        </span>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{pos.openTime}</p>
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
          <div className="bg-white dark:bg-[#121826] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200">
                  Slave / Follower Target Accounts ({slaves.length})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Configure independent risk sizing, max slippage rules, and emergency liquidation per follower.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-semibold px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
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
                      ? 'bg-slate-50/70 dark:bg-[#0D121F] border-slate-200 dark:border-slate-800'
                      : 'bg-slate-100/50 dark:bg-[#0B0F19]/50 border-slate-200 dark:border-slate-900 opacity-70'
                  }`}
                >
                  {/* Top row: Slave name, status toggle, emergency close */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => toggleSlaveActive(slave.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          slave.isActive
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-500 hover:bg-slate-300'
                        }`}
                        title={slave.isActive ? 'Pause follower' : 'Activate follower'}
                      >
                        {slave.isActive ? <Play size={14} /> : <Pause size={14} />}
                      </button>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-950 dark:text-white">
                            {slave.name}
                          </h4>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {slave.accountNumber}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {slave.broker} • {slave.platform}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <div className="text-right">
                        <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">
                          +${slave.floatingPnl.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {slave.openPositionsCount} copied open
                        </span>
                      </div>

                      {/* Emergency Close Button */}
                      <button
                        type="button"
                        onClick={() => handleEmergencyClose(slave)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 transition-all active:scale-95 flex items-center gap-1.5"
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
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
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
                        className="w-full text-xs font-medium rounded-lg px-2.5 py-1.5 bg-white dark:bg-[#121826] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                      >
                        <option value="RISK_MULTIPLIER">Risk Multiplier (1.0x)</option>
                        <option value="EQUITY_RATIO">Equity Proportion Ratio</option>
                        <option value="FIXED_LOT">Fixed Lot Size</option>
                      </select>
                    </div>

                    {/* Max Slippage */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
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
                        className="w-full text-xs font-mono font-medium rounded-lg px-2.5 py-1.5 bg-white dark:bg-[#121826] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Copy SL/TP checkbox */}
                    <div className="flex items-center sm:justify-center pt-2 sm:pt-4">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                        <input
                          type="checkbox"
                          checked={slave.copySlTp}
                          onChange={(e) =>
                            updateSlaveField(slave.id, 'copySlTp', e.target.checked)
                          }
                          className="w-4 h-4 rounded text-blue-600 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:ring-blue-500"
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
      <div className="bg-white dark:bg-[#121826] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200 flex items-center gap-2">
              <Clock size={16} className="text-blue-500" />
              <span>Copier Execution Audit Log</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live trade replication logs, latency records, and slippage verification.
            </p>
          </div>

          <div className="text-[11px] font-mono text-slate-400">
            {logs.length} events logged
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#0D121F] border-b border-slate-200 dark:border-[#1E293B] text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
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
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
              {logs.map((entry) => (
                <tr
                  key={entry.id}
                  className="hover:bg-slate-50/60 dark:hover:bg-[#151D2E]/60 transition-colors"
                >
                  <td className="py-3 px-3 text-slate-500 dark:text-slate-400">{entry.timestamp}</td>
                  <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                    {entry.symbol}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        entry.action === 'BUY'
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          : entry.action === 'SELL'
                          ? 'bg-red-500/15 text-red-600 dark:text-red-400'
                          : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {entry.action}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                    {entry.masterLot ? `${entry.masterLot.toFixed(2)}L` : '—'}
                  </td>
                  <td className="py-3 px-3 font-bold text-slate-950 dark:text-white">
                    {entry.slaveLot ? `${entry.slaveLot.toFixed(2)}L` : '—'}
                  </td>
                  <td className="py-3 px-3 font-sans text-slate-800 dark:text-slate-200">
                    {entry.slaveAccount}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`font-semibold ${
                        entry.delayMs < 20
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {entry.delayMs}ms
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                    {entry.slippagePips.toFixed(1)} pips
                  </td>
                  <td className="py-3 px-3 font-sans">
                    <div className="flex items-center gap-1.5">
                      {entry.status === 'COPIED' ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 size={11} />
                          Copied
                        </span>
                      ) : (
                        <span
                          className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                          title={entry.reason}
                        >
                          <XCircle size={11} />
                          Rejected
                        </span>
                      )}
                      {entry.reason && (
                        <span className="text-[10px] text-slate-400 italic">
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
