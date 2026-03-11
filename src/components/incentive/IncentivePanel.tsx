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
      <div className="flex gap-4 flex-wrap text-xs">
        <div className="bg-slate-800/60 border border-slate-700/40 rounded-lg px-3 py-2">
          <span className="text-slate-500">Peak rate </span>
          <span className="text-red-400 font-semibold">{TARIFF.peakRate}p/kWh</span>
          <span className="text-slate-600"> ({TARIFF.peakWindow})</span>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/40 rounded-lg px-3 py-2">
          <span className="text-slate-500">Off-peak rate </span>
          <span className="text-cyan-400 font-semibold">{TARIFF.offpeakRate}p/kWh</span>
          <span className="text-slate-600"> ({TARIFF.offpeakWindow})</span>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/40 rounded-lg px-3 py-2">
          <span className="text-slate-500">Tariff </span>
          <span className="text-slate-300 font-medium">{data.tariff.name}</span>
        </div>
      </div>

      {/* Archetype selector */}
      <div>
        <p className="text-xs text-slate-500 mb-3 uppercase tracking-wider">Your household profile</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {ARCHETYPES.map((a) => (
            <button
              key={a}
              onClick={() => setArchetype(a)}
              className={clsx(
                'text-left p-4 rounded-xl border transition-all duration-200',
                archetype === a
                  ? 'bg-cyan-500/10 border-cyan-400/50 shadow-[0_0_20px_rgba(0,255,245,0.08)]'
                  : 'bg-slate-800/40 border-slate-700/40 hover:border-slate-600/60 hover:bg-slate-800/60',
              )}
            >
              <p className={clsx('font-semibold text-sm mb-1', archetype === a ? 'text-cyan-300' : 'text-slate-300')}>
                {ARCHETYPE_LABELS[a]}
              </p>
              <p className="text-xs text-slate-500">{ARCHETYPE_DESCRIPTIONS[a]}</p>
              <p className="text-xs mt-2">
                <span className="text-slate-600">Baseline: </span>
                <span className={archetype === a ? 'text-cyan-400' : 'text-slate-400'}>
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
          <p className="text-xs text-slate-500 uppercase tracking-wider">Peak load shifted to off-peak</p>
          <span className="text-2xl font-bold text-cyan-400 tabular-nums">{shiftPct}%</span>
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
            background: `linear-gradient(to right, #00fff5 0%, #00fff5 ${shiftPct}%, #1e293b ${shiftPct}%, #1e293b 100%)`,
          }}
        />

        <div className="flex justify-between text-xs text-slate-600 mt-1">
          <span>0% (no change)</span>
          <span>50% (smart home)</span>
          <span>100% (full automation)</span>
        </div>

        <p className="mt-3 text-sm text-slate-400 italic min-h-[20px]">
          {description}
          {shiftedKwhDay > 0 && (
            <span className="text-slate-600 not-italic">
              {' '}—{' '}
              <span className="text-cyan-500">{shiftedKwhDay.toFixed(2)} kWh/day</span> moved off-peak
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

      <p className="text-xs text-slate-600 border-t border-slate-800 pt-3">
        Based on Agile Octopus indicative tariff rates. Grid impact assumes 10% adoption across 28M UK households.
        CO₂ savings use peak (250 gCO₂/kWh) vs off-peak (95 gCO₂/kWh) marginal intensity values from Carbon Intensity API data.
      </p>
    </div>
  );
}
