import React, { useState } from 'react';
import { Plus, ArrowUpRight, ArrowDownRight, CheckCircle2, XCircle, Minus, Link2 } from 'lucide-react';
import type { Account } from '../../data/accountTypes';
import type { Trade } from '../../data/types';
import { useTradesContext } from '../../data/TradesContext';

interface AccountTradesTableProps {
  account: Account;
  trades: Trade[];
  onOpenQuickTrade: () => void;
}

export const AccountTradesTable: React.FC<AccountTradesTableProps> = ({
  account,
  trades,
  onOpenQuickTrade,
}) => {
  const { trades: allTrades, updateTrade } = useTradesContext();
  const [filterResult, setFilterResult] = useState<'ALL' | 'WIN' | 'LOSS' | 'BE'>('ALL');
  const [showLinkModal, setShowLinkModal] = useState(false);

  const filteredTrades = trades.filter(t => {
    if (filterResult === 'ALL') return true;
    return t.result === filterResult;
  });

  const closedTrades = trades.filter(t => t.status === 'CLOSED');
  const wins = closedTrades.filter(t => t.result === 'WIN').length;
  const losses = closedTrades.filter(t => t.result === 'LOSS').length;
  const bes = closedTrades.filter(t => t.result === 'BE').length;
  const winRate = closedTrades.length > 0 ? Math.round((wins / closedTrades.length) * 100) : 0;

  const totalPnl = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const avgRR = closedTrades.length > 0
    ? (closedTrades.reduce((sum, t) => sum + t.rrRatio, 0) / closedTrades.length).toFixed(1)
    : '0.0';

  const unlinkedTrades = allTrades.filter(t => !t.accountId || t.accountId !== account.id);

  const handleLinkTrade = (tradeId: string) => {
    updateTrade(tradeId, { accountId: account.id });
  };

  return (
    <div
      className="rounded-2xl p-6 bg-white border border-slate-200 shadow-sm"
      style={{
        boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)',
      }}
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-200">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Account Trades Log</h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Trades executed under {account.name} ({account.accountNumber})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {unlinkedTrades.length > 0 && (
            <button
              type="button"
              onClick={() => setShowLinkModal(!showLinkModal)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 border border-slate-200 transition-colors"
            >
              <Link2 size={13} className="text-blue-600" />
              <span>Link Existing ({unlinkedTrades.length})</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenQuickTrade}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-sm"
          >
            <Plus size={14} />
            <span>Log Trade</span>
          </button>
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">Win Rate</span>
          <span className="text-xl font-extrabold text-blue-600 font-mono">{winRate}%</span>
          <span className="text-[10px] font-medium text-slate-500 block mt-0.5">
            {wins}W / {losses}L / {bes}BE
          </span>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">Realized P&L</span>
          <span
            className="text-xl font-extrabold font-mono"
            style={{ color: totalPnl >= 0 ? '#16a34a' : '#dc2626' }}
          >
            {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
          </span>
          <span className="text-[10px] font-medium text-slate-500 block mt-0.5">
            {closedTrades.length} closed trades
          </span>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">Average R:R</span>
          <span className="text-xl font-extrabold text-blue-600 font-mono">1:{avgRR}</span>
          <span className="text-[10px] font-medium text-slate-500 block mt-0.5">Risk to Reward</span>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">Initial Balance</span>
          <span className="text-xl font-extrabold text-blue-600 font-mono">
            ${account.initialBalance.toLocaleString()}
          </span>
          <span className="text-[10px] font-medium text-slate-500 block mt-0.5">{account.platform} • {account.provider}</span>
        </div>
      </div>

      {/* Link Trades Drawer */}
      {showLinkModal && (
        <div className="p-4 mb-5 rounded-2xl bg-blue-50/70 border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
              <Link2 size={13} className="text-blue-600" />
              Assign Existing Trades to this Account
            </h4>
            <button
              onClick={() => setShowLinkModal(false)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Close
            </button>
          </div>
          <div className="max-h-48 overflow-y-auto space-y-2">
            {unlinkedTrades.slice(0, 10).map(t => (
              <div
                key={t.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">{t.pair}</span>
                  <span className="text-slate-500 font-medium">{t.orderType}</span>
                  <span className="text-slate-400 font-mono">{t.date}</span>
                  <span
                    className="font-mono font-bold"
                    style={{ color: (t.pnl || 0) >= 0 ? '#16a34a' : '#dc2626' }}
                  >
                    {(t.pnl || 0) >= 0 ? '+' : ''}${t.pnl?.toFixed(2) || '0.00'}
                  </span>
                </div>
                <button
                  onClick={() => handleLinkTrade(t.id)}
                  className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold"
                >
                  Link
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-4">
        {(['ALL', 'WIN', 'LOSS', 'BE'] as const).map(res => (
          <button
            key={res}
            onClick={() => setFilterResult(res)}
            className="px-3 py-1 rounded-lg text-xs font-bold transition-all"
            style={{
              background: filterResult === res ? '#eff6ff' : '#f8fafc',
              color: filterResult === res ? '#2563eb' : '#64748b',
              border: filterResult === res ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
            }}
          >
            {res} {res === 'ALL' ? `(${trades.length})` : ''}
          </button>
        ))}
      </div>

      {/* Trades Table */}
      {filteredTrades.length === 0 ? (
        <div className="text-center py-12 rounded-xl bg-slate-50 border border-slate-200">
          <p className="text-sm font-semibold text-slate-700 mb-1">No trades logged for this account yet</p>
          <p className="text-xs text-slate-500 mb-4 max-w-sm mx-auto font-medium">
            Log your simulation or evaluation trades here to automatically calculate drawdown and profit metrics.
          </p>
          <button
            onClick={onOpenQuickTrade}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm"
          >
            <Plus size={14} />
            Log First Trade
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-500 border-b border-slate-200 font-semibold uppercase tracking-wider text-[11px]">
                <th className="pb-3">Date</th>
                <th className="pb-3">Pair / Direction</th>
                <th className="pb-3">Session</th>
                <th className="pb-3">Strategy</th>
                <th className="pb-3">R:R</th>
                <th className="pb-3">Score</th>
                <th className="pb-3">Result</th>
                <th className="pb-3 text-right">P&L ($)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredTrades.map(trade => (
                <tr key={trade.id} className="hover:bg-blue-50/40 transition-colors">
                  <td className="py-3 text-slate-500 font-mono">{trade.date}</td>
                  <td className="py-3 font-bold text-slate-900">
                    <div className="flex items-center gap-1.5">
                      <span>{trade.pair}</span>
                      <span
                        className="flex items-center text-[10px] px-1.5 py-0.5 rounded font-bold"
                        style={{
                          background: trade.orderType === 'Buy' ? '#f0fdf4' : '#fef2f2',
                          color: trade.orderType === 'Buy' ? '#16a34a' : '#dc2626',
                          border: `1px solid ${trade.orderType === 'Buy' ? '#bbf7d0' : '#fecaca'}`,
                        }}
                      >
                        {trade.orderType === 'Buy' ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                        {trade.orderType}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 text-slate-600">{trade.session}</td>
                  <td className="py-3 text-slate-800 font-semibold">{trade.strategy}</td>
                  <td className="py-3 text-blue-600 font-mono font-bold">1:{trade.rrRatio}</td>
                  <td className="py-3">
                    <span
                      className="px-2 py-0.5 rounded-full text-[11px] font-bold"
                      style={{
                        background: trade.score >= 20 ? '#eff6ff' : '#fffbeb',
                        color: trade.score >= 20 ? '#2563eb' : '#d97706',
                        border: `1px solid ${trade.score >= 20 ? '#bfdbfe' : '#fde68a'}`,
                      }}
                    >
                      {trade.score}/30
                    </span>
                  </td>
                  <td className="py-3">
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                      style={{
                        background:
                          trade.result === 'WIN'
                            ? '#f0fdf4'
                            : trade.result === 'LOSS'
                            ? '#fef2f2'
                            : '#eff6ff',
                        color:
                          trade.result === 'WIN'
                            ? '#16a34a'
                            : trade.result === 'LOSS'
                            ? '#dc2626'
                            : '#2563eb',
                        border: `1px solid ${
                          trade.result === 'WIN'
                            ? '#bbf7d0'
                            : trade.result === 'LOSS'
                            ? '#fecaca'
                            : '#bfdbfe'
                        }`,
                      }}
                    >
                      {trade.result === 'WIN' ? (
                        <CheckCircle2 size={11} />
                      ) : trade.result === 'LOSS' ? (
                        <XCircle size={11} />
                      ) : (
                        <Minus size={11} />
                      )}
                      {trade.result || trade.status}
                    </span>
                  </td>
                  <td className="py-3 text-right font-mono font-extrabold text-sm">
                    <span style={{ color: (trade.pnl || 0) >= 0 ? '#16a34a' : '#dc2626' }}>
                      {(trade.pnl || 0) >= 0 ? '+' : ''}${trade.pnl?.toFixed(2) || '0.00'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
