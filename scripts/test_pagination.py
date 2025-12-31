#!/usr/bin/env python3
"""Test pagination with offset"""

import os
import requests
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv('SEMANTIC_SCHOLAR_API_KEY')
headers = {'x-api-key': api_key} if api_key else {}

# Test pagination with different offsets
for offset in [0, 100, 200]:
    print(f"\n=== Test: offset={offset} ===")
    response = requests.get(
        "https://api.semanticscholar.org/graph/v1/paper/search",
        params={
            'query': 'publicationDate:2024-01-01',
            'fields': 'title,publicationDate',
            'limit': 100,
            'offset': offset
        },
        headers=headers,
        timeout=10
    )
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Results: {len(data.get('data', []))}")
        print(f"Total: {data.get('total', 'N/A')}")
    else:
        print(f"Error: {response.text[:300]}")
