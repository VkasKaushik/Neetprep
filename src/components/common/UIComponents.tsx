import React from 'react';
import { SubjectType, PriorityLevel } from '../../types';

export const SubjectBadge: React.FC<{ subject: SubjectType; size?: 'sm' | 'md' }> = ({ subject, size = 'sm' }) => {
  const dotColor = {
    Physics: 'bg-[#38bdf8]',
    Chemistry: 'bg-[#c084fc]',
    Biology: 'bg-[#34d399]',
  }[subject] || 'bg-slate-400';

  const textColor = {
    Physics: 'text-[#7dd3fc]',
    Chemistry: 'text-[#e9d5ff]',
    Biology: 'text-[#6ee7b7]',
  }[subject] || 'text-slate-300';

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-[#25252c] border border-white/[0.08] ${textColor} ${
      size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-xs sm:text-sm'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
      {subject}
    </span>
  );
};

export const PriorityBadge: React.FC<{ priority: PriorityLevel }> = ({ priority }) => {
  const styles = {
    High: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    Medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    Low: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20',
  }[priority];

  return (
    <span className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full border ${styles}`}>
      {priority}
    </span>
  );
};

export const CircularProgress: React.FC<{ percentage: number; size?: number; strokeWidth?: number }> = ({
  percentage,
  size = 76,
  strokeWidth = 6.5
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#26262e"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#purpleGradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
        <defs>
          <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#6e3ff5" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-base font-black text-white tracking-tight">{Math.round(percentage)}%</span>
      </div>
    </div>
  );
};

export const ProgressBar: React.FC<{ percentage: number; colorClass?: string; height?: string }> = ({
  percentage,
  colorClass = 'bg-[#6e3ff5]',
  height = 'h-2'
}) => {
  const clamped = Math.min(100, Math.max(0, percentage));
  return (
    <div className={`w-full bg-[#18181e] rounded-full overflow-hidden ${height} border border-white/[0.04]`}>
      <div
        className={`h-full rounded-full transition-all duration-500 ease-out ${colorClass}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
};

export const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  subtitle?: string;
}> = ({ isOpen, onClose, title, subtitle, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-lg bg-[#1a1a20] sm:rounded-3xl rounded-t-3xl border-t sm:border border-white/10 p-5 sm:p-6 max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-white/[0.08]">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
            {subtitle && <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#25252c] hover:bg-[#2e2e36] text-zinc-400 hover:text-white flex items-center justify-center transition border border-white/[0.08]"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};
