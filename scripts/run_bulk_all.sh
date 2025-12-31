#!/bin/bash
# Process all 60 bulk dataset files

cd /Users/sophia/Desktop/paper\ birthdays/paperbirthdays

echo "=========================================="
echo "Bulk Dataset Ingestion - All 60 Files"
echo "Target: 1M+ papers"
echo "=========================================="
echo ""

START_TIME=$(date +%s)

# Process files 1-60
for i in {1..60}; do
    echo "[$i/60] Processing file $i..."
    echo "Started: $(date)"

    venv/bin/python scripts/ingest_bulk.py $i 1

    # Check database count
    PAPER_COUNT=$(venv/bin/python -c "
import psycopg2
import os
from dotenv import load_dotenv
load_dotenv()
db = psycopg2.connect(os.getenv('DATABASE_URL'))
cursor = db.cursor()
cursor.execute('SELECT COUNT(*) FROM papers')
print(cursor.fetchone()[0])
")

    echo "Total papers in database: $PAPER_COUNT"
    echo "Completed: $(date)"
    echo ""
done

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
HOURS=$((DURATION / 3600))
MINUTES=$(((DURATION % 3600) / 60))

echo "=========================================="
echo "✓ ALL FILES COMPLETE!"
echo "Time taken: ${HOURS}h ${MINUTES}m"
echo "=========================================="

# Generate JSON for all dates
echo ""
echo "Generating JSON files for all 366 dates..."
venv/bin/python scripts/generate_json.py all

echo ""
echo "🎉 DONE! Ready to deploy!"
