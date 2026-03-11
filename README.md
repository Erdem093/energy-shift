# Energy Shift

Interactive Next.js dashboard for UK electricity demand behavior analysis.

## Live Demo

- https://energy-shift-5jjd848ch-erdem093s-projects.vercel.app/

The app visualizes:
- UK regional carbon intensity (14 DNO regions) on an interactive map
- National demand curves by season
- Regional carbon intensity comparison
- Household demand-shift incentive impacts (cost, CO2, and peak reduction)

## Tech Stack

- Next.js 14 (App Router)
- React 18 + TypeScript
- Tailwind CSS
- D3 (interactive UK map)
- Recharts (time-series and regional charts)

## Project Structure

- `src/app/page.tsx`: main dashboard page
- `src/components/map/`: UK map, legend, region detail panel
- `src/components/charts/`: demand and regional charts
- `src/components/incentive/`: savings and impact components
- `public/data/`: static JSON datasets used by the UI
- `scripts/`: data fetch/build utilities and map generation

## Local Development

Install dependencies:

```bash
npm install
```

Start dev server:

```bash
npm run dev
```

Open `http://localhost:3000` (or the next available port shown in terminal).

## Build

```bash
npm run build
npm run start
```

## Data Refresh

Run all data scripts:

```bash
npm run fetch-data
```

Map geometry file is generated to:

- `public/data/uk_dno_regions.json`

using:

- `scripts/generate_uk_map.py`

## Notes

- The map supports zoom, pan, and region selection.
- Region details can be expanded/collapsed from the map overlay.
- Seasonal demand chart now uses a shared Y-axis scale across seasons for accurate comparison.

## Links

- GitHub: https://github.com/Erdem093
- LinkedIn: https://www.linkedin.com/in/erdem-arslan-b61a992a7/
