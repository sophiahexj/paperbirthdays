#!/usr/bin/env python3
"""
Simplified ingestion - fetches recent papers only (2010-2024)
"""

import os
import sys
import time
import requests
import psycopg2
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

def ingest_papers(month, day, year_start=2015, year_end=2024):
    """Fetch and store papers for a specific date, recent years only"""

    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("ERROR: DATABASE_URL not set")
        sys.exit(1)

    db = psycopg2.connect(database_url)
    cursor = db.cursor()

    month_day = f"{month:02d}-{day:02d}"
    print(f"\n{'='*60}")
    print(f"Ingesting papers for {month_day} ({year_start}-{year_end})")
    print(f"{'='*60}\n")

    total_papers = 0

    for year in range(year_start, year_end + 1):
        date_str = f"{year}-{month:02d}-{day:02d}"

        try:
            print(f"Fetching {date_str}...", end=" ", flush=True)

            response = requests.get(
                "https://api.semanticscholar.org/graph/v1/paper/search",
                params={
                    'query': f'publicationDate:{date_str}',
                    'fields': 'title,authors,year,publicationDate,citationCount,fieldsOfStudy,venue,externalIds,openAccessPdf',
                    'limit': 100
                },
                timeout=20
            )

            if response.status_code == 200:
                data = response.json()
                papers = data.get('data', [])
                print(f"{len(papers)} papers")

                for paper in papers:
                    if not paper.get('paperId') or not paper.get('title'):
                        continue

                    # CRITICAL: Validate actual publication date matches what we queried for
                    actual_pub_date = paper.get('publicationDate')
                    if not actual_pub_date:
                        continue

                    # Only store if the ACTUAL publication date matches our query date
                    if actual_pub_date != date_str:
                        continue  # Skip papers with wrong dates

                    # CRITICAL: Only keep papers with MORE than 100 citations
                    citation_count = paper.get('citationCount', 0) or 0
                    if citation_count <= 100:
                        continue  # Skip papers with too few citations

                    # Extract month-day from actual publication date
                    try:
                        parts = actual_pub_date.split('-')
                        if len(parts) >= 3:
                            actual_month_day = f"{parts[1]}-{parts[2]}"
                            actual_year = int(parts[0])
                        else:
                            continue  # Skip if date format is incomplete
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
                        """, (
                            paper['paperId'],
                            'semantic_scholar',
                            paper.get('title'),
                            len(paper.get('authors', [])),
                            actual_pub_date,  # Use ACTUAL date from API
                            actual_month_day,  # Use ACTUAL month-day
                            actual_year,  # Use ACTUAL year
                            paper.get('venue'),
                            normalize_field(fields),
                            fields,
                            paper.get('citationCount', 0) or 0,
                            paper.get('externalIds', {}).get('DOI'),
                            f"https://www.semanticscholar.org/paper/{paper['paperId']}",
                            paper.get('openAccessPdf', {}).get('url') if isinstance(paper.get('openAccessPdf'), dict) else None,
                            bool(paper.get('openAccessPdf'))
                        ))
                        total_papers += 1
                    except Exception as e:
                        print(f"\n  Error inserting paper: {e}")
                        continue

                db.commit()

            elif response.status_code == 429:
                print("Rate limited! Waiting 60s...")
                time.sleep(60)
                continue

            else:
                print(f"Error: {response.status_code}")

            # Rate limiting: wait between requests
            time.sleep(0.5)  # 500ms between requests

        except Exception as e:
            print(f"Error: {e}")
            continue

    print(f"\n{'='*60}")
    print(f"✓ Completed! Inserted {total_papers} papers")
    print(f"{'='*60}\n")

    cursor.close()
    db.close()

if __name__ == "__main__":
    if len(sys.argv) > 1:
        month, day = map(int, sys.argv[1].split('-'))
    else:
        today = datetime.now()
        month, day = today.month, today.day

    ingest_papers(month, day)
