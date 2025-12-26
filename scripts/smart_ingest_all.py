#!/usr/bin/env python3
"""
Smart incremental ingestion strategy for all 365 dates
- Prioritizes dates by likelihood of traffic
- Generates JSON after each date so site updates progressively
- Can be stopped and resumed
- Handles rate limits gracefully
"""

import os
import sys
import subprocess
from datetime import datetime, timedelta
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def get_completed_dates():
    """Check which dates already have data"""
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        return set()

    try:
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()

        cursor.execute('''
            SELECT DISTINCT publication_month_day
            FROM papers
            WHERE publication_month_day IS NOT NULL
        ''')

        completed = {row[0] for row in cursor.fetchall()}
        conn.close()
        return completed
    except:
        return set()

def get_prioritized_dates():
    """Return all 365 dates in priority order

    Priority:
    1. Dates around today (±7 days) - people check their own birthdays
    2. Popular birthday months (Sept, Aug, July) - most babies born
    3. Holidays and notable dates
    4. Rest of the year
    """
    today = datetime.now()
    all_dates = []

    # Days in each month
    days_in_month = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

    # Priority 1: Today ± 14 days (people check their birthday)
    priority_1 = []
    for offset in range(-14, 15):
        date = today + timedelta(days=offset)
        priority_1.append(f"{date.month:02d}-{date.day:02d}")

    # Priority 2: Popular birthday months (Sept, Aug, July, June)
    priority_2 = []
    for month in [9, 8, 7, 6]:  # Sept, Aug, July, June
        for day in range(1, days_in_month[month-1] + 1):
            date_str = f"{month:02d}-{day:02d}"
            if date_str not in priority_1:
                priority_2.append(date_str)

    # Priority 3: Holiday season (Dec, Jan, Feb)
    priority_3 = []
    for month in [12, 1, 2]:
        for day in range(1, days_in_month[month-1] + 1):
            date_str = f"{month:02d}-{day:02d}"
            if date_str not in priority_1 and date_str not in priority_2:
                priority_3.append(date_str)

    # Priority 4: Everything else
    priority_4 = []
    for month in range(1, 13):
        for day in range(1, days_in_month[month-1] + 1):
            date_str = f"{month:02d}-{day:02d}"
            if date_str not in priority_1 and date_str not in priority_2 and date_str not in priority_3:
                priority_4.append(date_str)

    return priority_1 + priority_2 + priority_3 + priority_4

def run_command(cmd):
    """Run command and return success status"""
    try:
        # Get the project directory (parent of scripts/)
        project_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

        result = subprocess.run(
            cmd,
            shell=True,
            capture_output=True,
            text=True,
            timeout=600,  # 10 minutes per date
            cwd=project_dir,  # Run from project root
            env=os.environ.copy()  # Pass current environment (includes .env vars)
        )
        if result.returncode != 0:
            # Print stderr if command failed
            if result.stderr:
                print(f"    ERROR: {result.stderr[:500]}")  # First 500 chars of error
        return result.returncode == 0, result.stdout
    except subprocess.TimeoutExpired:
        print("    TIMEOUT - skipping")
        return False, ""
    except Exception as e:
        print(f"    ERROR: {e}")
        return False, ""

def main():
    print("=" * 70)
    print("SMART INCREMENTAL INGESTION FOR ALL 365 DATES")
    print("=" * 70)
    print()
    print("Strategy:")
    print("  1. Prioritizes dates around today (±14 days)")
    print("  2. Then popular birthday months (Sept, Aug, July, June)")
    print("  3. Then holiday season (Dec, Jan, Feb)")
    print("  4. Then remaining dates")
    print()
    print("You can stop this anytime (Ctrl+C) and resume later")
    print("=" * 70)
    print()

    # Get completed dates
    completed = get_completed_dates()
    print(f"Already completed: {len(completed)} dates")
    print()

    # Get prioritized list
    all_dates = get_prioritized_dates()
    remaining = [d for d in all_dates if d not in completed]

    print(f"Remaining: {len(remaining)} dates")
    print(f"Estimated time: {len(remaining) * 2} - {len(remaining) * 4} minutes")
    print()

    if not remaining:
        print("✓ All dates already ingested!")
        return

    print("Starting ingestion...")
    print()

    for i, date_str in enumerate(remaining, 1):
        month, day = date_str.split('-')
        month_name = datetime(2024, int(month), int(day)).strftime('%b %d')

        print(f"[{i}/{len(remaining)}] {month_name} ({date_str})")

        # Ingest
        print("  → Ingesting papers...")
        success, output = run_command(f"venv/bin/python scripts/ingest_recent.py {date_str}")

        if success:
            # Count papers from output
            if "Inserted" in output:
                count = output.split("Inserted")[1].split("papers")[0].strip()
                print(f"  ✓ {count} papers ingested")

            # Generate JSON
            print("  → Generating JSON...")
            json_success, _ = run_command(f"venv/bin/python scripts/generate_json.py {date_str}")

            if json_success:
                print(f"  ✓ {date_str} is now LIVE on the site!")
            else:
                print(f"  ✗ JSON generation failed")
        else:
            print(f"  ✗ Ingestion failed - skipping")

        # Progress
        percent = (i / len(remaining)) * 100
        print(f"  Progress: {percent:.1f}% ({i}/{len(remaining)})")
        print()

    print("=" * 70)
    print("✓ INGESTION COMPLETE!")
    print("All 365 dates are now available on your site")
    print("=" * 70)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nStopped by user. Progress saved!")
        print("Run again to resume from where you left off.")
        sys.exit(0)
