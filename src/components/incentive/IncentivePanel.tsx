'use client';

import { useState, useMemo } from 'react';
import { clsx } from 'clsx';
import type { IncentiveModelData, Archetype } from '@/lib/types';
import { getSavingAtShift, getShiftDescription, getMaxSaving } from '@/lib/incentive';
import { ARCHETYPE_LABELS, ARCHETYPE_DESCRIPTIONS, TARIFF } from '@/lib/constants';
import SavingsGauge from './SavingsGauge';
import ShiftImpactBreakdown from './ShiftImpactBreakdown';

interface IncentivePanelProps {
  data: IncentiveModelData;
}

const ARCHETYPES: Archetype[] = ['comfortable', 'affluent', 'adversity'];

export default function IncentivePanel({ data }: IncentivePanelProps) {
  const [archetype, setArchetype] = useState<Archetype>('comfortable');
  const [shiftPct, setShiftPct] = useState(20);

  const saving = useMemo(
    () => getSavingAtShift(data, archetype, shiftPct),
    [data, archetype, shiftPct],
  );

  const maxSaving = getMaxSaving(data, archetype);
  const baseline = data.archetypes[archetype].baselineCostGbp;
  const annualKwh = data.archetypes[archetype].annualKwh;
  const description = getShiftDescription(shiftPct);

  // Daily kWh shifted
  const peakFraction = 0.22; // approximate peak window fraction
  const shiftedKwhDay = (annualKwh / 365) * peakFraction * (shiftPct / 100);

  return (
    <div className="space-y-6">
      {/* Tariff context */}
      <div className="flex gap-2 flex-wrap text-xs">
        <div className="bg-[#0c1525] border border-[#1a2540] rounded-lg px-3 py-2">
          <span className="text-slate-600">Peak </span>
          <span className="font-mono font-semibold text-red-400">{TARIFF.peakRate}p/kWh</span>
          <span className="text-slate-700 font-mono"> {TARIFF.peakWindow}</span>
        </div>
        <div className="bg-[#0c1525] border border-[#1a2540] rounded-lg px-3 py-2">
          <span className="text-slate-600">Off-peak </span>
          <span className="font-mono font-semibold text-emerald-400">{TARIFF.offpeakRate}p/kWh</span>
          <span className="text-slate-700 font-mono"> {TARIFF.offpeakWindow}</span>
        </div>
        <div className="bg-[#0c1525] border border-[#1a2540] rounded-lg px-3 py-2">
          <span className="text-slate-600">Tariff </span>
          <span className="font-mono text-slate-400">{data.tariff.name}</span>
        </div>
      </div>

      {/* Archetype selector */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600 mb-3">Household profile</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {ARCHETYPES.map((a) => (
            <button
              key={a}
              onClick={() => setArchetype(a)}
              className={clsx(
                'text-left p-4 rounded-xl border-l-2 border border-[#1a2540] transition-all duration-200',
                archetype === a
                  ? 'bg-[#131820] border-l-white/40 border-[#1a2540]'
                  : 'bg-[#0c1525] border-l-transparent hover:border-l-slate-600 hover:border-[#243556]',
              )}
            >
              <p className={clsx('font-semibold text-sm mb-1', archetype === a ? 'text-white' : 'text-slate-400')}>
                {ARCHETYPE_LABELS[a]}
              </p>
              <p className="text-xs text-slate-600">{ARCHETYPE_DESCRIPTIONS[a]}</p>
              <p className="text-xs mt-2 font-mono">
                <span className="text-slate-700">Baseline: </span>
                <span className={archetype === a ? 'text-slate-300' : 'text-slate-500'}>
                  £{data.archetypes[a].baselineCostGbp.toFixed(0)}/yr
                </span>
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Slider */}
      <div>
        <div className="flex justify-between items-end mb-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">Peak load shifted to off-peak</p>
          <span className="text-2xl font-mono font-bold text-white tabular-nums">{shiftPct}%</span>
        </div>

        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={shiftPct}
          onChange={(e) => setShiftPct(Number(e.target.value))}
          className="w-full"
          style={{
            background: `linear-gradient(to right, #f97316 0%, #f97316 ${shiftPct}%, #0c1525 ${shiftPct}%, #0c1525 100%)`,
          }}
        />

        <div className="flex justify-between font-mono text-[10px] text-slate-700 mt-1.5">
          <span>0% · no change</span>
          <span>50% · smart home</span>
          <span>100% · full auto</span>
        </div>

        <p className="mt-3 text-sm text-slate-500 italic min-h-[20px]">
          {description}
          {shiftedKwhDay > 0 && (
            <span className="text-slate-600 not-italic font-mono">
              {' '}—{' '}
              <span className="text-slate-400">{shiftedKwhDay.toFixed(2)} kWh/day</span> moved off-peak
            </span>
          )}
        </p>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-6 items-start pt-2">
        <SavingsGauge
          annualSavingGbp={saving.annualSavingGbp}
          maxSavingGbp={maxSaving}
          co2SavedKg={saving.co2SavedKg}
        />
        <ShiftImpactBreakdown
          annualSavingGbp={saving.annualSavingGbp}
          co2SavedKg={saving.co2SavedKg}
          gridPeakReductionMW={saving.gridPeakReductionMW}
          baselineCostGbp={baseline}
        />
      </div>

      <p className="font-mono text-[10px] text-slate-700 border-t border-[#1a2540] pt-3">
        Based on Agile Octopus indicative tariff rates. Grid impact assumes 10% adoption across 28M UK households.
        CO₂ savings use peak (250 gCO₂/kWh) vs off-peak (95 gCO₂/kWh) marginal intensity values from Carbon Intensity API data.
      </p>
    </div>
  );
}
