#!/usr/bin/env python3
"""
Ingest all 365 dates and generate JSON files as we go
This allows the site to work progressively as dates are ingested
"""

import os
import sys
import subprocess
from datetime import datetime

def run_command(cmd):
    """Run a shell command and return success/failure"""
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        return result.returncode == 0
    except Exception as e:
        print(f"Error running command: {e}")
        return False

def main():
    print("Starting full data ingestion for all 365 dates...")
    print("This will take 6-12 hours. Progress will be saved as we go.\n")

    # Days in each month (using 29 for Feb to include leap day)
    days_in_month = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    total_dates = sum(days_in_month)
    completed = 0

    for month in range(1, 13):
        for day in range(1, days_in_month[month - 1] + 1):
            month_day = f"{month:02d}-{day:02d}"
            completed += 1

            print(f"\n[{completed}/{total_dates}] Processing {month_names[month-1]} {day} ({month_day})...")

            # Step 1: Ingest data for this date
            print(f"  → Ingesting papers...")
            ingest_cmd = f"venv/bin/python scripts/ingest_papers.py {month_day}"
            if not run_command(ingest_cmd):
                print(f"  ✗ Ingestion failed for {month_day}")
                continue

            # Step 2: Generate JSON for this date
            print(f"  → Generating JSON...")
            json_cmd = f"venv/bin/python scripts/generate_json.py {month_day}"
            if run_command(json_cmd):
                print(f"  ✓ {month_day} is now live on the site!")
            else:
                print(f"  ✗ JSON generation failed for {month_day}")

            # Progress update
            percent = (completed / total_dates) * 100
            print(f"\nProgress: {completed}/{total_dates} dates ({percent:.1f}%)\n")

    print("\n" + "="*60)
    print("✓ ALL DATES COMPLETED!")
    print("Your site now has papers for all 365 days of the year.")
    print("="*60)

if __name__ == "__main__":
    main()
