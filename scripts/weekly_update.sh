#!/bin/bash
# Weekly update script for Paper Birthdays
# Fetches papers from the last 7 days and regenerates JSON
# Run manually or via cron job

set -e  # Exit on error

cd "$(dirname "$0")/.."  # Go to project root

echo "======================================"
echo "Paper Birthdays - Weekly Update"
echo "======================================"
echo ""

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found!"
    echo "Run: python3 -m venv venv"
    exit 1
fi

# Activate virtual environment
source venv/bin/activate

# Check database connection
echo "🔍 Checking database connection..."
python -c "
import psycopg2
import os
from dotenv import load_dotenv
load_dotenv()
try:
    db = psycopg2.connect(os.getenv('DATABASE_URL'))
    print('✓ Database connected')
    db.close()
except Exception as e:
    print(f'✗ Database connection failed: {e}')
    exit(1)
"

# Get papers from last 7 days
echo ""
echo "📥 Fetching papers from last 7 days..."
echo ""

PAPERS_ADDED=0

for i in {0..6}; do
    # Calculate date (macOS date syntax)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        DATE=$(date -v-${i}d +%Y-%m-%d)
    else
        # Linux date syntax
        DATE=$(date -d "$i days ago" +%Y-%m-%d)
    fi

    echo "  Checking $DATE..."

    # Run ingestion for this date
    python scripts/ingest_recent.py "$DATE" 2>&1 | grep -E "papers|✓|✗" || true
done

echo ""
echo "📊 Checking new paper count..."

python -c "
import psycopg2
import os
from dotenv import load_dotenv
load_dotenv()

db = psycopg2.connect(os.getenv('DATABASE_URL'))
cursor = db.cursor()

cursor.execute('SELECT COUNT(*) FROM papers')
total = cursor.fetchone()[0]

print(f'Total papers in database: {total:,}')
db.close()
"

# Regenerate JSON files
echo ""
echo "📝 Regenerating JSON files..."
python scripts/generate_json.py all

echo ""
echo "======================================"
echo "✅ Weekly update complete!"
echo "======================================"
echo ""
echo "Next steps:"
echo "  1. Test locally: npm run dev"
echo "  2. Deploy: vercel --prod"
echo ""
echo "To automate this weekly:"
echo "  crontab -e"
echo "  Add: 0 2 * * 1 $PWD/scripts/weekly_update.sh"
echo ""
