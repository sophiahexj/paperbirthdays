#!/usr/bin/env python3
"""
Test database connection
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

print("=" * 60)
print("Database Connection Test")
print("=" * 60)

database_url = os.getenv('DATABASE_URL')

if not database_url:
    print("❌ ERROR: DATABASE_URL not found in .env file")
    print("\nMake sure you have a .env file with:")
    print("DATABASE_URL=postgresql://...")
    sys.exit(1)

# Check if it's still the placeholder
if "your-username" in database_url or "your-password" in database_url:
    print("❌ ERROR: DATABASE_URL is still using placeholder values")
    print("\nYou need to replace the placeholder in .env with your actual Neon connection string")
    print("\nCurrent value:")
    print(database_url)
    sys.exit(1)

print(f"✓ Found DATABASE_URL in .env file")
print(f"\nConnection string: {database_url[:50]}..." if len(database_url) > 50 else f"\nConnection string: {database_url}")

# Try to import psycopg2
try:
    import psycopg2
    print("✓ psycopg2 library is installed")
except ImportError:
    print("❌ ERROR: psycopg2 not installed")
    print("\nRun: pip install -r requirements.txt")
    sys.exit(1)

# Try to connect
print("\nAttempting to connect to database...")
try:
    conn = psycopg2.connect(database_url)
    print("✓ Successfully connected to database!")

    # Test a simple query
    cursor = conn.cursor()
    cursor.execute("SELECT version();")
    version = cursor.fetchone()[0]
    print(f"✓ PostgreSQL version: {version[:60]}...")

    # Check if tables exist
    cursor.execute("""
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name;
    """)
    tables = cursor.fetchall()

    if tables:
        print(f"\n✓ Found {len(tables)} tables in database:")
        for table in tables:
            print(f"  - {table[0]}")
    else:
        print("\n⚠ No tables found yet. You need to run the schema!")
        print("  Go to Neon SQL Editor and paste db/schema.sql")

    cursor.close()
    conn.close()

    print("\n" + "=" * 60)
    print("✅ ALL TESTS PASSED - Database is ready!")
    print("=" * 60)

except Exception as e:
    print(f"\n❌ ERROR: Failed to connect to database")
    print(f"\nError details: {e}")
    print("\nCommon issues:")
    print("  1. Check your connection string is correct")
    print("  2. Make sure your IP is allowed (Neon usually allows all by default)")
    print("  3. Check your password doesn't have special characters that need escaping")
    sys.exit(1)
