'use client';

import GlowDot from '@/components/ui/GlowDot';
import type { NationalSnapshot } from '@/lib/types';
import { ciToColor } from '@/lib/colorScale';
import { CI_INDEX_COLORS } from '@/lib/constants';

interface StatsBarProps {
  snapshot: NationalSnapshot;
  peakSavingGbp: number;
}

export default function StatsBar({ snapshot, peakSavingGbp }: StatsBarProps) {
  const renewablePct = (
    (snapshot.generationMix.wind ?? 0) +
    (snapshot.generationMix.solar ?? 0) +
    (snapshot.generationMix.hydro ?? 0) +
    (snapshot.generationMix.biomass ?? 0)
  );

  const ciColor = CI_INDEX_COLORS[snapshot.index] ?? '#f59e0b';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-[#1a2540] bg-[#030712]/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 h-10 flex items-center justify-between">

        {/* Brand */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-1 h-4 bg-blue-500 rounded-sm flex-shrink-0" />
            <span className="font-mono font-bold text-sm text-white tracking-tight">
              ENERGY<span className="text-blue-400">SHIFT</span>
            </span>
          </div>
          <span className="hidden md:block text-[#1a2540] select-none">│</span>
          <span className="hidden md:block text-[10px] tracking-widest text-slate-600 uppercase">UK Demand Analysis</span>
        </div>

        {/* Stats row */}
        <div className="flex items-center divide-x divide-[#1a2540] overflow-x-auto">

          <div className="flex items-center gap-2 px-3 h-10">
            <span className="hidden sm:block text-[10px] uppercase tracking-wider text-slate-600">CI</span>
            <span className="font-mono text-xs font-semibold tabular-nums" style={{ color: ciToColor(snapshot.ci) }}>
              {snapshot.ci}
              <span className="text-slate-600 font-normal"> gCO₂</span>
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 h-10">
            <span className="hidden sm:block text-[10px] uppercase tracking-wider text-slate-600">Grid</span>
            <span className="font-mono text-xs font-bold uppercase" style={{ color: ciColor }}>
              {snapshot.index}
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 h-10">
            <span className="hidden sm:block text-[10px] uppercase tracking-wider text-slate-600">Renewable</span>
            <span className="font-mono text-xs font-semibold text-emerald-400">{renewablePct.toFixed(1)}%</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3 h-10">
            <span className="text-[10px] uppercase tracking-wider text-slate-600">Peak saving</span>
            <span className="font-mono text-xs font-semibold text-amber-400">£{Math.round(peakSavingGbp)}/yr</span>
          </div>

          <div className="flex items-center gap-2 px-3 h-10">
            <GlowDot color="cyan" size="sm" />
            <span className="hidden sm:block text-[10px] uppercase tracking-wider text-slate-600">Live</span>
          </div>

        </div>
      </div>
    </header>
  );
}
