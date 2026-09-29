import React, { useState } from 'react';
import { X, Edit3, Trash2, RefreshCw, Award } from 'lucide-react';
import type { PropAccount, AccountPhase, AccountStatus } from '../../data/accountTypes';

interface EditAccountModalProps {
  account: PropAccount;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<PropAccount>) => void;
  onDelete: (id: string) => void;
  onReset: (id: string) => void;
  onAdvancePhase: (id: string) => void;
}

export const EditAccountModal: React.FC<EditAccountModalProps> = ({
  account,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  onReset,
  onAdvancePhase,
}) => {
  const [accountNumber, setAccountNumber] = useState(account.accountNumber);
  const [firmName, setFirmName] = useState(account.firmName);
  const [currentBalance, setCurrentBalance] = useState(account.currentBalance);
  const [phase, setPhase] = useState<AccountPhase>(account.phase);
  const [status, setStatus] = useState<AccountStatus>(account.status);
  const [dailyDrawdownLimitPct, setDailyDrawdownLimitPct] = useState(account.dailyDrawdownLimitPct);
  const [maxDrawdownLimitPct, setMaxDrawdownLimitPct] = useState(account.maxDrawdownLimitPct);
  const [profitTargetPct, setProfitTargetPct] = useState(account.profitTargetPct);
  const [currentDailyLoss, setCurrentDailyLoss] = useState(account.currentDailyLoss);
  const [currentMaxDrawdown, setCurrentMaxDrawdown] = useState(account.currentMaxDrawdown);
  const [notes, setNotes] = useState(account.notes || '');

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(account.id, {
      accountNumber,
      firmName,
      currentBalance: Number(currentBalance),
      phase,
      status,
      dailyDrawdownLimitPct: Number(dailyDrawdownLimitPct),
      maxDrawdownLimitPct: Number(maxDrawdownLimitPct),
      profitTargetPct: Number(profitTargetPct),
      currentDailyLoss: Number(currentDailyLoss),
      currentMaxDrawdown: Number(currentMaxDrawdown),
      isBreached: status === 'Not Passed',
      notes,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div
        className="w-full max-w-lg rounded-2xl p-6 relative my-8 bg-white border border-slate-200"
        style={{
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 border border-blue-200">
              <Edit3 size={18} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Manage & Rename Account</h3>
              <p className="text-xs text-slate-500 font-medium">{account.firmName} ({account.accountNumber})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick Phase Actions */}
        <div className="flex flex-wrap items-center gap-2 mb-5 p-3 rounded-xl bg-slate-50 border border-slate-200">
          <button
            type="button"
            onClick={() => {
              onAdvancePhase(account.id);
              onClose();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
          >
            <Award size={13} />
            <span>Advance Phase</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Reset this account balance and drawdown back to initial?')) {
                onReset(account.id);
                onClose();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
          >
            <RefreshCw size={13} />
            <span>Reset Balance</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Delete this prop account?')) {
                onDelete(account.id);
                onClose();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 ml-auto"
          >
            <Trash2 size={13} />
            <span>Delete</span>
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-700 font-bold mb-1.5">
                Firm / Label Name
              </label>
              <input
                type="text"
                required
                value={firmName}
                onChange={e => setFirmName(e.target.value)}
                className="w-full rounded-xl px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:border-blue-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-700 font-bold mb-1.5">
                Account Number #
              </label>
              <input
                type="text"
                required
                value={accountNumber}
                onChange={e => setAccountNumber(e.target.value)}
                className="w-full rounded-xl px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 text-slate-900 font-mono font-bold focus:border-blue-600 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-700 font-bold mb-1.5">
                Current Balance ($)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={currentBalance}
                onChange={e => setCurrentBalance(Number(e.target.value))}
                className="w-full rounded-xl px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 text-blue-600 font-mono font-bold focus:border-blue-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-700 font-bold mb-1.5">
                Evaluation Phase
              </label>
              <select
                value={phase}
                onChange={e => setPhase(e.target.value as AccountPhase)}
                className="w-full rounded-xl px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:border-blue-600 outline-none"
              >
                <option value="Phase 1">Phase 1</option>
                <option value="Phase 2">Phase 2</option>
                <option value="Master">Master</option>
                <option value="Instant">Instant</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-700 font-bold mb-1.5">
                Account Status
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as AccountStatus)}
                className="w-full rounded-xl px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:border-blue-600 outline-none"
              >
                <option value="Ongoing">Ongoing</option>
                <option value="Passed">Passed</option>
                <option value="Not Passed">Not Passed / Breached</option>
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-700 font-bold mb-1.5">
                Profit Target (%)
              </label>
              <input
                type="number"
                step="0.5"
                value={profitTargetPct}
                onChange={e => setProfitTargetPct(Number(e.target.value))}
                className="w-full rounded-xl px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 text-blue-600 font-bold focus:border-blue-600 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-700 font-bold mb-1.5">
                Today's Loss ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={currentDailyLoss}
                onChange={e => setCurrentDailyLoss(Number(e.target.value))}
                className="w-full rounded-xl px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 text-slate-900 font-mono font-bold focus:border-blue-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-700 font-bold mb-1.5">
                Max DD ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={currentMaxDrawdown}
                onChange={e => setCurrentMaxDrawdown(Number(e.target.value))}
                className="w-full rounded-xl px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 text-slate-900 font-mono font-bold focus:border-blue-600 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-700 font-bold mb-1.5">
              Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Notes..."
              className="w-full rounded-xl px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:border-blue-600 outline-none"
            />
          </div>

          {/* Action buttons */}
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
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
