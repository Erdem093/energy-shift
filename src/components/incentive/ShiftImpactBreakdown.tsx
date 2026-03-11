'use client';

import { treesEquivalent } from '@/lib/incentive';

interface ShiftImpactBreakdownProps {
  annualSavingGbp: number;
  co2SavedKg: number;
  gridPeakReductionMW: number;
  baselineCostGbp: number;
}

function IconPound() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 7.756a4.5 4.5 0 1 0-8.5 2.15M12 12H5m6.75 0v3.75m0-3.75H9m3.75 0c0 2.25-.75 4.5-3.75 4.5H5M3 16.5h2.25m9.75 0H21" />
    </svg>
  );
}

function IconLeaf() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c-4.97 0-9 4.03-9 9 0 3.93 2.53 7.29 6.07 8.5C10.55 21.17 12 20.07 12 18.57V12m0-9c4.97 0 9 4.03 9 9 0 3.93-2.53 7.29-6.07 8.5C13.45 21.17 12 20.07 12 18.57V12m0-9v9" />
    </svg>
  );
}

function IconBolt() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
    </svg>
  );
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
      Icon: IconPound,
      label: 'Annual saving',
      value: `£${Math.round(annualSavingGbp)}`,
      sub: `${savingPct.toFixed(0)}% off your bill`,
      valueColor: 'text-blue-400',
      iconColor: 'text-blue-500',
      accentBorder: 'border-l-blue-500/50',
    },
    {
      Icon: IconLeaf,
      label: 'CO₂ avoided',
      value: `${Math.round(co2SavedKg)} kg`,
      sub: trees > 0 ? `≈ ${trees} tree${trees > 1 ? 's' : ''} planted` : 'per year',
      valueColor: 'text-emerald-400',
      iconColor: 'text-emerald-500',
      accentBorder: 'border-l-emerald-500/50',
    },
    {
      Icon: IconBolt,
      label: 'Grid peak reduction',
      value: gridPeakReductionMW >= 1000
        ? `${(gridPeakReductionMW / 1000).toFixed(1)} GW`
        : `${Math.round(gridPeakReductionMW)} MW`,
      sub: 'if 10% of UK homes shift',
      valueColor: 'text-violet-400',
      iconColor: 'text-violet-500',
      accentBorder: 'border-l-violet-500/50',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-xl border border-[#1a2540] border-l-2 ${card.accentBorder} bg-[#0c1525] p-4 transition-colors duration-200 hover:border-[#243556]`}
        >
          <div className={`${card.iconColor} mb-2`}><card.Icon /></div>
          <p className="text-[10px] uppercase tracking-wider text-slate-600 mb-1">{card.label}</p>
          <p className={`text-2xl font-mono font-bold tabular-nums ${card.valueColor}`}>{card.value}</p>
          <p className="text-[10px] text-slate-600 mt-1.5">{card.sub}</p>
        </div>
      ))}
    </div>
  );
}
