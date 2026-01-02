#!/usr/bin/env python3
"""
Process Semantic Scholar bulk dataset - stream download and filter
"""

import os
import sys
import gzip
import json
import psycopg2
import requests
from datetime import datetime
from dotenv import load_dotenv
import time

load_dotenv()


def normalize_field(fields_of_study):
    """Map diverse field names to canonical categories"""
    if not fields_of_study:
        return 'Other'

    field_mapping = {
        'Medicine': ['Medicine'],
        'Biology': ['Biology'],
        'Computer Science': ['Computer Science'],
        'Economics': ['Economics', 'Business'],
        'Physics': ['Physics'],
        'Mathematics': ['Mathematics'],
        'Psychology': ['Psychology'],
        'Engineering': ['Engineering'],
        'Chemistry': ['Chemistry', 'Materials Science'],
        'Environmental Science': ['Environmental Science', 'Geology', 'Geography'],
        'Political Science': ['Political Science', 'Sociology'],
        'Art': ['Art'],
        'Philosophy': ['Philosophy'],
        'History': ['History'],
    }

    # Use the FIRST field (primary field) instead of all fields
    # This prevents misclassification when Medicine is a secondary field
    primary_field = fields_of_study[0]
    if isinstance(primary_field, dict):
        field_name = primary_field.get('category', '')
    else:
        field_name = str(primary_field)

    for category, keywords in field_mapping.items():
        for keyword in keywords:
            if keyword.lower() in field_name.lower():
                return category

    return 'Other'


def process_file_streaming(url, db_connection, file_num, total_files):
    """Download and process a single file, streaming line by line"""

    cursor = db_connection.cursor()

    print(f"\n[{file_num}/{total_files}] Downloading and processing...")

    # Retry entire file processing if connection breaks
    max_file_retries = 5
    total_papers = 0
    inserted_papers = 0
    papers_with_dates = 0

    for file_attempt in range(max_file_retries):
        try:
            # Stream download the gzipped file with retries
            max_retries = 3
            response = None
            for attempt in range(max_retries):
                try:
                    response = requests.get(url, stream=True, timeout=60)
                    response.raise_for_status()
                    break
                except (requests.exceptions.ConnectionError, requests.exceptions.Timeout) as e:
                    if attempt < max_retries - 1:
                        wait_time = (attempt + 1) * 10
                        print(f"  Connection error, retrying in {wait_time}s... (attempt {attempt + 1}/{max_retries})")
                        time.sleep(wait_time)
                    else:
                        raise

            if not response:
                continue

            # Process line by line from gzipped stream
            for line in gzip.open(response.raw, 'rt', encoding='utf-8'):
                total_papers += 1

                try:
                    paper = json.loads(line)

                    # Only process papers with exact YYYY-MM-DD publication dates
                    pub_date = paper.get('publicationdate')
                    if not pub_date or len(pub_date) != 10:
                        continue

                    papers_with_dates += 1

                    # Extract month-day
                    try:
                        parts = pub_date.split('-')
                        if len(parts) != 3:
                            continue
                        month_day = f"{parts[1]}-{parts[2]}"
                        year = int(parts[0])
                    except:
                        continue

                    # Filter by citation count
                    citation_count = paper.get('citationcount', 0) or 0
                    if citation_count <= 10:
                        continue

                    # Get fields (handle None)
                    fields = paper.get('s2fieldsofstudy') or []

                    # Extract paper ID
                    paper_id = paper.get('corpusid')
                    if not paper_id:
                        continue

                    # Get title
                    title = paper.get('title')
                    if not title:
                        continue

                    # Get venue
                    venue = paper.get('venue') or (paper.get('journal', {}) or {}).get('name', 'Unknown Venue')

                    # Get authors (handle None)
                    authors = paper.get('authors') or []
                    author_count = len(authors)

                    # Get DOI
                    external_ids = paper.get('externalids', {}) or {}
                    doi = external_ids.get('DOI')

                    # Get URL
                    url_field = paper.get('url') or f"https://www.semanticscholar.org/paper/{paper_id}"

                    # Insert into database
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
                        """, (
                            str(paper_id),
                            'semantic_scholar',
                            title,
                            author_count,
                            pub_date,
                            month_day,
                            year,
                            venue,
                            normalize_field(fields),
                            [f.get('category') if isinstance(f, dict) else str(f) for f in fields][:10],
                            citation_count,
                            doi,
                            url_field,
                            None,  # pdf_url not in bulk dataset
                            False   # is_open_access
                        ))
                        inserted_papers += 1

                        # Commit every 1000 papers
                        if inserted_papers % 1000 == 0:
                            db_connection.commit()
                            print(f"  Processed: {total_papers:,} | With dates: {papers_with_dates:,} | Inserted: {inserted_papers:,}", end='\r')

                    except Exception as e:
                        # Rollback on error and continue
                        db_connection.rollback()
                        if 'duplicate key' not in str(e):
                            print(f"\n  Error inserting paper {paper_id}: {e}")
                        continue

                except json.JSONDecodeError:
                    continue
                except Exception as e:
                    print(f"\n  Error processing line: {e}")
                    continue

            # Final commit for this attempt
            db_connection.commit()
            print(f"\n  ✓ File complete - Total: {total_papers:,} | With dates: {papers_with_dates:,} | Inserted: {inserted_papers:,}")
            return inserted_papers

        except (requests.exceptions.ConnectionError, requests.exceptions.Timeout, Exception) as e:
            if file_attempt < max_file_retries - 1:
                wait_time = (file_attempt + 1) * 30
                print(f"\n  ⚠️  Connection lost during download/processing. Retrying in {wait_time}s... (attempt {file_attempt + 1}/{max_file_retries})")
                time.sleep(wait_time)
                # Reset counters for retry
                total_papers = 0
                inserted_papers = 0
                papers_with_dates = 0
            else:
                print(f"\n  ❌ Failed after {max_file_retries} attempts: {e}")
                db_connection.commit()  # Commit what we have
                return inserted_papers

    return inserted_papers


def main():
    """Main entry point"""

    # Connect to database
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("ERROR: DATABASE_URL not set")
        sys.exit(1)

    try:
        db = psycopg2.connect(database_url)
        print("✓ Connected to database")
    except Exception as e:
        print(f"✗ Database connection failed: {e}")
        sys.exit(1)

    # Read download URLs
    urls_file = 'data/bulk/download_urls.txt'
    if not os.path.exists(urls_file):
        print(f"ERROR: {urls_file} not found")
        sys.exit(1)

    with open(urls_file) as f:
        urls = [line.strip() for line in f if line.strip()]

    print(f"\n🚀 Processing {len(urls)} files from Semantic Scholar bulk dataset")
    print("="*70)

    # Process files one by one
    total_inserted = 0
    file_num = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    max_files = int(sys.argv[2]) if len(sys.argv) > 2 else len(urls)

    for i in range(file_num - 1, min(file_num - 1 + max_files, len(urls))):
        url = urls[i]
        inserted = process_file_streaming(url, db, i + 1, len(urls))
        total_inserted += inserted

    db.close()

    print("\n" + "="*70)
    print(f"✓ COMPLETE! Total papers inserted: {total_inserted:,}")
    print("="*70)


if __name__ == "__main__":
    main()
