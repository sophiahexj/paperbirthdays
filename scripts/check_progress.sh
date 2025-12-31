#!/bin/bash
# Quick script to check bulk ingestion progress

cd /Users/sophia/Desktop/paper\ birthdays/paperbirthdays

echo "📊 Bulk Ingestion Progress"
echo "=========================="
echo ""

# Check if process is running
if ps aux | grep -q "[i]ngest_bulk"; then
    echo "✓ Bulk ingestion is running"
    echo ""
else
    echo "⚠ No bulk ingestion process detected"
    echo ""
fi

# Database stats
venv/bin/python -c "
import psycopg2
import os
from dotenv import load_dotenv
load_dotenv()

db = psycopg2.connect(os.getenv('DATABASE_URL'))
cursor = db.cursor()

cursor.execute('SELECT COUNT(*) FROM papers')
total = cursor.fetchone()[0]

cursor.execute('SELECT COUNT(DISTINCT publication_month_day) FROM papers WHERE publication_month_day IS NOT NULL')
dates = cursor.fetchone()[0]

cursor.execute('SELECT publication_month_day, COUNT(*) as count FROM papers GROUP BY publication_month_day ORDER BY count DESC LIMIT 5')
top_dates = cursor.fetchall()

cursor.execute('SELECT AVG(citation_count) FROM papers WHERE citation_count > 0')
avg_citations = cursor.fetchone()[0] or 0

print(f'Total papers: {total:,}')
print(f'Unique dates covered: {dates}/366')
print(f'Average citations: {avg_citations:.1f}')
print(f'')
print('Top 5 dates by paper count:')
for date, count in top_dates:
    print(f'  {date}: {count:,} papers')
"

echo ""
echo "To restart full ingestion: ./scripts/run_bulk_all.sh"
