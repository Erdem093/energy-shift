'use client';

import { clsx } from 'clsx';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: 'cyan' | 'amber' | 'red' | 'green' | 'none';
  title?: string;
  titleRight?: React.ReactNode;
}

const glowStyles = {
  cyan:  'shadow-[0_0_30px_rgba(0,255,245,0.08)] border-cyan-500/20 hover:border-cyan-400/40 hover:shadow-[0_0_40px_rgba(0,255,245,0.12)]',
  amber: 'shadow-[0_0_30px_rgba(245,158,11,0.08)] border-amber-500/20 hover:border-amber-400/40',
  red:   'shadow-[0_0_30px_rgba(239,68,68,0.08)] border-red-500/20',
  green: 'shadow-[0_0_30px_rgba(74,222,128,0.08)] border-green-500/20',
  none:  'border-slate-700/40',
};

export default function GlassCard({ children, className, glow = 'cyan', title, titleRight }: GlassCardProps) {
  return (
    <div
      className={clsx(
        'bg-slate-900/60 backdrop-blur-xl border rounded-2xl transition-all duration-300',
        glowStyles[glow],
        className,
      )}
    >
      {title && (
        <div className="flex items-center justify-between px-6 pt-5 pb-0 mb-4">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-400">{title}</h3>
          {titleRight && <div className="text-slate-400">{titleRight}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
