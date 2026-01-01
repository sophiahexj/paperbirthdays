#!/usr/bin/env python3
"""
Railway Ingestion Script - Run this on Railway to complete bulk ingestion
Optimized for speed with parallel processing
"""

import os
import sys
import subprocess
import time

def check_dependencies():
    """Install required packages"""
    print("📦 Installing dependencies...")
    subprocess.run([
        "pip", "install", "-q",
        "psycopg2-binary",
        "requests",
        "python-dotenv"
    ], check=True)
    print("✅ Dependencies installed")

def verify_database():
    """Test database connection"""
    print("\n🔍 Testing database connection...")
    import psycopg2
    from dotenv import load_dotenv

    load_dotenv()
    db_url = os.getenv('DATABASE_URL')

    if not db_url:
        print("❌ DATABASE_URL not set!")
        sys.exit(1)

    try:
        db = psycopg2.connect(db_url)
        cursor = db.cursor()
        cursor.execute('SELECT COUNT(*) FROM papers')
        count = cursor.fetchone()[0]
        print(f"✅ Connected! Current papers: {count:,}")
        db.close()
        return count
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        sys.exit(1)

def fetch_download_urls():
    """Get fresh download URLs from Semantic Scholar"""
    print("\n📥 Fetching download URLs...")
    import requests
    from dotenv import load_dotenv

    load_dotenv()
    api_key = os.getenv('SEMANTIC_SCHOLAR_API_KEY')

    if not api_key:
        print("❌ SEMANTIC_SCHOLAR_API_KEY not set!")
        sys.exit(1)

    # Wait for rate limit
    time.sleep(2)

    response = requests.get(
        'https://api.semanticscholar.org/datasets/v1/release/2025-12-09/dataset/papers',
        headers={'x-api-key': api_key}
    )

    if response.status_code == 200:
        dataset = response.json()
        files = dataset.get('files', [])

        os.makedirs('data/bulk', exist_ok=True)
        with open('data/bulk/download_urls.txt', 'w') as f:
            for url in files:
                f.write(url + '\n')

        print(f'✅ Saved {len(files)} download URLs')
        return len(files)
    else:
        print(f'❌ Error fetching URLs: {response.status_code}')
        if response.status_code == 429:
            print("Rate limited. Waiting 60 seconds...")
            time.sleep(60)
            return fetch_download_urls()
        sys.exit(1)

def run_parallel_ingestion(num_files=60, parallel=3):
    """Run ingestion with parallel processing"""
    print(f"\n🚀 Starting parallel ingestion ({parallel} files at a time)")
    print("=" * 70)

    import subprocess

    total_batches = (num_files + parallel - 1) // parallel

    for batch in range(total_batches):
        start_file = batch * parallel + 1
        end_file = min(start_file + parallel - 1, num_files)

        print(f"\n📦 Batch {batch + 1}/{total_batches}: Files {start_file}-{end_file}")

        processes = []
        for file_num in range(start_file, end_file + 1):
            if file_num <= num_files:
                print(f"  Starting file {file_num}...")
                proc = subprocess.Popen(
                    ["python3", "scripts/ingest_bulk.py", str(file_num), "1"],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE
                )
                processes.append((file_num, proc))

        # Wait for all processes in this batch
        for file_num, proc in processes:
            stdout, stderr = proc.communicate()
            if proc.returncode == 0:
                print(f"  ✅ File {file_num} complete")
            else:
                print(f"  ⚠️ File {file_num} had errors (continuing...)")
                if stderr:
                    print(f"     Error: {stderr.decode()[:200]}")

        # Progress update
        if batch % 5 == 0:
            current_count = verify_database()
            print(f"\n  📊 Current total: {current_count:,} papers")

    print("\n" + "=" * 70)
    print("✅ All batches complete!")

def main():
    """Main execution"""
    print("=" * 70)
    print("🚂 Railway Bulk Ingestion - Speed Mode")
    print("=" * 70)

    # Step 1: Install dependencies
    check_dependencies()

    # Step 2: Verify database
    initial_count = verify_database()

    # Step 3: Fetch download URLs
    num_files = fetch_download_urls()

    # Step 4: Run parallel ingestion (3 files at a time)
    print(f"\n🎯 Target: Process {num_files} files with 3-way parallelism")
    print(f"   Starting papers: {initial_count:,}")
    print(f"   Expected final: 800,000 - 1,200,000 papers")
    print(f"   Estimated time: 2-3 hours")
    print()

    input("Press ENTER to start ingestion (or Ctrl+C to cancel)...")

    start_time = time.time()
    run_parallel_ingestion(num_files=num_files, parallel=3)
    elapsed = time.time() - start_time

    # Final count
    final_count = verify_database()

    print("\n" + "=" * 70)
    print("🎉 INGESTION COMPLETE!")
    print("=" * 70)
    print(f"Starting papers:   {initial_count:,}")
    print(f"Final papers:      {final_count:,}")
    print(f"Papers added:      {final_count - initial_count:,}")
    print(f"Time elapsed:      {elapsed/3600:.1f} hours")
    print("=" * 70)
    print()
    print("Next steps:")
    print("  1. Run locally: venv/bin/python scripts/generate_json.py all")
    print("  2. Deploy: git push origin main")
    print()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️ Interrupted by user")
        sys.exit(0)
    except Exception as e:
        print(f"\n\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
