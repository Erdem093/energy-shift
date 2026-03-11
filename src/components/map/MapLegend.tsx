'use client';

export default function MapLegend() {
  return (
    <div className="flex items-center gap-3 mt-3">
      <span className="font-mono text-[10px] text-slate-600">0</span>
      <div
        className="flex-1 h-1.5 rounded-full"
        style={{ background: 'linear-gradient(to right, #334155, #f97316, #ef4444)' }}
      />
      <span className="font-mono text-[10px] text-slate-600">400 gCO₂/kWh</span>
    </div>
  );
}
