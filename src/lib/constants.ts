export const FUEL_COLORS: Record<string, string> = {
  wind:    '#22d3ee',
  solar:   '#fbbf24',
  nuclear: '#a78bfa',
  gas:     '#f97316',
  biomass: '#4ade80',
  hydro:   '#38bdf8',
  imports: '#94a3b8',
  coal:    '#6b7280',
  other:   '#475569',
};

export const FUEL_LABELS: Record<string, string> = {
  wind:    'Wind',
  solar:   'Solar',
  nuclear: 'Nuclear',
  gas:     'Gas',
  biomass: 'Biomass',
  hydro:   'Hydro',
  imports: 'Imports',
  coal:    'Coal',
  other:   'Other',
};

export const SEASON_COLORS: Record<string, string> = {
  winter: '#60a5fa',
  spring: '#4ade80',
  summer: '#fbbf24',
  autumn: '#fb923c',
};

export const SEASON_LABELS: Record<string, string> = {
  winter: 'Winter (Jan)',
  spring: 'Spring (Apr)',
  summer: 'Summer (Jul)',
  autumn: 'Autumn (Oct)',
};

export const ARCHETYPE_LABELS: Record<string, string> = {
  comfortable: 'Comfortable',
  affluent:    'Affluent',
  adversity:   'Adversity',
};

export const ARCHETYPE_DESCRIPTIONS: Record<string, string> = {
  comfortable: 'Typical 3-bed household · 3,100 kWh/yr',
  affluent:    'Larger home + EV · 4,200 kWh/yr',
  adversity:   'Smaller home, budget-conscious · 2,400 kWh/yr',
};

export const CI_INDEX_COLORS: Record<string, string> = {
  'very low':  '#00fff5',
  'low':       '#22d3ee',
  'moderate':  '#f59e0b',
  'high':      '#ef4444',
  'very high': '#dc2626',
};

export const TARIFF = {
  peakRate: 35,
  offpeakRate: 7,
  peakWindow: '16:00–19:00',
  offpeakWindow: '00:00–07:00',
};
