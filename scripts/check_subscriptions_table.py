#!/usr/bin/env python3
"""Check if subscriptions table exists"""

import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def check_table():
    """Check if subscriptions table exists"""
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        raise ValueError("DATABASE_URL environment variable not set")

    conn = psycopg2.connect(database_url)
    cursor = conn.cursor()

    # Check if table exists
    cursor.execute("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_name = 'paper_birthday_subscriptions'
        )
    """)
    exists = cursor.fetchone()[0]

    if exists:
        print("✓ Table 'paper_birthday_subscriptions' already exists!")

        # Show table structure
        cursor.execute("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'paper_birthday_subscriptions'
            ORDER BY ordinal_position
        """)

        print("\nTable structure:")
        print("-" * 60)
        for row in cursor.fetchall():
            print(f"  {row[0]}: {row[1]} (nullable: {row[2]})")

        # Check row count
        cursor.execute("SELECT COUNT(*) FROM paper_birthday_subscriptions")
        count = cursor.fetchone()[0]
        print(f"\nCurrent subscriptions: {count}")
    else:
        print("✗ Table 'paper_birthday_subscriptions' does NOT exist")
        print("\nYou need to run the migration manually using Supabase SQL editor:")
        print("1. Go to your Supabase/Neon dashboard")
        print("2. Open SQL Editor")
        print("3. Copy the contents of database/migrations/002_create_subscriptions_table.sql")
        print("4. Run the SQL script")

    cursor.close()
    conn.close()

if __name__ == '__main__':
    try:
        check_table()
    except Exception as e:
        print(f"Error checking table: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
