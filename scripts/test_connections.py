#!/usr/bin/env python3
"""
Test script to verify API key and database connection
"""

import os
import requests
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def test_database():
    """Test database connection"""
    print("\n" + "="*60)
    print("Testing Database Connection")
    print("="*60)

    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("✗ ERROR: DATABASE_URL not set in .env file")
        return False

    try:
        db = psycopg2.connect(database_url)
        cursor = db.cursor()
        cursor.execute("SELECT version();")
        version = cursor.fetchone()
        print(f"✓ Database connected successfully!")
        print(f"  PostgreSQL version: {version[0][:50]}...")
        cursor.close()
        db.close()
        return True
    except Exception as e:
        print(f"✗ Database connection failed: {e}")
        return False

def test_semantic_scholar_api():
    """Test Semantic Scholar API key"""
    print("\n" + "="*60)
    print("Testing Semantic Scholar API")
    print("="*60)

    api_key = os.getenv('SEMANTIC_SCHOLAR_API_KEY')

    if not api_key:
        print("⚠ Warning: No API key set (will use public rate limits)")
        print("  You can still use the API but with lower rate limits")
        headers = {}
    elif api_key == 'your_key_here':
        print("✗ ERROR: API key is still set to placeholder 'your_key_here'")
        print("  Please update SEMANTIC_SCHOLAR_API_KEY in .env with your actual key")
        return False
    else:
        print(f"  API key found: {api_key[:10]}...{api_key[-4:]}")
        headers = {'x-api-key': api_key}

    try:
        # Test with a simple search
        print("\n  Testing API with sample query...")
        response = requests.get(
            "https://api.semanticscholar.org/graph/v1/paper/search",
            params={
                'query': 'publicationDate:2024-01-01',
                'fields': 'title,year',
                'limit': 1
            },
            headers=headers,
            timeout=10
        )

        if response.status_code == 200:
            data = response.json()
            print(f"✓ API request successful!")
            print(f"  Status: {response.status_code}")
            print(f"  Sample result: {data.get('data', [{}])[0].get('title', 'N/A')[:50]}...")

            # Check rate limit headers
            if 'x-ratelimit-limit' in response.headers:
                print(f"  Rate limit: {response.headers.get('x-ratelimit-remaining')}/{response.headers.get('x-ratelimit-limit')} remaining")

            return True
        elif response.status_code == 403:
            print(f"✗ API request failed: 403 Forbidden")
            print(f"  This usually means your API key is invalid")
            print(f"  Response: {response.text}")
            return False
        elif response.status_code == 429:
            print(f"⚠ API request failed: 429 Rate Limited")
            print(f"  Your API key works but you've hit the rate limit")
            return True
        else:
            print(f"✗ API request failed: {response.status_code}")
            print(f"  Response: {response.text}")
            return False

    except Exception as e:
        print(f"✗ API request failed: {e}")
        return False

if __name__ == "__main__":
    print("\n🔍 Testing Paper Birthdays Connections\n")

    db_ok = test_database()
    api_ok = test_semantic_scholar_api()

    print("\n" + "="*60)
    print("Summary")
    print("="*60)
    print(f"Database: {'✓ OK' if db_ok else '✗ FAILED'}")
    print(f"Semantic Scholar API: {'✓ OK' if api_ok else '✗ FAILED'}")
    print("="*60 + "\n")
