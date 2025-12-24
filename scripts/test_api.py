#!/usr/bin/env python3
"""Quick test of Semantic Scholar API"""

import requests
from datetime import datetime

print("Testing Semantic Scholar API...")
print("Fetching papers published on 2024-12-24...")

try:
    response = requests.get(
        "https://api.semanticscholar.org/graph/v1/paper/search",
        params={
            'query': 'publicationDate:2024-12-24',
            'fields': 'title,authors,year,citationCount',
            'limit': 5
        },
        timeout=30
    )

    print(f"Status code: {response.status_code}")

    if response.status_code == 200:
        data = response.json()
        total = data.get('total', 0)
        papers = data.get('data', [])

        print(f"✓ Found {total} total papers published on 2024-12-24")
        print(f"✓ Showing first {len(papers)} papers:\n")

        for i, paper in enumerate(papers, 1):
            title = paper.get('title', 'No title')
            authors = len(paper.get('authors', []))
            citations = paper.get('citationCount', 0)
            print(f"{i}. {title}")
            print(f"   Authors: {authors}, Citations: {citations}\n")
    else:
        print(f"❌ Error: {response.status_code}")
        print(response.text)

except Exception as e:
    print(f"❌ Error: {e}")
