# Twitter Bot Setup Guide

This guide walks you through setting up the automated daily Twitter bot for Paper Birthdays.

## Prerequisites

1. A Twitter account for the bot (e.g., @PaperBirthdays)
2. Twitter API access (Free tier is sufficient)

## Step 1: Apply for Twitter API Access

1. Go to [developer.twitter.com](https://developer.twitter.com/)
2. Sign in with your bot's Twitter account
3. Apply for a developer account (Free tier)
4. Fill out the application form:
   - Use case: "Automated educational bot posting about academic paper anniversaries"
   - Will your app use Tweet, Retweet, Like, Follow, or Direct Message functionality? Yes (Tweet)
   - Do you plan to analyze Twitter data? No
5. Accept the terms and submit
6. Wait for approval (typically 1-2 hours to 1 day)

## Step 2: Create a Twitter App

Once your developer account is approved:

1. Go to the [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a new Project (if needed)
3. Create a new App within the project
4. Go to your app's "Keys and tokens" tab
5. Generate the following credentials:
   - API Key and Secret (also called Consumer Key/Secret)
   - Access Token and Secret

**Important**: Save these credentials securely. You won't be able to see the secrets again.

## Step 3: Add Credentials to GitHub Secrets

1. Go to your GitHub repository
2. Navigate to Settings > Secrets and variables > Actions
3. Click "New repository secret" and add each of the following:

| Secret Name | Value |
|------------|-------|
| `TWITTER_API_KEY` | Your API Key (Consumer Key) |
| `TWITTER_API_SECRET` | Your API Secret (Consumer Secret) |
| `TWITTER_ACCESS_TOKEN` | Your Access Token |
| `TWITTER_ACCESS_SECRET` | Your Access Token Secret |
| `DATABASE_URL` | Your PostgreSQL database URL (should already exist) |

## Step 4: Test the Bot Locally

Before enabling automation, test the bot locally:

```bash
# Activate virtual environment
source venv/bin/activate

# Add credentials to .env file (for local testing only)
echo "TWITTER_API_KEY=your_api_key" >> .env
echo "TWITTER_API_SECRET=your_api_secret" >> .env
echo "TWITTER_ACCESS_TOKEN=your_access_token" >> .env
echo "TWITTER_ACCESS_SECRET=your_access_secret" >> .env

# Test in dry-run mode (doesn't actually post)
python scripts/tweet_daily.py --dry-run

# If dry-run looks good, test a real post
python scripts/tweet_daily.py
```

## Step 5: Enable Automated Tweets

The GitHub Action is already configured in `.github/workflows/daily-tweet.yml` and will:

- Run automatically every day at 9:00 AM UTC
- Post one paper birthday tweet
- Use the secrets you added in Step 3

### Manual Trigger (Optional)

You can manually trigger a tweet:

1. Go to Actions tab in GitHub
2. Select "Daily Paper Birthday Tweet" workflow
3. Click "Run workflow"
4. Select the branch and click "Run workflow"

This is useful for testing or posting extra tweets.

## Step 6: Monitor the Bot

### Check Workflow Runs

1. Go to the Actions tab in GitHub
2. Look for "Daily Paper Birthday Tweet" runs
3. Click on any run to see logs and verify success

### What Gets Posted

The bot will:
- Query all papers published on today's date (MM-DD)
- Select randomly from the top 10 most-cited papers
- Post a tweet with format:

```
🎂 Paper Birthday!

"{Title}" turns {age} today!

📅 Published {Month} {Day}, {Year}
📊 {citations} citations
🏷️ #{field}

https://paperbirthdays.com/{month}-{day}-{year}
```

### Troubleshooting

If tweets aren't posting:

1. Check the Actions logs for errors
2. Verify all secrets are set correctly in GitHub
3. Ensure your Twitter API access hasn't been revoked
4. Check that there are papers in the database for today's date

### Rate Limits

Twitter Free tier limits:
- 1,500 tweets per month
- 50 tweets per day

Our bot posts once per day, well within limits.

## Future Enhancements

Potential improvements for later:
- Author tagging (requires Twitter handle data collection)
- Multiple tweets per day for popular dates
- Thread generation for related papers
- Image generation with paper metadata
