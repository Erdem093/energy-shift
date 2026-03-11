'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, TooltipProps,
} from 'recharts';
import type { NationalDemandData, Season } from '@/lib/types';
import { SEASON_COLORS, SEASON_LABELS } from '@/lib/constants';

interface SeasonalComparisonProps {
  data: NationalDemandData;
}

const SEASONS: Season[] = ['winter', 'spring', 'summer', 'autumn'];

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900/95 border border-slate-700/60 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-slate-400 mb-1.5">{label}</p>
      {payload.map(p => (
        <p key={p.name} className="mb-0.5" style={{ color: p.stroke }}>
          {p.name}: <span className="font-semibold">{(p.value as number).toFixed(0)}%</span>
        </p>
      ))}
    </div>
  );
}

export default function SeasonalComparison({ data }: SeasonalComparisonProps) {
  // Combine all seasons into one dataset by period
  const combinedData = Array.from({ length: 48 }, (_, i) => {
    const point: Record<string, number | string> = {
      time: data.seasonal.winter.profile[i]?.time ?? `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 === 0 ? '00' : '30'}`,
    };
    for (const season of SEASONS) {
      point[season] = data.seasonal[season].profile[i]?.normalised ?? 0;
    }
    return point;
  });

  const xTicks = combinedData.filter((_, i) => i % 8 === 0).map(d => d.time as string);

  return (
    <div className="w-full">
      <p className="text-xs text-slate-500 mb-4">
        Demand profiles normalised to each day&apos;s peak (100%) — reveals when demand is highest relative to capacity.
      </p>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={combinedData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.12)" />
          <XAxis
            dataKey="time"
            ticks={xTicks}
            tick={{ fill: '#64748b', fontSize: 10 }}
            axisLine={{ stroke: '#1e293b' }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={v => `${v}%`}
            tick={{ fill: '#64748b', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            domain={[40, 105]}
            width={38}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) => (
              <span style={{ color: SEASON_COLORS[value as Season], fontSize: 11 }}>
                {SEASON_LABELS[value as Season]}
              </span>
            )}
          />
          {SEASONS.map(season => (
            <Line
              key={season}
              type="monotone"
              dataKey={season}
              stroke={SEASON_COLORS[season]}
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={true}
              animationDuration={800}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      <p className="text-xs text-slate-600 mt-2 text-right">Source: Elexon BMRS API</p>
    </div>
  );
}
