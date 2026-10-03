import React from 'react';
import { Target, AlertTriangle, ShieldCheck, CheckCircle2, AlertOctagon } from 'lucide-react';
import { useTheme } from '../../data/ThemeContext';

export interface AccountMetricCardProps {
  type: 'profit-target' | 'daily-drawdown' | 'max-drawdown' | 'trading-days' | 'consistency';
  title: string;
  currentValue: number;
  targetValue: number;
  currentPct: number;
  limitPct: number;
  status: 'passed' | 'ongoing' | 'warning' | 'breached';
  isMaster?: boolean;
  subtitle?: string;
  isLossMetric?: boolean;
}

export const AccountMetricCard: React.FC<AccountMetricCardProps> = ({
  type,
  title,
  currentValue,
  targetValue,
  currentPct,
  limitPct,
  status,
  isMaster = false,
  subtitle,
  isLossMetric = false,
}) => {
  const { isDayMode } = useTheme();

  let statusBadge = {
    text: 'In Progress',
    bg: isDayMode ? '#EEF0FF' : '#181A20',
    border: isDayMode ? '#5D5FEF/30' : '#1E2026',
    color: '#5D5FEF',
    icon: Target,
  };

  if (status === 'passed') {
    statusBadge = {
      text: isMaster && type === 'profit-target' ? 'Profit Mode' : 'Passed',
      bg: isDayMode ? '#DCFCE7' : '#0E291E',
      border: isDayMode ? '#86EFAC' : '#144634',
      color: isDayMode ? '#059669' : '#10B981',
      icon: CheckCircle2,
    };
  } else if (status === 'breached') {
    statusBadge = {
      text: 'Breached',
      bg: isDayMode ? '#FEE2E2' : '#2D1416',
      border: isDayMode ? '#FCA5A5' : '#4C1D24',
      color: isDayMode ? '#DC2626' : '#F87171',
      icon: AlertOctagon,
    };
  } else if (status === 'warning') {
    statusBadge = {
      text: 'High Risk',
      bg: isDayMode ? '#FEF3C7' : '#2A1D0E',
      border: isDayMode ? '#FDE68A' : '#4A3416',
      color: '#D97706',
      icon: AlertTriangle,
    };
  } else if (isLossMetric && status === 'ongoing') {
    statusBadge = {
      text: 'Safe Buffer',
      bg: isDayMode ? '#DCFCE7' : '#0E291E',
      border: isDayMode ? '#86EFAC' : '#144634',
      color: isDayMode ? '#059669' : '#10B981',
      icon: ShieldCheck,
    };
  }

  let progressPct = 0;
  if (isLossMetric) {
    progressPct = limitPct > 0 ? Math.min(100, Math.max(0, (currentPct / limitPct) * 100)) : 0;
  } else if (type === 'trading-days') {
    progressPct = targetValue > 0 ? Math.min(100, (currentValue / targetValue) * 100) : 100;
  } else {
    if (isMaster) {
      progressPct = 100;
    } else {
      progressPct = limitPct > 0 ? Math.min(100, Math.max(0, (currentPct / limitPct) * 100)) : 0;
    }
  }

  const StatusIcon = statusBadge.icon;
  const bufferRemainingDollar = isLossMetric ? Math.max(0, targetValue - currentValue) : 0;
  const bufferRemainingPct = isLossMetric ? Math.max(0, limitPct - currentPct) : 0;

  const cardBg = isDayMode ? 'bg-white border-[#E5E4E2] text-[#111827]' : 'bg-[#131418] border-[#1E2026] text-white';
  const textPrimary = isDayMode ? 'text-[#111827]' : 'text-white';
  const textSecondary = isDayMode ? 'text-[#6B7280]' : 'text-[#8E95A5]';
  const textMuted = isDayMode ? 'text-[#9CA3AF]' : 'text-[#525866]';

  return (
    <div
      className={`rounded-xl p-4 border shadow-xs transition-all ${cardBg}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className={`text-xs uppercase tracking-wider font-bold ${textSecondary}`}>
            {title}
          </h4>
          {subtitle && (
            <p className={`text-[11px] mt-0.5 font-medium ${textMuted}`}>
              {subtitle}
            </p>
          )}
        </div>
        <div
          className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold"
          style={{
            background: statusBadge.bg,
            border: `1px solid ${statusBadge.border}`,
            color: statusBadge.color,
          }}
        >
          <StatusIcon size={12} />
          <span>{statusBadge.text}</span>
        </div>
      </div>

      {/* Main Metric Value */}
      <div className="mb-3">
        {type === 'trading-days' ? (
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-black tracking-tight font-mono ${textPrimary}`}>
              {currentValue}
            </span>
            <span className={`text-xs font-medium ${textSecondary}`}>
              / {targetValue} days required
            </span>
          </div>
        ) : isMaster && type === 'profit-target' ? (
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-black tracking-tight font-mono ${isDayMode ? 'text-[#059669]' : 'text-[#10B981]'}`}>
              ${currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className={`text-xs font-bold ${isDayMode ? 'text-[#059669]' : 'text-[#10B981]'}`}>
              ({currentPct >= 0 ? '+' : ''}{currentPct.toFixed(2)}%)
            </span>
            <span className={`text-xs font-medium ${textMuted}`}>• No ceiling</span>
          </div>
        ) : (
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl font-black tracking-tight font-mono ${textPrimary}`}
            >
              {isLossMetric
                ? `-$${currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : `${currentPct >= 0 ? '+' : ''}$${currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </span>
            <span
              className={`text-xs font-bold ${
                isLossMetric
                  ? currentPct > limitPct * 0.8
                    ? isDayMode ? 'text-[#DC2626]' : 'text-[#F87171]'
                    : isDayMode ? 'text-[#059669]' : 'text-[#10B981]'
                  : currentPct >= limitPct
                  ? isDayMode ? 'text-[#059669]' : 'text-[#10B981]'
                  : 'text-[#5D5FEF]'
              }`}
            >
              ({currentPct.toFixed(2)}%)
            </span>
            <span className={`text-xs font-medium ${textSecondary}`}>
              / limit: ${targetValue.toLocaleString()} ({limitPct}%)
            </span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className={`w-full h-2 rounded-full overflow-hidden border ${isDayMode ? 'bg-[#E5E4E2] border-[#E5E4E2]' : 'bg-[#0B0C0E] border-[#1E2026]'}`}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.max(3, Math.min(100, progressPct))}%`,
              background: isLossMetric
                ? progressPct >= 80
                  ? isDayMode ? '#DC2626' : '#F87171'
                  : progressPct >= 50
                  ? '#D97706'
                  : isDayMode ? '#059669' : '#10B981'
                : isMaster
                ? isDayMode ? '#059669' : '#10B981'
                : progressPct >= 100
                ? isDayMode ? '#059669' : '#10B981'
                : '#5D5FEF',
            }}
          />
        </div>
      </div>

      {/* Footer details */}
      <div className={`flex items-center justify-between text-xs pt-2.5 border-t font-medium ${isDayMode ? 'border-[#E5E4E2]' : 'border-[#1E2026]'}`}>
        {isLossMetric ? (
          <>
            <span className={textSecondary}>Safety Buffer:</span>
            <span
              className={`font-bold font-mono ${
                bufferRemainingPct <= 1.5
                  ? isDayMode ? 'text-[#DC2626]' : 'text-[#F87171]'
                  : isDayMode ? 'text-[#059669]' : 'text-[#10B981]'
              }`}
            >
              ${bufferRemainingDollar.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({bufferRemainingPct.toFixed(2)}% left)
            </span>
          </>
        ) : type === 'trading-days' ? (
          <>
            <span className={textSecondary}>Days Remaining:</span>
            <span className="font-bold text-[#5D5FEF] font-mono">
              {Math.max(0, targetValue - currentValue)} days
            </span>
          </>
        ) : isMaster ? (
          <>
            <span className={textSecondary}>Profit Split:</span>
            <span className={`font-bold ${isDayMode ? 'text-[#059669]' : 'text-[#10B981]'}`}>85% Trader / 15% Firm</span>
          </>
        ) : (
          <>
            <span className={textSecondary}>To Target:</span>
            <span
              className={`font-bold font-mono ${
                currentPct >= limitPct ? (isDayMode ? 'text-[#059669]' : 'text-[#10B981]') : 'text-[#5D5FEF]'
              }`}
            >
              {currentPct >= limitPct
                ? 'Target Achieved'
                : `$${Math.max(0, targetValue - currentValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${Math.max(0, limitPct - currentPct).toFixed(2)}% left)`}
            </span>
          </>
        )}
      </div>
    </div>
  );
};
