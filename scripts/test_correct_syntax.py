#!/usr/bin/env python3
"""Test correct date query syntax"""

import os
import requests
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv('SEMANTIC_SCHOLAR_API_KEY')
headers = {'x-api-key': api_key} if api_key else {}

# Test with correct publicationDateOrYear parameter
print("=== Testing correct syntax for 2020-12-31 ===\n")

response = requests.get(
    "https://api.semanticscholar.org/graph/v1/paper/search",
    params={
        'query': '*',  # Match all papers
        'publicationDateOrYear': '2020-12-31:2020-12-31',  # Filter to exact date
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

    # Check if dates match exactly
    exact_matches = [p for p in papers if p.get('publicationDate') == '2020-12-31']
    print(f"\nPapers with EXACT date 2020-12-31: {len(exact_matches)}")

    # Show papers with >10 citations
    high_citation = [p for p in exact_matches if (p.get('citationCount') or 0) > 10]
    print(f"Papers with >10 citations: {len(high_citation)}\n")

    for paper in high_citation[:5]:
        print(f"✓ [{paper.get('citationCount')} cites] {paper.get('title')[:60]}")
        print(f"  Pub date: {paper.get('publicationDate')}")
else:
    print(f"Error: {response.text}")
