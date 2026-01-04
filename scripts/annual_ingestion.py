#!/usr/bin/env python3
"""
Annual Paper Ingestion - Run once per year
Logic:
1. Ingest papers published since last ingestion with citations > 10
2. Keep only top 1000 papers per day (by citation count)
3. VACUUM database to reclaim space
"""

import os
import sys
import psycopg2
import requests
import time
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

def normalize_field(fields):
    """Simple field normalization"""
    if not fields:
        return 'Other'

    field_map = {
        'Computer Science': ['Computer Science'],
        'Economics': ['Economics', 'Business'],
        'Physics': ['Physics'],
        'Biology': ['Biology', 'Medicine'],
        'Mathematics': ['Mathematics'],
        'Psychology': ['Psychology'],
    }

    for canonical, variants in field_map.items():
        if any(f in fields for f in variants):
            return canonical
    return fields[0] if fields else 'Other'

def get_database_connection():
    """Connect to PostgreSQL database"""
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        raise ValueError("DATABASE_URL environment variable not set")
    return psycopg2.connect(database_url)

def get_last_ingestion_date(cursor):
    """Get the date of the last ingestion"""
    cursor.execute("""
        SELECT MAX(created_at) FROM ingestion_logs
        WHERE status = 'completed'
    """)
    result = cursor.fetchone()[0]

    if result:
        return result.strftime('%Y-%m-%d')
    else:
        # Default to 2024-01-01 if no previous ingestion
        return '2024-01-01'

def ingest_new_papers(cursor, last_ingestion_date):
    """
    Ingest papers published after last_ingestion_date with citations > 10
    For each unique month-day, fetch papers from recent years
    """
    print(f"\n📥 Ingesting new papers published after {last_ingestion_date}...")
    print(f"   Filtering for papers with citations > 10")

    # Get API key
    api_key = os.getenv('SEMANTIC_SCHOLAR_API_KEY')
    headers = {}
    if api_key:
        headers['x-api-key'] = api_key
    else:
        print("   Warning: No SEMANTIC_SCHOLAR_API_KEY set, will be rate-limited")

    # Get all unique month-days from current database
    cursor.execute("""
        SELECT DISTINCT publication_month_day
        FROM papers
        ORDER BY publication_month_day
    """)
    month_days = [row[0] for row in cursor.fetchall()]

    print(f"   Found {len(month_days)} unique month-days to update")

    # Parse last ingestion year
    last_year = int(last_ingestion_date.split('-')[0])
    current_year = datetime.now().year

    # If last ingestion was recent, only fetch new years
    start_year = last_year + 1
    end_year = current_year

    if start_year > end_year:
        print(f"   No new years to ingest (last ingestion: {last_year}, current: {current_year})")
        return 0

    print(f"   Will ingest years {start_year} to {end_year}")

    total_inserted = 0
    total_updated = 0

    # For each month-day, fetch papers from new years
    for idx, month_day in enumerate(month_days, 1):
        month, day = month_day.split('-')
        print(f"\n   [{idx}/{len(month_days)}] Processing {month_day}...", flush=True)

        for year in range(start_year, end_year + 1):
            date_str = f"{year}-{month}-{day}"

            try:
                # Fetch with pagination
                offset = 0
                limit = 100
                year_papers = 0

                while True:
                    response = requests.get(
                        "https://api.semanticscholar.org/graph/v1/paper/search",
                        params={
                            'query': 'a',
                            'publicationDateOrYear': date_str,
                            'fields': 'title,authors,year,publicationDate,citationCount,fieldsOfStudy,venue,externalIds,openAccessPdf',
                            'limit': limit,
                            'offset': offset
                        },
                        headers=headers,
                        timeout=20
                    )

                    if response.status_code == 200:
                        data = response.json()
                        papers = data.get('data', [])

                        if not papers:
                            break

                        for paper in papers:
                            if not paper.get('paperId') or not paper.get('title'):
                                continue

                            # Validate actual publication date
                            actual_pub_date = paper.get('publicationDate')
                            if not actual_pub_date or actual_pub_date != date_str:
                                continue

                            # CRITICAL: Only keep papers with MORE than 10 citations
                            citation_count = paper.get('citationCount', 0) or 0
                            if citation_count <= 10:
                                continue

                            # Extract month-day
                            try:
                                parts = actual_pub_date.split('-')
                                if len(parts) >= 3:
                                    actual_month_day = f"{parts[1]}-{parts[2]}"
                                    actual_year = int(parts[0])
                                else:
                                    continue
                            except:
                                continue

                            fields = paper.get('fieldsOfStudy', [])

                            try:
                                cursor.execute("""
                                    INSERT INTO papers (
                                        paper_id, source, title, author_count,
                                        publication_date, publication_month_day, year,
                                        venue, field, fields_of_study, citation_count,
                                        doi, url, pdf_url, is_open_access
                                    ) VALUES (
                                        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                                    )
                                    ON CONFLICT (paper_id) DO UPDATE SET
                                        citation_count = EXCLUDED.citation_count,
                                        updated_at = NOW()
                                    RETURNING (xmax = 0) AS inserted
                                """, (
                                    paper['paperId'],
                                    'semantic_scholar',
                                    paper.get('title'),
                                    len(paper.get('authors', [])),
                                    actual_pub_date,
                                    actual_month_day,
                                    actual_year,
                                    paper.get('venue'),
                                    normalize_field(fields),
                                    fields,
                                    citation_count,
                                    paper.get('externalIds', {}).get('DOI'),
                                    f"https://www.semanticscholar.org/paper/{paper['paperId']}",
                                    paper.get('openAccessPdf', {}).get('url') if isinstance(paper.get('openAccessPdf'), dict) else None,
                                    bool(paper.get('openAccessPdf'))
                                ))

                                # Check if it was an insert or update
                                was_inserted = cursor.fetchone()[0]
                                if was_inserted:
                                    total_inserted += 1
                                else:
                                    total_updated += 1
                                year_papers += 1

                            except Exception as e:
                                print(f"\n      Error inserting paper: {e}")
                                continue

                        # If we got less than limit, no need to paginate
                        if len(papers) < limit:
                            break

                        # Move to next page
                        offset += limit

                    elif response.status_code == 400:
                        # Hit pagination limit
                        break

                    elif response.status_code == 429:
                        print("\n      Rate limited! Waiting 5s...")
                        time.sleep(5)
                        continue

                    else:
                        print(f"\n      Error {response.status_code}")
                        break

                    # Rate limiting between pagination
                    time.sleep(1.0)

                if year_papers > 0:
                    print(f"      {year}: {year_papers} papers", flush=True)

                # Rate limiting between years
                time.sleep(0.5)

            except Exception as e:
                print(f"\n      Error fetching {date_str}: {e}")
                continue

        # Commit after each month-day
        cursor.connection.commit()

    print(f"\n✅ Ingestion complete!")
    print(f"   Inserted: {total_inserted:,} new papers")
    print(f"   Updated: {total_updated:,} existing papers")
    print(f"   Total processed: {total_inserted + total_updated:,}")

    return total_inserted + total_updated

def get_database_stats(cursor):
    """Get current database statistics"""
    # Total papers
    cursor.execute('SELECT COUNT(*) FROM papers')
    total_papers = cursor.fetchone()[0]

    # Papers per day distribution
    cursor.execute("""
        SELECT
            publication_month_day,
            COUNT(*) as count
        FROM papers
        GROUP BY publication_month_day
        ORDER BY count DESC
        LIMIT 5
    """)
    top_days = cursor.fetchall()

    # Database size
    cursor.execute("SELECT pg_size_pretty(pg_database_size(current_database()))")
    db_size = cursor.fetchone()[0]

    return {
        'total_papers': total_papers,
        'top_days': top_days,
        'db_size': db_size
    }

def trim_to_top_1000_per_day(cursor):
    """
    Keep only top 1000 papers per day (by citation count)
    Delete the rest
    """
    print("\n🔪 Trimming to top 1000 papers per day...")

    cursor.execute("""
        DELETE FROM papers
        WHERE paper_id IN (
            SELECT paper_id
            FROM (
                SELECT
                    paper_id,
                    ROW_NUMBER() OVER (
                        PARTITION BY publication_month_day
                        ORDER BY citation_count DESC
                    ) as rank
                FROM papers
            ) ranked
            WHERE rank > 1000
        )
    """)

    deleted_count = cursor.rowcount
    print(f"✅ Deleted {deleted_count:,} papers (keeping top 1000 per day)")

    return deleted_count

def vacuum_database(conn):
    """VACUUM database to reclaim space"""
    print("\n🧹 Running VACUUM to reclaim space...")

    # VACUUM requires autocommit mode
    old_isolation_level = conn.isolation_level
    conn.set_isolation_level(0)

    cursor = conn.cursor()
    cursor.execute('VACUUM FULL papers')
    cursor.close()

    conn.set_isolation_level(old_isolation_level)
    print("✅ VACUUM complete")

def log_ingestion(cursor, status, notes):
    """Log ingestion run"""
    cursor.execute("""
        INSERT INTO ingestion_logs (status, notes, created_at)
        VALUES (%s, %s, NOW())
    """, (status, notes))

def main():
    """Main annual ingestion process"""
    print("=" * 70)
    print("📅 Annual Paper Ingestion")
    print("=" * 70)
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

    conn = get_database_connection()
    cursor = conn.cursor()

    try:
        # Step 1: Get current stats
        print("📊 Current Database Stats:")
        stats_before = get_database_stats(cursor)
        print(f"   Total papers: {stats_before['total_papers']:,}")
        print(f"   Database size: {stats_before['db_size']}")
        print(f"   Top days:")
        for day, count in stats_before['top_days']:
            print(f"      {day}: {count:,} papers")

        # Step 2: Get last ingestion date
        last_ingestion = get_last_ingestion_date(cursor)
        print(f"\n📆 Last ingestion: {last_ingestion}")
        print(f"   Will ingest papers published after this date with citations > 10")

        # Step 3: Ingest new papers
        new_papers_count = ingest_new_papers(cursor, last_ingestion)
        conn.commit()

        # Step 4: Trim to top 1000 per day
        deleted_count = trim_to_top_1000_per_day(cursor)
        conn.commit()

        # Step 5: VACUUM to reclaim space
        vacuum_database(conn)

        # Step 6: Get final stats
        print("\n📊 Final Database Stats:")
        stats_after = get_database_stats(cursor)
        print(f"   Total papers: {stats_after['total_papers']:,}")
        print(f"   Database size: {stats_after['db_size']}")
        print(f"   Papers removed: {stats_before['total_papers'] - stats_after['total_papers']:,}")

        # Step 7: Log completion
        notes = f"Ingested {new_papers_count:,} new papers. Trimmed {deleted_count:,} papers. Final count: {stats_after['total_papers']:,}"
        log_ingestion(cursor, 'completed', notes)
        conn.commit()

        print("\n" + "=" * 70)
        print("✅ Annual ingestion complete!")
        print("=" * 70)

    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

        try:
            log_ingestion(cursor, 'failed', str(e))
            conn.commit()
        except:
            pass

        sys.exit(1)

    finally:
        cursor.close()
        conn.close()

if __name__ == '__main__':
    main()
