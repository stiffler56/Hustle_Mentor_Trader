import React, { useState } from 'react';
import { X, Building2, Check } from 'lucide-react';
import { PROP_FIRM_PRESETS, type PropAccount, type AccountPhase } from '../../data/accountTypes';

interface NewAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAccount: (data: Omit<PropAccount, 'id' | 'createdAt'>) => void;
}

export const NewAccountModal: React.FC<NewAccountModalProps> = ({
  isOpen,
  onClose,
  onAddAccount,
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState('fundingpips-2step');
  const [firmName, setFirmName] = useState('FundingPips');
  const [modelType, setModelType] = useState('2-Step Standard');
  const [accountSize, setAccountSize] = useState<number>(50000);
  const [phase, setPhase] = useState<AccountPhase>('Phase 1');
  const [profitTargetPct, setProfitTargetPct] = useState<number>(8);
  const [dailyDrawdownLimitPct, setDailyDrawdownLimitPct] = useState<number>(5);
  const [maxDrawdownLimitPct, setMaxDrawdownLimitPct] = useState<number>(10);
  const [platform, setPlatform] = useState('cTrader');
  const [accountNumber, setAccountNumber] = useState(() => `#${Math.floor(10000000 + Math.random() * 90000000)}`);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handlePresetSelect = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = PROP_FIRM_PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    setFirmName(preset.name);
    setModelType(preset.modelType);
    setAccountSize(preset.defaultSizes[2] || preset.defaultSizes[0] || 50000);
    setPlatform(preset.platformOptions[0] || 'cTrader');

    const firstPhase = preset.phases[0];
    if (firstPhase) {
      setPhase(firstPhase.phase);
      setProfitTargetPct(firstPhase.profitTargetPct);
      setDailyDrawdownLimitPct(firstPhase.dailyDrawdownLimitPct);
      setMaxDrawdownLimitPct(firstPhase.maxDrawdownLimitPct);
    }
  };

  const handlePhaseChange = (newPhase: AccountPhase) => {
    setPhase(newPhase);
    const preset = PROP_FIRM_PRESETS.find(p => p.id === selectedPresetId);
    const phaseConfig = preset?.phases.find(p => p.phase === newPhase);

    if (phaseConfig) {
      setProfitTargetPct(phaseConfig.profitTargetPct);
      setDailyDrawdownLimitPct(phaseConfig.dailyDrawdownLimitPct);
      setMaxDrawdownLimitPct(phaseConfig.maxDrawdownLimitPct);
    } else if (newPhase === 'Phase 1') {
      setProfitTargetPct(8);
    } else if (newPhase === 'Phase 2') {
      setProfitTargetPct(5);
    } else if (newPhase === 'Master') {
      setProfitTargetPct(0);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onAddAccount({
      accountNumber: accountNumber.startsWith('#') ? accountNumber : `#${accountNumber}`,
      firmName: firmName.trim() || 'Custom Firm',
      accountSize,
      initialBalance: accountSize,
      currentBalance: accountSize,
      modelType,
      phase,
      status: 'Ongoing',
      profitTargetPct: phase === 'Master' ? 0 : profitTargetPct,
      currentProfitPct: 0,
      pnl: 0,
      dailyDrawdownLimitPct,
      maxDrawdownLimitPct,
      currentDailyLoss: 0,
      currentMaxDrawdown: 0,
      platform,
      notes,
    });

    onClose();
  };

  const currentPreset = PROP_FIRM_PRESETS.find(p => p.id === selectedPresetId);
  const sizeOptions = currentPreset?.defaultSizes || [5000, 10000, 25000, 50000, 100000, 200000];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div
        className="w-full max-w-xl rounded-2xl p-6 relative my-8 bg-white border border-slate-200"
        style={{
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 border border-blue-200">
              <Building2 size={20} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Add Account</h3>
              <p className="text-xs text-slate-500 font-medium">Create a new evaluation challenge or funded account</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Preset Picker */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-700 font-bold mb-2">
              Firm Template
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PROP_FIRM_PRESETS.map(preset => {
                const isSelected = selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handlePresetSelect(preset.id)}
                    className="p-3 rounded-xl text-left transition-all relative overflow-hidden"
                    style={{
                      background: isSelected ? '#eff6ff' : '#f8fafc',
                      border: `1.5px solid ${isSelected ? '#2563eb' : '#e2e8f0'}`,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{preset.name}</span>
                      {isSelected && <Check size={14} className="text-blue-600 font-bold" />}
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium block mt-0.5 truncate">
                      {preset.modelType}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Account Size */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-700 font-bold mb-2">
              Account Capital
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {sizeOptions.map(sz => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setAccountSize(sz)}
                  className="py-2.5 rounded-xl text-xs font-bold transition-all text-center"
                  style={{
                    background: accountSize === sz ? '#2563eb' : '#f8fafc',
                    color: accountSize === sz ? '#ffffff' : '#334155',
                    border: `1.5px solid ${accountSize === sz ? '#2563eb' : '#e2e8f0'}`,
                  }}
                >
                  ${(sz / 1000).toFixed(0)}k
                </button>
              ))}
            </div>
          </div>

          {/* Phase & Account # */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-700 font-bold mb-1.5">
                Evaluation Phase
              </label>
              <select
                value={phase}
                onChange={e => handlePhaseChange(e.target.value as AccountPhase)}
                className="w-full rounded-xl px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 text-slate-800 font-semibold focus:border-blue-600 outline-none"
              >
                <option value="Phase 1">Phase 1 (Student / Step 1)</option>
                <option value="Phase 2">Phase 2 (Practitioner / Step 2)</option>
                <option value="Master">Master (Funded Account)</option>
                <option value="Instant">Instant Funding</option>
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-700 font-bold mb-1.5">
                Account Login # / Label
              </label>
              <input
                type="text"
                required
                value={accountNumber}
                onChange={e => setAccountNumber(e.target.value)}
                placeholder="#20823275"
                className="w-full rounded-xl px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 text-slate-800 font-mono font-bold focus:border-blue-600 outline-none"
              />
            </div>
          </div>

          {/* Objectives Parameters */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 block">
              Risk Rules & Objectives
            </span>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Profit Target (%)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={phase === 'Master' ? 0 : profitTargetPct}
                  disabled={phase === 'Master'}
                  onChange={e => setProfitTargetPct(Number(e.target.value))}
                  className="w-full rounded-lg px-2.5 py-2 text-xs bg-white border border-slate-200 text-blue-600 font-bold disabled:opacity-40"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Daily DD Limit (%)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={dailyDrawdownLimitPct}
                  onChange={e => setDailyDrawdownLimitPct(Number(e.target.value))}
                  className="w-full rounded-lg px-2.5 py-2 text-xs bg-white border border-slate-200 text-blue-600 font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Max DD Limit (%)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={maxDrawdownLimitPct}
                  onChange={e => setMaxDrawdownLimitPct(Number(e.target.value))}
                  className="w-full rounded-lg px-2.5 py-2 text-xs bg-white border border-slate-200 text-blue-600 font-bold"
                />
              </div>
            </div>
          </div>

          {/* Platform & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-700 font-bold mb-1.5">
                Trading Platform
              </label>
              <select
                value={platform}
                onChange={e => setPlatform(e.target.value)}
                className="w-full rounded-xl px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 text-slate-800 font-semibold focus:border-blue-600 outline-none"
              >
                <option value="cTrader">cTrader</option>
                <option value="Match-Trader">Match-Trader</option>
                <option value="MetaTrader 5">MetaTrader 5</option>
                <option value="TradeLocker">TradeLocker</option>
                <option value="DXtrade">DXtrade</option>
                <option value="Custom">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-700 font-bold mb-1.5">
                Notes
              </label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. 85% profit split"
                className="w-full rounded-xl px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 text-slate-800 font-medium focus:border-blue-600 outline-none"
              />
            </div>
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
              Create Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
