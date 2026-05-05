import { useState } from 'react';
import { CheckCircle, XCircle, Clock, TrendingUp, TrendingDown, Search, Filter, ChevronDown, Plus, Minus } from 'lucide-react';
import { Trade } from '../data/trades';

interface TradeJournalProps {
  trades: Trade[];
  onUpdateResult: (id: string, result: Trade['result'], pnl: number, rrRatio: number) => void;
}

function DecisionBadge({ decision }: { decision: Trade['decision'] }) {
  const map = {
    TAKE: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    WAIT: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    PASS: 'bg-red-500/15 text-red-400 border-red-500/30',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded border ${map[decision]}`}>
      {decision}
    </span>
  );
}

function ResultBadge({ result }: { result: Trade['result'] }) {
  if (!result) return <span className="text-xs px-2 py-0.5 rounded border bg-gray-700/30 text-gray-500 border-gray-700">OPEN</span>;
  const map = {
    WIN: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    LOSS: 'bg-red-500/15 text-red-400 border-red-500/30',
    BREAKEVEN: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded border ${map[result]}`}>
      {result}
    </span>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 75 ? 'text-emerald-400' : score >= 55 ? 'text-amber-400' : 'text-red-400';
  return <span className={`text-sm font-semibold ${color}`}>{score}%</span>;
}

function LogResultModal({ trade, onSave, onClose }: {
  trade: Trade;
  onSave: (result: Trade['result'], pnl: number, rrRatio: number) => void;
  onClose: () => void;
}) {
  const [result, setResult] = useState<Trade['result']>('WIN');
  const [pnl, setPnl] = useState('');
  const [rr, setRr] = useState('');

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#111118] border border-[#2a2a3d] rounded-2xl p-6 w-full max-w-sm space-y-4">
        <h3 className="text-white">Log Result — {trade.pair} {trade.orderType}</h3>
        <p className="text-xs text-gray-400">{trade.date} · Score: {trade.score}% · {trade.decision}</p>

        <div className="grid grid-cols-3 gap-2">
          {(['WIN', 'LOSS', 'BREAKEVEN'] as const).map(r => (
            <button
              key={r}
              onClick={() => setResult(r)}
              className={`py-2.5 rounded-xl text-sm transition-all ${
                result === r
                  ? r === 'WIN' ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400'
                    : r === 'LOSS' ? 'bg-red-500/20 border border-red-500/50 text-red-400'
                    : 'bg-blue-500/20 border border-blue-500/50 text-blue-400'
                  : 'bg-[#1a1a27] border border-[#2a2a3d] text-gray-400'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1.5">P&L ($)</label>
            <div className="flex items-center gap-2">
              <button onClick={() => setPnl(p => p.startsWith('-') ? p.slice(1) : '-' + p)} className="text-gray-400 hover:text-white">
                {result === 'LOSS' ? <Minus size={14} /> : <Plus size={14} />}
              </button>
              <input
                type="number"
                value={pnl}
                onChange={(e) => setPnl(e.target.value)}
                placeholder="e.g. 312"
                className="flex-1 bg-[#1a1a27] border border-[#2a2a3d] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400/50"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1.5">R:R Ratio</label>
            <input
              type="number"
              step="0.1"
              value={rr}
              onChange={(e) => setRr(e.target.value)}
              placeholder="e.g. 2.5"
              className="w-full bg-[#1a1a27] border border-[#2a2a3d] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400/50"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-gray-800 text-gray-400 text-sm hover:bg-gray-700 transition-all">Cancel</button>
          <button
            onClick={() => {
              onSave(result, result === 'LOSS' ? -Math.abs(Number(pnl)) : Number(pnl), Number(rr));
              onClose();
            }}
            className="flex-1 py-2.5 rounded-xl bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400 transition-all"
          >
            Save Result
          </button>
        </div>
      </div>
    </div>
  );
}

export function TradeJournal({ trades, onUpdateResult }: TradeJournalProps) {
  const [search, setSearch] = useState('');
  const [filterResult, setFilterResult] = useState<string>('ALL');
  const [filterDecision, setFilterDecision] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'pnl'>('date');
  const [logModal, setLogModal] = useState<Trade | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = trades
    .filter(t => {
      const matchSearch = t.pair.toLowerCase().includes(search.toLowerCase()) ||
        t.strategy.toLowerCase().includes(search.toLowerCase()) ||
        t.notes.toLowerCase().includes(search.toLowerCase());
      const matchResult = filterResult === 'ALL' || t.result === filterResult || (filterResult === 'OPEN' && !t.result);
      const matchDecision = filterDecision === 'ALL' || t.decision === filterDecision;
      return matchSearch && matchResult && matchDecision;
    })
    .sort((a, b) => {
      if (sortBy === 'date') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === 'score') return b.score - a.score;
      if (sortBy === 'pnl') return (b.pnl ?? 0) - (a.pnl ?? 0);
      return 0;
    });

  const totalPnl = trades.filter(t => t.pnl !== null).reduce((s, t) => s + (t.pnl ?? 0), 0);
  const winCount = trades.filter(t => t.result === 'WIN').length;
  const closedCount = trades.filter(t => t.result !== null).length;
  const winRate = closedCount > 0 ? Math.round((winCount / closedCount) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* Summary Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total P&L', value: `${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(0)}`, color: totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400' },
          { label: 'Win Rate', value: `${winRate}%`, color: winRate >= 55 ? 'text-emerald-400' : 'text-amber-400' },
          { label: 'Total Trades', value: `${trades.length}`, color: 'text-white' },
          { label: 'Wins / Losses', value: `${winCount} / ${trades.filter(t => t.result === 'LOSS').length}`, color: 'text-white' },
        ].map(s => (
          <div key={s.label} className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className={`text-xl font-semibold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search trades..."
            className="w-full bg-[#111118] border border-[#1e1e2e] rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-amber-400/50"
          />
        </div>
        <div className="flex gap-2">
          {['ALL', 'WIN', 'LOSS', 'BREAKEVEN', 'OPEN'].map(r => (
            <button
              key={r}
              onClick={() => setFilterResult(r)}
              className={`px-3 py-2 rounded-xl text-xs transition-all ${filterResult === r ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-[#111118] border border-[#1e1e2e] text-gray-400 hover:border-gray-600'}`}
            >
              {r}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {['ALL', 'TAKE', 'WAIT', 'PASS'].map(d => (
            <button
              key={d}
              onClick={() => setFilterDecision(d)}
              className={`px-3 py-2 rounded-xl text-xs transition-all ${filterDecision === d ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-[#111118] border border-[#1e1e2e] text-gray-400 hover:border-gray-600'}`}
            >
              {d}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <Filter size={13} className="text-gray-500" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-[#111118] border border-[#1e1e2e] text-gray-400 text-sm rounded-xl px-3 py-2.5 focus:outline-none"
          >
            <option value="date">Latest First</option>
            <option value="score">Highest Score</option>
            <option value="pnl">Best P&L</option>
          </select>
        </div>
      </div>

      {/* Trade List */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-500 bg-[#111118] border border-[#1e1e2e] rounded-2xl">
            No trades match your filters.
          </div>
        )}
        {filtered.map(trade => {
          const isExpanded = expandedId === trade.id;
          return (
            <div key={trade.id} className="bg-[#111118] border border-[#1e1e2e] rounded-2xl overflow-hidden">
              {/* Main row */}
              <div
                className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-white/[0.02] transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : trade.id)}
              >
                {/* Date */}
                <div className="w-20 shrink-0">
                  <p className="text-xs text-gray-500">{new Date(trade.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                  <p className="text-xs text-gray-600">{new Date(trade.date).getFullYear()}</p>
                </div>

                {/* Pair + type */}
                <div className="flex items-center gap-1.5 w-28 shrink-0">
                  {trade.orderType === 'BUY'
                    ? <TrendingUp size={13} className="text-emerald-400" />
                    : <TrendingDown size={13} className="text-red-400" />
                  }
                  <span className="text-sm text-white">{trade.pair}</span>
                </div>

                {/* Session */}
                <div className="hidden md:block w-24 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded ${trade.session === 'New York' ? 'bg-blue-500/10 text-blue-400' : trade.session === 'London' ? 'bg-purple-500/10 text-purple-400' : 'bg-gray-700 text-gray-400'}`}>
                    {trade.session === 'New York' ? 'NY' : trade.session}
                  </span>
                </div>

                {/* Strategy */}
                <div className="hidden lg:block flex-1 min-w-0">
                  <span className="text-xs text-gray-400 truncate">{trade.strategy}</span>
                </div>

                {/* Score */}
                <div className="w-12 text-center shrink-0">
                  <ScoreBadge score={trade.score} />
                </div>

                {/* Decision */}
                <div className="w-16 shrink-0">
                  <DecisionBadge decision={trade.decision} />
                </div>

                {/* Result */}
                <div className="w-20 shrink-0">
                  <ResultBadge result={trade.result} />
                </div>

                {/* PnL */}
                <div className="w-20 text-right shrink-0">
                  {trade.pnl !== null
                    ? <span className={`text-sm font-medium ${trade.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {trade.pnl >= 0 ? '+' : ''}{trade.pnl}
                      </span>
                    : <button
                        onClick={(e) => { e.stopPropagation(); setLogModal(trade); }}
                        className="text-xs px-2 py-1 bg-amber-500/10 text-amber-400 rounded hover:bg-amber-500/20 transition-all"
                      >
                        + Result
                      </button>
                  }
                </div>

                <ChevronDown size={14} className={`text-gray-500 transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="border-t border-[#1e1e2e] px-4 py-4 bg-[#0d0d14] space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div><span className="text-gray-500">BAIS:</span> <span className="text-gray-300 ml-1">{trade.bais}</span></div>
                    <div><span className="text-gray-500">Confluences:</span> <span className="text-gray-300 ml-1">{trade.confluences}</span></div>
                    <div><span className="text-gray-500">Mental Focus:</span> <span className={`ml-1 ${trade.mentalFocus >= 20 ? 'text-emerald-400' : 'text-red-400'}`}>{trade.mentalFocus}</span></div>
                    <div><span className="text-gray-500">Risk:</span> <span className="text-gray-300 ml-1">{trade.riskPercent}%</span></div>
                    <div><span className="text-gray-500">Buy L/Sell H:</span> <span className="text-gray-300 ml-1">{trade.buyLowSellHigh}</span></div>
                    <div><span className="text-gray-500">Bias Align:</span> <span className="text-gray-300 ml-1">{trade.biasAlignment}</span></div>
                    <div><span className="text-gray-500">Trend:</span> <span className="text-gray-300 ml-1">{trade.trend}</span></div>
                    {trade.rrRatio !== null && <div><span className="text-gray-500">R:R:</span> <span className="text-gray-300 ml-1">{trade.rrRatio}R</span></div>}
                  </div>
                  {trade.notes && (
                    <div className="bg-[#111118] rounded-lg px-3 py-2.5">
                      <p className="text-xs text-gray-400">{trade.notes}</p>
                    </div>
                  )}
                  {trade.pnl === null && (
                    <button
                      onClick={() => setLogModal(trade)}
                      className="text-sm px-4 py-2 bg-amber-500 text-black rounded-xl font-medium hover:bg-amber-400 transition-all"
                    >
                      + Log Result
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {logModal && (
        <LogResultModal
          trade={logModal}
          onSave={(result, pnl, rr) => onUpdateResult(logModal.id, result, pnl, rr)}
          onClose={() => setLogModal(null)}
        />
      )}
    </div>
  );
}
