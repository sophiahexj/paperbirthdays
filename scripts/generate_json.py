#!/usr/bin/env python3
"""
Paper Birthdays - JSON Generation Script
Queries database and generates static JSON files for each day of the year
"""

import os
import sys
import json
import psycopg2
from datetime import datetime
from typing import List, Dict
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class JSONGenerator:
    """Generates static JSON files from database"""

    def __init__(self, db_connection):
        self.db = db_connection
        self.output_dir = os.path.join(os.getcwd(), 'public', 'data')

        # Ensure output directory exists
        os.makedirs(self.output_dir, exist_ok=True)

    def normalize_field(self, fields_of_study):
        """Map primary field to canonical category (uses FIRST field only)"""
        if not fields_of_study or len(fields_of_study) == 0:
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

        # Use the FIRST field (primary field) to prevent misclassification
        primary_field = fields_of_study[0]
        field_name = str(primary_field)

        for category, keywords in field_mapping.items():
            for keyword in keywords:
                if keyword.lower() in field_name.lower():
                    return category

        return 'Other'

    def fetch_papers_for_date(self, month_day: str) -> List[Dict]:
        """Query database for papers on a specific MM-DD"""
        cursor = self.db.cursor()

        cursor.execute("""
            SELECT
                paper_id, title, author_count, year, citation_count,
                fields_of_study, subfield, venue, url
            FROM papers
            WHERE publication_month_day = %s
            ORDER BY citation_count DESC
        """, (month_day,))

        papers = []
        for row in cursor.fetchall():
            # Calculate correct field from fields_of_study array
            correct_field = self.normalize_field(row[5])

            papers.append({
                'id': row[0],
                'title': row[1],
                'author_count': row[2],
                'year': row[3],
                'citation_count': row[4],
                'field': correct_field,
                'subfield': row[6],
                'venue': row[7] or 'Unknown Venue',
                'url': row[8] or 'https://example.com'
            })

        return papers

    def generate_file_for_date(self, month: int, day: int) -> bool:
        """Generate JSON file for a specific date"""
        month_day = f"{month:02d}-{day:02d}"

        try:
            # Fetch papers
            papers = self.fetch_papers_for_date(month_day)

            # Create output data
            output_data = {
                'date': month_day,
                'total_papers': len(papers),
                'papers': papers,
                'last_updated': datetime.now().isoformat()
            }

            # Write to file
            output_path = os.path.join(self.output_dir, f"{month_day}.json")

            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(output_data, f, indent=2, ensure_ascii=False)

            print(f"  {month_day}.json: {len(papers)} papers")
            return True

        except Exception as e:
            print(f"  Error generating {month_day}.json: {e}")
            return False

    def generate_all_files(self):
        """Generate JSON files for all 366 days"""
        print("Generating JSON files for all dates...\n")

        days_in_month = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
        total_files = 0
        total_papers = 0

        for month in range(1, 13):
            for day in range(1, days_in_month[month - 1] + 1):
                if self.generate_file_for_date(month, day):
                    total_files += 1

                    # Count papers for stats
                    month_day = f"{month:02d}-{day:02d}"
                    papers = self.fetch_papers_for_date(month_day)
                    total_papers += len(papers)

        print(f"\n✓ Generated {total_files} JSON files")
        print(f"✓ Total papers across all dates: {total_papers}")

        # Generate metadata file
        self.generate_metadata(total_papers)

    def generate_metadata(self, total_papers: int):
        """Generate metadata.json with global stats"""
        cursor = self.db.cursor()

        # Get field distribution
        cursor.execute("""
            SELECT field, COUNT(*) as count
            FROM papers
            GROUP BY field
            ORDER BY count DESC
        """)

        fields = {}
        for row in cursor.fetchall():
            if row[0]:
                fields[row[0]] = row[1]

        # Get year range
        cursor.execute("""
            SELECT MIN(year), MAX(year)
            FROM papers
            WHERE year IS NOT NULL
        """)
        year_min, year_max = cursor.fetchone()

        # Create metadata
        metadata = {
            'total_papers': total_papers,
            'date_range': f"{year_min}-{year_max}" if year_min and year_max else "Unknown",
            'last_full_update': datetime.now().isoformat(),
            'sources': ['Semantic Scholar'],
            'fields': fields,
            'total_files': 366
        }

        # Write metadata file
        output_path = os.path.join(self.output_dir, 'metadata.json')
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, indent=2)

        print(f"✓ Generated metadata.json")


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
        print("✓ Connected to database\n")
    except Exception as e:
        print(f"✗ Database connection failed: {e}")
        sys.exit(1)

    generator = JSONGenerator(db)

    # Determine what to generate
    if len(sys.argv) > 1:
        if sys.argv[1] == 'all':
            # Generate all 366 files
            generator.generate_all_files()

        elif '-' in sys.argv[1]:
            # Generate specific date (MM-DD format)
            month, day = map(int, sys.argv[1].split('-'))
            generator.generate_file_for_date(month, day)
            print("\n✓ Done!")

        else:
            print("Usage: python generate_json.py [all|MM-DD]")
            sys.exit(1)
    else:
        # Default: generate all
        generator.generate_all_files()

    db.close()


if __name__ == "__main__":
    main()
