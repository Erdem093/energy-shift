'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';

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

const UKRegionalMap = dynamic(() => import('@/components/map/UKRegionalMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full" style={{ paddingBottom: '130%', position: 'relative' }}>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex items-center gap-2 text-slate-600 text-xs font-mono">
          <span className="w-3 h-3 border border-blue-500/40 border-t-blue-500 rounded-full animate-spin" />
          Loading map…
        </div>
      </div>
    </div>
  ),
});

function SectionLabel({ index, label }: { index: string; label: string }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="font-sans text-[10px] text-slate-700 tracking-widest">{index}</span>
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</span>
      <span className="flex-1 h-px bg-[#1a2540]" />
    </div>
  );
}

export default function Home() {
  const [regionalData, setRegionalData] = useState<RegionalIntensityData | null>(null);
  const [demandData, setDemandData] = useState<NationalDemandData | null>(null);
  const [fuelData, setFuelData] = useState<FuelMixData | null>(null);
  const [incentiveData, setIncentiveData] = useState<IncentiveModelData | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<RegionalData | null>(null);
  const [selectedRegionId, setSelectedRegionId] = useState<number | null>(null);
  const [isRegionPanelCollapsed, setIsRegionPanelCollapsed] = useState(false);

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
    if (region) setIsRegionPanelCollapsed(false);
  };

  const handleHeatmapSelect = (regionId: number) => {
    if (!regionalData) return;
    const region = regionalData.regions.find(r => r.regionId === regionId) ?? null;
    setSelectedRegion(region);
    setSelectedRegionId(regionId);
    setIsRegionPanelCollapsed(false);
  };

  const peakSaving = incentiveData
    ? incentiveData.archetypes.comfortable.shiftSavings[50]?.annualSavingGbp ?? 95
    : 95;

  return (
    <main className="min-h-screen">
      {regionalData && (
        <StatsBar snapshot={regionalData.nationalSnapshot} peakSavingGbp={peakSaving} />
      )}

      <div className="max-w-7xl mx-auto px-4 pt-20 pb-16 space-y-8">

        {/* ── Hero ── */}
        <section className="pt-10 pb-4">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 items-start">
            <div>
              <div className="inline-flex items-center gap-2 border border-[#1a2540] bg-[#070d18] rounded-full px-4 py-1.5 text-[10px] font-mono text-slate-500 mb-6 tracking-wider uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse flex-shrink-0" />
                Real-time · Carbon Intensity API · Elexon BMRS
              </div>

              <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-white mb-4 leading-none">
                UK Energy
                <br />
                <span className="text-slate-300">Demand Shift</span>
              </h1>

              <p className="text-slate-400 text-base max-w-xl mb-8 leading-relaxed">
                Analysing when British households use electricity, the carbon cost of peak demand,
                and what financial incentive it takes to change behaviour.
              </p>

              {/* Key stats row */}
              <div className="flex flex-wrap gap-px border border-[#1a2540] rounded-xl overflow-hidden w-fit bg-[#1a2540] mb-8">
                {[
                  { value: '44.7', unit: 'GW', label: 'winter peak', color: 'text-white' },
                  { value: '5×', unit: '', label: 'price differential', color: 'text-white' },
                  { value: '£190', unit: '/yr', label: 'max saving', color: 'text-white' },
                  { value: '14', unit: '', label: 'DNO regions', color: 'text-slate-400' },
                ].map(s => (
                  <div key={s.label} className="bg-[#070d18] px-5 py-3 text-center min-w-[90px]">
                    <p className={`font-mono font-bold text-xl tabular-nums ${s.color}`}>
                      {s.value}<span className="text-xs font-normal">{s.unit}</span>
                    </p>
                    <p className="text-[10px] text-slate-600 uppercase tracking-wider mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {['Half-hourly data', '4 seasonal profiles', 'Interactive incentive model', 'Agile Octopus tariff'].map(tag => (
                  <span key={tag} className="text-[10px] font-mono border border-[#1a2540] text-slate-500 rounded-full px-3 py-1 bg-[#070d18]">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {fuelData && (
              <GlassCard className="p-4 lg:mt-10" glow="none">
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 mb-3">
                  GB Generation Mix
                </div>
                <FuelMixDonut data={fuelData} />
              </GlassCard>
            )}
          </div>
        </section>

        {/* ── Map + Fuel Mix ── */}
        {regionalData && (
          <section>
            <SectionLabel index="// 01" label="Regional Carbon Intensity" />
            <GlassCard className="p-4" glow="none">
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    14 DNO Regions · Annual average
                  </span>
                  <span className="font-mono text-[10px] text-slate-600">gCO₂/kWh</span>
                </div>
                <UKRegionalMap
                  data={regionalData}
                  selectedRegionId={selectedRegionId}
                  onRegionSelect={handleRegionSelect}
                />
                <MapLegend />
                <AnimatePresence mode="wait">
                  {selectedRegion && !isRegionPanelCollapsed && (
                    <motion.div
                      key="region-panel"
                      initial={{ opacity: 0, y: 12, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.97 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      className="absolute right-3 bottom-8 z-10 w-full max-w-[320px] bg-[#0c1525]/95 border border-[#1a2540] rounded-xl overflow-hidden backdrop-blur-sm shadow-[0_8px_24px_rgba(0,0,0,0.45)] max-h-[68%] overflow-y-auto"
                    >
                      <button
                        type="button"
                        onClick={() => setIsRegionPanelCollapsed(true)}
                        className="absolute top-2 right-2 z-20 h-7 w-7 rounded-md border border-[#2a3f60] bg-[#070d18]/80 text-slate-400 hover:text-slate-200 hover:border-[#3a5378] transition-colors"
                        aria-label="Collapse region details"
                      >
                        <svg className="w-4 h-4 mx-auto" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M4 7l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      <RegionTooltip region={selectedRegion} />
                    </motion.div>
                  )}
                </AnimatePresence>
                <AnimatePresence>
                  {selectedRegion && isRegionPanelCollapsed && (
                    <motion.button
                      key="region-panel-expand"
                      type="button"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                      onClick={() => setIsRegionPanelCollapsed(false)}
                      className="absolute right-3 bottom-8 z-10 flex items-center gap-2 text-[10px] font-mono text-slate-300 bg-[#0c1525]/92 border border-[#2a3f60] rounded-lg px-3 py-1.5 hover:border-[#3a5378] transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M4 13l6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Show details
                    </motion.button>
                  )}
                </AnimatePresence>
                {!selectedRegion && (
                  <div className="absolute right-3 bottom-8 z-10 hidden sm:flex items-center gap-2 text-[10px] font-mono text-slate-500 bg-[#0c1525]/90 border border-[#1a2540] rounded-lg px-3 py-1.5 pointer-events-none">
                    Click a region for details
                  </div>
                )}
              </div>
              <div className="mt-3 sm:hidden bg-[#0c1525] border border-[#1a2540] rounded-xl overflow-hidden">
                <div className="text-[10px] font-mono text-slate-600 px-3 pt-2">
                  Tap a region for details
                </div>
                <RegionTooltip region={selectedRegion} />
              </div>
            </GlassCard>
          </section>
        )}

        {/* ── Demand Curve ── */}
        {demandData && (
          <section>
            <SectionLabel index="// 02" label="National Demand Profile" />
            <GlassCard className="p-5" glow="cyan">
              <p className="text-xs text-slate-600 mb-5 max-w-2xl">
                GB electricity demand across a 24-hour period. The evening peak (red zone) costs 5× more than overnight — the core case for time-of-use tariffs.
              </p>
              <DemandCurve data={demandData} />
            </GlassCard>
          </section>
        )}

        {/* ── Seasonal + Regional ── */}
        {demandData && regionalData && (
          <section>
            <SectionLabel index="// 03" label="Seasonal &amp; Regional Analysis" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

              <GlassCard className="p-5" glow="none">
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 mb-1">
                  Seasonal Shape Comparison
                </div>
                <SeasonalComparison data={demandData} />
              </GlassCard>

              <GlassCard className="p-5" glow="amber">
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 mb-1">
                  Carbon Intensity by Region
                </div>
                <RegionalHeatmap
                  data={regionalData}
                  onRegionSelect={handleHeatmapSelect}
                  selectedRegionId={selectedRegionId}
                />
              </GlassCard>

            </div>
          </section>
        )}

        {/* ── Incentive Model ── */}
        {incentiveData && (
          <section>
            <SectionLabel index="// 04" label="Demand Shift Incentive Calculator" />
            <GlassCard className="p-5 sm:p-7" glow="green">
              <p className="text-xs text-slate-600 max-w-2xl mb-6">
                How much does a household save by shifting load from peak (16:00–19:00) to off-peak (00:00–07:00)?
                Drag the slider to model different levels of behavioural change.
              </p>
              <IncentivePanel data={incentiveData} />
            </GlassCard>
          </section>
        )}

        {/* ── The Analysis ── */}
        <section>
          <SectionLabel index="// 05" label="The Analysis" />
          <GlassCard className="p-6 sm:p-8" glow="none">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
              <div>
                <h3 className="text-slate-200 font-semibold mb-2 text-sm">Why peak demand matters</h3>
                <p className="text-slate-500 leading-relaxed text-xs">
                  UK winter evening demand peaks at 44+ GW — nearly double the overnight minimum.
                  The marginal generators brought online to meet this peak are the dirtiest and most expensive.
                  Scotland&apos;s grid runs at under 30 gCO₂/kWh; South Wales peaks above 360 gCO₂/kWh in winter.
                </p>
              </div>
              <div>
                <h3 className="text-slate-200 font-semibold mb-2 text-sm">The commercial case for shifting</h3>
                <p className="text-slate-500 leading-relaxed text-xs">
                  On Agile Octopus, peak (16:00–19:00) costs 35p/kWh vs 7p overnight — a 5× differential.
                  A comfortable household shifting just 20% of peak load saves ~£38/year with no capital cost.
                  Add an EV and battery and that can reach £200+/year.
                </p>
              </div>
              <div>
                <h3 className="text-slate-200 font-semibold mb-2 text-sm">Grid-scale impact</h3>
                <p className="text-slate-500 leading-relaxed text-xs">
                  If 10% of UK households shifted 30% of peak load, it would reduce grid peak demand by
                  ~500 MW — equivalent to a mid-sized gas peaker plant that would otherwise run for
                  just 3 hours a day at high carbon intensity.
                </p>
              </div>
            </div>
          </GlassCard>
        </section>

        {/* Loading */}
        {!regionalData && (
          <div className="flex items-center justify-center py-40">
            <div className="text-center space-y-4">
              <div className="w-8 h-8 border border-slate-700 border-t-slate-400 rounded-full animate-spin mx-auto" />
              <p className="font-mono text-xs text-slate-600 tracking-wider">LOADING ENERGY DATA</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="border-t border-[#1a2540] pt-6 pb-2">
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-[10px] font-mono text-slate-700">
            <span>Source: Carbon Intensity API (National Grid ESO)</span>
            <span>·</span>
            <span>Elexon BMRS API</span>
            <span>·</span>
            <span>Agile Octopus indicative tariff</span>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-mono text-slate-600 mt-2">
            <a
              href="https://github.com/Erdem093"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-300 transition-colors"
            >
              GitHub
            </a>
            <span>·</span>
            <a
              href="https://www.linkedin.com/in/erdem-arslan-b61a992a7/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-300 transition-colors"
            >
              LinkedIn
            </a>
          </div>
          <p className="text-[10px] text-slate-800 font-mono mt-1">
            Built to model the analytical case for time-of-use tariff adoption in GB households
          </p>
        </footer>

      </div>
    </main>
  );
}
