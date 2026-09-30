import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { Account } from '../../data/accountTypes';
import type { Trade, Session, OrderType, Strategy, TradeResult } from '../../data/types';
import { useTradesContext } from '../../data/TradesContext';

interface QuickTradeModalProps {
  account: Account;
  isOpen: boolean;
  onClose: () => void;
}

export const QuickTradeModal: React.FC<QuickTradeModalProps> = ({
  account,
  isOpen,
  onClose,
}) => {
  const { addTrade } = useTradesContext();

  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [pair, setPair] = useState('XAUUSD');
  const [orderType, setOrderType] = useState<OrderType>('Buy');
  const [session, setSession] = useState<Session>('New York');
  const [strategy, setStrategy] = useState<Strategy>('D1/H4 FVG');
  const [result, setResult] = useState<TradeResult>('WIN');
  const [pnl, setPnl] = useState<number>(450);
  const [rrRatio, setRrRatio] = useState<number>(2.5);
  const [score, setScore] = useState<number>(22);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const signedPnl = result === 'LOSS' ? -Math.abs(pnl) : result === 'BE' ? 0 : Math.abs(pnl);

    const newTrade: Trade = {
      id: `trade-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      date,
      pair,
      trend: orderType === 'Buy' ? 'Bullish' : 'Bearish',
      orderType,
      session,
      strategy,
      bais: 'D1 FVG + 15m MSS',
      mentalFocus: 25,
      confluences: 4,
      buyLowSellHigh: 5,
      bias: 5,
      risk: 1,
      rrRatio: Number(rrRatio),
      score: Number(score),
      decision: score >= 18 ? 'TAKE' : 'WAIT',
      result,
      pnl: signedPnl,
      notes,
      status: 'CLOSED',
      createdAt: new Date().toISOString(),
      closedAt: new Date().toISOString(),
      accountId: account.id,
    };

    addTrade(newTrade);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div
        className="w-full max-w-md rounded-2xl p-6 relative my-8 bg-white border border-slate-200"
        style={{
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
        }}
      >
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-200">
          <div>
            <h3 className="text-base font-bold text-slate-900">Log Account Trade</h3>
            <p className="text-xs text-slate-500 font-medium">
              Assigned to: <span className="text-blue-600 font-bold">{account.name} ({account.accountNumber})</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-700 font-bold mb-1.5">
                Instrument Pair
              </label>
              <input
                type="text"
                required
                value={pair}
                onChange={e => setPair(e.target.value.toUpperCase())}
                placeholder="XAUUSD"
                className="w-full rounded-xl px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 text-slate-900 font-bold uppercase focus:border-blue-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-700 font-bold mb-1.5">
                Order Direction
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOrderType('Buy')}
                  className="py-2 rounded-xl text-xs font-bold transition-all"
                  style={{
                    background: orderType === 'Buy' ? '#f0fdf4' : '#f8fafc',
                    color: orderType === 'Buy' ? '#16a34a' : '#64748b',
                    border: `1.5px solid ${orderType === 'Buy' ? '#bbf7d0' : '#e2e8f0'}`,
                  }}
                >
                  Buy
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType('Sell')}
                  className="py-2 rounded-xl text-xs font-bold transition-all"
                  style={{
                    background: orderType === 'Sell' ? '#fef2f2' : '#f8fafc',
                    color: orderType === 'Sell' ? '#dc2626' : '#64748b',
                    border: `1.5px solid ${orderType === 'Sell' ? '#fecaca' : '#e2e8f0'}`,
                  }}
                >
                  Sell
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-700 font-bold mb-1.5">
                Outcome Result
              </label>
              <select
                value={result}
                onChange={e => setResult(e.target.value as TradeResult)}
                className="w-full rounded-xl px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:border-blue-600 outline-none"
              >
                <option value="WIN">WIN (Profit)</option>
                <option value="LOSS">LOSS (Drawdown)</option>
                <option value="BE">BE (Break Even)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-700 font-bold mb-1.5">
                P&L Amount ($)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={pnl}
                onChange={e => setPnl(Math.abs(Number(e.target.value)))}
                className="w-full rounded-xl px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 text-blue-600 font-mono font-bold focus:border-blue-600 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-700 font-bold mb-1.5">
                Session
              </label>
              <select
                value={session}
                onChange={e => setSession(e.target.value as Session)}
                className="w-full rounded-xl px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:border-blue-600 outline-none"
              >
                <option value="New York">New York</option>
                <option value="London">London</option>
                <option value="Tokyo">Tokyo</option>
                <option value="Sydney">Sydney</option>
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-700 font-bold mb-1.5">
                Risk-to-Reward (R:R)
              </label>
              <input
                type="number"
                step="0.1"
                value={rrRatio}
                onChange={e => setRrRatio(Number(e.target.value))}
                className="w-full rounded-xl px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 text-blue-600 font-mono font-bold focus:border-blue-600 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-700 font-bold mb-1.5">
              Strategy Setup
            </label>
            <select
              value={strategy}
              onChange={e => setStrategy(e.target.value as Strategy)}
              className="w-full rounded-xl px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:border-blue-600 outline-none"
            >
              <option value="D1/H4 FVG">D1/H4 FVG</option>
              <option value="Liquidity">Liquidity Sweep</option>
              <option value="Order Block">Order Block</option>
              <option value="ICT Concept">ICT Concept</option>
              <option value="Support/Resistance">Support/Resistance</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-700 font-bold mb-1.5">
              Trade Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Clean FVG entry"
              className="w-full rounded-xl px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:border-blue-600 outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm"
            >
              Log & Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
