"""
fetch_carbon_intensity.py
Fetches half-hourly carbon intensity + generation mix data from the Carbon Intensity API
for all 14 UK DNO regions across 4 representative seasonal days.

Outputs: ../public/data/regional_intensity.json
"""

import json
import time
import requests
from datetime import datetime, timezone
from pathlib import Path

OUTPUT_PATH = Path(__file__).parent.parent / "public" / "data" / "regional_intensity.json"

# 4 representative days (weekdays to avoid weekend anomalies)
SEASONAL_DAYS = {
    "winter": "2024-01-17",
    "spring": "2024-04-10",
    "summer": "2024-07-10",
    "autumn": "2024-10-09",
}

# Carbon Intensity API region metadata
REGIONS = {
    1:  {"shortName": "North Scotland",       "dnoRegion": "Scottish Hydro Electric Power Distribution"},
    2:  {"shortName": "South Scotland",        "dnoRegion": "SP Energy Networks"},
    3:  {"shortName": "North West England",    "dnoRegion": "Electricity North West"},
    4:  {"shortName": "North East England",    "dnoRegion": "Northern Powergrid"},
    5:  {"shortName": "Yorkshire",             "dnoRegion": "Northern Powergrid"},
    6:  {"shortName": "North Wales & Mersey",  "dnoRegion": "SP Manweb"},
    7:  {"shortName": "South Wales",           "dnoRegion": "National Grid Electricity Distribution"},
    8:  {"shortName": "West Midlands",         "dnoRegion": "National Grid Electricity Distribution"},
    9:  {"shortName": "East Midlands",         "dnoRegion": "National Grid Electricity Distribution"},
    10: {"shortName": "East England",          "dnoRegion": "UK Power Networks"},
    11: {"shortName": "South West England",    "dnoRegion": "National Grid Electricity Distribution"},
    12: {"shortName": "South England",         "dnoRegion": "Scottish and Southern Electricity Networks"},
    13: {"shortName": "London",                "dnoRegion": "UK Power Networks"},
    14: {"shortName": "South East England",    "dnoRegion": "UK Power Networks"},
}

BASE_URL = "https://api.carbonintensity.org.uk"

def fetch_region_day(region_id: int, date_str: str) -> list[dict]:
    """Fetch 48 half-hourly records for a region on a given date."""
    from_ts = f"{date_str}T00:00Z"
    to_ts   = f"{date_str}T23:30Z"
    url = f"{BASE_URL}/regional/intensity/{from_ts}/{to_ts}/regionid/{region_id}"
    resp = requests.get(url, timeout=15)
    resp.raise_for_status()
    data = resp.json()
    return data.get("data", {}).get("data", [])

def extract_profile(records: list[dict]) -> list[float]:
    """Return 48-element list of CI forecast values."""
    profile = []
    for r in sorted(records, key=lambda x: x.get("from", "")):
        ci = r.get("intensity", {}).get("forecast", 0) or 0
        profile.append(float(ci))
    # Pad or trim to exactly 48
    while len(profile) < 48:
        profile.append(profile[-1] if profile else 0.0)
    return profile[:48]

def extract_genmix(records: list[dict]) -> dict[str, float]:
    """Average generation mix percentages across all records."""
    fuel_totals: dict[str, float] = {}
    count = 0
    for r in records:
        genmix = r.get("generationmix", [])
        for item in genmix:
            fuel = item.get("fuel", "other")
            perc = float(item.get("perc", 0) or 0)
            fuel_totals[fuel] = fuel_totals.get(fuel, 0.0) + perc
        count += 1
    if count == 0:
        return {}
    return {k: round(v / count, 2) for k, v in fuel_totals.items()}

def fetch_national_snapshot() -> dict:
    """Fetch current national carbon intensity + generation mix."""
    resp = requests.get(f"{BASE_URL}/intensity", timeout=15)
    resp.raise_for_status()
    intensity_data = resp.json().get("data", [{}])[0]

    resp2 = requests.get(f"{BASE_URL}/generation", timeout=15)
    resp2.raise_for_status()
    gen_data = resp2.json().get("data", {})

    genmix_raw = gen_data.get("generationmix", [])
    genmix = {item["fuel"]: round(float(item.get("perc", 0)), 2) for item in genmix_raw}

    ci_val = intensity_data.get("intensity", {}).get("actual") or intensity_data.get("intensity", {}).get("forecast", 150)
    ci_index = intensity_data.get("intensity", {}).get("index", "moderate")

    return {
        "ci": int(ci_val),
        "index": ci_index,
        "from": intensity_data.get("from", ""),
        "generationMix": genmix,
    }

def main():
    print("=== Fetching Carbon Intensity Data ===")
    print(f"Seasons: {list(SEASONAL_DAYS.keys())}")
    print(f"Regions: {len(REGIONS)}")
    print(f"Total API calls: ~{len(REGIONS) * len(SEASONAL_DAYS) + 2}")

    all_region_data = []

    for region_id, meta in REGIONS.items():
        print(f"\nRegion {region_id}: {meta['shortName']}")
        seasonal: dict[str, dict] = {}
        all_records: list[dict] = []

        for season, date_str in SEASONAL_DAYS.items():
            print(f"  Fetching {season} ({date_str})...", end=" ", flush=True)
            try:
                records = fetch_region_day(region_id, date_str)
                profile = extract_profile(records)
                avg_ci = round(sum(profile) / len(profile), 1) if profile else 0
                seasonal[season] = {
                    "avgCI": avg_ci,
                    "profile": [round(v, 1) for v in profile],
                }
                all_records.extend(records)
                print(f"OK (avg {avg_ci} gCO2/kWh)")
            except Exception as e:
                print(f"ERROR: {e}")
                seasonal[season] = {"avgCI": 0, "profile": [0.0] * 48}

            time.sleep(0.5)

        # Compute overall stats from all seasonal records
        all_profiles = [v for s in seasonal.values() for v in s["profile"]]
        avg_ci = round(sum(all_profiles) / len(all_profiles), 1) if all_profiles else 0
        min_ci = round(min(all_profiles), 1) if all_profiles else 0
        max_ci = round(max(all_profiles), 1) if all_profiles else 0

        # Find peak period (highest avg CI across all profiles)
        period_avgs = []
        for i in range(48):
            vals = [seasonal[s]["profile"][i] for s in seasonal if len(seasonal[s]["profile"]) > i]
            period_avgs.append(sum(vals) / len(vals) if vals else 0)
        peak_period = period_avgs.index(max(period_avgs)) + 1

        gen_mix = extract_genmix(all_records)

        all_region_data.append({
            "regionId": region_id,
            "shortName": meta["shortName"],
            "dnoRegion": meta["dnoRegion"],
            "avgCI": avg_ci,
            "minCI": min_ci,
            "maxCI": max_ci,
            "peakPeriod": peak_period,
            "seasonal": seasonal,
            "generationMix": gen_mix,
        })

    print("\nFetching national snapshot...", end=" ", flush=True)
    try:
        national_snapshot = fetch_national_snapshot()
        print(f"OK ({national_snapshot['ci']} gCO2/kWh, {national_snapshot['index']})")
    except Exception as e:
        print(f"ERROR: {e}")
        national_snapshot = {
            "ci": 180,
            "index": "moderate",
            "from": datetime.now(timezone.utc).isoformat(),
            "generationMix": {"wind": 30.0, "gas": 30.0, "nuclear": 15.0, "solar": 10.0, "biomass": 5.0, "imports": 5.0, "hydro": 3.0, "other": 2.0, "coal": 0.0},
        }

    output = {
        "generatedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "regions": all_region_data,
        "nationalSnapshot": national_snapshot,
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w") as f:
        json.dump(output, f, indent=2)

    print(f"\n✓ Written: {OUTPUT_PATH}")
    print(f"  Regions: {len(all_region_data)}")
    print(f"  National CI: {national_snapshot['ci']} gCO2/kWh ({national_snapshot['index']})")

if __name__ == "__main__":
    main()
