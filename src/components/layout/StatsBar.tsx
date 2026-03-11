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

  const stats = [
    { label: 'National CI', value: `${snapshot.ci} gCO₂/kWh`, color: ciToColor(snapshot.ci), highlight: true },
    { label: 'Grid status', value: snapshot.index.toUpperCase(), color: ciColor },
    { label: 'Renewables', value: `${renewablePct.toFixed(1)}%`, color: '#22d3ee' },
    { label: 'Peak saving potential', value: `Up to £${Math.round(peakSavingGbp)}/yr`, color: '#4ade80' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 h-11 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <span className="text-cyan-400 font-bold text-sm tracking-tight">⚡ ENERGY SHIFT</span>
          <span className="hidden sm:inline text-slate-600 text-xs">UK Demand Behaviour Analysis</span>
        </div>

        {/* Stats pills */}
        <div className="flex items-center gap-1 sm:gap-3 overflow-x-auto">
          {stats.map((s, i) => (
            <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-900/60 border border-slate-800/60 flex-shrink-0">
              <span className="hidden sm:inline text-xs text-slate-600">{s.label}</span>
              <span className="text-xs font-semibold tabular-nums" style={{ color: s.color }}>{s.value}</span>
            </div>
          ))}

          {/* Live indicator */}
          <div className="flex items-center gap-1.5 ml-1">
            <GlowDot color="cyan" size="sm" />
            <span className="text-xs text-slate-600 hidden sm:inline">Live</span>
          </div>
        </div>
      </div>
    </header>
  );
}
