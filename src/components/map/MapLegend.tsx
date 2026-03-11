'use client';

export default function MapLegend() {
  return (
    <div className="flex items-center gap-3 mt-3">
      <span className="text-xs text-slate-500">Low CO₂</span>
      <div
        className="flex-1 h-2 rounded-full"
        style={{
          background: 'linear-gradient(to right, #00fff5, #f59e0b, #ef4444)',
        }}
      />
      <span className="text-xs text-slate-500">High CO₂</span>
      <div className="flex items-center gap-1 ml-3">
        <span className="text-xs text-slate-600">0</span>
        <span className="text-xs text-slate-600 mx-1">—</span>
        <span className="text-xs text-slate-600">150</span>
        <span className="text-xs text-slate-600 mx-1">—</span>
        <span className="text-xs text-slate-600">400 gCO₂/kWh</span>
      </div>
    </div>
  );
}
