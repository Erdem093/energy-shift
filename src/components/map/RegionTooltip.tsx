'use client';

import type { RegionalData } from '@/lib/types';
import { FUEL_COLORS, FUEL_LABELS, SEASON_LABELS } from '@/lib/constants';
import { ciToColor } from '@/lib/colorScale';

interface RegionTooltipProps {
  region: RegionalData | null;
}

export default function RegionTooltip({ region }: RegionTooltipProps) {
  if (!region) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[220px] text-slate-700 gap-2">
        <svg className="w-6 h-6 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
        </svg>
        <span className="font-mono text-[10px] uppercase tracking-wider">Select a region</span>
      </div>
    );
  }

  const color = ciToColor(region.avgCI);
  const topFuels = Object.entries(region.generationMix)
    .filter(([, v]) => v > 1)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }} />
          <h4 className="font-semibold text-slate-100 text-sm">{region.shortName}</h4>
        </div>
        <p className="text-xs text-slate-500 pl-4">{region.dnoRegion}</p>
      </div>

      {/* Carbon intensity */}
      <div className="bg-[#030712] border border-[#1a2540] rounded-lg p-3">
        <p className="text-[10px] uppercase tracking-wider text-slate-600 mb-1">Annual avg CI</p>
        <p className="text-2xl font-mono font-bold" style={{ color }}>{region.avgCI}</p>
        <p className="text-[10px] font-mono text-slate-700">gCO₂/kWh</p>
        <div className="flex gap-3 mt-2 font-mono text-[10px]">
          <span className="text-slate-600">Min: <span className="text-cyan-400">{region.minCI}</span></span>
          <span className="text-slate-600">Max: <span className="text-red-400">{region.maxCI}</span></span>
        </div>
      </div>

      {/* Seasonal CI */}
      <div>
        <p className="text-[10px] uppercase tracking-wider text-slate-600 mb-2">Seasonal avg</p>
        <div className="grid grid-cols-2 gap-1.5">
          {(Object.entries(region.seasonal) as [string, { avgCI: number }][]).map(([season, d]) => (
            <div key={season} className="bg-[#030712] border border-[#1a2540] rounded-lg px-2 py-1.5">
              <p className="text-[10px] uppercase tracking-wider text-slate-700">{(SEASON_LABELS[season] ?? season).split(' ')[0]}</p>
              <p className="text-sm font-mono font-semibold" style={{ color: ciToColor(d.avgCI) }}>{d.avgCI}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Generation mix */}
      {topFuels.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wider text-slate-600 mb-2">Generation mix</p>
          <div className="space-y-1.5">
            {topFuels.map(([fuel, perc]) => (
              <div key={fuel} className="flex items-center gap-2 text-xs">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: FUEL_COLORS[fuel] ?? '#475569' }} />
                <span className="text-slate-500 flex-1">{FUEL_LABELS[fuel] ?? fuel}</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-14 h-1 rounded-full bg-[#1a2540]">
                    <div className="h-1 rounded-full" style={{ width: `${Math.min(perc, 100)}%`, backgroundColor: FUEL_COLORS[fuel] ?? '#475569' }} />
                  </div>
                  <span className="font-mono text-slate-600 tabular-nums w-8 text-right">{perc.toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
