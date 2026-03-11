'use client';

import { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, TooltipProps } from 'recharts';
import type { FuelMixData, Season } from '@/lib/types';
import { FUEL_COLORS, FUEL_LABELS, SEASON_LABELS } from '@/lib/constants';
import { clsx } from 'clsx';

interface FuelMixDonutProps {
  data: FuelMixData;
}

type ViewMode = 'current' | Season;

function CustomTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="bg-[#070d18] border border-[#1a2540] rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="font-semibold mb-0.5" style={{ color: item.payload.color }}>{item.payload.label}</p>
      <p className="font-mono text-slate-300">{item.value?.toFixed(1)}%</p>
    </div>
  );
}

export default function FuelMixDonut({ data }: FuelMixDonutProps) {
  const [view, setView] = useState<ViewMode>('current');

  const mixData = view === 'current'
    ? data.nationalMix.current
    : data.nationalMix.seasonal[view as Season];

  const chartData = Object.entries(mixData)
    .filter(([, v]) => v > 0.5)
    .sort(([, a], [, b]) => b - a)
    .map(([fuel, perc]) => ({
      name: fuel,
      label: FUEL_LABELS[fuel] ?? fuel,
      value: perc,
      color: FUEL_COLORS[fuel] ?? '#64748b',
    }));

  const renewables = (mixData.wind ?? 0) + (mixData.solar ?? 0) + (mixData.hydro ?? 0) + (mixData.biomass ?? 0);
  const lowCarbon = renewables + (mixData.nuclear ?? 0);

  return (
    <div className="w-full">
      {/* View selector */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {(['current', 'winter', 'summer'] as ViewMode[]).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={clsx(
              'px-2.5 py-1 rounded-md text-[11px] font-mono font-medium transition-all duration-150 border',
              view === v
                ? 'bg-blue-500/15 border-blue-500/40 text-blue-300'
                : 'bg-[#0c1525] border-[#1a2540] text-slate-500 hover:text-slate-300 hover:border-[#2a3f60]',
            )}
          >
            {v === 'current' ? 'Today' : SEASON_LABELS[v].split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Donut chart */}
      <div className="relative">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={95}
              paddingAngle={1}
              dataKey="value"
              isAnimationActive={true}
              animationDuration={700}
            >
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} stroke="rgba(2,6,23,0.5)" strokeWidth={1} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Centre text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-mono font-bold text-emerald-400">{renewables.toFixed(0)}%</span>
          <span className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wider">renewable</span>
          <span className="text-[10px] text-slate-600 mt-0.5 font-mono">{lowCarbon.toFixed(0)}% low-C</span>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-3">
        {chartData.slice(0, 8).map(item => (
          <div key={item.name} className="flex items-center gap-2 text-xs">
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
            <span className="text-slate-500 truncate">{item.label}</span>
            <span className="ml-auto font-mono text-slate-600 tabular-nums">{item.value.toFixed(1)}%</span>
          </div>
        ))}
      </div>

      <p className="font-mono text-[10px] text-slate-700 mt-3">Source: Carbon Intensity API · National Grid ESO</p>
    </div>
  );
}
