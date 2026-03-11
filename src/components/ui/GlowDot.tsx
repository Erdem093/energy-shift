'use client';

interface GlowDotProps {
  color?: 'cyan' | 'green' | 'amber' | 'red';
  size?: 'sm' | 'md';
}

const colors = {
  cyan:  { dot: 'bg-cyan-400',  ring: 'bg-cyan-400/30', shadow: '0 0 8px rgba(0,255,245,0.8)' },
  green: { dot: 'bg-green-400', ring: 'bg-green-400/30', shadow: '0 0 8px rgba(74,222,128,0.8)' },
  amber: { dot: 'bg-amber-400', ring: 'bg-amber-400/30', shadow: '0 0 8px rgba(251,191,36,0.8)' },
  red:   { dot: 'bg-red-400',   ring: 'bg-red-400/30', shadow: '0 0 8px rgba(239,68,68,0.8)' },
};

export default function GlowDot({ color = 'cyan', size = 'sm' }: GlowDotProps) {
  const c = colors[color];
  const sz = size === 'sm' ? 'w-2 h-2' : 'w-3 h-3';
  const ringSz = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

  return (
    <span className="relative inline-flex items-center justify-center flex-shrink-0">
      <span className={`absolute ${ringSz} rounded-full ${c.ring} animate-ping`} />
      <span className={`relative ${sz} rounded-full ${c.dot}`} style={{ boxShadow: c.shadow }} />
    </span>
  );
}
