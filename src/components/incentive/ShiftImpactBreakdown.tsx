'use client';

import { treesEquivalent } from '@/lib/incentive';
import { Leaf, PoundSterling, Zap } from 'lucide-react';

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
      Icon: PoundSterling,
      label: 'Annual saving',
      value: `£${Math.round(annualSavingGbp)}`,
      sub: `${savingPct.toFixed(0)}% off your bill`,
      valueColor: 'text-white',
      iconColor: 'text-slate-500',
      accentBorder: 'border-l-slate-500/40',
    },
    {
      Icon: Leaf,
      label: 'CO₂ avoided',
      value: `${Math.round(co2SavedKg)} kg`,
      sub: trees > 0 ? `≈ ${trees} tree${trees > 1 ? 's' : ''} planted` : 'per year',
      valueColor: 'text-white',
      iconColor: 'text-slate-500',
      accentBorder: 'border-l-slate-500/40',
    },
    {
      Icon: Zap,
      label: 'Grid peak reduction',
      value: gridPeakReductionMW >= 1000
        ? `${(gridPeakReductionMW / 1000).toFixed(1)} GW`
        : `${Math.round(gridPeakReductionMW)} MW`,
      sub: 'if 10% of UK homes shift',
      valueColor: 'text-white',
      iconColor: 'text-slate-500',
      accentBorder: 'border-l-slate-500/40',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-xl border border-[#1a2540] border-l-2 ${card.accentBorder} bg-[#0c1525] p-4 transition-colors duration-200 hover:border-[#243556]`}
        >
          <div className={`mb-2 inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#243556] bg-[#070d18] ${card.iconColor}`}>
            <card.Icon size={16} strokeWidth={1.8} />
          </div>
          <p className="text-[10px] uppercase tracking-wider text-slate-600 mb-1">{card.label}</p>
          <p className={`text-2xl font-mono font-bold tabular-nums ${card.valueColor}`}>{card.value}</p>
          <p className="text-[10px] text-slate-600 mt-1.5">{card.sub}</p>
        </div>
      ))}
    </div>
  );
}
