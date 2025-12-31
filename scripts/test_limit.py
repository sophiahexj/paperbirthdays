#!/usr/bin/env python3
"""Test different limit values"""

import os
import requests
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv('SEMANTIC_SCHOLAR_API_KEY')
headers = {'x-api-key': api_key} if api_key else {}

# Test different limits
for limit in [100, 500, 1000]:
    print(f"\n=== Test: limit={limit} ===")
    response = requests.get(
        "https://api.semanticscholar.org/graph/v1/paper/search",
        params={
            'query': 'publicationDate:2024-01-01',
            'fields': 'title,publicationDate',
            'limit': limit
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
        print(f"Error: {response.text[:200]}")
