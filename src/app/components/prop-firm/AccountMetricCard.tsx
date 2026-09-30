import React from 'react';
import { Target, AlertTriangle, ShieldCheck, CheckCircle2, AlertOctagon } from 'lucide-react';

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
  let statusBadge = {
    text: 'In Progress',
    bg: '#eff6ff',
    border: '#bfdbfe',
    color: '#2563eb',
    icon: Target,
  };

  if (status === 'passed') {
    statusBadge = {
      text: isMaster && type === 'profit-target' ? 'Profit Mode' : 'Passed',
      bg: '#f0fdf4',
      border: '#bbf7d0',
      color: '#16a34a',
      icon: CheckCircle2,
    };
  } else if (status === 'breached') {
    statusBadge = {
      text: 'Breached',
      bg: '#fef2f2',
      border: '#fecaca',
      color: '#dc2626',
      icon: AlertOctagon,
    };
  } else if (status === 'warning') {
    statusBadge = {
      text: 'High Risk',
      bg: '#fffbeb',
      border: '#fde68a',
      color: '#d97706',
      icon: AlertTriangle,
    };
  } else if (isLossMetric && status === 'ongoing') {
    statusBadge = {
      text: 'Safe Buffer',
      bg: '#eff6ff',
      border: '#bfdbfe',
      color: '#2563eb',
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

  return (
    <div
      className="rounded-2xl p-5 bg-white border border-slate-200 shadow-sm transition-all hover:shadow-md"
      style={{
        boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-xs uppercase tracking-wider font-bold text-slate-800">
            {title}
          </h4>
          {subtitle && (
            <p className="text-[11px] mt-0.5 text-slate-500 font-medium">
              {subtitle}
            </p>
          )}
        </div>
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
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
            <span className="text-2xl font-extrabold tracking-tight text-blue-600 font-mono">
              {currentValue}
            </span>
            <span className="text-xs font-medium text-slate-500">
              / {targetValue} days required
            </span>
          </div>
        ) : isMaster && type === 'profit-target' ? (
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold tracking-tight text-blue-600 font-mono">
              ${currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs font-bold text-emerald-600">
              ({currentPct >= 0 ? '+' : ''}{currentPct.toFixed(2)}%)
            </span>
            <span className="text-xs font-medium text-slate-500">• No target ceiling</span>
          </div>
        ) : (
          <div className="flex items-baseline gap-2">
            <span
              className="text-2xl font-extrabold tracking-tight font-mono"
              style={{
                color: isLossMetric
                  ? currentPct > limitPct * 0.8
                    ? '#dc2626'
                    : '#0f172a'
                  : currentPct >= limitPct
                  ? '#16a34a'
                  : '#2563eb',
              }}
            >
              {isLossMetric
                ? `-$${currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : `${currentPct >= 0 ? '+' : ''}$${currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </span>
            <span
              className="text-xs font-bold"
              style={{
                color: isLossMetric
                  ? currentPct > limitPct * 0.8
                    ? '#dc2626'
                    : '#2563eb'
                  : currentPct >= limitPct
                  ? '#16a34a'
                  : '#2563eb',
              }}
            >
              ({currentPct.toFixed(2)}%)
            </span>
            <span className="text-xs font-medium text-slate-500">
              / limit: ${targetValue.toLocaleString()} ({limitPct}%)
            </span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="w-full h-2.5 rounded-full overflow-hidden bg-slate-100 border border-slate-200/70">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.max(3, Math.min(100, progressPct))}%`,
              background: isLossMetric
                ? progressPct >= 80
                  ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                  : progressPct >= 50
                  ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                  : 'linear-gradient(90deg, #3b82f6, #2563eb)'
                : isMaster
                ? 'linear-gradient(90deg, #2563eb, #1d4ed8)'
                : progressPct >= 100
                ? 'linear-gradient(90deg, #16a34a, #15803d)'
                : 'linear-gradient(90deg, #3b82f6, #1d4ed8)',
            }}
          />
        </div>
      </div>

      {/* Footer details */}
      <div className="flex items-center justify-between text-xs pt-2.5 border-t border-slate-100 font-medium">
        {isLossMetric ? (
          <>
            <span className="text-slate-600">Safety Buffer:</span>
            <span
              className="font-bold font-mono"
              style={{
                color: bufferRemainingPct <= 1.5 ? '#dc2626' : '#2563eb',
              }}
            >
              ${bufferRemainingDollar.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({bufferRemainingPct.toFixed(2)}% left)
            </span>
          </>
        ) : type === 'trading-days' ? (
          <>
            <span className="text-slate-600">Days Remaining:</span>
            <span className="font-bold text-blue-600 font-mono">
              {Math.max(0, targetValue - currentValue)} days
            </span>
          </>
        ) : isMaster ? (
          <>
            <span className="text-slate-600">Profit Split:</span>
            <span className="font-bold text-blue-600">85% Trader / 15% Firm</span>
          </>
        ) : (
          <>
            <span className="text-slate-600">To Target:</span>
            <span
              className="font-bold font-mono"
              style={{ color: currentPct >= limitPct ? '#16a34a' : '#2563eb' }}
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
