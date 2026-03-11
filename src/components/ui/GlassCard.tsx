'use client';

import { clsx } from 'clsx';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: 'cyan' | 'amber' | 'red' | 'green' | 'none';
  title?: string;
  titleRight?: React.ReactNode;
}

const accentBorders: Record<string, string> = {
  cyan:  'border-l-slate-500/40',
  amber: 'border-l-slate-500/40',
  red:   'border-l-red-500/40',
  green: 'border-l-slate-500/40',
  none:  'border-l-[#1a2540]',
};

export default function GlassCard({ children, className, glow = 'none', title, titleRight }: GlassCardProps) {
  return (
    <div
      className={clsx(
        'bg-[#070d18] border border-[#1a2540] border-l-2 rounded-xl',
        'transition-colors duration-200 hover:border-[#243556]',
        accentBorders[glow],
        className,
      )}
    >
      {title && (
        <div className="flex items-center justify-between px-5 pt-4 pb-0 mb-3">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{title}</span>
          {titleRight && <div className="text-slate-500 text-xs">{titleRight}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
