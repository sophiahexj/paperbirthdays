#!/bin/bash
# Railway worker script - runs ingestion as background job

set -e

echo "🚀 Starting Railway ingestion worker..."

# Install dependencies
pip install -q psycopg2-binary requests python-dotenv

# Run the auto-ingestion script
python3 railway_auto.py

# Keep container alive (Railway needs this)
echo "✅ Ingestion complete! Keeping container alive..."
tail -f /dev/null
