#!/usr/bin/env python3
"""
Send paper birthday emails to subscribers
Runs daily to notify users about papers celebrating their publication anniversary
"""

import os
import sys
import requests
from datetime import datetime
from typing import List, Dict, Any
import psycopg2
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Email service configuration
EMAIL_SERVICE = os.getenv('EMAIL_SERVICE', 'resend').lower()
RESEND_API_KEY = os.getenv('RESEND_API_KEY')
SENDGRID_API_KEY = os.getenv('SENDGRID_API_KEY')
MAILGUN_API_KEY = os.getenv('MAILGUN_API_KEY')
MAILGUN_DOMAIN = os.getenv('MAILGUN_DOMAIN')
FROM_EMAIL = os.getenv('FROM_EMAIL', 'noreply@happybdaypaper.com')
FROM_NAME = os.getenv('FROM_NAME', 'Paper Birthdays')
SITE_URL = os.getenv('NEXT_PUBLIC_SITE_URL', 'https://happybdaypaper.com')


def get_database_connection():
    """Connect to PostgreSQL database"""
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        raise ValueError("DATABASE_URL environment variable not set")
    return psycopg2.connect(database_url)


def get_today_subscriptions(cursor, month_day: str, current_year: int) -> List[Dict[str, Any]]:
    """Get all subscriptions that need birthday emails sent today"""
    cursor.execute('''
        SELECT
            s.id, s.email, s.paper_id, s.paper_title,
            s.publication_month_day, s.unsubscribe_token,
            p.year, p.citation_count, p.url, p.venue, p.fields_of_study
        FROM paper_birthday_subscriptions s
        JOIN papers p ON s.paper_id = p.paper_id
        WHERE s.publication_month_day = %s
          AND s.verified = TRUE
          AND s.unsubscribed = FALSE
          AND (s.last_sent_year IS NULL OR s.last_sent_year < %s)
    ''', (month_day, current_year))

    columns = [desc[0] for desc in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]


def normalize_field(fields_of_study):
    """Normalize field of study to primary category"""
    if not fields_of_study or len(fields_of_study) == 0:
        return 'Other'

    field_mapping = {
        'Medicine': ['Medicine'],
        'Biology': ['Biology'],
        'Computer Science': ['Computer Science'],
        'Economics': ['Economics', 'Business'],
        'Physics': ['Physics'],
        'Mathematics': ['Mathematics'],
        'Psychology': ['Psychology'],
        'Engineering': ['Engineering'],
        'Chemistry': ['Chemistry', 'Materials Science'],
        'Environmental Science': ['Environmental Science', 'Geology', 'Geography'],
        'Political Science': ['Political Science', 'Sociology'],
        'Art': ['Art'],
        'Philosophy': ['Philosophy'],
        'History': ['History'],
    }

    primary_field = fields_of_study[0]

    for category, keywords in field_mapping.items():
        for keyword in keywords:
            if keyword.lower() in str(primary_field).lower():
                return category

    return 'Other'


def format_date(month_day: str) -> str:
    """Format MM-DD to 'Month Day' (e.g., '01-15' -> 'January 15')"""
    month, day = month_day.split('-')
    date = datetime(2000, int(month), int(day))
    return date.strftime('%B %d')


def send_email_resend(to: str, subject: str, html: str, text: str) -> bool:
    """Send email via Resend API"""
    if not RESEND_API_KEY:
        print("Error: RESEND_API_KEY not configured")
        return False

    try:
        response = requests.post(
            'https://api.resend.com/emails',
            headers={
                'Authorization': f'Bearer {RESEND_API_KEY}',
                'Content-Type': 'application/json',
            },
            json={
                'from': f'{FROM_NAME} <{FROM_EMAIL}>',
                'to': [to],
                'subject': subject,
                'html': html,
                'text': text,
            }
        )

        if response.status_code in [200, 201]:
            return True
        else:
            print(f"Resend error: {response.status_code} - {response.text}")
            return False

    except Exception as e:
        print(f"Error sending via Resend: {e}")
        return False


def send_email_sendgrid(to: str, subject: str, html: str, text: str) -> bool:
    """Send email via SendGrid API"""
    if not SENDGRID_API_KEY:
        print("Error: SENDGRID_API_KEY not configured")
        return False

    try:
        response = requests.post(
            'https://api.sendgrid.com/v3/mail/send',
            headers={
                'Authorization': f'Bearer {SENDGRID_API_KEY}',
                'Content-Type': 'application/json',
            },
            json={
                'personalizations': [{'to': [{'email': to}]}],
                'from': {'email': FROM_EMAIL, 'name': FROM_NAME},
                'subject': subject,
                'content': [
                    {'type': 'text/plain', 'value': text},
                    {'type': 'text/html', 'value': html},
                ],
            }
        )

        if response.status_code == 202:
            return True
        else:
            print(f"SendGrid error: {response.status_code} - {response.text}")
            return False

    except Exception as e:
        print(f"Error sending via SendGrid: {e}")
        return False


def send_email_mailgun(to: str, subject: str, html: str, text: str) -> bool:
    """Send email via Mailgun API"""
    if not MAILGUN_API_KEY or not MAILGUN_DOMAIN:
        print("Error: MAILGUN_API_KEY or MAILGUN_DOMAIN not configured")
        return False

    try:
        response = requests.post(
            f'https://api.mailgun.net/v3/{MAILGUN_DOMAIN}/messages',
            auth=('api', MAILGUN_API_KEY),
            data={
                'from': f'{FROM_NAME} <{FROM_EMAIL}>',
                'to': to,
                'subject': subject,
                'text': text,
                'html': html,
            }
        )

        if response.status_code == 200:
            return True
        else:
            print(f"Mailgun error: {response.status_code} - {response.text}")
            return False

    except Exception as e:
        print(f"Error sending via Mailgun: {e}")
        return False


def send_birthday_email(subscription: Dict[str, Any], current_year: int) -> bool:
    """Send birthday email for a subscription"""
    email = subscription['email']
    paper_title = subscription['paper_title']
    paper_year = subscription['year']
    citation_count = subscription['citation_count']
    paper_url = subscription['url']
    month_day = subscription['publication_month_day']
    unsubscribe_token = subscription['unsubscribe_token']
    fields_of_study = subscription['fields_of_study']

    # Calculate age
    age = current_year - paper_year

    # Normalize field
    field = normalize_field(fields_of_study)

    # Format date
    formatted_date = format_date(month_day)

    # Create URLs
    month, day = month_day.split('-')
    unsubscribe_url = f"{SITE_URL}/api/unsubscribe/{unsubscribe_token}"
    date_url = f"{SITE_URL}/{month.lower()}-{int(day)}"

    # Email subject
    subject = f"🎂 Happy {age}th Birthday to \"{paper_title}\"!"

    # HTML email body
    html = f'''
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }}
    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
    .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }}
    .birthday-icon {{ font-size: 48px; margin-bottom: 10px; }}
    .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }}
    .paper-card {{ background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
    .stat {{ display: inline-block; margin: 10px 15px 10px 0; color: #666; font-size: 14px; }}
    .button {{ display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 10px 10px 10px 0; }}
    .button-secondary {{ background: #6b7280; }}
    .footer {{ text-align: center; margin-top: 30px; font-size: 12px; color: #999; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="birthday-icon">🎂</div>
      <h1 style="margin: 0; font-size: 28px;">Paper Birthday!</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 18px;">Celebrating {age} Years</p>
    </div>
    <div class="content">
      <p>Today marks <strong>{age} years</strong> since this paper was published!</p>

      <div class="paper-card">
        <h2 style="margin: 0 0 15px 0; font-size: 20px; color: #111;">"{paper_title}"</h2>

        <div>
          <span class="stat">📅 Published {formatted_date}, {paper_year}</span>
          <span class="stat">📊 {citation_count:,} citations</span>
          <span class="stat">🏷️ {field}</span>
        </div>
      </div>

      <p style="text-align: center;">
        <a href="{paper_url}" class="button">Read the Paper</a>
        <a href="{date_url}" class="button button-secondary">More {formatted_date} Papers</a>
      </p>

      <p style="font-size: 14px; color: #666; margin-top: 30px;">
        You're receiving this email because you subscribed to birthday reminders for this paper on happybdaypaper.com
      </p>
    </div>
    <div class="footer">
      <p>
        <a href="{unsubscribe_url}">Unsubscribe</a> from this paper
      </p>
      <p>Happy Birthday Paper | <a href="{SITE_URL}">happybdaypaper.com</a></p>
    </div>
  </div>
</body>
</html>
    '''.strip()

    # Plain text email body
    text = f'''
🎂 Paper Birthday! Celebrating {age} Years

Today marks {age} years since this paper was published:

"{paper_title}"

📅 Published {formatted_date}, {paper_year}
📊 {citation_count:,} citations
🏷️ {field}

Read the paper: {paper_url}
More {formatted_date} papers: {date_url}

---
Unsubscribe: {unsubscribe_url}
Happy Birthday Paper | {SITE_URL}
    '''.strip()

    # Send email based on configured service
    if EMAIL_SERVICE == 'resend':
        return send_email_resend(email, subject, html, text)
    elif EMAIL_SERVICE == 'sendgrid':
        return send_email_sendgrid(email, subject, html, text)
    elif EMAIL_SERVICE == 'mailgun':
        return send_email_mailgun(email, subject, html, text)
    else:
        print(f"Error: Unknown email service '{EMAIL_SERVICE}'")
        return False


def mark_subscription_sent(cursor, subscription_id: int, year: int):
    """Mark subscription as sent for this year"""
    cursor.execute(
        'UPDATE paper_birthday_subscriptions SET last_sent_year = %s WHERE id = %s',
        (year, subscription_id)
    )


def main():
    """Main function to send birthday emails"""
    # Check for dry run mode
    dry_run = '--dry-run' in sys.argv or os.getenv('DRY_RUN') == 'true'

    if dry_run:
        print("Running in DRY RUN mode (no emails will be sent)")

    # Get today's date
    today = datetime.now()
    month_day = today.strftime('%m-%d')
    current_year = today.year

    print(f"Sending birthday emails for {month_day} ({format_date(month_day)})")

    try:
        # Connect to database
        print("Connecting to database...")
        conn = get_database_connection()
        cursor = conn.cursor()

        # Get subscriptions for today
        print("Fetching subscriptions...")
        subscriptions = get_today_subscriptions(cursor, month_day, current_year)

        if not subscriptions:
            print(f"No subscriptions found for {format_date(month_day)}")
            return 0

        print(f"Found {len(subscriptions)} subscription(s) to process")

        # Send emails
        success_count = 0
        error_count = 0

        for subscription in subscriptions:
            paper_title = subscription['paper_title'][:50] + '...' if len(subscription['paper_title']) > 50 else subscription['paper_title']
            email = subscription['email']

            print(f"Sending to {email}: \"{paper_title}\"")

            if dry_run:
                print(f"  [DRY RUN] Would send email to {email}")
                success_count += 1
            else:
                success = send_birthday_email(subscription, current_year)

                if success:
                    # Mark as sent
                    mark_subscription_sent(cursor, subscription['id'], current_year)
                    conn.commit()
                    print(f"  ✓ Sent successfully")
                    success_count += 1
                else:
                    print(f"  ✗ Failed to send")
                    error_count += 1

        # Summary
        print("\n" + "=" * 60)
        print("SUMMARY")
        print("=" * 60)
        print(f"Total subscriptions: {len(subscriptions)}")
        print(f"Successfully sent: {success_count}")
        print(f"Errors: {error_count}")

        # Cleanup
        cursor.close()
        conn.close()

        return 0 if error_count == 0 else 1

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == '__main__':
    sys.exit(main())
