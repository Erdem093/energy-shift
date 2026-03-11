'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, TooltipProps } from 'recharts';
import type { RegionalIntensityData } from '@/lib/types';
import { ciToColor } from '@/lib/colorScale';

interface RegionalHeatmapProps {
  data: RegionalIntensityData;
  onRegionSelect?: (regionId: number) => void;
  selectedRegionId?: number | null;
}

function CustomTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="bg-slate-900/95 border border-slate-700/60 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-slate-300 font-semibold mb-1">{item.payload.shortName}</p>
      <p style={{ color: ciToColor(item.value as number) }} className="font-bold">
        {item.value} gCO₂/kWh avg
      </p>
    </div>
  );
}

export default function RegionalHeatmap({ data, onRegionSelect, selectedRegionId }: RegionalHeatmapProps) {
  const sorted = [...data.regions].sort((a, b) => a.avgCI - b.avgCI);

  const chartData = sorted.map(r => ({
    regionId: r.regionId,
    shortName: r.shortName.length > 18 ? r.shortName.slice(0, 16) + '…' : r.shortName,
    fullName: r.shortName,
    avgCI: r.avgCI,
  }));

  return (
    <div className="w-full">
      <p className="text-xs text-slate-500 mb-4">
        Annual average carbon intensity by DNO region — Scotland dominates renewables, Midlands relies more on gas.
      </p>

      <ResponsiveContainer width="100%" height={320}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 0, right: 20, left: 8, bottom: 0 }}
          onClick={(e) => {
            if (e?.activePayload?.[0]?.payload?.regionId) {
              onRegionSelect?.(e.activePayload[0].payload.regionId);
            }
          }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(100,116,139,0.12)" />
          <XAxis
            type="number"
            tick={{ fill: '#64748b', fontSize: 10 }}
            axisLine={{ stroke: '#1e293b' }}
            tickLine={false}
            tickFormatter={v => `${v}`}
            label={{ value: 'gCO₂/kWh', position: 'insideBottomRight', offset: -5, fill: '#475569', fontSize: 10 }}
          />
          <YAxis
            type="category"
            dataKey="shortName"
            tick={{ fill: '#94a3b8', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={120}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Bar dataKey="avgCI" radius={[0, 4, 4, 0]} isAnimationActive animationDuration={600}>
            {chartData.map((entry) => (
              <Cell
                key={entry.regionId}
                fill={ciToColor(entry.avgCI)}
                opacity={selectedRegionId === entry.regionId ? 1 : 0.75}
                style={{ cursor: 'pointer' }}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="text-xs text-slate-600 mt-1 text-right">Source: Carbon Intensity API · 4 seasonal days</p>
    </div>
  );
}
