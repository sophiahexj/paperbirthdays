#!/usr/bin/env python3
"""Test exact date with publicationDateOrYear"""

import os
import requests
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv('SEMANTIC_SCHOLAR_API_KEY')
headers = {'x-api-key': api_key} if api_key else {}

# Test exact date format
print("=== Testing publicationDateOrYear=2020-12-31 ===\n")

response = requests.get(
    "https://api.semanticscholar.org/graph/v1/paper/search",
    params={
        'query': 'machine learning',  # Some query text
        'publicationDateOrYear': '2020-12-31',  # Exact date (not a range)
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
    print(f"Returned: {len(papers)}\n")

    # Check dates
    for paper in papers[:5]:
        print(f"Date: {paper.get('publicationDate')} | [{paper.get('citationCount')} cites]")
        print(f"  {paper.get('title')[:70]}")
else:
    print(f"Error: {response.text[:200]}")
