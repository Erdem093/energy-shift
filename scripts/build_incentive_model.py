"""
build_incentive_model.py
Builds a precomputed lookup table for the demand-shift incentive calculator.

For each archetype and each shift percentage (0-100%), computes:
- Annual cost saving (£/yr) vs baseline
- CO2 saved (kg/yr)
- Grid peak demand reduction (MW) if all 28M UK households adopted this behaviour

Outputs: ../public/data/incentive_model.json
"""

import json
from datetime import datetime, timezone
from pathlib import Path

FUEL_MIX_PATH = Path(__file__).parent.parent / "public" / "data" / "fuel_mix.json"
OUTPUT_PATH = Path(__file__).parent.parent / "public" / "data" / "incentive_model.json"

# Tariff constants (Agile Octopus representative rates, Jan 2024)
PEAK_RATE_P = 35.0       # p/kWh, 16:00-19:00 (periods 33-38, 0-indexed 32-37)
SHOULDER_RATE_P = 20.0   # p/kWh, 07:00-16:00, 19:00-22:00
OFFPEAK_RATE_P = 7.0     # p/kWh, 00:00-07:00, 22:00-00:00
STANDING_CHARGE_P = 61.64  # p/day

# Period index ranges (0-indexed)
PEAK_PERIODS = list(range(32, 38))    # 16:00-19:00
OFFPEAK_PERIODS = list(range(0, 14)) + list(range(44, 48))  # 00:00-07:00, 22:00-00:00
# All other periods are shoulder

# Carbon intensity parameters (gCO2/kWh)
# Peak periods (evening, gas-heavy): higher CI
# Off-peak periods (overnight, more wind): lower CI
CI_PEAK_G_PER_KWH = 250.0    # typical winter evening (gas-heavy)
CI_OFFPEAK_G_PER_KWH = 95.0  # typical overnight (more wind/nuclear)

# UK total households (for national scale calculation)
UK_HOUSEHOLDS = 28_000_000
AGILE_ADOPTION_RATE = 0.10  # assumed 10% on Agile or similar ToU tariff

def period_rate(idx: int) -> float:
    if idx in PEAK_PERIODS:
        return PEAK_RATE_P
    if idx in OFFPEAK_PERIODS:
        return OFFPEAK_RATE_P
    return SHOULDER_RATE_P

def compute_baseline_cost(annual_kwh: float, profile: list[float]) -> float:
    """Annual cost (£) at baseline — before any shifting."""
    daily_kwh = annual_kwh / 365.0
    daily_cost_p = sum(profile[i] * daily_kwh * period_rate(i) for i in range(48))
    return round((daily_cost_p * 365 + STANDING_CHARGE_P * 365) / 100, 2)

def compute_shifted_cost(annual_kwh: float, profile: list[float], shift_pct: float) -> tuple[float, float]:
    """
    Compute cost and CO2 after shifting `shift_pct`% of peak-window load to cheapest off-peak.
    Returns (annual_cost_gbp, annual_co2_kg).
    """
    new_profile = list(profile)
    daily_kwh = annual_kwh / 365.0

    # Compute total peak fraction and amount to shift
    peak_total = sum(profile[i] for i in PEAK_PERIODS)
    shift_fraction = peak_total * (shift_pct / 100.0)

    # Remove from peak periods proportionally
    for i in PEAK_PERIODS:
        ratio = profile[i] / peak_total if peak_total > 0 else 0
        new_profile[i] = max(0.0, profile[i] - shift_fraction * ratio)

    # Add to cheapest off-peak periods (spread evenly across 00:00-06:00, periods 0-11)
    cheapest_periods = list(range(0, 12))  # 00:00-06:00
    per_period_addition = shift_fraction / len(cheapest_periods)
    for i in cheapest_periods:
        new_profile[i] += per_period_addition

    # Compute cost
    daily_cost_p = sum(new_profile[i] * daily_kwh * period_rate(i) for i in range(48))
    annual_cost_gbp = round((daily_cost_p * 365 + STANDING_CHARGE_P * 365) / 100, 2)

    # Compute CO2: peak load moved from peak CI to off-peak CI
    shifted_daily_kwh = shift_fraction * daily_kwh
    # CO2 saved = (CI_peak - CI_offpeak) * shifted_kwh * 365 days / 1000 (g→kg)
    annual_co2_kg = round((CI_PEAK_G_PER_KWH - CI_OFFPEAK_G_PER_KWH) * shifted_daily_kwh * 365 / 1000, 1)

    return annual_cost_gbp, annual_co2_kg

def compute_grid_reduction(annual_kwh: float, profile: list[float], shift_pct: float) -> float:
    """
    Estimate grid peak demand reduction in MW if UK_HOUSEHOLDS * AGILE_ADOPTION_RATE households shift.
    Returns MW reduction at the peak period (33).
    """
    daily_kwh = annual_kwh / 365.0
    peak_total = sum(profile[i] for i in PEAK_PERIODS)
    shift_fraction = peak_total * (shift_pct / 100.0)

    # Amount shifted from peak hour in kWh per household per half-hour
    peak_shift_kwh_per_hh = shift_fraction * daily_kwh / len(PEAK_PERIODS)

    # Convert to MW at national scale: kWh per half-hour → MW (divide by 0.5 for half-hourly)
    total_shifted_mwh = peak_shift_kwh_per_hh * UK_HOUSEHOLDS * AGILE_ADOPTION_RATE / 1000  # kWh → MWh
    peak_reduction_mw = round(total_shifted_mwh / 0.5, 0)  # MWh per half-hour → MW

    return peak_reduction_mw

def main():
    print("=== Building Incentive Model ===")

    # Load household profiles from fuel_mix.json
    with open(FUEL_MIX_PATH) as f:
        fuel_data = json.load(f)

    household_profiles = fuel_data["householdProfiles"]

    archetypes_output = {}

    for archetype_name, arch in household_profiles.items():
        annual_kwh = arch["annualKwh"]
        profile = arch["halfHourlyFractions"]
        baseline_cost = compute_baseline_cost(annual_kwh, profile)

        print(f"\n  {archetype_name}: {annual_kwh} kWh/yr, baseline £{baseline_cost:.2f}/yr")

        shift_savings = []
        for shift_pct in range(0, 101):
            if shift_pct == 0:
                shift_savings.append({
                    "shiftPct": 0,
                    "annualSavingGbp": 0.0,
                    "co2SavedKg": 0.0,
                    "gridPeakReductionMW": 0.0,
                })
                continue

            shifted_cost, co2_saved = compute_shifted_cost(annual_kwh, profile, float(shift_pct))
            saving = round(baseline_cost - shifted_cost, 2)
            grid_reduction = compute_grid_reduction(annual_kwh, profile, float(shift_pct))

            shift_savings.append({
                "shiftPct": shift_pct,
                "annualSavingGbp": max(0.0, saving),
                "co2SavedKg": co2_saved,
                "gridPeakReductionMW": grid_reduction,
            })

            if shift_pct % 10 == 0:
                print(f"    {shift_pct}% shift → £{saving:.0f}/yr saved, {co2_saved:.0f} kg CO2, {grid_reduction:.0f} MW grid reduction")

        archetypes_output[archetype_name] = {
            "annualKwh": annual_kwh,
            "baselineCostGbp": baseline_cost,
            "shiftSavings": shift_savings,
        }

    output = {
        "generatedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "tariff": {
            "name": "Agile Octopus (representative)",
            "peakRatePence": PEAK_RATE_P,
            "shoulderRatePence": SHOULDER_RATE_P,
            "offpeakRatePence": OFFPEAK_RATE_P,
            "standingChargePence": STANDING_CHARGE_P,
            "peakWindow": "16:00-19:00",
            "offpeakWindow": "00:00-07:00",
        },
        "assumptions": {
            "peakCarbonIntensityGCO2kWh": CI_PEAK_G_PER_KWH,
            "offpeakCarbonIntensityGCO2kWh": CI_OFFPEAK_G_PER_KWH,
            "ukHouseholds": UK_HOUSEHOLDS,
            "agileAdoptionRate": AGILE_ADOPTION_RATE,
            "nationalScaleNote": f"Grid impact assumes {AGILE_ADOPTION_RATE:.0%} of {UK_HOUSEHOLDS/1e6:.0f}M UK households on ToU tariff",
        },
        "archetypes": archetypes_output,
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w") as f:
        json.dump(output, f, indent=2)

    print(f"\n✓ Written: {OUTPUT_PATH}")

if __name__ == "__main__":
    main()
