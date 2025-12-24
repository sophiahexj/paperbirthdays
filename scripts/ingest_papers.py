#!/usr/bin/env python3
"""
Paper Birthdays - Data Ingestion Script
Fetches papers from Semantic Scholar API and stores them in PostgreSQL
"""

import os
import sys
import time
import requests
import psycopg2
from datetime import datetime, date
from typing import List, Dict, Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class SemanticScholarIngester:
    """Handles fetching and storing papers from Semantic Scholar API"""

    def __init__(self, db_connection):
        self.db = db_connection
        self.base_url = "https://api.semanticscholar.org/graph/v1"
        self.rate_limit_delay = 0.01  # 10ms between requests (100/sec limit)
        self.api_key = os.getenv('SEMANTIC_SCHOLAR_API_KEY')  # Optional

        # Prepare headers
        self.headers = {}
        if self.api_key:
            self.headers['x-api-key'] = self.api_key

    def extract_month_day(self, date_str: str) -> Optional[str]:
        """Extract MM-DD from date string"""
        if not date_str:
            return None
        try:
            parts = date_str.split('-')
            if len(parts) >= 2:
                return f"{parts[1]}-{parts[2]}"
        except:
            pass
        return None

    def normalize_field(self, fields_of_study: List[str]) -> str:
        """Map diverse field names to canonical categories"""
        if not fields_of_study:
            return 'Other'

        field_mapping = {
            'Computer Science': ['Computer Science', 'CS'],
            'Economics': ['Economics', 'Business'],
            'Physics': ['Physics', 'Astronomy', 'Astrophysics'],
            'Biology': ['Biology', 'Medicine', 'Biochemistry', 'Genetics'],
            'Mathematics': ['Mathematics', 'Statistics'],
            'Psychology': ['Psychology', 'Cognitive Science'],
            'Engineering': ['Engineering'],
            'Chemistry': ['Chemistry', 'Materials Science'],
            'Environmental Science': ['Environmental Science', 'Geology', 'Geography'],
            'Political Science': ['Political Science', 'Sociology'],
            'Philosophy': ['Philosophy'],
            'History': ['History'],
            'Art': ['Art'],
        }

        for canonical, variants in field_mapping.items():
            if any(f in fields_of_study for f in variants):
                return canonical

        return fields_of_study[0] if fields_of_study else 'Other'

    def fetch_papers_for_date(self, month: int, day: int, year_start: int = 1900, year_end: int = 2024, max_per_year: int = 100) -> List[Dict]:
        """Fetch papers published on MM-DD across multiple years"""
        all_papers = []

        for year in range(year_start, year_end + 1):
            date_str = f"{year}-{month:02d}-{day:02d}"

            try:
                response = requests.get(
                    f"{self.base_url}/paper/search",
                    params={
                        'query': f'publicationDate:{date_str}',
                        'fields': 'title,authors,publicationDate,citationCount,fieldsOfStudy,venue,abstract,openAccessPdf,externalIds,influentialCitationCount,referenceCount',
                        'limit': 100,
                        'offset': 0
                    },
                    headers=self.headers,
                    timeout=10
                )

                if response.status_code == 200:
                    data = response.json()
                    papers = data.get('data', [])
                    all_papers.extend(papers[:max_per_year])

                    print(f"  {date_str}: {len(papers)} papers")

                elif response.status_code == 429:  # Rate limited
                    print(f"  Rate limited at {date_str}, waiting 60s...")
                    time.sleep(60)
                    continue

                time.sleep(self.rate_limit_delay)

            except Exception as e:
                print(f"  Error fetching {date_str}: {e}")
                self.log_failed_fetch(date_str, str(e))
                continue

        return all_papers

    def normalize_paper(self, raw_paper: Dict) -> Dict:
        """Convert API response to our schema"""
        pub_date = raw_paper.get('publicationDate')
        fields_of_study = raw_paper.get('fieldsOfStudy', [])

        return {
            'paper_id': raw_paper.get('paperId'),
            'source': 'semantic_scholar',
            'title': raw_paper.get('title'),
            'abstract': raw_paper.get('abstract'),
            'authors': [author.get('name') for author in raw_paper.get('authors', [])],
            'author_count': len(raw_paper.get('authors', [])),
            'publication_date': pub_date,
            'publication_month_day': self.extract_month_day(pub_date),
            'year': int(pub_date.split('-')[0]) if pub_date and '-' in pub_date else None,
            'venue': raw_paper.get('venue'),
            'field': self.normalize_field(fields_of_study),
            'fields_of_study': fields_of_study,
            'citation_count': raw_paper.get('citationCount', 0) or 0,
            'influential_citation_count': raw_paper.get('influentialCitationCount', 0) or 0,
            'reference_count': raw_paper.get('referenceCount', 0) or 0,
            'doi': raw_paper.get('externalIds', {}).get('DOI'),
            'url': f"https://www.semanticscholar.org/paper/{raw_paper.get('paperId')}" if raw_paper.get('paperId') else None,
            'pdf_url': raw_paper.get('openAccessPdf', {}).get('url') if isinstance(raw_paper.get('openAccessPdf'), dict) else None,
            'is_open_access': bool(raw_paper.get('openAccessPdf'))
        }

    def upsert_paper(self, paper: Dict) -> bool:
        """Insert new paper or update citation count if exists"""
        cursor = self.db.cursor()

        try:
            cursor.execute("""
                INSERT INTO papers (
                    paper_id, source, title, abstract, authors, author_count,
                    publication_date, publication_month_day, year, venue,
                    field, fields_of_study, citation_count, influential_citation_count,
                    reference_count, doi, url, pdf_url, is_open_access
                ) VALUES (
                    %(paper_id)s, %(source)s, %(title)s, %(abstract)s, %(authors)s, %(author_count)s,
                    %(publication_date)s, %(publication_month_day)s, %(year)s, %(venue)s,
                    %(field)s, %(fields_of_study)s, %(citation_count)s, %(influential_citation_count)s,
                    %(reference_count)s, %(doi)s, %(url)s, %(pdf_url)s, %(is_open_access)s
                )
                ON CONFLICT (paper_id) DO UPDATE SET
                    citation_count = EXCLUDED.citation_count,
                    influential_citation_count = EXCLUDED.influential_citation_count,
                    reference_count = EXCLUDED.reference_count,
                    updated_at = NOW(),
                    last_citation_update = CURRENT_DATE
            """, paper)

            self.db.commit()
            return True

        except Exception as e:
            self.db.rollback()
            print(f"  Error upserting paper: {e}")
            return False

    def log_failed_fetch(self, identifier: str, error: str):
        """Log failed API calls for retry later"""
        cursor = self.db.cursor()
        try:
            cursor.execute("""
                INSERT INTO failed_fetches (paper_id, source, error_message)
                VALUES (%s, %s, %s)
            """, (identifier, 'semantic_scholar', error))
            self.db.commit()
        except:
            self.db.rollback()

    def log_ingestion(self, month_day: str, fetched: int, new: int, duration: int, status: str = 'success', error: str = None):
        """Log ingestion run"""
        cursor = self.db.cursor()
        try:
            cursor.execute("""
                INSERT INTO ingestion_logs (
                    run_date, month_day, source, papers_fetched, papers_new,
                    status, error_message, duration_seconds
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (date.today(), month_day, 'semantic_scholar', fetched, new, status, error, duration))
            self.db.commit()
        except:
            self.db.rollback()

    def ingest_for_month_day(self, month: int, day: int):
        """Main ingestion function for a specific MM-DD"""
        start_time = time.time()
        month_day = f"{month:02d}-{day:02d}"

        print(f"\nIngesting papers for {month_day}...")

        # Fetch papers
        raw_papers = self.fetch_papers_for_date(month, day)
        print(f"Fetched {len(raw_papers)} total papers")

        # Normalize and insert
        new_count = 0

        for raw_paper in raw_papers:
            paper = self.normalize_paper(raw_paper)

            # Skip incomplete records
            if not paper['title'] or not paper['year'] or not paper['paper_id']:
                continue

            if self.upsert_paper(paper):
                new_count += 1

        # Log results
        duration = int(time.time() - start_time)
        self.log_ingestion(month_day, len(raw_papers), new_count, duration)

        print(f"✓ Completed {month_day}: {new_count} papers in {duration}s\n")


def main():
    """Main entry point"""
    # Connect to database
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("Error: DATABASE_URL environment variable not set")
        print("Create a .env file with: DATABASE_URL=postgresql://user:pass@host/db")
        sys.exit(1)

    try:
        db = psycopg2.connect(database_url)
        print("✓ Connected to database")
    except Exception as e:
        print(f"✗ Database connection failed: {e}")
        sys.exit(1)

    ingester = SemanticScholarIngester(db)

    # Determine what to ingest
    if len(sys.argv) > 1:
        if sys.argv[1] == 'today':
            # Ingest today's date
            today = datetime.now()
            ingester.ingest_for_month_day(today.month, today.day)

        elif sys.argv[1] == 'all':
            # Ingest all 366 dates (WARNING: Takes a long time!)
            print("Ingesting all 366 dates... This will take several hours.")
            for month in range(1, 13):
                days_in_month = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
                for day in range(1, days_in_month[month - 1] + 1):
                    try:
                        ingester.ingest_for_month_day(month, day)
                    except Exception as e:
                        print(f"Error on {month:02d}-{day:02d}: {e}")
                        continue

        elif '-' in sys.argv[1]:
            # Ingest specific date (MM-DD format)
            month, day = map(int, sys.argv[1].split('-'))
            ingester.ingest_for_month_day(month, day)

        else:
            print("Usage: python ingest_papers.py [today|all|MM-DD]")
            sys.exit(1)
    else:
        # Default: ingest today
        today = datetime.now()
        ingester.ingest_for_month_day(today.month, today.day)

    db.close()
    print("✓ All done!")


if __name__ == "__main__":
    main()
