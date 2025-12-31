#!/usr/bin/env python3
import os, requests
from dotenv import load_dotenv
load_dotenv()

api_key = os.getenv('SEMANTIC_SCHOLAR_API_KEY')
headers = {'x-api-key': api_key} if api_key else {}

# Test wildcard vs empty vs real query
for query in ['*', '', 'a']:
    print(f"\n=== query='{query}' ===")
    response = requests.get(
        "https://api.semanticscholar.org/graph/v1/paper/search",
        params={
            'query': query,
            'publicationDateOrYear': '2020-12-31',
            'fields': 'title',
            'limit': 1
        },
        headers=headers
    )
    if response.status_code == 200:
        print(f"Results: {response.json().get('total', 0)}")
    else:
        print(f"Error: {response.status_code}")
