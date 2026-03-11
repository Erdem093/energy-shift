"""
run_all.py
Orchestrates the full data pipeline in dependency order.
Run from the scripts/ directory: python3 run_all.py
"""

import subprocess
import sys
from pathlib import Path

SCRIPTS_DIR = Path(__file__).parent

PIPELINE = [
    ("fetch_carbon_intensity.py", "Carbon Intensity API → regional_intensity.json"),
    ("fetch_demand_profile.py",   "Elexon BMRS API → national_demand.json"),
    ("process_smart_meter.py",    "Household profiles → fuel_mix.json"),
    ("build_incentive_model.py",  "Incentive model → incentive_model.json"),
]

def main():
    print("=" * 60)
    print("UK Energy Behaviour Tool — Data Pipeline")
    print("=" * 60)
    errors = []

    for script, description in PIPELINE:
        print(f"\n[{PIPELINE.index((script, description)) + 1}/{len(PIPELINE)}] {description}")
        print("-" * 50)
        result = subprocess.run(
            [sys.executable, str(SCRIPTS_DIR / script)],
            capture_output=False,
        )
        if result.returncode != 0:
            errors.append(script)
            print(f"  ✗ {script} FAILED (exit code {result.returncode})")
        else:
            print(f"  ✓ {script} completed")

    print("\n" + "=" * 60)
    if errors:
        print(f"✗ Pipeline completed with errors in: {', '.join(errors)}")
        sys.exit(1)
    else:
        print("✓ All data files generated successfully!")
        print("\nFiles written to public/data/:")
        for path in sorted((SCRIPTS_DIR.parent / "public" / "data").glob("*.json")):
            size_kb = path.stat().st_size / 1024
            print(f"  {path.name:40s} {size_kb:6.1f} KB")

if __name__ == "__main__":
    main()
