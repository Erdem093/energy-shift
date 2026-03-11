'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

import type { RegionalIntensityData, NationalDemandData, FuelMixData, IncentiveModelData, RegionalData } from '@/lib/types';
import GlassCard from '@/components/ui/GlassCard';
import StatsBar from '@/components/layout/StatsBar';
import DemandCurve from '@/components/charts/DemandCurve';
import FuelMixDonut from '@/components/charts/FuelMixDonut';
import SeasonalComparison from '@/components/charts/SeasonalComparison';
import RegionalHeatmap from '@/components/charts/RegionalHeatmap';
import RegionTooltip from '@/components/map/RegionTooltip';
import MapLegend from '@/components/map/MapLegend';
import IncentivePanel from '@/components/incentive/IncentivePanel';

// D3 map must be client-only (no SSR)
const UKRegionalMap = dynamic(() => import('@/components/map/UKRegionalMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full" style={{ paddingBottom: '130%', position: 'relative' }}>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-slate-600 text-sm animate-pulse">Loading map…</div>
      </div>
    </div>
  ),
});

export default function Home() {
  const [regionalData, setRegionalData] = useState<RegionalIntensityData | null>(null);
  const [demandData, setDemandData] = useState<NationalDemandData | null>(null);
  const [fuelData, setFuelData] = useState<FuelMixData | null>(null);
  const [incentiveData, setIncentiveData] = useState<IncentiveModelData | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<RegionalData | null>(null);
  const [selectedRegionId, setSelectedRegionId] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/data/regional_intensity.json').then(r => r.json()),
      fetch('/data/national_demand.json').then(r => r.json()),
      fetch('/data/fuel_mix.json').then(r => r.json()),
      fetch('/data/incentive_model.json').then(r => r.json()),
    ]).then(([regional, demand, fuel, incentive]) => {
      setRegionalData(regional);
      setDemandData(demand);
      setFuelData(fuel);
      setIncentiveData(incentive);
    }).catch(console.error);
  }, []);

  const handleRegionSelect = (region: RegionalData | null) => {
    setSelectedRegion(region);
    setSelectedRegionId(region?.regionId ?? null);
  };

  const handleHeatmapSelect = (regionId: number) => {
    if (!regionalData) return;
    const region = regionalData.regions.find(r => r.regionId === regionId) ?? null;
    setSelectedRegion(region);
    setSelectedRegionId(regionId);
  };

  const peakSaving = incentiveData
    ? incentiveData.archetypes.comfortable.shiftSavings[50]?.annualSavingGbp ?? 95
    : 95;

  return (
    <main className="min-h-screen">
      {/* Fixed top stats bar */}
      {regionalData && (
        <StatsBar snapshot={regionalData.nationalSnapshot} peakSavingGbp={peakSaving} />
      )}

      <div className="max-w-7xl mx-auto px-4 pt-20 pb-16 space-y-6">

        {/* ── Hero ── */}
        <section className="py-10 text-center">
          <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-4 py-1.5 text-xs text-cyan-400 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Real-time data · Carbon Intensity API · Elexon BMRS
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white mb-4">
            UK Energy{' '}
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #00fff5, #22d3ee, #60a5fa)' }}>
              Demand Shift
            </span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-6">
            Analysing when British households use electricity, the carbon cost of peak demand,
            and exactly what financial incentive it takes to change behaviour.
          </p>
          <div className="flex justify-center gap-3 flex-wrap">
            {[
              { label: '14 DNO regions', color: 'cyan' },
              { label: 'Half-hourly data', color: 'cyan' },
              { label: '4 seasonal profiles', color: 'cyan' },
              { label: 'Interactive incentive model', color: 'green' },
            ].map(b => (
              <span key={b.label} className={`text-xs border rounded-full px-3 py-1 ${b.color === 'green' ? 'border-green-500/30 text-green-400 bg-green-500/5' : 'border-cyan-500/30 text-cyan-400 bg-cyan-500/5'}`}>
                {b.label}
              </span>
            ))}
          </div>
        </section>

        {/* ── Map + Fuel Mix ── */}
        {regionalData && fuelData && (
          <section className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">

            {/* Map card */}
            <GlassCard className="p-5" glow="cyan">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">
                  Regional Carbon Intensity
                </h2>
                <span className="text-xs text-slate-600">Annual average · gCO₂/kWh</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-[1fr_220px] gap-4">
                {/* Map */}
                <div>
                  <UKRegionalMap
                    data={regionalData}
                    selectedRegionId={selectedRegionId}
                    onRegionSelect={handleRegionSelect}
                  />
                  <MapLegend />
                </div>

                {/* Region detail panel */}
                <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl overflow-hidden">
                  <RegionTooltip region={selectedRegion} />
                </div>
              </div>
            </GlassCard>

            {/* Fuel mix */}
            <GlassCard className="p-5" glow="cyan">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400 mb-4">
                GB Generation Mix
              </h2>
              <FuelMixDonut data={fuelData} />
            </GlassCard>
          </section>
        )}

        {/* ── Demand Curve ── */}
        {demandData && (
          <GlassCard className="p-5" glow="cyan">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400 mb-1">
              National Demand Profile
            </h2>
            <p className="text-xs text-slate-600 mb-5">
              GB electricity demand across a 24-hour period. The evening peak (red zone) costs 5× more than overnight — the core case for time-of-use tariffs.
            </p>
            <DemandCurve data={demandData} />
          </GlassCard>
        )}

        {/* ── Seasonal + Regional ── */}
        {demandData && regionalData && (
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GlassCard className="p-5" glow="cyan">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400 mb-1">
                Seasonal Shape Comparison
              </h2>
              <SeasonalComparison data={demandData} />
            </GlassCard>

            <GlassCard className="p-5" glow="amber">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400 mb-1">
                Carbon Intensity by Region
              </h2>
              <RegionalHeatmap
                data={regionalData}
                onRegionSelect={handleHeatmapSelect}
                selectedRegionId={selectedRegionId}
              />
            </GlassCard>
          </section>
        )}

        {/* ── Incentive Model ── */}
        {incentiveData && (
          <GlassCard className="p-5 sm:p-7" glow="green">
            <div className="mb-6">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400 mb-1">
                ⚡ Demand Shift Incentive Calculator
              </h2>
              <p className="text-xs text-slate-500 max-w-2xl">
                How much does a household save by shifting load from peak (16:00–19:00) to off-peak (00:00–07:00)?
                Drag the slider to model different levels of behavioural change — from a single appliance to full home automation.
              </p>
            </div>
            <IncentivePanel data={incentiveData} />
          </GlassCard>
        )}

        {/* ── The Story ── */}
        <GlassCard className="p-6 sm:p-8" glow="none">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400 mb-4">The Analysis</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
            <div>
              <h3 className="text-cyan-400 font-semibold mb-2">Why peak demand matters</h3>
              <p className="text-slate-500 leading-relaxed text-xs">
                UK winter evening demand peaks at 44+ GW — nearly double the overnight minimum.
                The marginal generators brought online to meet this peak are the dirtiest and most expensive.
                Scotland&apos;s grid runs at under 30 gCO₂/kWh; South Wales peaks above 360 gCO₂/kWh in winter.
              </p>
            </div>
            <div>
              <h3 className="text-amber-400 font-semibold mb-2">The commercial case for shifting</h3>
              <p className="text-slate-500 leading-relaxed text-xs">
                On Agile Octopus, peak (16:00–19:00) costs 35p/kWh vs 7p overnight — a 5× differential.
                A comfortable household shifting just 20% of peak load saves ~£38/year with no capital cost.
                Add an EV and battery and that can reach £200+/year.
              </p>
            </div>
            <div>
              <h3 className="text-green-400 font-semibold mb-2">Grid-scale impact</h3>
              <p className="text-slate-500 leading-relaxed text-xs">
                If 10% of UK households shifted 30% of peak load, it would reduce grid peak demand by
                ~500 MW — equivalent to a mid-sized gas peaker plant that would otherwise run for
                just 3 hours a day at high carbon intensity.
              </p>
            </div>
          </div>
        </GlassCard>

        {/* Loading state */}
        {!regionalData && (
          <div className="flex items-center justify-center py-32">
            <div className="text-center space-y-3">
              <div className="w-8 h-8 border-2 border-cyan-500/40 border-t-cyan-500 rounded-full animate-spin mx-auto" />
              <p className="text-slate-600 text-sm">Loading energy data…</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="border-t border-slate-800 pt-6 pb-2 text-center">
          <p className="text-xs text-slate-600">
            Data sources:{' '}
            <span className="text-slate-500">Carbon Intensity API (National Grid ESO)</span>
            {' · '}
            <span className="text-slate-500">Elexon BMRS API</span>
            {' · '}
            <span className="text-slate-500">Agile Octopus indicative tariff rates</span>
          </p>
          <p className="text-xs text-slate-700 mt-1">
            Built to model the analytical case for time-of-use tariff adoption in GB households
          </p>
        </footer>
      </div>
    </main>
  );
}
