'use client';

import { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceArea, ReferenceLine, TooltipProps,
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
    <div className="bg-slate-900/95 border border-slate-700/60 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-slate-400 mb-1">{label}</p>
      <p className="text-cyan-400 font-semibold">{demand ? `${(demand / 1000).toFixed(1)} GW` : '—'}</p>
    </div>
  );
}

export default function DemandCurve({ data }: DemandCurveProps) {
  const [activeSeason, setActiveSeason] = useState<Season>('winter');
  const seasonData = data.seasonal[activeSeason];
  const color = SEASON_COLORS[activeSeason];

  const { startPeriod, endPeriod, startTime, endTime } = seasonData.peakWindow;

  // X-axis ticks every 4 periods (2 hours)
  const xTicks = seasonData.profile
    .filter(d => (d.period - 1) % 8 === 0)
    .map(d => d.time);

  return (
    <div className="w-full">
      {/* Season tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {SEASONS.map(s => (
          <button
            key={s}
            onClick={() => setActiveSeason(s)}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border',
              activeSeason === s
                ? 'text-slate-900 border-transparent'
                : 'bg-slate-800/60 border-slate-700/40 text-slate-400 hover:text-slate-200 hover:border-slate-600',
            )}
            style={activeSeason === s ? { backgroundColor: SEASON_COLORS[s], borderColor: SEASON_COLORS[s] } : {}}
          >
            {SEASON_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Key stats row */}
      <div className="flex gap-6 mb-4 text-xs">
        <div>
          <span className="text-slate-500">Peak</span>
          <span className="ml-2 font-semibold" style={{ color }}>{(seasonData.peakDemandMW / 1000).toFixed(1)} GW</span>
        </div>
        <div>
          <span className="text-slate-500">Overnight min</span>
          <span className="ml-2 font-semibold text-slate-300">{(seasonData.minDemandMW / 1000).toFixed(1)} GW</span>
        </div>
        <div>
          <span className="text-slate-500">Peak window</span>
          <span className="ml-2 font-semibold text-red-400">{startTime}–{endTime}</span>
        </div>
        <div>
          <span className="text-slate-500">Peak/trough ratio</span>
          <span className="ml-2 font-semibold text-amber-400">
            {(seasonData.peakDemandMW / seasonData.minDemandMW).toFixed(1)}×
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={seasonData.profile} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`areaGrad-${activeSeason}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.12)" />

          {/* Off-peak window (cheapest) */}
          <ReferenceArea x1="00:00" x2="07:00" fill="rgba(74,222,128,0.05)" stroke="rgba(74,222,128,0.2)" strokeWidth={1} label={{ value: 'Cheapest', position: 'insideTopLeft', fill: '#4ade80', fontSize: 10 }} />

          {/* Peak demand window */}
          <ReferenceArea x1={startTime} x2={endTime} fill="rgba(239,68,68,0.08)" stroke="rgba(239,68,68,0.3)" strokeWidth={1} label={{ value: 'Peak', position: 'insideTopRight', fill: '#ef4444', fontSize: 10 }} />

          <XAxis
            dataKey="time"
            ticks={xTicks}
            tick={{ fill: '#64748b', fontSize: 10 }}
            axisLine={{ stroke: '#1e293b' }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={v => `${(v / 1000).toFixed(0)}GW`}
            tick={{ fill: '#64748b', fontSize: 10 }}
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

      <p className="text-xs text-slate-600 mt-2 text-right">
        Source: Elexon BMRS · {seasonData.label}
      </p>
    </div>
  );
}
