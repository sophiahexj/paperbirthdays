#!/usr/bin/env python3
"""
Run database schema
"""

import os
import sys
import psycopg2
from dotenv import load_dotenv

load_dotenv()

print("=" * 60)
print("Running Database Schema")
print("=" * 60)

database_url = os.getenv('DATABASE_URL')
if not database_url:
    print("❌ ERROR: DATABASE_URL not found")
    sys.exit(1)

# Read schema file
schema_path = os.path.join(os.path.dirname(__file__), '..', 'db', 'schema.sql')
with open(schema_path, 'r') as f:
    schema_sql = f.read()

try:
    conn = psycopg2.connect(database_url)
    cursor = conn.cursor()

    print("✓ Connected to database")
    print("\nExecuting schema...")

    # Execute the schema
    cursor.execute(schema_sql)
    conn.commit()

    print("✓ Schema executed successfully!")

    # Verify tables were created
    cursor.execute("""
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name;
    """)
    tables = cursor.fetchall()

    print(f"\n✓ Created {len(tables)} tables:")
    for table in tables:
        print(f"  - {table[0]}")

    cursor.close()
    conn.close()

    print("\n" + "=" * 60)
    print("✅ DATABASE READY!")
    print("=" * 60)

except Exception as e:
    print(f"\n❌ ERROR: {e}")
    sys.exit(1)
