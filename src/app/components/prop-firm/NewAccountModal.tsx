import React, { useState } from 'react';
import { X, Building2, Check, ShieldCheck, Globe } from 'lucide-react';
import {
  PROVIDER_PRESETS,
  type Account,
  type AccountCategory,
  type AccountStatus,
  type TradingPlatform,
  type PropPhase,
} from '../../data/accountTypes';

interface NewAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAccount: (data: Omit<Account, 'id' | 'startDate'>) => void;
}

export const NewAccountModal: React.FC<NewAccountModalProps> = ({
  isOpen,
  onClose,
  onAddAccount,
}) => {
  const [category, setCategory] = useState<AccountCategory>('prop_evaluation');
  const [selectedPresetId, setSelectedPresetId] = useState('fundingpips-2step');
  const [name, setName] = useState('FundingPips $50k Evaluation');
  const [provider, setProvider] = useState('FundingPips');
  const [platform, setPlatform] = useState<TradingPlatform>('cTrader');
  const [serverType, setServerType] = useState('FundingPips-Demo');
  const [initialBalance, setInitialBalance] = useState<number>(50000);
  const [phase, setPhase] = useState<PropPhase>('Phase 1');
  const [modelType, setModelType] = useState('2-Step Evaluation');
  const [profitTargetPct, setProfitTargetPct] = useState<number>(8);
  const [dailyDrawdownLimitPct, setDailyDrawdownLimitPct] = useState<number>(5);
  const [maxDrawdownLimitPct, setMaxDrawdownLimitPct] = useState<number>(10);
  const [minTradingDays, setMinTradingDays] = useState<number>(0);
  const [accountNumber, setAccountNumber] = useState(() => `#${Math.floor(10000000 + Math.random() * 90000000)}`);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleCategoryChange = (newCat: AccountCategory) => {
    setCategory(newCat);
    if (newCat === 'prop_evaluation') {
      const preset = PROVIDER_PRESETS.find(p => p.id === 'fundingpips-2step');
      if (preset) applyPreset(preset, newCat);
    } else if (newCat === 'prop_funded') {
      const preset = PROVIDER_PRESETS.find(p => p.id === 'fundingpips-2step');
      if (preset) {
        applyPreset(preset, newCat);
        setPhase('Master');
        setProfitTargetPct(0);
      }
    } else if (newCat === 'broker_live') {
      const preset = PROVIDER_PRESETS.find(p => p.id === 'ic-markets-live');
      if (preset) applyPreset(preset, newCat);
    } else if (newCat === 'broker_demo') {
      const preset = PROVIDER_PRESETS.find(p => p.id === 'custom-account');
      if (preset) applyPreset(preset, newCat);
    }
  };

  const applyPreset = (preset: typeof PROVIDER_PRESETS[0], catOverride?: AccountCategory) => {
    setSelectedPresetId(preset.id);
    const cat = catOverride || preset.category;
    setCategory(cat);
    setProvider(preset.name);
    setPlatform(preset.defaultPlatform);
    setServerType(preset.serverTypes[0] || 'Standard');
    const defaultSz = preset.defaultSizes[2] || preset.defaultSizes[0] || 50000;
    setInitialBalance(defaultSz);
    setName(`${preset.name} $${(defaultSz / 1000).toFixed(0)}k ${cat.startsWith('prop') ? 'Evaluation' : 'Account'}`);

    if (preset.propConfig) {
      setModelType(preset.propConfig.modelType);
      const firstPhase = preset.propConfig.phases[0];
      if (firstPhase) {
        setPhase(firstPhase.phase);
        setProfitTargetPct(firstPhase.profitTargetPct);
        setDailyDrawdownLimitPct(firstPhase.dailyDrawdownLimitPct);
        setMaxDrawdownLimitPct(firstPhase.maxDrawdownLimitPct);
        setMinTradingDays(firstPhase.minTradingDays);
      }
    }
  };

  const handlePresetSelect = (presetId: string) => {
    const preset = PROVIDER_PRESETS.find(p => p.id === presetId);
    if (preset) applyPreset(preset);
  };

  const handlePhaseChange = (newPhase: PropPhase) => {
    setPhase(newPhase);
    const preset = PROVIDER_PRESETS.find(p => p.id === selectedPresetId);
    const phaseConfig = preset?.propConfig?.phases.find(p => p.phase === newPhase);

    if (phaseConfig) {
      setProfitTargetPct(phaseConfig.profitTargetPct);
      setDailyDrawdownLimitPct(phaseConfig.dailyDrawdownLimitPct);
      setMaxDrawdownLimitPct(phaseConfig.maxDrawdownLimitPct);
      setMinTradingDays(phaseConfig.minTradingDays);
    } else if (newPhase === 'Phase 1') {
      setProfitTargetPct(8);
      setDailyDrawdownLimitPct(5);
      setMaxDrawdownLimitPct(10);
    } else if (newPhase === 'Phase 2') {
      setProfitTargetPct(5);
      setDailyDrawdownLimitPct(5);
      setMaxDrawdownLimitPct(10);
    } else if (newPhase === 'Master' || newPhase === 'Funded') {
      setProfitTargetPct(0);
      setDailyDrawdownLimitPct(5);
      setMaxDrawdownLimitPct(10);
    }
  };

  const handleSizeSelect = (sz: number) => {
    setInitialBalance(sz);
    setName(`${provider} $${(sz / 1000).toFixed(0)}k ${category.startsWith('prop') ? 'Evaluation' : 'Account'}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const isProp = category.startsWith('prop');
    const status: AccountStatus = isProp ? 'Ongoing' : 'Active';

    onAddAccount({
      accountNumber: accountNumber.startsWith('#') ? accountNumber : `#${accountNumber}`,
      name: name.trim() || `${provider} Account`,
      category,
      provider: provider.trim() || 'Custom',
      platform,
      serverType,
      initialBalance,
      currentBalance: initialBalance,
      currentEquity: initialBalance,
      currency: 'USD',
      status,
      todayPnl: 0,
      totalPnl: 0,
      consistencyScore: 2.08,
      consistencyMetrics: {
        riskReward: 2.2,
        stopLossUsagePct: 100,
        winRate: 65,
      },
      propDetails: isProp ? {
        modelType,
        phase,
        profitTargetPct: phase === 'Master' || phase === 'Funded' ? 0 : profitTargetPct,
        dailyDrawdownLimitPct,
        maxDrawdownLimitPct,
        minTradingDays,
        tradingDaysLogged: 0,
        consistencyRulePct: 33,
        profitSplitPct: 85,
        currentDailyLoss: 0,
        currentMaxDrawdown: 0,
      } : undefined,
      notes,
      isBreached: false,
    });

    onClose();
  };

  const isProp = category.startsWith('prop');
  const currentPreset = PROVIDER_PRESETS.find(p => p.id === selectedPresetId);
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
              <p className="text-xs text-slate-500 font-medium">Create a new evaluation challenge, funded account, or personal broker account</p>
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
          {/* Account Category Selector */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-700 font-bold mb-2">
              Account Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'prop_evaluation', label: 'Prop Evaluation', icon: ShieldCheck },
                { id: 'prop_funded', label: 'Prop Funded', icon: Building2 },
                { id: 'broker_live', label: 'Broker Live', icon: Globe },
                { id: 'broker_demo', label: 'Broker Demo', icon: Globe },
              ].map(cat => {
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategoryChange(cat.id as AccountCategory)}
                    className="p-2.5 rounded-xl text-center transition-all flex flex-col items-center justify-center gap-1"
                    style={{
                      background: isSelected ? '#eff6ff' : '#f8fafc',
                      color: isSelected ? '#2563eb' : '#475569',
                      border: `1.5px solid ${isSelected ? '#2563eb' : '#e2e8f0'}`,
                      fontWeight: isSelected ? 700 : 600,
                    }}
                  >
                    <cat.icon size={15} />
                    <span className="text-[11px] leading-tight">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preset Picker */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-700 font-bold mb-2">
              Template Preset
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PROVIDER_PRESETS.map(preset => {
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
                      {preset.defaultPlatform} • {preset.serverTypes[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Account Capital */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-700 font-bold mb-2">
              Account Capital / Starting Balance
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {sizeOptions.map(sz => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => handleSizeSelect(sz)}
                  className="py-2.5 rounded-xl text-xs font-bold transition-all text-center"
                  style={{
                    background: initialBalance === sz ? '#2563eb' : '#f8fafc',
                    color: initialBalance === sz ? '#ffffff' : '#334155',
                    border: `1.5px solid ${initialBalance === sz ? '#2563eb' : '#e2e8f0'}`,
                  }}
                >
                  ${(sz / 1000).toFixed(0)}k
                </button>
              ))}
            </div>
          </div>

          {/* Account Name & Login # */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-700 font-bold mb-1.5">
                Account Label / Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="FundingPips $50k Evaluation"
                className="w-full rounded-xl px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:border-blue-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-700 font-bold mb-1.5">
                Account Login # / ID
              </label>
              <input
                type="text"
                required
                value={accountNumber}
                onChange={e => setAccountNumber(e.target.value)}
                placeholder="#20823275"
                className="w-full rounded-xl px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 text-slate-900 font-mono font-bold focus:border-blue-600 outline-none"
              />
            </div>
          </div>

          {/* Prop Firm Specific Rules */}
          {isProp && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                  Prop Evaluation Rules
                </span>
                <select
                  value={phase}
                  onChange={e => handlePhaseChange(e.target.value as PropPhase)}
                  className="rounded-lg px-2 py-1 text-xs bg-white border border-slate-200 text-blue-700 font-bold outline-none"
                >
                  <option value="Phase 1">Phase 1</option>
                  <option value="Phase 2">Phase 2</option>
                  <option value="Master">Master / Funded</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Profit Target (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={phase === 'Master' || phase === 'Funded' ? 0 : profitTargetPct}
                    disabled={phase === 'Master' || phase === 'Funded'}
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
          )}

          {/* Platform & Server */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-700 font-bold mb-1.5">
                Trading Platform
              </label>
              <select
                value={platform}
                onChange={e => setPlatform(e.target.value as TradingPlatform)}
                className="w-full rounded-xl px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 text-slate-800 font-semibold focus:border-blue-600 outline-none"
              >
                <option value="cTrader">cTrader</option>
                <option value="MetaTrader 5">MetaTrader 5</option>
                <option value="MetaTrader 4">MetaTrader 4</option>
                <option value="TradeLocker">TradeLocker</option>
                <option value="TradingView">TradingView</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-700 font-bold mb-1.5">
                Server / Execution Type
              </label>
              <input
                type="text"
                value={serverType}
                onChange={e => setServerType(e.target.value)}
                placeholder="Raw Spread / Live Server"
                className="w-full rounded-xl px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 text-slate-800 font-semibold focus:border-blue-600 outline-none"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-700 font-bold mb-1.5">
              Account Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Primary evaluation account on cTrader"
              className="w-full rounded-xl px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 text-slate-800 font-medium focus:border-blue-600 outline-none"
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
              Create Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
