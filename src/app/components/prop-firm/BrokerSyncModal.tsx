import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import type { Account, InvestorConnectionConfig } from '../../data/accountTypes';
import { SERVER_BASE, useAuthContext } from '../../data/AuthContext';
import { useTradesContext } from '../../data/TradesContext';

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
  const { syncBrokerAccount } = useTradesContext();

  const [platform, setPlatform] = useState<'MT4' | 'MT5'>('MT5');
  const [login, setLogin] = useState('');
  const [investorPassword, setInvestorPassword] = useState('');
  const [server, setServer] = useState('ICMarketsSC-Live01');
  const [autoSyncIntervalSec, setAutoSyncIntervalSec] = useState<number>(30);
  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState<boolean>(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (account) {
      setPlatform(account.connection?.platform || (account.platform === 'MetaTrader 4' ? 'MT4' : 'MT5'));
      setLogin(account.connection?.login || account.accountNumber.replace('#', ''));
      setInvestorPassword(account.connection?.investorPassword || '');
      setServer(account.connection?.server || account.serverType || 'ICMarketsSC-Live01');
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
      setError('Broker server name is required.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${SERVER_BASE}/broker/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          platform,
          login: login.trim(),
          investorPassword: investorPassword.trim(),
          server: server.trim(),
          accountId: account.id,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to connect to broker.');
      }

      const connectionConfig: InvestorConnectionConfig = {
        platform,
        login: login.trim(),
        investorPassword: investorPassword.trim(),
        server: server.trim(),
        syncStatus: 'connected',
        lastSyncedAt: new Date().toISOString(),
        autoSyncIntervalSec,
        externalAccountId: data.externalAccountId,
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

      const syncResult = await syncBrokerAccount(updatedAccount).catch(() => null);

      setSuccess(
        `Connected to ${platform}! ${
          syncResult?.newTradesCount ? `Imported ${syncResult.newTradesCount} trades.` : 'Account verified.'
        }`
      );

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Connection failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    setError('');
    try {
      await fetch(`${SERVER_BASE}/broker/disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          accountId: account.id,
          login,
        }),
      }).catch(() => {});

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
                MT4 / MT5 Investor Sync
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Automated read-only synchronization for {account.name}
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

        {/* Security Banner */}
        <div className="bg-emerald-50/80 border-b border-emerald-100 p-4 flex items-start gap-3">
          <ShieldCheck size={18} className="text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-[11px] leading-relaxed text-emerald-900">
            <strong className="font-bold text-emerald-950">Read-Only Investor Security: </strong>
            Investor password only grants read permissions to trades and account history. It is impossible to place orders, withdraw funds, or change settings.
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleConnect} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
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
              Account Login / Number
            </label>
            <input
              type="text"
              value={login}
              onChange={e => setLogin(e.target.value)}
              placeholder="e.g. 20823275"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-medium focus:bg-white focus:border-blue-500 outline-none transition-all"
            />
          </div>

          {/* Broker Server Name */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">
              Broker Server Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={server}
                onChange={e => setServer(e.target.value)}
                placeholder="e.g. ICMarketsSC-Live01, FTMO-Demo, FundingPips-Live"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:border-blue-500 outline-none transition-all"
              />
            </div>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {['ICMarketsSC-Live01', 'FTMO-Server', 'FundingPips-Live', 'Pepperstone-Live'].map(preset => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => setServer(preset)}
                  className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-mono hover:bg-slate-200"
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

          {/* Auto-Sync Configuration */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 block text-xs">Continuous Auto-Sync</span>
                <span className="text-[11px] text-slate-500 font-medium">
                  Automatically sync trades without opening the dashboard
                </span>
              </div>
              <input
                type="checkbox"
                checked={isAutoSyncEnabled}
                onChange={e => setIsAutoSyncEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
              />
            </div>

            {isAutoSyncEnabled && (
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">
                  Sync Polling Interval
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: '15s', val: 15 },
                    { label: '30s', val: 30 },
                    { label: '1m', val: 60 },
                    { label: '5m', val: 300 },
                  ].map(item => (
                    <button
                      type="button"
                      key={item.val}
                      onClick={() => setAutoSyncIntervalSec(item.val)}
                      className={`py-2 rounded-xl font-bold border transition-all text-[11px] ${
                        autoSyncIntervalSec === item.val
                          ? 'bg-blue-50 text-blue-700 border-blue-300'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
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
                <span>{isConnected ? 'Save & Sync' : 'Connect & Sync'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
