# Energy Shift — Visual Change Guide

This document is written for an LLM (or developer) making **visual/UI changes only**. It describes the project architecture, what is safe to touch, and what must not be changed.

---

## What this project is

A single-page Next.js 14 (App Router, TypeScript) web app deployed on Vercel. It visualises UK electricity demand patterns across 14 DNO regions, shows carbon intensity data, and lets users model the financial savings from shifting household energy use out of peak hours. All data is static JSON — there is no server-side API, no database, no auth.

**Live at:** `https://github.com/Erdem093/energy-shift`

---

## Architecture in one sentence

Python scripts (run locally, not on Vercel) generate static JSON files → committed to `public/data/` → Next.js serves them as CDN-cached assets → React components fetch and render them client-side.

---

## DO NOT TOUCH — backend / data layer

These files generate and define the data. Visual changes should never require editing them.

```
scripts/                          ← Python data pipeline (run locally)
  fetch_carbon_intensity.py
  fetch_demand_profile.py
  process_smart_meter.py
  build_incentive_model.py
  generate_uk_map.py

public/data/                      ← Static JSON (committed, served as CDN assets)
  regional_intensity.json         ← 14 UK DNO regions, CI values, fuel mix, seasonal data
  national_demand.json            ← Half-hourly GB demand, 4 seasons
  fuel_mix.json                   ← GB generation mix (wind/solar/nuclear/gas etc.)
  incentive_model.json            ← Pre-computed savings table, 3 household archetypes
  uk_dno_regions.json             ← GeoJSON for the UK map (69 KB, do not regenerate)

src/lib/types.ts                  ← All TypeScript interfaces — do not change shapes
src/lib/incentive.ts              ← Savings calculation logic
src/lib/colorScale.ts             ← CI value → hex colour interpolation
```

If a JSON file needs to be re-fetched with fresh data, run the Python scripts in `scripts/` using the `.venv` virtualenv, not by editing the frontend.

---

## SAFE TO EDIT — frontend / visual layer

Everything under `src/` except `src/lib/types.ts`, `src/lib/incentive.ts`, and `src/lib/colorScale.ts`.

### File map

```
src/
├── app/
│   ├── globals.css               ← Global styles, CSS variables, Recharts overrides, slider style
│   ├── layout.tsx                ← HTML shell, font (Inter), metadata/SEO
│   └── page.tsx                  ← Page assembly — layout, section order, grid structure
│
├── components/
│   ├── layout/
│   │   └── StatsBar.tsx          ← Fixed top bar: national CI, renewables %, grid status, live dot
│   │
│   ├── map/
│   │   ├── UKRegionalMap.tsx     ← D3 SVG map (client-only). IMPORTANT: see map notes below
│   │   ├── RegionTooltip.tsx     ← Side panel shown when a region is clicked
│   │   └── MapLegend.tsx         ← Gradient bar (cyan → amber → red) with gCO₂/kWh labels
│   │
│   ├── charts/
│   │   ├── DemandCurve.tsx       ← Recharts AreaChart, 48 half-hourly periods, season tabs
│   │   ├── FuelMixDonut.tsx      ← Recharts PieChart donut, generation mix
│   │   ├── SeasonalComparison.tsx ← 4 LineChart overlays, normalised demand shape
│   │   └── RegionalHeatmap.tsx   ← Horizontal BarChart, CI by region, clickable
│   │
│   ├── incentive/
│   │   ├── IncentivePanel.tsx    ← Archetype selector + shift % slider + results layout
│   │   ├── SavingsGauge.tsx      ← Animated SVG circular progress ring, £/year in centre
│   │   └── ShiftImpactBreakdown.tsx ← 3 stat cards: financial / carbon / grid impact
│   │
│   └── ui/
│       ├── GlassCard.tsx         ← Reusable card wrapper (glassmorphism)
│       └── GlowDot.tsx           ← Pulsing live indicator dot
│
└── lib/
    └── constants.ts              ← Colour palettes, labels, tariff rates — safe to edit colours
```

---

## Design system

### Colours (CSS variables in `globals.css`)

| Variable | Value | Used for |
|---|---|---|
| `--bg-primary` | `#020617` | Page background (slate-950) |
| `--bg-secondary` | `#0f172a` | Card interiors (slate-900) |
| `--accent-cyan` | `#00fff5` | Primary accent, selected states, slider |
| `--accent-amber` | `#f59e0b` | Mid-range carbon intensity |
| `--accent-red` | `#ef4444` | High carbon intensity, peak demand zone |

### Carbon intensity colour scale (`src/lib/colorScale.ts`)
- 0 gCO₂/kWh → `#00fff5` (cyan)
- 150 gCO₂/kWh → `#f59e0b` (amber)
- 300+ gCO₂/kWh → `#ef4444` (red)
- Used by the map fill, RegionTooltip, and RegionalHeatmap bar colours

### Fuel colours (`src/lib/constants.ts` → `FUEL_COLORS`)
```
wind → #22d3ee   solar → #fbbf24   nuclear → #a78bfa
gas → #f97316    biomass → #4ade80  hydro → #38bdf8
imports → #94a3b8  coal → #6b7280
```

### Season colours (`SEASON_COLORS`)
```
winter → #60a5fa   spring → #4ade80
summer → #fbbf24   autumn → #fb923c
```

### GlassCard
The reusable card wrapper. Props:
- `glow?: 'cyan' | 'amber' | 'red' | 'green' | 'none'` — sets the border accent colour
- `className?` — merged with base styles via `clsx`
- `title?` / `titleRight?` — optional header row inside the card

Base classes: `bg-slate-900/60 backdrop-blur-xl border rounded-2xl`

### Background
Dark slate-950 with a 40px cyan grid overlay (set in `globals.css` on `body`).

---

## Map — critical notes

`UKRegionalMap.tsx` uses D3 and must only be imported via `next/dynamic` with `ssr: false` (already done in `page.tsx`). **Do not add an SSR import.**

Key architectural decisions that must be preserved:
1. `regionMap` is computed with `useMemo` — do not move it outside or make it a plain `new Map()` call in component scope (this caused a bug where the map re-fetched the GeoJSON on every hover)
2. The GeoJSON is cached in `geoJsonRef` — the main draw effect only fetches once
3. Two separate effects: one for drawing (deps: `data, regionMap`), one for visual state updates like hover/selection (deps: `hoveredId, selectedRegionId, regionMap`) — keep them separate
4. `onRegionSelect` is stored in `onRegionSelectRef` to avoid the callback being a stale closure dependency
5. The SVG has no `overflow: hidden` — this is intentional so `drop-shadow` filters aren't clipped at the boundary

---

## Recharts components

All charts use Recharts v2. Common customisation points:
- `<Tooltip contentStyle>` — style the hover tooltip box
- `<CartesianGrid strokeDasharray>` — grid line style
- `<XAxis tick>` / `<YAxis tick>` — axis label style
- `<ReferenceArea>` — used in DemandCurve to highlight the peak (red) and off-peak (green) windows

Recharts default text colour is overridden globally in `globals.css`:
```css
.recharts-text { fill: #64748b !important; font-size: 11px; }
```

---

## Page layout (`src/app/page.tsx`)

Section order (top to bottom):
1. `StatsBar` — fixed, always visible
2. Hero — title, tagline, data source badges
3. Map card + Fuel Mix Donut — `grid lg:grid-cols-[1fr_340px]`
4. Demand Curve — full width
5. Seasonal Comparison + Regional Heatmap — `grid lg:grid-cols-2`
6. Incentive Calculator — full width
7. The Analysis — 3-column text
8. Footer

All sections are wrapped in `GlassCard`. The max content width is `max-w-7xl`.

---

## What data flows where

```
regional_intensity.json  →  UKRegionalMap (fill colours)
                         →  RegionTooltip (CI values, fuel mix, seasonal breakdown)
                         →  RegionalHeatmap (bar chart, clickable)
                         →  StatsBar (national CI snapshot, renewables %)

national_demand.json     →  DemandCurve (48 half-hourly periods, 4 seasons)
                         →  SeasonalComparison (4 overlaid season shapes)

fuel_mix.json            →  FuelMixDonut (generation mix pie)

incentive_model.json     →  IncentivePanel (archetype selector + slider)
                         →  SavingsGauge (£/year gauge)
                         →  ShiftImpactBreakdown (financial, carbon, grid cards)
                         →  StatsBar (peak saving potential pill)
```

Interaction state is lifted to `page.tsx`:
- `selectedRegionId` / `selectedRegion` — shared between map click, heatmap click, and tooltip panel

---

## Dependencies to be aware of

| Package | Used for | Notes |
|---|---|---|
| `d3` v7 | UK map rendering | Client-only — no SSR |
| `recharts` v2 | All other charts | |
| `topojson-client` | (available, not currently used) | |
| `clsx` | Conditional className merging | |
| `tailwind-merge` | (available if needed) | |
| `framer-motion` | (available, not currently used) | Safe to use for animations |
| `@radix-ui/react-slider` | (available, not currently used) | The slider uses a plain `<input type="range">` |

---

## Safe visual changes (examples)

- Changing colours in `constants.ts`, `colorScale.ts`, or `globals.css`
- Editing card layout, padding, typography in any component
- Changing the GlassCard border/background styles
- Adding animations with framer-motion or CSS transitions
- Changing chart colours, axis labels, tooltip styles in Recharts components
- Editing the Hero section text or badge layout in `page.tsx`
- Editing the footer or Analysis section
- Changing font sizes, weights, spacing

## Unsafe visual changes (do not do without understanding the code)

- Changing how data is fetched or what props are passed between components
- Changing the D3 effect structure in `UKRegionalMap.tsx` (see notes above)
- Changing `src/lib/types.ts` interfaces
- Changing `src/lib/incentive.ts` calculation logic
- Editing any file in `scripts/` or `public/data/`
- Adding SSR imports of `UKRegionalMap`
