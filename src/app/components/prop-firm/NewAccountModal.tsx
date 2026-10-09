import React, { useState } from 'react';
import {
  X,
  Building2,
  Check,
  ShieldCheck,
  Globe,
  Zap,
  Sliders,
  DollarSign,
  HelpCircle,
  Sparkles,
  Server,
  Layers,
} from 'lucide-react';
import {
  PROVIDER_PRESETS,
  type Account,
  type AccountCategory,
  type AccountStatus,
  type TradingPlatform,
  type PropPhase,
  type ProviderPreset,
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
  // ── Primary Division: Real Account vs Demo Account ───────────────────────
  const [accountMode, setAccountMode] = useState<'real' | 'demo'>('real');

  // Shared / Form state
  const [name, setName] = useState('FundingPips Real $50k');
  const [provider, setProvider] = useState('FundingPips');
  const [category, setCategory] = useState<AccountCategory>('prop_evaluation');
  const [platform, setPlatform] = useState<TradingPlatform>('MetaTrader 5');
  const [serverType, setServerType] = useState('FundingPips-Server');
  const [initialBalance, setInitialBalance] = useState<number>(50000);
  const [customBalanceInput, setCustomBalanceInput] = useState<string>('50000');
  const [isCustomBalance, setIsCustomBalance] = useState(false);

  // Prop rules
  const [phase, setPhase] = useState<PropPhase>('Phase 1');
  const [modelType, setModelType] = useState('2-Step Evaluation');
  const [profitTargetPct, setProfitTargetPct] = useState<number>(8);
  const [dailyDrawdownLimitPct, setDailyDrawdownLimitPct] = useState<number>(5);
  const [maxDrawdownLimitPct, setMaxDrawdownLimitPct] = useState<number>(10);
  const [minTradingDays, setMinTradingDays] = useState<number>(0);

  // Real connection details
  const [accountNumber, setAccountNumber] = useState(() => `#${Math.floor(10000000 + Math.random() * 90000000)}`);
  const [investorPassword, setInvestorPassword] = useState('');
  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState(true);
  const [notes, setNotes] = useState('');

  // Selected Demo Preset
  const [selectedDemoPresetId, setSelectedDemoPresetId] = useState('ftmo-demo');

  if (!isOpen) return null;

  // ── Mode Switcher Handlers ───────────────────────────────────────────────
  const handleSwitchMode = (mode: 'real' | 'demo') => {
    setAccountMode(mode);
    if (mode === 'real') {
      setName('FundingPips Real $50k');
      setProvider('FundingPips');
      setPlatform('MetaTrader 5');
      setServerType('FundingPips-Server');
      setInitialBalance(50000);
      setCustomBalanceInput('50000');
      setIsCustomBalance(false);
      setProfitTargetPct(8);
      setDailyDrawdownLimitPct(5);
      setMaxDrawdownLimitPct(10);
      setModelType('2-Step Evaluation');
      setCategory('prop_evaluation');
    } else {
      // Demo preset
      const preset = PROVIDER_PRESETS.find(p => p.id === 'ftmo-demo') || PROVIDER_PRESETS[1];
      if (preset) applyPreset(preset);
    }
  };

  const applyPreset = (preset: ProviderPreset) => {
    setSelectedDemoPresetId(preset.id);
    setProvider(preset.name.replace(' Demo', ''));
    setPlatform(preset.defaultPlatform);
    setServerType(preset.serverTypes[0] || 'Demo Server');
    const sz = preset.defaultSizes[2] || preset.defaultSizes[0] || 100000;
    setInitialBalance(sz);
    setCustomBalanceInput(String(sz));
    setIsCustomBalance(false);
    setName(`${preset.name} $${(sz / 1000).toFixed(0)}k Practice`);
    setCategory(preset.category);

    if (preset.propConfig) {
      setModelType(preset.propConfig.modelType);
      const first = preset.propConfig.phases[0];
      if (first) {
        setPhase(first.phase);
        setProfitTargetPct(first.profitTargetPct);
        setDailyDrawdownLimitPct(first.dailyDrawdownLimitPct);
        setMaxDrawdownLimitPct(first.maxDrawdownLimitPct);
        setMinTradingDays(first.minTradingDays);
      }
    }
  };

  const handleSizeSelect = (sz: number) => {
    setInitialBalance(sz);
    setCustomBalanceInput(String(sz));
    setIsCustomBalance(false);
    setName(
      accountMode === 'real'
        ? `${provider} Real $${(sz / 1000).toFixed(0)}k`
        : `${provider} Demo $${(sz / 1000).toFixed(0)}k Practice`
    );
  };

  const handleCustomBalanceChange = (valStr: string) => {
    setCustomBalanceInput(valStr);
    const parsed = parseFloat(valStr.replace(/[^0-9.]/g, ''));
    if (!isNaN(parsed) && parsed > 0) {
      setInitialBalance(parsed);
      setName(
        accountMode === 'real'
          ? `${provider} Real $${(parsed / 1000).toFixed(0)}k`
          : `${provider} Demo $${(parsed / 1000).toFixed(0)}k Practice`
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const isProp = category.startsWith('prop');
    const status: AccountStatus = isProp ? 'Ongoing' : 'Active';

    const connection =
      accountMode === 'real' && investorPassword.trim()
        ? {
            platform: platform === 'MetaTrader 4' ? ('MT4' as const) : ('MT5' as const),
            login: accountNumber.replace('#', '').trim(),
            investorPassword: investorPassword.trim(),
            server: serverType.trim() || 'FundingPips-Server',
            syncStatus: 'connected' as const,
            autoSyncIntervalSec: 30,
          }
        : undefined;

    onAddAccount({
      accountNumber: accountNumber.startsWith('#') ? accountNumber : `#${accountNumber}`,
      name: name.trim() || `${provider} Account`,
      accountMode,
      category,
      provider: provider.trim() || (accountMode === 'real' ? 'FundingPips' : 'Simulated'),
      platform,
      serverType: serverType.trim() || (accountMode === 'real' ? 'FundingPips-Server' : 'Demo Server'),
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
      propDetails: isProp
        ? {
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
          }
        : undefined,
      notes: notes.trim() || (accountMode === 'real' ? 'Real account with live server sync' : 'Simulated demo practice account'),
      isBreached: false,
      connection,
      isAutoSyncEnabled: Boolean(connection && isAutoSyncEnabled),
    });

    onClose();
  };

  const quickSizes = [5000, 10000, 25000, 50000, 100000, 200000, 300000];
  const demoPresets = PROVIDER_PRESETS.filter(p => p.accountMode === 'demo');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-2xl p-6 relative my-8 bg-[#131418] border border-[#1E2026] text-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#1E2026]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#181A20] border border-[#1E2026] text-[#6366F1]">
              <Building2 size={20} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Generate Trading Account</h3>
              <p className="text-xs text-[#8E95A5] font-medium">
                Choose between a Live Server connection or a Simulated Demo challenge
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#8E95A5] hover:text-white p-1.5 rounded-lg hover:bg-[#181A20] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── PART 1: Top Mode Division Switcher (Real vs Demo) ── */}
        <div className="grid grid-cols-2 gap-3 mb-5 p-1 bg-[#0F1013] rounded-2xl border border-[#1E2026]">
          {/* Real Account Choice */}
          <button
            type="button"
            onClick={() => handleSwitchMode('real')}
            className={`p-3.5 rounded-xl text-left transition-all relative flex items-start gap-3 cursor-pointer ${
              accountMode === 'real'
                ? 'bg-[#181A20] border border-emerald-500/50 shadow-xs'
                : 'border border-transparent hover:bg-[#181A20]/50 opacity-70'
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
              <Zap size={16} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-white">Real Account</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Live Server
                </span>
              </div>
              <p className="text-[11px] text-[#8E95A5] font-medium mt-0.5 leading-snug">
                Connects real MT5 / broker server. Pulls live balance & deals.
              </p>
            </div>
          </button>

          {/* Demo Account Choice */}
          <button
            type="button"
            onClick={() => handleSwitchMode('demo')}
            className={`p-3.5 rounded-xl text-left transition-all relative flex items-start gap-3 cursor-pointer ${
              accountMode === 'demo'
                ? 'bg-[#181A20] border border-purple-500/50 shadow-xs'
                : 'border border-transparent hover:bg-[#181A20]/50 opacity-70'
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 mt-0.5">
              <Sliders size={16} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-white">Demo / Practice</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  Simulated
                </span>
              </div>
              <p className="text-[11px] text-[#8E95A5] font-medium mt-0.5 leading-snug">
                Pick fake prop firms & custom money to test your strategy freely.
              </p>
            </div>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ── PART 2: REAL ACCOUNT SPECIFICS ── */}
          {accountMode === 'real' ? (
            <div className="space-y-4 p-4 rounded-xl bg-[#0F1013] border border-[#1E2026]">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                <Server size={14} />
                <span>Real Server Connection Settings</span>
              </div>

              {/* Server Name Presets & Custom Server */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#8E95A5] font-bold mb-1">
                  Broker / Prop Server Name
                </label>
                <input
                  type="text"
                  required
                  value={serverType}
                  onChange={e => setServerType(e.target.value)}
                  placeholder="e.g. FundingPips-Server, FundingPips-SIM1"
                  className="w-full rounded-xl px-3.5 py-2 text-xs bg-[#131418] border border-[#1E2026] text-white font-medium focus:border-emerald-500 outline-none"
                />
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {['FundingPips-Server', 'FundingPips-SIM1', 'FundingPips-Demo'].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setServerType(preset)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all cursor-pointer ${
                        serverType === preset
                          ? 'bg-emerald-500 text-slate-900 font-bold'
                          : 'bg-[#181A20] text-[#8E95A5] border border-[#1E2026] hover:text-white'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Real Account Number & Investor Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#8E95A5] font-bold mb-1">
                    Real Login / Account Number
                  </label>
                  <input
                    type="text"
                    required
                    value={accountNumber}
                    onChange={e => setAccountNumber(e.target.value)}
                    placeholder="e.g. 20823275"
                    className="w-full rounded-xl px-3.5 py-2 text-xs bg-[#131418] border border-[#1E2026] text-white font-mono font-bold focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#8E95A5] font-bold mb-1">
                    Read-Only Investor Password
                  </label>
                  <input
                    type="password"
                    value={investorPassword}
                    onChange={e => setInvestorPassword(e.target.value)}
                    placeholder="Enter investor password"
                    className="w-full rounded-xl px-3.5 py-2 text-xs bg-[#131418] border border-[#1E2026] text-white font-mono outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Live Info Banner */}
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px]">
                <ShieldCheck size={15} className="shrink-0 mt-0.5" />
                <span>
                  Uses read-only investor credentials. Orders cannot be opened or closed, only past trades and balance are read.
                </span>
              </div>
            </div>
          ) : (
            /* ── PART 3: DEMO ACCOUNT SPECIFICS (Fake Prop Firms & Custom Money) ── */
            <div className="space-y-4 p-4 rounded-xl bg-[#0F1013] border border-[#1E2026]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders size={14} />
                  <span>Select Fake / Simulated Prop Firm</span>
                </span>
              </div>

              {/* Fake Prop Firm Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {demoPresets.map(preset => {
                  const isSelected = selectedDemoPresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className={`p-2.5 rounded-xl text-left transition-all border cursor-pointer ${
                        isSelected
                          ? 'bg-[#181A20] border-purple-500 text-white shadow-xs'
                          : 'bg-[#131418] border-[#1E2026] text-[#8E95A5] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{preset.name.replace(' Demo', '')}</span>
                        {isSelected && <Check size={12} className="text-purple-400" />}
                      </div>
                      <span className="text-[10px] text-[#8E95A5] block mt-0.5 truncate">
                        {preset.propConfig?.modelType || 'Simulated Rules'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── SET MONEY / STARTING CAPITAL (Customizable for Demo and Real) ── */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs uppercase tracking-wider text-[#8E95A5] font-bold">
                {accountMode === 'demo' ? 'Set Demo Money / Starting Capital' : 'Account Balance / Size'}
              </label>
              <button
                type="button"
                onClick={() => setIsCustomBalance(!isCustomBalance)}
                className="text-[11px] font-bold text-[#6366F1] hover:underline cursor-pointer"
              >
                {isCustomBalance ? 'Choose Preset' : '+ Type Custom Money'}
              </button>
            </div>

            {isCustomBalance ? (
              <div className="relative">
                <input
                  type="number"
                  step="1000"
                  min="500"
                  value={customBalanceInput}
                  onChange={e => handleCustomBalanceChange(e.target.value)}
                  placeholder="Enter any amount (e.g. 15000, 300000)"
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl text-xs bg-[#0F1013] border border-[#6366F1] text-white font-mono font-bold focus:outline-none"
                />
                <DollarSign size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6366F1]" />
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                {quickSizes.map(sz => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => handleSizeSelect(sz)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                      initialBalance === sz
                        ? 'bg-[#6366F1] text-white shadow-xs font-black'
                        : 'bg-[#0F1013] text-[#8E95A5] border border-[#1E2026] hover:text-white'
                    }`}
                  >
                    ${(sz / 1000).toFixed(0)}k
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Account Label & Display Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#8E95A5] font-bold mb-1">
                Account Label / Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Account Name"
                className="w-full rounded-xl px-3.5 py-2 text-xs bg-[#0F1013] border border-[#1E2026] text-white font-bold focus:border-[#6366F1] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#8E95A5] font-bold mb-1">
                Trading Platform
              </label>
              <select
                value={platform}
                onChange={e => setPlatform(e.target.value as TradingPlatform)}
                className="w-full rounded-xl px-3 py-2 text-xs bg-[#0F1013] border border-[#1E2026] text-white font-semibold focus:border-[#6366F1] outline-none"
              >
                <option value="MetaTrader 5">MetaTrader 5</option>
                <option value="MetaTrader 4">MetaTrader 4</option>
                <option value="cTrader">cTrader</option>
                <option value="TradeLocker">TradeLocker</option>
                <option value="TradingView">TradingView</option>
              </select>
            </div>
          </div>

          {/* Prop Rules / Challenge Rules (Editable for Demo) */}
          <div className="p-3.5 rounded-xl bg-[#0F1013] border border-[#1E2026] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6366F1]">
                {accountMode === 'demo' ? 'Simulated Challenge Rules' : 'Evaluation Rules'}
              </span>
              <select
                value={phase}
                onChange={e => setPhase(e.target.value as PropPhase)}
                className="rounded-lg px-2 py-0.5 text-xs bg-[#181A20] border border-[#1E2026] text-[#6366F1] font-bold outline-none"
              >
                <option value="Phase 1">Phase 1</option>
                <option value="Phase 2">Phase 2</option>
                <option value="Master">Master / Funded</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-semibold text-[#8E95A5] mb-0.5">
                  Profit Target (%)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={phase === 'Master' || phase === 'Funded' ? 0 : profitTargetPct}
                  disabled={phase === 'Master' || phase === 'Funded'}
                  onChange={e => setProfitTargetPct(Number(e.target.value))}
                  className="w-full rounded-lg px-2.5 py-1.5 text-xs bg-[#131418] border border-[#1E2026] text-emerald-400 font-bold outline-none disabled:opacity-40"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-[#8E95A5] mb-0.5">
                  Daily DD Limit (%)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={dailyDrawdownLimitPct}
                  onChange={e => setDailyDrawdownLimitPct(Number(e.target.value))}
                  className="w-full rounded-lg px-2.5 py-1.5 text-xs bg-[#131418] border border-[#1E2026] text-red-400 font-bold outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-[#8E95A5] mb-0.5">
                  Max DD Limit (%)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={maxDrawdownLimitPct}
                  onChange={e => setMaxDrawdownLimitPct(Number(e.target.value))}
                  className="w-full rounded-lg px-2.5 py-1.5 text-xs bg-[#131418] border border-[#1E2026] text-red-400 font-bold outline-none"
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1E2026]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#8E95A5] hover:text-white bg-[#0F1013] hover:bg-[#181A20] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-6 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition-all cursor-pointer ${
                accountMode === 'real'
                  ? 'bg-emerald-600 hover:bg-emerald-500'
                  : 'bg-[#6366F1] hover:bg-[#4F46E5]'
              }`}
            >
              {accountMode === 'real' ? 'Generate Real Account' : 'Generate Demo Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
