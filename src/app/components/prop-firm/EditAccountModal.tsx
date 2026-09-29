import React, { useState } from 'react';
import { X, Edit3, Trash2, RefreshCw, Award } from 'lucide-react';
import type { Account, AccountStatus, PropPhase } from '../../data/accountTypes';

interface EditAccountModalProps {
  account: Account;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Account>) => void;
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
  const [name, setName] = useState(account.name);
  const [accountNumber, setAccountNumber] = useState(account.accountNumber);
  const [provider, setProvider] = useState(account.provider);
  const [currentBalance, setCurrentBalance] = useState(account.currentBalance);
  const [status, setStatus] = useState<AccountStatus>(account.status);
  const [serverType, setServerType] = useState(account.serverType || '');
  const [phase, setPhase] = useState<PropPhase>(account.propDetails?.phase || 'Phase 1');
  const [dailyDrawdownLimitPct, setDailyDrawdownLimitPct] = useState(account.propDetails?.dailyDrawdownLimitPct || 5);
  const [maxDrawdownLimitPct, setMaxDrawdownLimitPct] = useState(account.propDetails?.maxDrawdownLimitPct || 10);
  const [profitTargetPct, setProfitTargetPct] = useState(account.propDetails?.profitTargetPct || 8);
  const [notes, setNotes] = useState(account.notes || '');

  if (!isOpen) return null;

  const isProp = account.category.startsWith('prop');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedPropDetails = isProp ? {
      ...(account.propDetails || {
        modelType: 'Evaluation',
        phase: 'Phase 1',
        profitTargetPct: 8,
        dailyDrawdownLimitPct: 5,
        maxDrawdownLimitPct: 10,
      }),
      phase,
      profitTargetPct: Number(profitTargetPct),
      dailyDrawdownLimitPct: Number(dailyDrawdownLimitPct),
      maxDrawdownLimitPct: Number(maxDrawdownLimitPct),
    } : undefined;

    onUpdate(account.id, {
      name,
      accountNumber,
      provider,
      serverType,
      currentBalance: Number(currentBalance),
      currentEquity: Number(currentBalance),
      status,
      propDetails: updatedPropDetails,
      isBreached: status === 'Breached' || status === 'Not Passed',
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
              <h3 className="text-base font-bold text-slate-900">Manage Account</h3>
              <p className="text-xs text-slate-500 font-medium">{account.name} ({account.accountNumber})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick Phase & Reset Actions */}
        <div className="flex flex-wrap items-center gap-2 mb-5 p-3 rounded-xl bg-slate-50 border border-slate-200">
          {isProp && (
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
          )}

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
              if (window.confirm('Delete this account permanently?')) {
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
                Account Name / Label
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
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
                Account Status
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as AccountStatus)}
                className="w-full rounded-xl px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:border-blue-600 outline-none"
              >
                <option value="Ongoing">Ongoing</option>
                <option value="Active">Active</option>
                <option value="Passed">Passed</option>
                <option value="Not Passed">Not Passed</option>
                <option value="Breached">Breached</option>
              </select>
            </div>
          </div>

          {isProp && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700 block">
                Prop Risk Rules & Phase
              </span>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Phase
                  </label>
                  <select
                    value={phase}
                    onChange={e => setPhase(e.target.value as PropPhase)}
                    className="w-full rounded-lg px-2.5 py-2 text-xs bg-white border border-slate-200 text-slate-900 font-bold"
                  >
                    <option value="Phase 1">Phase 1</option>
                    <option value="Phase 2">Phase 2</option>
                    <option value="Master">Master</option>
                    <option value="Funded">Funded</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Profit Target (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={profitTargetPct}
                    onChange={e => setProfitTargetPct(Number(e.target.value))}
                    className="w-full rounded-lg px-2.5 py-2 text-xs bg-white border border-slate-200 text-blue-600 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Daily DD (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={dailyDrawdownLimitPct}
                    onChange={e => setDailyDrawdownLimitPct(Number(e.target.value))}
                    className="w-full rounded-lg px-2.5 py-2 text-xs bg-white border border-slate-200 text-blue-600 font-bold"
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-700 font-bold mb-1.5">
              Server / Platform Details
            </label>
            <input
              type="text"
              value={serverType}
              onChange={e => setServerType(e.target.value)}
              placeholder="e.g. Raw Spread Demo / Live Server"
              className="w-full rounded-xl px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:border-blue-600 outline-none"
            />
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
