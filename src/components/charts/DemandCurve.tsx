'use client';

import { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceArea, TooltipProps,
} from 'recharts';
import { clsx } from 'clsx';
import type { NationalDemandData, Season } from '@/lib/types';
import { SEASON_COLORS, SEASON_LABELS } from '@/lib/constants';

interface DemandCurveProps {
  data: NationalDemandData;
}

const SEASONS: Season[] = ['winter', 'spring', 'summer', 'autumn'];

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const demand = payload[0]?.value;
  return (
    <div className="bg-[#070d18] border border-[#1a2540] rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="font-mono text-slate-500 mb-1">{label}</p>
      <p className="font-mono font-semibold text-blue-400">{demand ? `${(demand / 1000).toFixed(1)} GW` : '—'}</p>
    </div>
  );
}

export default function DemandCurve({ data }: DemandCurveProps) {
  const [activeSeason, setActiveSeason] = useState<Season>('winter');
  const seasonData = data.seasonal[activeSeason];
  const color = SEASON_COLORS[activeSeason];

  const { startTime, endTime } = seasonData.peakWindow;

  // X-axis ticks every 4 periods (2 hours)
  const xTicks = seasonData.profile
    .filter(d => (d.period - 1) % 8 === 0)
    .map(d => d.time);

  return (
    <div className="w-full">
      {/* Season tabs */}
      <div className="flex gap-1.5 mb-5 flex-wrap">
        {SEASONS.map(s => (
          <button
            key={s}
            onClick={() => setActiveSeason(s)}
            className={clsx(
              'px-3 py-1.5 rounded-md text-[11px] font-mono font-medium transition-all duration-150 border',
              activeSeason === s
                ? 'text-[#030712] border-transparent'
                : 'bg-[#0c1525] border-[#1a2540] text-slate-500 hover:text-slate-300 hover:border-[#2a3f60]',
            )}
            style={activeSeason === s ? { backgroundColor: SEASON_COLORS[s], borderColor: SEASON_COLORS[s] } : {}}
          >
            {SEASON_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Key stats row */}
      <div className="flex flex-wrap gap-6 mb-4">
        {[
          { label: 'Peak', value: `${(seasonData.peakDemandMW / 1000).toFixed(1)} GW`, color },
          { label: 'Overnight min', value: `${(seasonData.minDemandMW / 1000).toFixed(1)} GW`, color: '#94a3b8' },
          { label: 'Peak window', value: `${startTime}–${endTime}`, color: '#ef4444' },
          { label: 'Peak/trough', value: `${(seasonData.peakDemandMW / seasonData.minDemandMW).toFixed(1)}×`, color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} className="text-xs">
            <span className="text-slate-600 mr-1.5">{s.label}</span>
            <span className="font-mono font-semibold" style={{ color: s.color }}>{s.value}</span>
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={seasonData.profile} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`areaGrad-${activeSeason}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,37,64,0.9)" />

          <ReferenceArea x1="00:00" x2="07:00" fill="rgba(16,185,129,0.05)" stroke="rgba(16,185,129,0.2)" strokeWidth={1} label={{ value: 'Cheapest', position: 'insideTopLeft', fill: '#10b981', fontSize: 10 }} />
          <ReferenceArea x1={startTime} x2={endTime} fill="rgba(239,68,68,0.07)" stroke="rgba(239,68,68,0.25)" strokeWidth={1} label={{ value: 'Peak', position: 'insideTopRight', fill: '#ef4444', fontSize: 10 }} />

          <XAxis
            dataKey="time"
            ticks={xTicks}
            tick={{ fill: '#475569', fontSize: 10, fontFamily: 'var(--font-fira)' }}
            axisLine={{ stroke: '#1a2540' }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={v => `${(v / 1000).toFixed(0)}GW`}
            tick={{ fill: '#475569', fontSize: 10, fontFamily: 'var(--font-fira)' }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip content={<CustomTooltip />} />

          <Area
            type="monotone"
            dataKey="demandMW"
            stroke={color}
            strokeWidth={2}
            fill={`url(#areaGrad-${activeSeason})`}
            isAnimationActive={true}
            animationDuration={600}
          />
        </AreaChart>
      </ResponsiveContainer>

      <p className="font-mono text-[10px] text-slate-700 mt-2 text-right">
        Source: Elexon BMRS · {seasonData.label}
      </p>
    </div>
  );
}
