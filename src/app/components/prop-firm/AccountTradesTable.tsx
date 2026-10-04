import React, { useState } from 'react';
import { Plus, ArrowUpRight, ArrowDownRight, CheckCircle2, XCircle, Minus, Link2 } from 'lucide-react';
import type { Account } from '../../data/accountTypes';
import type { Trade } from '../../data/types';
import { useTradesContext } from '../../data/TradesContext';
import { useTheme } from '../../data/ThemeContext';

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
  const { isDayMode } = useTheme();
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

  const cardBg = isDayMode ? 'bg-white border-[#E5E4E2] text-[#111827]' : 'bg-[#131418] border-[#1E2026] text-white';
  const subCardBg = isDayMode ? 'bg-[#F9FAFB] border-[#E5E4E2]' : 'bg-[#0F1013] border-[#1E2026]';
  const textPrimary = isDayMode ? 'text-[#111827]' : 'text-white';
  const textSecondary = isDayMode ? 'text-[#6B7280]' : 'text-[#8E95A5]';
  const textMuted = isDayMode ? 'text-[#9CA3AF]' : 'text-[#525866]';
  const divider = isDayMode ? 'border-[#E5E4E2]' : 'border-[#1E2026]';

  return (
    <div
      className={`rounded-xl p-5 border shadow-xs transition-all ${cardBg}`}
    >
      {/* Top Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b ${divider}`}>
        <div>
          <h3 className={`text-xs font-bold uppercase tracking-wider ${textPrimary}`}>Account Trades Log</h3>
          <p className={`text-[11px] font-medium mt-0.5 ${textSecondary}`}>
            Trades executed under {account.name} ({account.accountNumber})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {unlinkedTrades.length > 0 && (
            <button
              type="button"
              onClick={() => setShowLinkModal(!showLinkModal)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                isDayMode
                  ? 'bg-white hover:bg-[#F2F1EF] text-[#6B7280] border-[#E5E4E2]'
                  : 'bg-[#0F1013] hover:bg-[#181A20] text-[#8E95A5] border-[#1E2026]'
              }`}
            >
              <Link2 size={13} className="text-[#5D5FEF]" />
              <span>Link Existing ({unlinkedTrades.length})</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenQuickTrade}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-[#5D5FEF] hover:bg-[#4F51D8] transition-all shadow-xs cursor-pointer"
          >
            <Plus size={14} />
            <span>Log Trade</span>
          </button>
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className={`p-3.5 rounded-lg border ${subCardBg}`}>
          <span className={`text-[10px] font-bold uppercase tracking-wider block ${textSecondary}`}>Win Rate</span>
          <span className={`text-xl font-black font-mono ${textPrimary}`}>{winRate}%</span>
          <span className={`text-[10px] font-medium block mt-0.5 ${textMuted}`}>
            {wins}W / {losses}L / {bes}BE
          </span>
        </div>
        <div className={`p-3.5 rounded-lg border ${subCardBg}`}>
          <span className={`text-[10px] font-bold uppercase tracking-wider block ${textSecondary}`}>Realized P&L</span>
          <span
            className="text-xl font-black font-mono"
            style={{ color: totalPnl >= 0 ? (isDayMode ? '#059669' : '#10B981') : (isDayMode ? '#DC2626' : '#F87171') }}
          >
            {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
          </span>
          <span className={`text-[10px] font-medium block mt-0.5 ${textMuted}`}>
            {closedTrades.length} closed trades
          </span>
        </div>
        <div className={`p-3.5 rounded-lg border ${subCardBg}`}>
          <span className={`text-[10px] font-bold uppercase tracking-wider block ${textSecondary}`}>Average R:R</span>
          <span className={`text-xl font-black font-mono ${textPrimary}`}>1:{avgRR}</span>
          <span className={`text-[10px] font-medium block mt-0.5 ${textMuted}`}>Risk to Reward</span>
        </div>
        <div className={`p-3.5 rounded-lg border ${subCardBg}`}>
          <span className={`text-[10px] font-bold uppercase tracking-wider block ${textSecondary}`}>Initial Balance</span>
          <span className={`text-xl font-black font-mono ${textPrimary}`}>
            ${account.initialBalance.toLocaleString()}
          </span>
          <span className={`text-[10px] font-medium block mt-0.5 ${textMuted}`}>{account.platform} • {account.provider}</span>
        </div>
      </div>

      {/* Link Trades Drawer */}
      {showLinkModal && (
        <div className={`p-4 mb-5 rounded-xl border ${subCardBg}`}>
          <div className="flex items-center justify-between mb-3">
            <h4 className={`text-xs font-bold flex items-center gap-1.5 ${textPrimary}`}>
              <Link2 size={13} className="text-[#5D5FEF]" />
              Assign Existing Trades to this Account
            </h4>
            <button
              onClick={() => setShowLinkModal(false)}
              className={`text-xs font-semibold hover:underline cursor-pointer ${textSecondary}`}
            >
              Close
            </button>
          </div>
          <div className="max-h-48 overflow-y-auto space-y-2">
            {unlinkedTrades.slice(0, 10).map(t => (
              <div
                key={t.id}
                className={`flex items-center justify-between p-2.5 rounded-lg border text-xs ${isDayMode ? 'bg-white border-[#E5E4E2]' : 'bg-[#131418] border-[#1E2026]'}`}
              >
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${textPrimary}`}>{t.pair}</span>
                  <span className={textSecondary}>{t.orderType}</span>
                  <span className={`font-mono ${textMuted}`}>{t.date}</span>
                  <span
                    className="font-mono font-bold"
                    style={{ color: (t.pnl || 0) >= 0 ? (isDayMode ? '#059669' : '#10B981') : (isDayMode ? '#DC2626' : '#F87171') }}
                  >
                    {(t.pnl || 0) >= 0 ? '+' : ''}${t.pnl?.toFixed(2) || '0.00'}
                  </span>
                </div>
                <button
                  onClick={() => handleLinkTrade(t.id)}
                  className="px-2.5 py-1 rounded-md bg-[#5D5FEF] hover:bg-[#4F51D8] text-white text-[11px] font-bold cursor-pointer"
                >
                  Link
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className={`flex items-center gap-1.5 mb-4 p-1 rounded-lg border w-fit ${isDayMode ? 'bg-[#F2F1EF] border-[#E5E4E2]' : 'bg-[#0F1013] border-[#1E2026]'}`}>
        {(['ALL', 'WIN', 'LOSS', 'BE'] as const).map(res => (
          <button
            key={res}
            onClick={() => setFilterResult(res)}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
              filterResult === res
                ? isDayMode ? 'bg-white text-[#5D5FEF] shadow-xs' : 'bg-[#1E2026] text-white'
                : textSecondary
            }`}
          >
            {res} {res === 'ALL' ? `(${trades.length})` : ''}
          </button>
        ))}
      </div>

      {/* Trades Table */}
      {filteredTrades.length === 0 ? (
        <div className={`text-center py-12 rounded-xl border ${subCardBg}`}>
          <p className={`text-xs font-semibold mb-1 ${textSecondary}`}>No trades logged for this account yet</p>
          <p className={`text-[11px] mb-4 max-w-sm mx-auto font-medium ${textMuted}`}>
            Log your simulation or evaluation trades here to automatically calculate drawdown and profit metrics.
          </p>
          <button
            onClick={onOpenQuickTrade}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-[#5D5FEF] hover:bg-[#4F51D8] shadow-xs cursor-pointer"
          >
            <Plus size={14} />
            Log First Trade
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className={`border-b font-semibold uppercase tracking-wider text-[10px] ${
                isDayMode ? 'text-[#6B7280] border-[#E5E4E2]' : 'text-[#8E95A5] border-[#1E2026]'
              }`}>
                <th className="pb-2.5">Date</th>
                <th className="pb-2.5">Pair / Direction</th>
                <th className="pb-2.5">Session</th>
                <th className="pb-2.5">Strategy</th>
                <th className="pb-2.5">R:R</th>
                <th className="pb-2.5">Score</th>
                <th className="pb-2.5">Result</th>
                <th className="pb-2.5 text-right">P&L ($)</th>
              </tr>
            </thead>
            <tbody className={`divide-y font-medium ${isDayMode ? 'divide-[#E5E4E2]' : 'divide-[#1E2026]'}`}>
              {filteredTrades.map(trade => (
                <tr key={trade.id} className={`transition-colors ${isDayMode ? 'hover:bg-[#F9FAFB]' : 'hover:bg-[#181A20]'}`}>
                  <td className={`py-2.5 font-mono ${textSecondary}`}>{trade.date}</td>
                  <td className={`py-2.5 font-bold ${textPrimary}`}>
                    <div className="flex items-center gap-1.5">
                      <span>{trade.pair}</span>
                      <span
                        className={`flex items-center text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                          trade.orderType === 'Buy'
                            ? isDayMode
                              ? 'bg-[#DCFCE7] text-[#059669] border border-[#86EFAC]'
                              : 'bg-[#0E291E] text-[#10B981] border border-[#144634]'
                            : isDayMode
                            ? 'bg-[#FEE2E2] text-[#DC2626] border border-[#FCA5A5]'
                            : 'bg-[#2D1416] text-[#F87171] border border-[#4C1D24]'
                        }`}
                      >
                        {trade.orderType === 'Buy' ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                        {trade.orderType}
                      </span>
                    </div>
                  </td>
                  <td className={`py-2.5 ${textSecondary}`}>{trade.session}</td>
                  <td className={`py-2.5 font-medium ${textPrimary}`}>{trade.strategy}</td>
                  <td className="py-2.5 text-[#5D5FEF] font-mono font-bold">1:{trade.rrRatio}</td>
                  <td className="py-2.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        isDayMode ? 'bg-[#F2F1EF] text-[#111827] border-[#E5E4E2]' : 'bg-[#181A20] text-white border-[#1E2026]'
                      }`}
                    >
                      {trade.score}/30
                    </span>
                  </td>
                  <td className="py-2.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        trade.result === 'WIN'
                          ? isDayMode
                            ? 'bg-[#DCFCE7] text-[#059669] border border-[#86EFAC]'
                            : 'bg-[#0E291E] text-[#10B981] border border-[#144634]'
                          : trade.result === 'LOSS'
                          ? isDayMode
                            ? 'bg-[#FEE2E2] text-[#DC2626] border border-[#FCA5A5]'
                            : 'bg-[#2D1416] text-[#F87171] border border-[#4C1D24]'
                          : isDayMode
                          ? 'bg-[#F2F1EF] text-[#6B7280] border border-[#E5E4E2]'
                          : 'bg-[#181A20] text-[#8E95A5] border border-[#1E2026]'
                      }`}
                    >
                      {trade.result === 'WIN' ? (
                        <CheckCircle2 size={10} />
                      ) : trade.result === 'LOSS' ? (
                        <XCircle size={10} />
                      ) : (
                        <Minus size={10} />
                      )}
                      {trade.result || trade.status}
                    </span>
                  </td>
                  <td className="py-2.5 text-right font-mono font-black text-xs">
                    <span style={{ color: (trade.pnl || 0) >= 0 ? (isDayMode ? '#059669' : '#10B981') : (isDayMode ? '#DC2626' : '#F87171') }}>
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
