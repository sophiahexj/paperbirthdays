#!/usr/bin/env python3
"""Run database migration for subscriptions table"""

import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def run_migration():
    """Run the subscriptions table migration"""
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        raise ValueError("DATABASE_URL environment variable not set")

    # Read migration SQL
    migration_file = 'database/migrations/002_create_subscriptions_table.sql'
    with open(migration_file, 'r') as f:
        sql = f.read()

    # Connect and execute
    print(f"Connecting to database...")
    conn = psycopg2.connect(database_url)
    cursor = conn.cursor()

    print(f"Running migration: {migration_file}")
    cursor.execute(sql)
    conn.commit()

    print("✓ Migration completed successfully!")

    # Verify table exists
    cursor.execute("""
        SELECT table_name FROM information_schema.tables
        WHERE table_name = 'paper_birthday_subscriptions'
    """)
    if cursor.fetchone():
        print("✓ Table 'paper_birthday_subscriptions' created")

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

    cursor.close()
    conn.close()

if __name__ == '__main__':
    try:
        run_migration()
    except Exception as e:
        print(f"Error running migration: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
