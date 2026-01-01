#!/bin/bash
# Auto-start script for cloud deployment
# This runs automatically when deployed - no shell needed!

set -e

echo "🚀 Auto-starting bulk ingestion..."

# Install dependencies
pip install -q psycopg2-binary requests python-dotenv

# Run the ingestion script with auto-start
python3 -c "
import subprocess
import sys

# Run railway_ingestion.py and auto-confirm
proc = subprocess.Popen(
    ['python3', 'railway_ingestion.py'],
    stdin=subprocess.PIPE,
    stdout=subprocess.PIPE,
    stderr=subprocess.STDOUT,
    text=True
)

# Auto-send ENTER when prompted
import time
time.sleep(5)  # Wait for prompt
proc.stdin.write('\n')
proc.stdin.flush()

# Stream output
for line in proc.stdout:
    print(line, end='')
    sys.stdout.flush()
"
