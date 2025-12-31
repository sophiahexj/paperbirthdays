#!/usr/bin/env python3
"""Test December 31st data"""

import os
import requests
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv('SEMANTIC_SCHOLAR_API_KEY')
headers = {'x-api-key': api_key} if api_key else {}

# Test December 31st for a few years
for year in [2018, 2020, 2023]:
    print(f"\n=== {year}-12-31 ===")
    response = requests.get(
        "https://api.semanticscholar.org/graph/v1/paper/search",
        params={
            'query': f'publicationDate:{year}-12-31',
            'fields': 'title,publicationDate,citationCount',
            'limit': 20
        },
        headers=headers,
        timeout=10
    )
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        papers = data.get('data', [])
        print(f"Total results: {data.get('total', 'N/A')}")
        print(f"Returned: {len(papers)}")

        # Show papers with >10 citations
        high_citation = [p for p in papers if (p.get('citationCount') or 0) > 10]
        print(f"Papers with >10 citations: {len(high_citation)}")

        for paper in high_citation[:3]:
            print(f"  - [{paper.get('citationCount')} cites] {paper.get('title')[:60]}")
            print(f"    Pub date: {paper.get('publicationDate')}")
    else:
        print(f"Error: {response.text[:200]}")

    import time
    time.sleep(1)
