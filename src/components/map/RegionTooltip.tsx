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
      <div className="flex flex-col items-center justify-center h-full min-h-[220px] text-slate-600 text-sm">
        <svg className="w-8 h-8 mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.869V19.13a1 1 0 01-1.447.894L15 18M3 8.869A1 1 0 013.447 8l10.106 4.612a1 1 0 010 1.776L3.447 19A1 1 0 013 18.131V8.869z" />
        </svg>
        <span>Click a region to explore</span>
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
      <div className="bg-slate-800/60 rounded-xl p-3">
        <p className="text-xs text-slate-500 mb-1">Annual avg carbon intensity</p>
        <p className="text-2xl font-bold" style={{ color }}>{region.avgCI}</p>
        <p className="text-xs text-slate-600">gCO₂/kWh</p>
        <div className="flex gap-3 mt-2 text-xs">
          <span className="text-slate-500">Min: <span className="text-cyan-400">{region.minCI}</span></span>
          <span className="text-slate-500">Max: <span className="text-red-400">{region.maxCI}</span></span>
        </div>
      </div>

      {/* Seasonal CI */}
      <div>
        <p className="text-xs text-slate-500 mb-2">Seasonal average</p>
        <div className="grid grid-cols-2 gap-1.5">
          {(Object.entries(region.seasonal) as [string, { avgCI: number }][]).map(([season, d]) => (
            <div key={season} className="bg-slate-800/40 rounded-lg px-2 py-1.5">
              <p className="text-xs text-slate-500">{(SEASON_LABELS[season] ?? season).split(' ')[0]}</p>
              <p className="text-sm font-semibold" style={{ color: ciToColor(d.avgCI) }}>{d.avgCI}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Generation mix */}
      {topFuels.length > 0 && (
        <div>
          <p className="text-xs text-slate-500 mb-2">Generation mix</p>
          <div className="space-y-1.5">
            {topFuels.map(([fuel, perc]) => (
              <div key={fuel} className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: FUEL_COLORS[fuel] ?? '#64748b' }} />
                <span className="text-slate-400 flex-1">{FUEL_LABELS[fuel] ?? fuel}</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-16 h-1 rounded-full bg-slate-800">
                    <div className="h-1 rounded-full" style={{ width: `${Math.min(perc, 100)}%`, backgroundColor: FUEL_COLORS[fuel] ?? '#64748b' }} />
                  </div>
                  <span className="text-slate-500 tabular-nums w-8 text-right">{perc.toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
