'use client';

import { treesEquivalent } from '@/lib/incentive';

interface ShiftImpactBreakdownProps {
  annualSavingGbp: number;
  co2SavedKg: number;
  gridPeakReductionMW: number;
  baselineCostGbp: number;
}

export default function ShiftImpactBreakdown({
  annualSavingGbp,
  co2SavedKg,
  gridPeakReductionMW,
  baselineCostGbp,
}: ShiftImpactBreakdownProps) {
  const trees = treesEquivalent(co2SavedKg);
  const savingPct = baselineCostGbp > 0 ? (annualSavingGbp / baselineCostGbp) * 100 : 0;

  const cards = [
    {
      icon: '💷',
      label: 'Annual saving',
      value: `£${Math.round(annualSavingGbp)}`,
      sub: `${savingPct.toFixed(0)}% off your bill`,
      color: 'text-cyan-400',
      glow: 'rgba(0,255,245,0.1)',
      border: 'border-cyan-500/20',
    },
    {
      icon: '🌿',
      label: 'CO₂ avoided',
      value: `${Math.round(co2SavedKg)} kg`,
      sub: trees > 0 ? `≈ ${trees} tree${trees > 1 ? 's' : ''} planted` : 'per year',
      color: 'text-green-400',
      glow: 'rgba(74,222,128,0.1)',
      border: 'border-green-500/20',
    },
    {
      icon: '⚡',
      label: 'Grid peak reduction',
      value: gridPeakReductionMW >= 1000
        ? `${(gridPeakReductionMW / 1000).toFixed(1)} GW`
        : `${Math.round(gridPeakReductionMW)} MW`,
      sub: 'if 10% of UK homes shift',
      color: 'text-violet-400',
      glow: 'rgba(167,139,250,0.1)',
      border: 'border-violet-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-xl border ${card.border} p-4 transition-all duration-200`}
          style={{ background: card.glow, backdropFilter: 'blur(8px)' }}
        >
          <div className="text-lg mb-1">{card.icon}</div>
          <p className="text-xs text-slate-500 mb-1">{card.label}</p>
          <p className={`text-2xl font-bold tabular-nums ${card.color}`}>{card.value}</p>
          <p className="text-xs text-slate-600 mt-1">{card.sub}</p>
        </div>
      ))}
    </div>
  );
}
