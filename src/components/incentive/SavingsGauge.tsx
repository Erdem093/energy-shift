'use client';

import { useEffect, useRef } from 'react';

interface SavingsGaugeProps {
  annualSavingGbp: number;
  maxSavingGbp: number;
  co2SavedKg: number;
}

export default function SavingsGauge({ annualSavingGbp, maxSavingGbp, co2SavedKg }: SavingsGaugeProps) {
  const circleRef = useRef<SVGCircleElement>(null);

  const size = 180;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = maxSavingGbp > 0 ? Math.min(annualSavingGbp / maxSavingGbp, 1) : 0;
  const offset = circumference * (1 - progress);

  // Pick colour based on saving amount
  const color = annualSavingGbp < 20 ? '#64748b'
    : annualSavingGbp < 60 ? '#22d3ee'
    : annualSavingGbp < 120 ? '#00fff5'
    : '#4ade80';

  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.style.transition = 'stroke-dashoffset 500ms cubic-bezier(0.4, 0, 0.2, 1)';
    }
  }, []);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <svg width={size} height={size} className="rotate-[-90deg]" style={{ overflow: 'visible' }}>
          {/* Background ring */}
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="#1e293b" strokeWidth={strokeWidth}
          />
          {/* Progress ring */}
          <circle
            ref={circleRef}
            cx={size / 2} cy={size / 2} r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ filter: `drop-shadow(0 0 8px ${color})` }}
          />
        </svg>

        {/* Centre content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
          <span className="text-3xl font-bold text-white tabular-nums" style={{ color }}>
            £{Math.round(annualSavingGbp)}
          </span>
          <span className="text-xs text-slate-500 mt-0.5">saved / year</span>
          {co2SavedKg > 0 && (
            <span className="text-xs text-green-400 mt-1">{Math.round(co2SavedKg)} kg CO₂</span>
          )}
        </div>
      </div>

      {annualSavingGbp > 0 && (
        <p className="text-xs text-slate-500 text-center">
          That&apos;s{' '}
          <span className="text-cyan-400 font-medium">£{(annualSavingGbp / 12).toFixed(0)}/month</span>
          {' '}back in your pocket
        </p>
      )}
    </div>
  );
}
