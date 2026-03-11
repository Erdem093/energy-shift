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
  cyan:  'border-cyan-500/15 hover:border-cyan-400/30',
  amber: 'border-amber-500/15 hover:border-amber-400/30',
  red:   'border-red-500/15',
  green: 'border-green-500/15 hover:border-green-400/30',
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
