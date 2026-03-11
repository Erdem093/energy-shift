export type Fuel = 'biomass' | 'coal' | 'imports' | 'gas' | 'nuclear' | 'other' | 'hydro' | 'solar' | 'wind';
export type Season = 'winter' | 'spring' | 'summer' | 'autumn';
export type Archetype = 'comfortable' | 'affluent' | 'adversity';
export type CIIndex = 'very low' | 'low' | 'moderate' | 'high' | 'very high';

export interface GenerationMix {
  [key: string]: number;
}

export interface SeasonalProfile {
  avgCI: number;
  profile: number[];
}

export interface RegionalData {
  regionId: number;
  shortName: string;
  dnoRegion: string;
  avgCI: number;
  minCI: number;
  maxCI: number;
  peakPeriod: number;
  seasonal: Record<Season, SeasonalProfile>;
  generationMix: GenerationMix;
}

export interface NationalSnapshot {
  ci: number;
  index: string;
  from: string;
  generationMix: GenerationMix;
}

export interface RegionalIntensityData {
  generatedAt: string;
  regions: RegionalData[];
  nationalSnapshot: NationalSnapshot;
}

export interface DemandPeriod {
  period: number;
  time: string;
  demandMW: number;
  normalised: number;
}

export interface PeakWindow {
  startPeriod: number;
  endPeriod: number;
  startTime: string;
  endTime: string;
}

export interface SeasonalDemandData {
  label: string;
  peakDemandMW: number;
  minDemandMW: number;
  profile: DemandPeriod[];
  peakWindow: PeakWindow;
}

export interface NationalDemandData {
  generatedAt: string;
  seasonal: Record<Season, SeasonalDemandData>;
  monthlyPeaks: Array<{ month: string; avgPeakMW: number }>;
}

export interface HouseholdProfile {
  annualKwh: number;
  halfHourlyFractions: number[];
  peakWindowFraction: number;
  offPeakFraction: number;
  baselineCostAgile: number;
}

export interface FuelMixData {
  generatedAt: string;
  nationalMix: {
    current: GenerationMix;
    seasonal: Record<Season, GenerationMix>;
  };
  householdProfiles: Record<Archetype, HouseholdProfile>;
}

export interface ShiftSaving {
  shiftPct: number;
  annualSavingGbp: number;
  co2SavedKg: number;
  gridPeakReductionMW: number;
}

export interface IncentiveArchetype {
  annualKwh: number;
  baselineCostGbp: number;
  shiftSavings: ShiftSaving[];
}

export interface IncentiveModelData {
  generatedAt: string;
  tariff: {
    name: string;
    peakRatePence: number;
    shoulderRatePence: number;
    offpeakRatePence: number;
    standingChargePence: number;
    peakWindow: string;
    offpeakWindow: string;
  };
  assumptions: {
    peakCarbonIntensityGCO2kWh: number;
    offpeakCarbonIntensityGCO2kWh: number;
    ukHouseholds: number;
    agileAdoptionRate: number;
    nationalScaleNote: string;
  };
  archetypes: Record<Archetype, IncentiveArchetype>;
}
