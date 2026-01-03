#!/usr/bin/env python3
"""Check database size and table sizes"""

import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def check_sizes():
    """Check database and table sizes"""
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        raise ValueError("DATABASE_URL environment variable not set")

    conn = psycopg2.connect(database_url)
    cursor = conn.cursor()

    # Get database size
    cursor.execute("""
        SELECT pg_size_pretty(pg_database_size(current_database())) as size
    """)
    db_size = cursor.fetchone()[0]
    print(f"Total database size: {db_size}")
    print("\n" + "=" * 60)

    # Get table sizes
    cursor.execute("""
        SELECT
            tablename,
            pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
            pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
    """)

    print("\nTable sizes:")
    print("-" * 60)
    total_bytes = 0
    for row in cursor.fetchall():
        tablename, size, size_bytes = row
        total_bytes += size_bytes
        print(f"  {tablename:40} {size:>15}")

    print("-" * 60)
    print(f"  {'TOTAL':40} {total_bytes/1024/1024:>12.2f} MB")

    # Check row counts
    print("\n" + "=" * 60)
    print("\nRow counts:")
    print("-" * 60)

    cursor.execute("""
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
    """)

    for (tablename,) in cursor.fetchall():
        cursor.execute(f"SELECT COUNT(*) FROM {tablename}")
        count = cursor.fetchone()[0]
        print(f"  {tablename:40} {count:>15,} rows")

    cursor.close()
    conn.close()

if __name__ == '__main__':
    try:
        check_sizes()
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
