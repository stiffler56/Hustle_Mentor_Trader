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
  const [investorPassword, setInvestorPassword] = useState('');
  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState(true);

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

    const connection = investorPassword.trim() ? {
      platform: platform === 'MetaTrader 4' ? ('MT4' as const) : ('MT5' as const),
      login: accountNumber.replace('#', '').trim(),
      investorPassword: investorPassword.trim(),
      server: serverType.trim() || 'ICMarketsSC-Live01',
      syncStatus: 'connected' as const,
      autoSyncIntervalSec: 30,
    } : undefined;

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
      connection,
      isAutoSyncEnabled: Boolean(connection && isAutoSyncEnabled),
    });

    onClose();
  };

  const isProp = category.startsWith('prop');
  const currentPreset = PROVIDER_PRESETS.find(p => p.id === selectedPresetId);
  const sizeOptions = currentPreset?.defaultSizes || [5000, 10000, 25000, 50000, 100000, 200000];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl rounded-2xl p-6 relative my-8 bg-[#131418] border border-[#1E2026] text-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#1E2026]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#181A20] border border-[#1E2026] text-[#6366F1]">
              <Building2 size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Add Account</h3>
              <p className="text-xs text-[#8E95A5] font-medium">Create a new evaluation challenge, funded account, or personal broker account</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#8E95A5] hover:text-white p-1.5 rounded-lg hover:bg-[#181A20] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Account Category Selector */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#8E95A5] font-bold mb-2">
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
                    className="p-2.5 rounded-xl text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer"
                    style={{
                      background: isSelected ? '#181A20' : '#0F1013',
                      color: isSelected ? '#FFFFFF' : '#8E95A5',
                      border: `1.5px solid ${isSelected ? '#6366F1' : '#1E2026'}`,
                      fontWeight: isSelected ? 700 : 500,
                    }}
                  >
                    <cat.icon size={15} className={isSelected ? 'text-[#6366F1]' : 'text-[#8E95A5]'} />
                    <span className="text-[11px] leading-tight">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preset Picker */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#8E95A5] font-bold mb-2">
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
                    className="p-3 rounded-xl text-left transition-all relative overflow-hidden cursor-pointer"
                    style={{
                      background: isSelected ? '#181A20' : '#0F1013',
                      border: `1.5px solid ${isSelected ? '#6366F1' : '#1E2026'}`,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{preset.name}</span>
                      {isSelected && <Check size={14} className="text-[#6366F1] font-bold" />}
                    </div>
                    <span className="text-[11px] text-[#8E95A5] font-medium block mt-0.5 truncate">
                      {preset.defaultPlatform} • {preset.serverTypes[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Account Capital */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#8E95A5] font-bold mb-2">
              Account Capital / Starting Balance
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {sizeOptions.map(sz => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => handleSizeSelect(sz)}
                  className="py-2.5 rounded-xl text-xs font-bold transition-all text-center cursor-pointer"
                  style={{
                    background: initialBalance === sz ? '#6366F1' : '#0F1013',
                    color: '#ffffff',
                    border: `1.5px solid ${initialBalance === sz ? '#6366F1' : '#1E2026'}`,
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
              <label className="block text-xs uppercase tracking-wider text-[#8E95A5] font-bold mb-1.5">
                Account Label / Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="FundingPips $50k Evaluation"
                className="w-full rounded-xl px-3.5 py-2.5 text-xs bg-[#0F1013] border border-[#1E2026] text-white font-bold focus:border-[#6366F1] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#8E95A5] font-bold mb-1.5">
                Account Login # / ID
              </label>
              <input
                type="text"
                required
                value={accountNumber}
                onChange={e => setAccountNumber(e.target.value)}
                placeholder="#20823275"
                className="w-full rounded-xl px-3.5 py-2.5 text-xs bg-[#0F1013] border border-[#1E2026] text-white font-mono font-bold focus:border-[#6366F1] outline-none"
              />
            </div>
          </div>

          {/* Prop Firm Specific Rules */}
          {isProp && (
            <div className="p-4 rounded-xl bg-[#0F1013] border border-[#1E2026] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#6366F1]">
                  Prop Evaluation Rules
                </span>
                <select
                  value={phase}
                  onChange={e => handlePhaseChange(e.target.value as PropPhase)}
                  className="rounded-lg px-2 py-1 text-xs bg-[#131418] border border-[#1E2026] text-[#6366F1] font-bold outline-none"
                >
                  <option value="Phase 1">Phase 1</option>
                  <option value="Phase 2">Phase 2</option>
                  <option value="Master">Master / Funded</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#8E95A5] mb-1">
                    Profit Target (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={phase === 'Master' || phase === 'Funded' ? 0 : profitTargetPct}
                    disabled={phase === 'Master' || phase === 'Funded'}
                    onChange={e => setProfitTargetPct(Number(e.target.value))}
                    className="w-full rounded-lg px-2.5 py-2 text-xs bg-[#131418] border border-[#1E2026] text-[#10B981] font-bold disabled:opacity-40 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#8E95A5] mb-1">
                    Daily DD Limit (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={dailyDrawdownLimitPct}
                    onChange={e => setDailyDrawdownLimitPct(Number(e.target.value))}
                    className="w-full rounded-lg px-2.5 py-2 text-xs bg-[#131418] border border-[#1E2026] text-[#F87171] font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#8E95A5] mb-1">
                    Max DD Limit (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={maxDrawdownLimitPct}
                    onChange={e => setMaxDrawdownLimitPct(Number(e.target.value))}
                    className="w-full rounded-lg px-2.5 py-2 text-xs bg-[#131418] border border-[#1E2026] text-[#F87171] font-bold outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Platform & Server */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#8E95A5] font-bold mb-1.5">
                Trading Platform
              </label>
              <select
                value={platform}
                onChange={e => setPlatform(e.target.value as TradingPlatform)}
                className="w-full rounded-xl px-3.5 py-2.5 text-xs bg-[#0F1013] border border-[#1E2026] text-white font-semibold focus:border-[#6366F1] outline-none"
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
              <label className="block text-xs uppercase tracking-wider text-[#8E95A5] font-bold mb-1.5">
                Server / Execution Type
              </label>
              <input
                type="text"
                value={serverType}
                onChange={e => setServerType(e.target.value)}
                placeholder="Raw Spread / Live Server"
                className="w-full rounded-xl px-3.5 py-2.5 text-xs bg-[#0F1013] border border-[#1E2026] text-white font-semibold focus:border-[#6366F1] outline-none"
              />
            </div>
          </div>

          {/* MT4 / MT5 Investor Sync */}
          {(platform === 'MetaTrader 4' || platform === 'MetaTrader 5') && (
            <div className="p-3.5 bg-[#181A20] rounded-xl border border-[#1E2026] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">
                  Automated Investor Password Sync (Read-Only)
                </span>
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-[#6366F1] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAutoSyncEnabled}
                    onChange={e => setIsAutoSyncEnabled(e.target.checked)}
                    className="rounded text-[#6366F1] w-3.5 h-3.5"
                  />
                  <span>Auto-Sync</span>
                </label>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#8E95A5] font-bold mb-1">
                  Read-Only Investor Password (Optional)
                </label>
                <input
                  type="password"
                  value={investorPassword}
                  onChange={e => setInvestorPassword(e.target.value)}
                  placeholder="Enter investor password for automated background sync"
                  className="w-full rounded-lg px-3 py-2 text-xs bg-[#0F1013] border border-[#1E2026] font-mono text-white outline-none focus:border-[#6366F1]"
                />
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#8E95A5] font-bold mb-1.5">
              Account Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Primary evaluation account on cTrader"
              className="w-full rounded-xl px-3.5 py-2.5 text-xs bg-[#0F1013] border border-[#1E2026] text-white font-medium focus:border-[#6366F1] outline-none"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1E2026]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#8E95A5] hover:text-white bg-[#0F1013] hover:bg-[#181A20] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-[#6366F1] hover:bg-[#4F46E5] shadow-xs transition-all"
            >
              Create Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
