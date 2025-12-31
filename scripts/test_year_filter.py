#!/usr/bin/env python3
"""Test using year filter then filtering client-side"""

import os
import requests
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv('SEMANTIC_SCHOLAR_API_KEY')
headers = {'x-api-key': api_key} if api_key else {}

# Approach: Get all papers from 2020, then filter for 12-31
print("=== Getting papers from 2020, filtering for 12-31 ===\n")

response = requests.get(
    "https://api.semanticscholar.org/graph/v1/paper/search",
    params={
        'query': '*',
        'year': '2020',
        'fields': 'title,publicationDate,citationCount',
        'limit': 100
    },
    headers=headers,
    timeout=10
)

print(f"Status: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    papers = data.get('data', [])
    print(f"Total results for 2020: {data.get('total', 'N/A')}")
    print(f"Returned: {len(papers)}")

    # Filter for exact date
    dec31_papers = [p for p in papers if p.get('publicationDate') == '2020-12-31']
    print(f"\nPapers with exact date 2020-12-31: {len(dec31_papers)}")

    # Show papers with >10 citations
    high_citation = [p for p in dec31_papers if (p.get('citationCount') or 0) > 10]
    print(f"Papers with >10 citations: {len(high_citation)}\n")

    for paper in high_citation[:3]:
        print(f"✓ [{paper.get('citationCount')} cites] {paper.get('title')[:60]}")
else:
    print(f"Error: {response.text}")
