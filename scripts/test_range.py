#!/usr/bin/env python3
"""Test date range queries"""

import os
import requests
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv('SEMANTIC_SCHOLAR_API_KEY')
headers = {'x-api-key': api_key} if api_key else {}

# Test date range syntax
print("\n=== Test: Date range query ===")
response = requests.get(
    "https://api.semanticscholar.org/graph/v1/paper/search",
    params={
        'year': '2018-2024',
        'publicationDateOrYear': '2024-01-01',
        'fields': 'title,publicationDate,year',
        'limit': 10
    },
    headers=headers,
    timeout=10
)
print(f"Status: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    print(f"Results: {len(data.get('data', []))}")
    for paper in data.get('data', [])[:3]:
        print(f"  - {paper.get('publicationDate')} | {paper.get('title')[:60]}")
else:
    print(f"Error: {response.text[:300]}")

# Another test: bulk parameter
print("\n=== Test: Bulk search ===")
response = requests.get(
    "https://api.semanticscholar.org/graph/v1/paper/search/bulk",
    params={
        'query': 'publicationDate:2024-01-01',
        'fields': 'title,publicationDate',
        'limit': 10
    },
    headers=headers,
    timeout=10
)
print(f"Status: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    print(f"Results: {len(data.get('data', []))}")
else:
    print(f"Error: {response.text[:300]}")
