#!/usr/bin/env python3
"""Test different query approaches"""

import os
import requests
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv('SEMANTIC_SCHOLAR_API_KEY')
headers = {'x-api-key': api_key} if api_key else {}

# Test 1: Single date query (should work)
print("\n=== Test 1: Single date ===")
response = requests.get(
    "https://api.semanticscholar.org/graph/v1/paper/search",
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
    print(f"Error: {response.text}")

# Test 2: OR query with 2 dates
print("\n=== Test 2: OR query (2 dates) ===")
response = requests.get(
    "https://api.semanticscholar.org/graph/v1/paper/search",
    params={
        'query': 'publicationDate:2024-01-01 OR publicationDate:2023-01-01',
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
    print(f"Error: {response.text}")

# Test 3: OR query with 7 dates (like our script)
print("\n=== Test 3: OR query (7 dates) ===")
dates = [f"{year}-01-01" for year in range(2018, 2025)]
query = ' OR '.join([f'publicationDate:{date}' for date in dates])
print(f"Query: {query[:100]}...")
response = requests.get(
    "https://api.semanticscholar.org/graph/v1/paper/search",
    params={
        'query': query,
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
    print(f"Error: {response.text[:200]}")
