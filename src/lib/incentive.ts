import type { IncentiveModelData, Archetype, ShiftSaving } from './types';

export function getSavingAtShift(
  model: IncentiveModelData,
  archetype: Archetype,
  shiftPct: number,
): ShiftSaving {
  const savings = model.archetypes[archetype].shiftSavings;
  const lo = Math.floor(Math.max(0, Math.min(shiftPct, 100)));
  const hi = Math.min(lo + 1, 100);
  const frac = shiftPct - lo;

  const lower = savings[lo];
  const upper = savings[hi];

  return {
    shiftPct,
    annualSavingGbp: lerp(lower.annualSavingGbp, upper.annualSavingGbp, frac),
    co2SavedKg: lerp(lower.co2SavedKg, upper.co2SavedKg, frac),
    gridPeakReductionMW: lerp(lower.gridPeakReductionMW, upper.gridPeakReductionMW, frac),
  };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function treesEquivalent(co2Kg: number): number {
  return Math.round(co2Kg / 21);
}

export function getShiftDescription(shiftPct: number): string {
  if (shiftPct < 5)  return 'No behavioural change — paying full peak rates';
  if (shiftPct < 15) return 'Run the dishwasher overnight instead of after dinner';
  if (shiftPct < 25) return 'Shift dishwasher + washing machine to off-peak hours';
  if (shiftPct < 40) return 'Add EV charging + smart appliances to off-peak schedule';
  if (shiftPct < 60) return 'Smart home automation managing most discretionary loads';
  if (shiftPct < 80) return 'Full smart home + hot water cylinder shifted overnight';
  return 'Battery storage + EV optimisation + full home automation';
}

export function getMaxSaving(model: IncentiveModelData, archetype: Archetype): number {
  const savings = model.archetypes[archetype].shiftSavings;
  return savings[savings.length - 1]?.annualSavingGbp ?? 0;
}
