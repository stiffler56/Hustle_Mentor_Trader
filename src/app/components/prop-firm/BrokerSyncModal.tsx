import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  KeyRound,
  Server,
  Zap,
  Unplug,
  Lock,
  UploadCloud,
  FileText,
  ExternalLink,
} from 'lucide-react';
import type { Account, InvestorConnectionConfig } from '../../data/accountTypes';
import { useAuthContext } from '../../data/AuthContext';
import { useTradesContext } from '../../data/TradesContext';
import { requestBrokerConnect, requestBrokerDisconnect } from '../../utils/brokerSync';
import { parseMtReport } from '../../utils/mtReportParser';

interface BrokerSyncModalProps {
  account?: Account | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateAccount: (id: string, updates: Partial<Account>) => void;
}

export const BrokerSyncModal: React.FC<BrokerSyncModalProps> = ({
  account,
  isOpen,
  onClose,
  onUpdateAccount,
}) => {
  const { accessToken } = useAuthContext();
  const { syncBrokerAccount, importTrades } = useTradesContext();

  const [activeTab, setActiveTab] = useState<'cloud' | 'file'>('cloud');
  const [platform, setPlatform] = useState<'MT4' | 'MT5'>('MT5');
  const [login, setLogin] = useState('');
  const [investorPassword, setInvestorPassword] = useState('');
  const [server, setServer] = useState('FundingPips-Server');
  const [metaApiToken, setMetaApiToken] = useState(() => {
    return localStorage.getItem('metaapi_token') || ((import.meta as any).env?.VITE_METAAPI_TOKEN as string) || '';
  });
  const [autoSyncIntervalSec, setAutoSyncIntervalSec] = useState<number>(30);
  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState<boolean>(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [progressMsg, setProgressMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (account) {
      setPlatform(account.connection?.platform || (account.platform === 'MetaTrader 4' ? 'MT4' : 'MT5'));
      setLogin(account.connection?.login || account.accountNumber.replace('#', ''));
      setInvestorPassword(account.connection?.investorPassword || '');
      setServer(account.connection?.server || account.serverType || 'FundingPips-Server');
      setMetaApiToken(account.connection?.metaApiToken || localStorage.getItem('metaapi_token') || ((import.meta as any).env?.VITE_METAAPI_TOKEN as string) || '');
      setAutoSyncIntervalSec(account.connection?.autoSyncIntervalSec || 30);
      setIsAutoSyncEnabled(account.isAutoSyncEnabled ?? true);
      setError('');
      setSuccess('');
    }
  }, [account, isOpen]);

  if (!isOpen || !account) return null;

  const isConnected = account.connection?.syncStatus === 'connected';

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!login.trim()) {
      setError('Account login / number is required.');
      return;
    }
    if (!investorPassword.trim()) {
      setError('Read-only Investor Password is required.');
      return;
    }
    if (!server.trim()) {
      setError('Broker server name is required (e.g. FundingPips-Server).');
      return;
    }

    if (!metaApiToken.trim()) {
      setError(
        'MetaTrader 5 servers require a MetaApi Cloud Token to bridge live trades into the web dashboard. Enter your free token below, or switch to the "MT5 Statement" tab to upload your real report.'
      );
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setProgressMsg('Initiating connection...');

    try {
      const data = await requestBrokerConnect({
        platform,
        login: login.trim(),
        investorPassword: investorPassword.trim(),
        server: server.trim(),
        accountId: account.id,
        accessToken,
        metaApiToken: metaApiToken.trim(),
        onProgress: (msg) => setProgressMsg(msg),
      });

      const connectionConfig: InvestorConnectionConfig = {
        platform,
        login: login.trim(),
        investorPassword: investorPassword.trim(),
        server: server.trim(),
        syncStatus: 'connected',
        lastSyncedAt: new Date().toISOString(),
        autoSyncIntervalSec,
        externalAccountId: data.externalAccountId,
        metaApiToken: metaApiToken.trim(),
        region: data.region || 'london',
      };

      const updatedAccount: Account = {
        ...account,
        accountNumber: `#${login.trim()}`,
        serverType: server.trim(),
        connection: connectionConfig,
        isAutoSyncEnabled,
        currentBalance: data.balance ?? account.currentBalance,
        currentEquity: data.equity ?? account.currentEquity,
      };

      onUpdateAccount(account.id, {
        accountNumber: `#${login.trim()}`,
        serverType: server.trim(),
        connection: connectionConfig,
        isAutoSyncEnabled,
        currentBalance: updatedAccount.currentBalance,
        currentEquity: updatedAccount.currentEquity,
      });

      setSuccess(
        `Connected to ${server} (#${login.trim()})! Synced ${data.tradesCount ?? 0} real deals and ${data.openPositionsCount ?? 0} open positions.`
      );

      setTimeout(() => {
        onClose();
      }, 1600);
    } catch (err: any) {
      setError(err.message || 'Connection failed. Please verify credentials.');
    } finally {
      setLoading(false);
      setProgressMsg('');
    }
  };

  const handleFileReport = (file: File) => {
    setError('');
    setSuccess('');
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const text = ev.target?.result as string;
        if (!text) throw new Error('File is empty.');
        const parsed = parseMtReport(text, account.id);
        if (!parsed.trades || parsed.trades.length === 0) {
          throw new Error('No executed trades found in report. Ensure you exported Closed Transactions or Deals.');
        }

        const count = importTrades(parsed.trades, 'merge');
        const updates: Partial<Account> = {};
        if (parsed.balance) {
          updates.currentBalance = parsed.balance;
          updates.currentEquity = parsed.balance;
        }

        onUpdateAccount(account.id, updates);
        setSuccess(`Successfully imported ${count} real trades from your MT5 report! Balance updated.`);
        setTimeout(() => onClose(), 1500);
      } catch (err: any) {
        setError(err.message || 'Failed to parse MT5 report.');
      }
    };
    reader.readAsText(file);
  };

  const handleDisconnect = async () => {
    setLoading(true);
    setError('');
    try {
      await requestBrokerDisconnect({
        accountId: account.id,
        login,
        accessToken,
      });

      onUpdateAccount(account.id, {
        connection: undefined,
        isAutoSyncEnabled: false,
      });

      setSuccess('Broker disconnected.');
      setTimeout(() => onClose(), 800);
    } catch (err: any) {
      setError(err.message || 'Disconnect failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#131418] rounded-2xl shadow-2xl border border-[#1E2026] text-white overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#1E2026]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#181A20] border border-[#1E2026] flex items-center justify-center text-[#6366F1]">
              <Zap size={20} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white tracking-tight">
                Funding Pips / MT5 Real Sync
              </h2>
              <p className="text-xs text-[#8E95A5] font-medium">
                Live read-only synchronization for {account.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#8E95A5] hover:text-white hover:bg-[#181A20] rounded-xl transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#1E2026] bg-[#0F1013] p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('cloud')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'cloud'
                ? 'bg-[#181A20] text-white shadow-xs border border-[#1E2026]'
                : 'text-[#8E95A5] hover:bg-[#181A20] hover:text-white'
            }`}
          >
            <Zap size={14} className={activeTab === 'cloud' ? 'text-[#6366F1]' : ''} />
            <span>Live Cloud Sync</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('file')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'file'
                ? 'bg-[#181A20] text-white shadow-xs border border-[#1E2026]'
                : 'text-[#8E95A5] hover:bg-[#181A20] hover:text-white'
            }`}
          >
            <FileText size={14} className={activeTab === 'file' ? 'text-[#6366F1]' : ''} />
            <span>Import MT5 Statement</span>
          </button>
        </div>

        {/* Security Banner */}
        <div className="bg-[#0E291E]/60 border-b border-[#144634] p-3 flex items-start gap-2.5">
          <ShieldCheck size={16} className="text-[#10B981] shrink-0 mt-0.5" />
          <div className="text-[11px] leading-relaxed text-[#10B981]">
            <strong className="font-bold text-white">Read-Only Investor Security: </strong>
            Your investor password only reads past deals and balance. It is impossible to place orders or withdraw funds.
          </div>
        </div>

        {activeTab === 'cloud' ? (
          /* Form Body - Cloud Sync */
          <form onSubmit={handleConnect} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
            {error && (
              <div className="p-3 bg-[#2D1416] border border-[#4C1D24] rounded-xl text-[#F87171] flex items-start gap-2">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 bg-[#0E291E] border border-[#144634] rounded-xl text-[#10B981] flex items-center gap-2">
                <CheckCircle2 size={15} className="shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {loading && progressMsg && (
              <div className="p-3 bg-[#181A20] border border-[#6366F1]/40 rounded-xl text-white flex items-center gap-2.5">
                <RefreshCw size={15} className="text-[#6366F1] animate-spin shrink-0" />
                <span className="leading-snug font-medium text-xs text-[#E2E8F0]">{progressMsg}</span>
              </div>
            )}

            {/* Platform Choice */}
            <div>
              <label className="block font-bold text-[#8E95A5] uppercase tracking-wider text-[10px] mb-1.5">
                Trading Platform
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['MT5', 'MT4'] as const).map(p => (
                  <button
                    type="button"
                    key={p}
                    onClick={() => setPlatform(p)}
                    className={`py-2.5 px-4 rounded-xl font-bold border transition-all text-xs flex items-center justify-center gap-2 cursor-pointer ${
                      platform === p
                        ? 'bg-[#181A20] text-white border-[#6366F1] shadow-xs'
                        : 'bg-[#0F1013] text-[#8E95A5] border-[#1E2026] hover:bg-[#181A20] hover:text-white'
                    }`}
                  >
                    <Server size={14} className={platform === p ? 'text-[#6366F1]' : ''} />
                    <span>MetaTrader {p === 'MT5' ? '5' : '4'}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Login / Account Number */}
            <div>
              <label className="block font-bold text-[#8E95A5] uppercase tracking-wider text-[10px] mb-1.5">
                Account Number / Login
              </label>
              <input
                type="text"
                value={login}
                onChange={e => setLogin(e.target.value)}
                placeholder="e.g. 5241088"
                className="w-full px-3.5 py-2.5 bg-[#0F1013] border border-[#1E2026] rounded-xl text-white font-mono font-medium focus:border-[#6366F1] outline-none transition-all"
              />
            </div>

            {/* Broker Server Name */}
            <div>
              <label className="block font-bold text-[#8E95A5] uppercase tracking-wider text-[10px] mb-1.5">
                Broker Server Name
              </label>
              <input
                type="text"
                value={server}
                onChange={e => setServer(e.target.value)}
                placeholder="e.g. FundingPips-Server, FundingPips-Demo"
                className="w-full px-3.5 py-2.5 bg-[#0F1013] border border-[#1E2026] rounded-xl text-white font-medium focus:border-[#6366F1] outline-none transition-all"
              />
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {['FundingPips-Server', 'FundingPips-SIM1', 'FundingPips-Demo'].map(preset => (
                  <button
                    type="button"
                    key={preset}
                    onClick={() => setServer(preset)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all cursor-pointer ${
                      server === preset
                        ? 'bg-[#6366F1] text-white font-bold'
                        : 'bg-[#0F1013] text-[#8E95A5] border border-[#1E2026] hover:bg-[#181A20] hover:text-white'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Investor Password */}
            <div>
              <label className="block font-bold text-[#8E95A5] uppercase tracking-wider text-[10px] mb-1.5">
                Investor Password (Read-Only)
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={investorPassword}
                  onChange={e => setInvestorPassword(e.target.value)}
                  placeholder="Enter read-only investor password"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-[#0F1013] border border-[#1E2026] rounded-xl text-white font-mono font-medium focus:border-[#6366F1] outline-none transition-all"
                />
                <KeyRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#525866]" />
              </div>
            </div>

            {/* MetaApi Cloud Token */}
            <div className="p-3.5 bg-[#0F1013] rounded-xl border border-[#1E2026] space-y-2">
              <div className="flex items-center justify-between">
                <label className="block font-bold text-[#6366F1] uppercase tracking-wider text-[10px]">
                  MetaApi Cloud Token (Required for Live MT5 Sync)
                </label>
                <a
                  href="https://app.metaapi.cloud/token"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#6366F1] hover:underline"
                >
                  <span>Get Free Token</span>
                  <ExternalLink size={11} />
                </a>
              </div>
              <input
                type="password"
                value={metaApiToken}
                onChange={e => {
                  setMetaApiToken(e.target.value);
                  localStorage.setItem('metaapi_token', e.target.value.trim());
                }}
                placeholder="Paste token from app.metaapi.cloud/token"
                className="w-full px-3 py-2 bg-[#131418] border border-[#1E2026] rounded-xl text-white font-mono text-xs focus:border-[#6366F1] outline-none"
              />
              <p className="text-[10px] text-[#8E95A5] leading-relaxed">
                Connects directly to Funding Pips MT5 servers to extract your live balance, equity, and executed deals without simulated data.
              </p>
            </div>

            {/* Auto-Sync Configuration */}
            <div className="pt-2 border-t border-[#1E2026] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block text-xs">Continuous Auto-Sync</span>
                  <span className="text-[11px] text-[#8E95A5] font-medium">
                    Automatically poll Funding Pips every {autoSyncIntervalSec}s
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={isAutoSyncEnabled}
                  onChange={e => setIsAutoSyncEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-[#6366F1] focus:ring-[#6366F1] border-[#1E2026] bg-[#0F1013]"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-[#1E2026] flex items-center justify-between gap-3">
              {isConnected ? (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-[#F87171] bg-[#2D1416] hover:bg-[#2D1416]/80 border border-[#4C1D24] transition-all text-xs"
                >
                  <Unplug size={14} />
                  <span>Disconnect</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl font-semibold text-[#8E95A5] hover:text-white bg-[#0F1013] hover:bg-[#181A20] transition-all text-xs"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-white bg-[#6366F1] hover:bg-[#4F46E5] transition-all shadow-xs text-xs disabled:opacity-50"
                >
                  {loading ? <RefreshCw size={14} className="animate-spin" /> : <Lock size={14} />}
                  <span>{isConnected ? 'Save & Sync Live' : 'Connect & Sync Live'}</span>
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* File Upload Body - MT5 Detailed Statement */
          <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
            {error && (
              <div className="p-3 bg-[#2D1416] border border-[#4C1D24] rounded-xl text-[#F87171] flex items-start gap-2">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 bg-[#0E291E] border border-[#144634] rounded-xl text-[#10B981] flex items-center gap-2">
                <CheckCircle2 size={15} className="shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault();
                const f = e.dataTransfer.files?.[0];
                if (f) handleFileReport(f);
              }}
              className="border-2 border-dashed border-[#1E2026] hover:border-[#6366F1] hover:bg-[#181A20]/50 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-[#0F1013] border border-[#1E2026] text-[#6366F1] flex items-center justify-center mb-3">
                <UploadCloud size={24} />
              </div>
              <h4 className="font-extrabold text-white text-sm mb-1">
                Upload Funding Pips MT5 Report
              </h4>
              <p className="text-[#8E95A5] text-xs mb-3">
                Drag and drop your exported <code className="font-mono bg-[#0F1013] px-1 py-0.5 rounded text-white">.html</code> or <code className="font-mono bg-[#0F1013] px-1 py-0.5 rounded text-white">.csv</code> statement
              </p>
              <span className="px-3.5 py-1.5 rounded-lg bg-[#6366F1] text-white font-bold text-xs shadow-xs">
                Select Report File
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".html,.htm,.csv"
                className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) handleFileReport(f);
                }}
              />
            </div>

            <div className="bg-[#0F1013] rounded-xl p-4 border border-[#1E2026] space-y-2">
              <h5 className="font-bold text-white text-xs">How to export from MT5 in 3 clicks:</h5>
              <ol className="list-decimal list-inside space-y-1 text-[#8E95A5] text-[11px] leading-relaxed">
                <li>Open MetaTrader 5 with your Funding Pips account</li>
                <li>In the bottom window, click the <strong>History</strong> tab</li>
                <li>Right-click anywhere in the trade list and click <strong>Report &rarr; HTML</strong></li>
                <li>Upload that downloaded file here &mdash; all real trades and balance will populate immediately!</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

