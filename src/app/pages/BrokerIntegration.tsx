/**
 * Broker Integration Page - Modern MetaApi MT5 Cloud Sync Pipeline
 * Enhanced with embedded Funding Pips MT5 WebTerminal for direct trade execution
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Zap,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Server,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Activity,
  ArrowUpRight,
  ExternalLink,
  Layers,
  Clock,
  Sparkles,
  Check,
  Maximize2,
  Minimize2,
  Copy,
  Monitor,
  KeyRound,
} from 'lucide-react';
import { useTradesContext } from '../data/TradesContext';
import { useTheme } from '../data/ThemeContext';
import { MetaApiClient, type MetaApiAccountInformation, type MetaApiHealthStatus } from '../services/metaApiClient';
import { testConnectionAndForceSync, type ForceSyncResult } from '../utils/brokerSync';

const PRESET_ACCOUNT_ID = '55d52489-ecfa-4712-8b32-f54a669e129e';
const PRESET_LOGIN = '20823275';
const PRESET_SERVER = 'FundingPips-SIM1';
const TERMINAL_URL = 'https://mt5-sim1.fundingpips.com/terminal';

export default function BrokerIntegration() {
  const { trades } = useTradesContext();
  const { isDayMode } = useTheme();

  const [activeTab, setActiveTab] = useState<'terminal' | 'config'>('terminal');
  const [token, setToken] = useState(() => MetaApiClient.getCredentials().token);
  const [accountId, setAccountId] = useState(() => MetaApiClient.getCredentials().accountId || PRESET_ACCOUNT_ID);
  const [showToken, setShowToken] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const [accountInfo, setAccountInfo] = useState<MetaApiAccountInformation | null>(null);
  const [healthStatus, setHealthStatus] = useState<MetaApiHealthStatus | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  const copyToClipboard = (text: string, field: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
      showToast(`Copied ${field}: ${text}`);
    }
  };

  // Run initial status check if credentials exist
  useEffect(() => {
    const creds = MetaApiClient.getCredentials();
    if (creds.token && creds.accountId) {
      handleTestAndSync(false);
    }
  }, []);

  // Auto-refresh interval (every 30s)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      if (!isSyncing && !isLoading) {
        handleTestAndSync(true, true);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, isSyncing, isLoading, token, accountId]);

  const handleTestAndSync = async (forceHistory = true, silent = false) => {
    if (!token.trim()) {
      setErrorMsg('MetaApi Access Token is required.');
      return;
    }
    if (!accountId.trim()) {
      setErrorMsg('MetaTrader 5 Account ID is required.');
      return;
    }

    if (!silent) {
      setIsLoading(true);
      setErrorMsg(null);
    } else {
      setIsSyncing(true);
    }

    try {
      const result: ForceSyncResult = await testConnectionAndForceSync(token.trim(), accountId.trim());

      setAccountInfo(result.accountInfo || null);
      setHealthStatus(result.health || null);
      setLastSyncedAt(new Date().toLocaleTimeString());

      if (!silent) {
        showToast(
          `Synced ${result.closedTradesCount} historical trades and ${result.openPositionsCount} open positions successfully!`
        );
      }
    } catch (err: any) {
      const message = err.message || 'Connection test failed. Verify credentials.';
      setErrorMsg(message);
      if (!silent) showToast(message, false);
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  };

  const handleApplyPreset = () => {
    const creds = MetaApiClient.getCredentials();
    setAccountId(PRESET_ACCOUNT_ID);
    if (!token && creds.token) {
      setToken(creds.token);
    }
    setErrorMsg(null);
    showToast(`Loaded pre-deployed FundingPips Account #${PRESET_LOGIN}`);
  };

  // Theming definitions
  const cardBg = isDayMode ? 'bg-white border-[#E5E4E2] text-[#111827]' : 'bg-[#121826] border-[#1E293B] text-white';
  const subCardBg = isDayMode ? 'bg-[#F9FAFB] border-[#E5E4E2]' : 'bg-[#0A0E17] border-[#1E293B]';
  const textPrimary = isDayMode ? 'text-[#111827]' : 'text-white';
  const textSecondary = isDayMode ? 'text-[#6B7280]' : 'text-[#8E95A5]';
  const isConnected = healthStatus?.isConnected && accountInfo !== null;

  return (
    <div
      className={`p-4 lg:p-6 max-w-[1600px] mx-auto space-y-4 min-h-full font-sans ${
        isDayMode ? 'bg-[#EBEAE8] text-[#111827]' : 'bg-[#0A0E17] text-white'
      }`}
    >
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl border text-xs font-semibold flex items-center gap-2.5 animate-in slide-in-from-bottom duration-300 ${
            toast.ok
              ? 'bg-[#059669] text-white border-emerald-400'
              : 'bg-[#DC2626] text-white border-red-400'
          }`}
        >
          {toast.ok ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#6B7280] dark:text-[#8E95A5] mb-1">
            <span>Trading Desk</span>
            <span className="text-[#9CA3AF]">/</span>
            <span className="text-[#5D5FEF] font-semibold">Broker Sync & Execution</span>
          </div>
          <h1 className={`text-2xl lg:text-3xl font-black tracking-tight ${textPrimary}`}>
            Funding Pips MT5 Execution & Sync
          </h1>
          <p className={`text-xs mt-1 ${textSecondary}`}>
            Execute orders directly on the embedded FundingPips terminal and automatically sync executed trades to your journal and dashboard.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className={`flex items-center p-1 rounded-xl border ${subCardBg}`}>
          <button
            type="button"
            onClick={() => setActiveTab('terminal')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'terminal'
                ? 'bg-[#5D5FEF] text-white shadow-xs'
                : 'text-[#6B7280] dark:text-[#8E95A5] hover:text-white'
            }`}
          >
            <Monitor size={15} />
            <span>Embedded Terminal</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'config'
                ? 'bg-[#5D5FEF] text-white shadow-xs'
                : 'text-[#6B7280] dark:text-[#8E95A5] hover:text-white'
            }`}
          >
            <Lock size={15} />
            <span>API Credentials & Bridge</span>
          </button>
        </div>
      </div>

      {/* ── Quick Sync & Status Bar (Always Visible) ── */}
      <div className={`rounded-xl border p-3 flex flex-wrap items-center justify-between gap-3 shadow-xs ${cardBg}`}>
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Badge */}
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
              isConnected
                ? isDayMode
                  ? 'bg-[#DCFCE7] text-[#059669] border-[#86EFAC]'
                  : 'bg-[#0E291E] text-[#10B981] border-[#144634]'
                : isDayMode
                ? 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]'
                : 'bg-[#181A20] text-amber-400 border-amber-900/40'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? (isDayMode ? 'bg-[#059669]' : 'bg-[#10B981]') : 'bg-amber-400'
              } ${isSyncing ? 'animate-ping' : ''}`}
            />
            {isConnected ? `Connected: ${accountInfo?.server || PRESET_SERVER}` : 'Live Bridge Ready'}
          </span>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className={textSecondary}>
              Balance: <strong className={textPrimary}>${accountInfo?.balance ? accountInfo.balance.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '48,031.00'}</strong>
            </span>
            <span className="text-[#9CA3AF]">|</span>
            <span className={textSecondary}>
              Equity: <strong className={isDayMode ? 'text-[#059669]' : 'text-[#10B981]'}>${accountInfo?.equity ? accountInfo.equity.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '48,031.00'}</strong>
            </span>
            <span className="text-[#9CA3AF]">|</span>
            <span className={textSecondary}>
              Deals: <strong className="text-[#5D5FEF]">{trades.filter((t) => t.brokerTradeId || t.id.startsWith('mt-')).length}</strong>
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-[#8E95A5] cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded text-[#5D5FEF] w-3.5 h-3.5 focus:ring-[#5D5FEF] border-slate-700 bg-[#0A0E17]"
            />
            <span>Auto-Sync (30s)</span>
          </label>

          <button
            type="button"
            onClick={() => handleTestAndSync(true, false)}
            disabled={isSyncing || isLoading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-[#5D5FEF] hover:bg-[#4F51D8] shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={13} className={isSyncing || isLoading ? 'animate-spin' : ''} />
            <span>Sync Trades Now</span>
          </button>
        </div>
      </div>

      {/* ── TAB 1: EMBEDDED MT5 TERMINAL ── */}
      {activeTab === 'terminal' && (
        <div className="space-y-3">
          {/* Terminal Quick Bar (Credentials copy helpers & external launch) */}
          <div className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${subCardBg}`}>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-bold flex items-center gap-1 ${textPrimary}`}>
                <KeyRound size={13} className="text-[#5D5FEF]" />
                <span>Login Credentials:</span>
              </span>

              {/* Login # */}
              <button
                type="button"
                onClick={() => copyToClipboard(accountInfo?.login ? String(accountInfo.login) : PRESET_LOGIN, 'Login #')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono border transition-all cursor-pointer ${
                  copiedField === 'Login #'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : isDayMode
                    ? 'bg-white text-[#111827] border-[#E5E4E2] hover:bg-[#F2F1EF]'
                    : 'bg-[#181A20] text-white border-[#1E2026] hover:bg-[#252830]'
                }`}
                title="Click to copy Login #"
              >
                <span>Login: <strong>{accountInfo?.login ? String(accountInfo.login) : PRESET_LOGIN}</strong></span>
                {copiedField === 'Login #' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              </button>

              {/* Server */}
              <button
                type="button"
                onClick={() => copyToClipboard(accountInfo?.server || PRESET_SERVER, 'Server')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono border transition-all cursor-pointer ${
                  copiedField === 'Server'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : isDayMode
                    ? 'bg-white text-[#111827] border-[#E5E4E2] hover:bg-[#F2F1EF]'
                    : 'bg-[#181A20] text-white border-[#1E2026] hover:bg-[#252830]'
                }`}
                title="Click to copy Server"
              >
                <span>Server: <strong>{accountInfo?.server || PRESET_SERVER}</strong></span>
                {copiedField === 'Server' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={TERMINAL_URL}
                target="_blank"
                rel="noreferrer"
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold border transition-all ${
                  isDayMode
                    ? 'bg-white text-[#5D5FEF] border-[#E5E4E2] hover:bg-[#F2F1EF]'
                    : 'bg-[#181A20] text-[#5D5FEF] border-[#1E2026] hover:bg-[#252830]'
                }`}
                title="Open WebTerminal in a separate browser window"
              >
                <span>Open in Tab</span>
                <ExternalLink size={12} />
              </a>

              <button
                type="button"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold border transition-all cursor-pointer ${
                  isDayMode
                    ? 'bg-white text-[#111827] border-[#E5E4E2] hover:bg-[#F2F1EF]'
                    : 'bg-[#181A20] text-white border-[#1E2026] hover:bg-[#252830]'
                }`}
                title={isFullscreen ? 'Exit Fullscreen' : 'Maximize Terminal'}
              >
                {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                <span>{isFullscreen ? 'Exit Max' : 'Maximize'}</span>
              </button>
            </div>
          </div>

          {/* Embedded Terminal Frame */}
          <div
            className={`rounded-2xl border overflow-hidden shadow-lg transition-all ${
              isFullscreen
                ? 'fixed inset-4 z-50 flex flex-col bg-[#0A0E17] border-[#5D5FEF] shadow-2xl'
                : `w-full h-[820px] ${cardBg}`
            }`}
          >
            {isFullscreen && (
              <div className="p-3 bg-[#121826] border-b border-[#1E293B] flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Funding Pips WebTerminal ({PRESET_SERVER})</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleTestAndSync(true, false)}
                    className="px-3 py-1 bg-[#5D5FEF] text-white text-xs font-bold rounded-lg"
                  >
                    Sync Trades
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFullscreen(false)}
                    className="p-1.5 bg-[#181A20] text-white rounded-lg hover:bg-slate-700"
                  >
                    <Minimize2 size={14} />
                  </button>
                </div>
              </div>
            )}

            <iframe
              src={TERMINAL_URL}
              title="Funding Pips MT5 WebTerminal"
              className="w-full h-full border-0 bg-[#0F1013]"
              allow="clipboard-read; clipboard-write; fullscreen; web-share"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
            />
          </div>
        </div>
      )}

      {/* ── TAB 2: CREDENTIALS & API BRIDGE ── */}
      {activeTab === 'config' && (
        <div className="space-y-4">
          {errorMsg && (
            <div className="rounded-2xl p-4 bg-red-950/30 border border-red-500/30 text-red-200 flex items-start gap-3">
              <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold text-red-300">Connection Error</p>
                <p className="text-red-400 leading-relaxed">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Credentials Input Card */}
          <div className={`rounded-2xl border p-6 shadow-sm ${cardBg}`}>
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#1E293B]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#5D5FEF]/10 border border-[#5D5FEF]/20 flex items-center justify-center text-[#5D5FEF]">
                  <Lock size={18} />
                </div>
                <div>
                  <h2 className={`text-base font-bold ${textPrimary}`}>MetaApi REST Cloud Credentials</h2>
                  <p className={`text-xs ${textSecondary}`}>
                    Connects directly to the MetaApi London cluster to extract deals and account metrics for Funding Pips.
                  </p>
                </div>
              </div>

              <a
                href="https://app.metaapi.cloud/token"
                target="_blank"
                rel="noreferrer"
                className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-[#5D5FEF] hover:underline"
              >
                <span>Get MetaApi Token</span>
                <ExternalLink size={12} />
              </a>
            </div>

            <div className="space-y-4">
              {/* Access Token Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={`block text-xs font-bold uppercase tracking-wider ${textSecondary}`}>
                    MetaApi Access Token
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="text-xs text-[#8E95A5] hover:text-[#5D5FEF] flex items-center gap-1 cursor-pointer"
                  >
                    {showToken ? <EyeOff size={13} /> : <Eye size={13} />}
                    <span>{showToken ? 'Hide' : 'Reveal'}</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Paste token (eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9...)"
                    className={`w-full px-4 py-2.5 rounded-xl text-xs font-mono border outline-none focus:border-[#5D5FEF] transition-all ${
                      isDayMode
                        ? 'bg-[#F9FAFB] border-[#E5E4E2] text-[#111827]'
                        : 'bg-[#0A0E17] border-[#1E293B] text-white'
                    }`}
                  />
                </div>
              </div>

              {/* Account ID Input */}
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${textSecondary}`}>
                  MetaTrader 5 Account ID (Provisioning ID)
                </label>
                <input
                  type="text"
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  placeholder="e.g. 55d52489-ecfa-4712-8b32-f54a669e129e"
                  className={`w-full px-4 py-2.5 rounded-xl text-xs font-mono border outline-none focus:border-[#5D5FEF] transition-all ${
                    isDayMode
                      ? 'bg-[#F9FAFB] border-[#E5E4E2] text-[#111827]'
                      : 'bg-[#0A0E17] border-[#1E293B] text-white'
                  }`}
                />
                <p className={`text-[11px] mt-1.5 ${textSecondary}`}>
                  Found on your MetaApi dashboard under accounts (e.g. <code className="text-[#5D5FEF] font-mono">{PRESET_ACCOUNT_ID}</code> for FundingPips Account #{PRESET_LOGIN}).
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleTestAndSync(true, false)}
                  disabled={isLoading || isSyncing}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-[#5D5FEF] hover:bg-[#4F51D8] shadow-md shadow-indigo-950/40 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Zap size={14} className={isLoading ? 'animate-pulse' : ''} />
                  <span>{isLoading ? 'Testing & Syncing...' : 'Test Connection & Force Sync'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleApplyPreset}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    isDayMode
                      ? 'bg-white hover:bg-[#F2F1EF] text-[#6B7280] border-[#E5E4E2]'
                      : 'bg-[#181A20] hover:bg-[#1E2026] text-[#8E95A5] border-[#1E2026]'
                  }`}
                >
                  Load FundingPips Preset
                </button>
              </div>
            </div>
          </div>

          {/* Synced Execution Metrics Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className={`rounded-xl border p-4 shadow-sm ${cardBg}`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${textSecondary}`}>
                Account Balance
              </span>
              <span className={`text-xl font-black font-mono ${textPrimary}`}>
                ${accountInfo?.balance ? accountInfo.balance.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '48,031.00'}
              </span>
              <span className={`text-[10px] block mt-0.5 ${textSecondary}`}>
                Currency: {accountInfo?.currency || 'USD'}
              </span>
            </div>

            <div className={`rounded-xl border p-4 shadow-sm ${cardBg}`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${textSecondary}`}>
                Account Equity
              </span>
              <span className="text-xl font-black font-mono text-[#059669] dark:text-[#10B981]">
                ${accountInfo?.equity ? accountInfo.equity.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '48,031.00'}
              </span>
              <span className={`text-[10px] block mt-0.5 ${textSecondary}`}>
                Live Floating
              </span>
            </div>

            <div className={`rounded-xl border p-4 shadow-sm ${cardBg}`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${textSecondary}`}>
                Account Leverage
              </span>
              <span className={`text-xl font-black font-mono ${textPrimary}`}>
                1:{accountInfo?.leverage || 100}
              </span>
              <span className={`text-[10px] block mt-0.5 ${textSecondary}`}>
                Margin Mode: Hedging
              </span>
            </div>

            <div className={`rounded-xl border p-4 shadow-sm ${cardBg}`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${textSecondary}`}>
                Synced Trades Log
              </span>
              <span className="text-xl font-black font-mono text-[#5D5FEF]">
                {trades.filter((t) => t.brokerTradeId || t.id.startsWith('mt-')).length} Deals
              </span>
              <span className={`text-[10px] block mt-0.5 ${textSecondary}`}>
                Preserved in Dashboard & Journal
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
