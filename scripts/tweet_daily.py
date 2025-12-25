#!/usr/bin/env python3
"""
Daily Twitter bot for Paper Birthdays
Posts one paper celebrating its publication anniversary each day
"""

import os
import sys
import random
from datetime import datetime
import psycopg2
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

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
            author_count
        FROM papers
        WHERE publication_date::text LIKE %s
        ORDER BY citation_count DESC
        LIMIT 100
    ''', (f'%-{month_day}',))

    return cursor.fetchall()

def select_paper(papers):
    """
    Select a paper to tweet about
    Strategy: Random selection from top 10 most-cited papers
    This balances quality (high-impact) with variety
    """
    if not papers:
        return None

    # Take top 10 by citations, or all if fewer than 10
    top_papers = papers[:min(10, len(papers))]

    # Randomly select one
    return random.choice(top_papers)

def calculate_age(year):
    """Calculate how many years old the paper is"""
    current_year = datetime.now().year
    return current_year - year

def generate_tweet(paper, site_url="https://happybdaypaper.com"):
    """
    Generate tweet text for a paper

    Format:
    🎂 Paper Birthday!

    "{Title}" turns {age} today!

    📅 Published {Month} {Day}, {Year}
    📊 {citations} citations
    🏷️ #{field}

    Celebrate other paper birthdays at [URL]
    """
    title, year, citations, field, venue, paper_id, author_count = paper

    age = calculate_age(year)
    today = datetime.now()
    month_name = today.strftime('%B')
    day = today.day

    # Create date-based URL (without year - points to all papers on this date)
    month_abbrev = today.strftime('%b').lower()
    paper_url = f"{site_url}/{month_abbrev}-{day}"

    # Clean field name for hashtag (remove spaces, capitalize)
    field_hashtag = field.replace(' ', '').replace('-', '')

    # Build tweet
    tweet = f"""🎂 Paper Birthday!

"{title}" turns {age} today!

📅 Published {month_name} {day}, {year}
📊 {citations:,} citations
🏷️ #{field_hashtag}

Celebrate other paper birthdays at {paper_url}"""

    # Check length (Twitter limit is 280 chars, URLs count as 23 chars)
    # Calculate actual length (Twitter counts URLs as 23 chars)
    url_display_len = len(paper_url)
    url_twitter_len = 23
    tweet_len = len(tweet) - url_display_len + url_twitter_len

    # If too long, truncate title
    if tweet_len > 280:
        max_title_len = len(title) - (tweet_len - 280) - 3  # -3 for "..."
        if max_title_len > 20:  # Only truncate if we can keep reasonable length
            truncated_title = title[:max_title_len] + "..."
            tweet = f"""🎂 Paper Birthday!

"{truncated_title}" turns {age} today!

📅 Published {month_name} {day}, {year}
📊 {citations:,} citations
🏷️ #{field_hashtag}

Celebrate other paper birthdays at {paper_url}"""

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
