#!/usr/bin/env python3
"""
Daily Twitter bot for Paper Birthdays
Posts one paper celebrating its publication anniversary each day
"""

import os
import sys
import json
import random
from datetime import datetime
import psycopg2
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Load author Twitter handles mapping
def load_author_handles():
    """Load author name to Twitter handle mapping"""
    try:
        mapping_path = os.path.join(os.path.dirname(__file__), 'author_twitter_handles.json')
        if os.path.exists(mapping_path):
            with open(mapping_path, 'r') as f:
                return json.load(f)
    except Exception as e:
        print(f"Warning: Could not load author Twitter handles: {e}")
    return {}

AUTHOR_TWITTER_HANDLES = load_author_handles()

def get_database_connection():
    """Connect to PostgreSQL database"""
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        raise ValueError("DATABASE_URL environment variable not set")
    return psycopg2.connect(database_url)

def get_todays_papers(cursor):
    """Get all papers published on today's date (MM-DD)"""
    today = datetime.now()
    month_day = today.strftime('%m-%d')

    cursor.execute('''
        SELECT
            title,
            year,
            citation_count,
            field,
            venue,
            paper_id,
            author_count,
            authors
        FROM papers
        WHERE publication_month_day = %s
          AND venue IS NOT NULL
          AND venue != 'Unknown Venue'
          AND TRIM(venue) != ''
        ORDER BY citation_count DESC
        LIMIT 100
    ''', (month_day,))

    return cursor.fetchall()

def select_paper(papers):
    """
    Select a paper to tweet about

    Strategy:
    1. First, try to find papers where at least one author has a Twitter account (from top 50)
    2. If found, randomly select from those papers
    3. If not found, fall back to random selection from top 10 most-cited papers

    This maximizes engagement by tagging authors when possible
    """
    if not papers:
        return None

    # First pass: Look for papers with authors who have Twitter accounts
    if AUTHOR_TWITTER_HANDLES:
        # Check top 50 papers for author matches
        top_50 = papers[:min(50, len(papers))]
        papers_with_handles = []

        for paper in top_50:
            authors = paper[7] if len(paper) > 7 else []  # authors is the 8th column
            if authors:
                # Check if any author has a Twitter handle
                for author in authors:
                    if author in AUTHOR_TWITTER_HANDLES or any(
                        author.lower() == mapped_name.lower()
                        for mapped_name in AUTHOR_TWITTER_HANDLES.keys()
                    ):
                        papers_with_handles.append(paper)
                        break  # Found at least one author with Twitter, add this paper

        # If we found papers with author handles, randomly select from those
        if papers_with_handles:
            print(f"Found {len(papers_with_handles)} papers with authors on Twitter")
            return random.choice(papers_with_handles)

    # Fallback: Random selection from top 10 most-cited papers
    print("No papers found with authors on Twitter, using top cited papers")
    top_papers = papers[:min(10, len(papers))]
    return random.choice(top_papers)

def calculate_age(year):
    """Calculate how many years old the paper is"""
    current_year = datetime.now().year
    return current_year - year

def find_author_handles(authors):
    """
    Look up Twitter handles for authors

    Args:
        authors: List of author names

    Returns:
        List of Twitter handles (with @ prefix) found in our mapping
    """
    if not authors or not AUTHOR_TWITTER_HANDLES:
        return []

    handles = []
    for author in authors:
        # Try exact match first
        if author in AUTHOR_TWITTER_HANDLES:
            handle = AUTHOR_TWITTER_HANDLES[author]
            if handle and not handle.startswith('@'):
                handle = '@' + handle
            handles.append(handle)
        # Try case-insensitive match
        else:
            for mapped_name, mapped_handle in AUTHOR_TWITTER_HANDLES.items():
                if mapped_name.lower() == author.lower():
                    if mapped_handle and not mapped_handle.startswith('@'):
                        mapped_handle = '@' + mapped_handle
                    handles.append(mapped_handle)
                    break

    return handles

def generate_tweet(paper, site_url="https://happybdaypaper.com"):
    """
    Generate tweet text for a paper

    Format:
    [TITLE] turns [AGE] today!

    [Author tags if available]

    Cited [CITATION_COUNT] times.

    #[FIELD]
    📄 happybdaypaper.com
    """
    title, year, citations, field, venue, paper_id, author_count, authors = paper

    age = calculate_age(year)

    # Clean field name for hashtag (remove spaces, capitalize)
    field_hashtag = field.replace(' ', '').replace('-', '')

    # Look up author Twitter handles
    author_handles = find_author_handles(authors) if authors else []
    author_line = ' '.join(author_handles) if author_handles else ''

    # Build tweet
    if author_line:
        tweet = f"""{title} turns {age} today!

{author_line}

Cited {citations:,} times.

#{field_hashtag}
📄 {site_url}"""
    else:
        tweet = f"""{title} turns {age} today!

Cited {citations:,} times.

#{field_hashtag}
📄 {site_url}"""

    # Check length (Twitter limit is 280 chars, URLs count as 23 chars)
    # Calculate actual length (Twitter counts URLs as 23 chars)
    url_display_len = len(site_url)
    url_twitter_len = 23
    tweet_len = len(tweet) - url_display_len + url_twitter_len

    # If too long, truncate title
    if tweet_len > 280:
        max_title_len = len(title) - (tweet_len - 280) - 3  # -3 for "..."
        if max_title_len > 20:  # Only truncate if we can keep reasonable length
            truncated_title = title[:max_title_len] + "..."
            if author_line:
                tweet = f"""{truncated_title} turns {age} today!

{author_line}

Cited {citations:,} times.

#{field_hashtag}
📄 {site_url}"""
            else:
                tweet = f"""{truncated_title} turns {age} today!

Cited {citations:,} times.

#{field_hashtag}
📄 {site_url}"""

    return tweet

def post_tweet(tweet_text, dry_run=False):
    """
    Post tweet using Twitter API v2

    Args:
        tweet_text: The text to tweet
        dry_run: If True, print tweet instead of posting
    """
    if dry_run:
        print("=" * 60)
        print("DRY RUN - Would post this tweet:")
        print("=" * 60)
        print(tweet_text)
        print("=" * 60)
        print(f"Length: {len(tweet_text)} chars")
        return True

    try:
        import tweepy
    except ImportError:
        print("Error: tweepy not installed. Run: pip install tweepy")
        return False

    # Get Twitter API credentials from environment
    api_key = os.getenv('TWITTER_API_KEY')
    api_secret = os.getenv('TWITTER_API_SECRET')
    access_token = os.getenv('TWITTER_ACCESS_TOKEN')
    access_secret = os.getenv('TWITTER_ACCESS_SECRET')

    if not all([api_key, api_secret, access_token, access_secret]):
        print("Error: Twitter API credentials not found in environment variables")
        print("Required: TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET")
        return False

    try:
        # Create Twitter API v2 client
        client = tweepy.Client(
            consumer_key=api_key,
            consumer_secret=api_secret,
            access_token=access_token,
            access_token_secret=access_secret
        )

        # Post tweet
        response = client.create_tweet(text=tweet_text)
        print(f"✓ Tweet posted successfully!")
        print(f"Tweet ID: {response.data['id']}")
        return True

    except Exception as e:
        print(f"Error posting tweet: {e}")
        return False

def main():
    """Main function to run daily tweet"""
    # Check for dry run mode
    dry_run = '--dry-run' in sys.argv or os.getenv('DRY_RUN') == 'true'

    if dry_run:
        print("Running in DRY RUN mode (no actual tweet will be posted)")

    try:
        # Connect to database
        print("Connecting to database...")
        conn = get_database_connection()
        cursor = conn.cursor()

        # Get today's papers
        print("Fetching papers for today's date...")
        papers = get_todays_papers(cursor)

        if not papers:
            print(f"No papers found for today's date ({datetime.now().strftime('%B %d')})")
            return 1

        print(f"Found {len(papers)} papers for today")

        # Select a paper
        paper = select_paper(papers)
        print(f"\nSelected paper: {paper[0][:60]}...")

        # Generate tweet
        tweet = generate_tweet(paper)

        # Post tweet
        success = post_tweet(tweet, dry_run=dry_run)

        # Cleanup
        cursor.close()
        conn.close()

        return 0 if success else 1

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == '__main__':
    sys.exit(main())
