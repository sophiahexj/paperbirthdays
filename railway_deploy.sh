#!/bin/bash
# Railway deployment script for bulk ingestion
# Run this on Railway to complete ingestion faster

set -e

echo "🚂 Railway Bulk Ingestion Setup"
echo "================================"

# Install Python dependencies
echo "📦 Installing dependencies..."
pip install -q psycopg2-binary requests python-dotenv

# Verify database connection
echo "🔍 Testing database connection..."
python3 << 'PYTHON'
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()
db_url = os.getenv('DATABASE_URL')

if not db_url:
    print("❌ DATABASE_URL not set!")
    exit(1)

try:
    db = psycopg2.connect(db_url)
    cursor = db.cursor()
    cursor.execute('SELECT COUNT(*) FROM papers')
    count = cursor.fetchone()[0]
    print(f"✅ Connected! Current papers: {count:,}")
    db.close()
except Exception as e:
    print(f"❌ Connection failed: {e}")
    exit(1)
PYTHON

# Download fresh URLs
echo "📥 Fetching fresh download URLs..."
python3 << 'PYTHON'
import requests
import os
from dotenv import load_dotenv
import time

load_dotenv()
api_key = os.getenv('SEMANTIC_SCHOLAR_API_KEY')

print('Fetching dataset URLs...')
time.sleep(2)  # Rate limit safety

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

    print(f'✅ Saved {len(files)} URLs')
else:
    print(f'❌ Error: {response.status_code}')
    exit(1)
PYTHON

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start ingestion, run:"
echo "  python3 scripts/ingest_bulk.py 1 60"
echo ""
echo "Or run all files:"
echo "  ./scripts/run_bulk_all.sh"
