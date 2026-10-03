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

    try {
      const data = await requestBrokerConnect({
        platform,
        login: login.trim(),
        investorPassword: investorPassword.trim(),
        server: server.trim(),
        accountId: account.id,
        accessToken,
        metaApiToken: metaApiToken.trim(),
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
        connection: connectionConfig,
        isAutoSyncEnabled,
        currentBalance: data.balance ?? account.currentBalance,
        currentEquity: data.equity ?? account.currentEquity,
      };

      onUpdateAccount(account.id, {
        connection: connectionConfig,
        isAutoSyncEnabled,
        currentBalance: updatedAccount.currentBalance,
        currentEquity: updatedAccount.currentEquity,
      });

      const syncResult = await syncBrokerAccount(updatedAccount);

      setSuccess(
        `Connected to ${server}! Synced ${syncResult?.newTradesCount || 0} real trades.`
      );

      setTimeout(() => {
        onClose();
      }, 1400);
    } catch (err: any) {
      setError(err.message || 'Connection failed. Please verify credentials.');
    } finally {
      setLoading(false);
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
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Zap size={20} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                Funding Pips / MT5 Real Sync
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Live read-only synchronization for {account.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('cloud')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'cloud'
                ? 'bg-white text-blue-600 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Zap size={14} />
            <span>Live Cloud Sync</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('file')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'file'
                ? 'bg-white text-blue-600 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText size={14} />
            <span>Import MT5 Statement</span>
          </button>
        </div>

        {/* Security Banner */}
        <div className="bg-emerald-50/80 border-b border-emerald-100 p-3.5 flex items-start gap-2.5">
          <ShieldCheck size={16} className="text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-[11px] leading-relaxed text-emerald-900">
            <strong className="font-bold text-emerald-950">Read-Only Investor Security: </strong>
            Your investor password only reads past deals and balance. It is impossible to place orders or withdraw funds.
          </div>
        </div>

        {activeTab === 'cloud' ? (
          /* Form Body - Cloud Sync */
          <form onSubmit={handleConnect} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-start gap-2">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 flex items-center gap-2">
                <CheckCircle2 size={15} className="shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {/* Platform Choice */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">
                Trading Platform
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['MT5', 'MT4'] as const).map(p => (
                  <button
                    type="button"
                    key={p}
                    onClick={() => setPlatform(p)}
                    className={`py-2.5 px-4 rounded-xl font-bold border transition-all text-xs flex items-center justify-center gap-2 ${
                      platform === p
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Server size={14} />
                    <span>MetaTrader {p === 'MT5' ? '5' : '4'}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Login / Account Number */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">
                Account Number / Login
              </label>
              <input
                type="text"
                value={login}
                onChange={e => setLogin(e.target.value)}
                placeholder="e.g. 5241088"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-medium focus:bg-white focus:border-blue-500 outline-none transition-all"
              />
            </div>

            {/* Broker Server Name */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">
                Broker Server Name
              </label>
              <input
                type="text"
                value={server}
                onChange={e => setServer(e.target.value)}
                placeholder="e.g. FundingPips-Server, FundingPips-Demo"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:border-blue-500 outline-none transition-all"
              />
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {['FundingPips-SIM1', 'FundingPips-Server', 'FundingPips-Demo', 'ICMarketsSC-Live01', 'FTMO-Server'].map(preset => (
                  <button
                    type="button"
                    key={preset}
                    onClick={() => setServer(preset)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all ${
                      server === preset
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Investor Password */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">
                Investor Password (Read-Only)
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={investorPassword}
                  onChange={e => setInvestorPassword(e.target.value)}
                  placeholder="Enter read-only investor password"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-medium focus:bg-white focus:border-blue-500 outline-none transition-all"
                />
                <KeyRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            {/* MetaApi Cloud Token */}
            <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-100 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block font-bold text-blue-900 uppercase tracking-wider text-[10px]">
                  MetaApi Cloud Token (Required for Live MT5 Sync)
                </label>
                <a
                  href="https://app.metaapi.cloud/token"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 underline"
                >
                  <span>Get Free Token</span>
                  <ExternalLink size={11} />
                </a>
              </div>
              <input
                type="password"
                value={metaApiToken}
                onChange={e => setMetaApiToken(e.target.value)}
                placeholder="Paste token from app.metaapi.cloud/token"
                className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-slate-900 font-mono text-xs focus:border-blue-600 outline-none"
              />
              <p className="text-[10px] text-blue-700/80 leading-relaxed">
                Connects directly to Funding Pips MT5 servers to extract your live balance, equity, and executed deals without simulated data.
              </p>
            </div>

            {/* Auto-Sync Configuration */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block text-xs">Continuous Auto-Sync</span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Automatically poll Funding Pips every {autoSyncIntervalSec}s
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={isAutoSyncEnabled}
                  onChange={e => setIsAutoSyncEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
              {isConnected ? (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-all text-xs"
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
                  className="px-4 py-2.5 rounded-xl font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all text-xs"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-sm text-xs disabled:opacity-50"
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
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-start gap-2">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 flex items-center gap-2">
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
              className="border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/30 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <UploadCloud size={24} />
              </div>
              <h4 className="font-extrabold text-slate-800 text-sm mb-1">
                Upload Funding Pips MT5 Report
              </h4>
              <p className="text-slate-500 text-xs mb-3">
                Drag and drop your exported <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">.html</code> or <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">.csv</code> statement
              </p>
              <span className="px-3.5 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-xs">
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

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
              <h5 className="font-bold text-slate-800 text-xs">How to export from MT5 in 3 clicks:</h5>
              <ol className="list-decimal list-inside space-y-1 text-slate-600 text-[11px] leading-relaxed">
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

