# Paper Birthday Subscriptions - Setup Guide with Resend

This guide will help you set up the paper birthday subscription system using **Resend** as the email service provider.

## Why Resend?

- **Generous free tier:** 100 emails/day, 3,000 emails/month
- **No expiration:** Free tier doesn't expire (unlike SendGrid's 60-day limit)
- **Developer-friendly:** Simple API, great documentation
- **Reliable:** Modern infrastructure, high deliverability

---

## Overview

The subscription system includes:
- **Search & Subscribe UI**: Users can search for papers and subscribe to birthday reminders
- **Email Verification**: Double opt-in to confirm subscriptions
- **Daily Email Sending**: Automated emails sent every year on the paper's publication date
- **One-Click Unsubscribe**: Easy opt-out functionality

---

## Step 1: Database Migration

Run the database migration to create the subscriptions table:

```bash
# Using psql
psql $DATABASE_URL -f database/migrations/002_create_subscriptions_table.sql

# Or using Supabase dashboard
# Copy the contents of database/migrations/002_create_subscriptions_table.sql
# and run it in the SQL editor
```

**Verify the migration:**
```bash
psql $DATABASE_URL -c "SELECT * FROM paper_birthday_subscriptions LIMIT 1;"
```

---

## Step 2: Set Up Resend

### 1. Sign up for Resend

Go to https://resend.com and sign up for a free account.

### 2. Add and Verify Your Domain

**Option A: Use Your Own Domain (Recommended for Production)**

1. Go to the **Domains** section in Resend dashboard
2. Click **Add Domain**
3. Enter your domain (e.g., `happybdaypaper.com`)
4. Add the DNS records Resend provides to your domain (usually via your domain registrar like Namecheap, Cloudflare, etc.)
5. Wait for verification (usually takes a few minutes)

**Option B: Use Resend's Testing Domain (For Development)**

1. Resend gives you a testing domain automatically: `onboarding.resend.dev`
2. You can only send to your own verified email addresses with this domain
3. Great for testing, but you'll need your own domain for production

### 3. Create an API Key

1. Go to **API Keys** in the Resend dashboard
2. Click **Create API Key**
3. Name: "Paper Birthdays"
4. Permission: **Sending access** (default)
5. Copy the API key (starts with `re_`) - you won't see it again!

### 4. Configure Your Environment Variables

Add these to your `.env` file:

```bash
# Email Configuration
EMAIL_SERVICE=resend
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx

# From email must be from your verified domain
FROM_EMAIL=noreply@happybdaypaper.com
FROM_NAME=Paper Birthdays

# Your site URL
NEXT_PUBLIC_SITE_URL=https://happybdaypaper.com
```

**Important Notes:**
- `FROM_EMAIL` must use a domain you've verified in Resend
- For testing with `onboarding.resend.dev`, use: `FROM_EMAIL=onboarding@resend.dev`
- For production with your domain: `FROM_EMAIL=noreply@yourdomain.com`

---

## Step 3: Test the System Locally

### Test Email Sending

```bash
# Dry run (no emails sent, just prints what would be sent)
python scripts/send_birthday_emails.py --dry-run

# Send actual emails for today's subscriptions
python scripts/send_birthday_emails.py
```

### Test the Subscription Flow

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Open http://localhost:3000**

3. **Test the full flow:**
   - Scroll down to "Subscribe to Paper Birthdays"
   - Search for a paper (e.g., "machine learning")
   - Select a paper from the results
   - Enter your email
   - Click Subscribe
   - Check your email for verification link
   - Click the verification link
   - Should redirect to homepage with success message

4. **Check Resend Dashboard:**
   - Go to **Emails** section in Resend
   - You should see the verification email that was sent
   - Check delivery status

---

## Step 4: Deploy to Production

### Add Environment Variables to Vercel

1. Go to your Vercel project
2. Settings → Environment Variables
3. Add these variables:

```
DATABASE_URL=your-postgres-connection-string
EMAIL_SERVICE=resend
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx
FROM_EMAIL=noreply@happybdaypaper.com
FROM_NAME=Paper Birthdays
NEXT_PUBLIC_SITE_URL=https://happybdaypaper.com
```

### Deploy the Changes

```bash
git add .
git commit -m "Add paper birthday subscription system with Resend

- Database schema for subscriptions
- Search and subscribe UI
- Email verification via Resend
- Daily birthday email sending
- One-click unsubscribe"
git push
```

Vercel will automatically deploy your changes.

---

## Step 5: Set Up GitHub Actions for Daily Emails

The GitHub Action is already configured in `.github/workflows/daily-birthday-emails.yml` and will run daily at 9:00 AM EST.

### Add Required GitHub Secrets

Go to your repository: **Settings → Secrets and variables → Actions**

Click **New repository secret** and add these:

| Secret Name | Value |
|------------|-------|
| `DATABASE_URL` | Your Postgres connection string |
| `EMAIL_SERVICE` | `resend` |
| `RESEND_API_KEY` | Your Resend API key (re_xxx...) |
| `FROM_EMAIL` | `noreply@happybdaypaper.com` |
| `FROM_NAME` | `Paper Birthdays` |
| `NEXT_PUBLIC_SITE_URL` | `https://happybdaypaper.com` |

### Test the GitHub Action

1. **Go to:** Repository → Actions tab
2. **Click:** "Send Daily Birthday Emails" workflow
3. **Click:** "Run workflow" dropdown → "Run workflow" button
4. **Watch the logs** to ensure it works

The workflow will now run automatically every day at 9:00 AM EST (2:00 PM UTC).

---

## Step 6: Monitor and Maintain

### Check Email Delivery

**Resend Dashboard:**
1. Go to https://resend.com/emails
2. View all sent emails with delivery status
3. Filter by status (sent, delivered, bounced, etc.)
4. Click on individual emails to see details

### Check Database

```bash
# See all subscriptions
psql $DATABASE_URL -c "SELECT email, paper_title, verified, unsubscribed, created_at FROM paper_birthday_subscriptions ORDER BY created_at DESC LIMIT 10;"

# See verified subscriptions
psql $DATABASE_URL -c "SELECT COUNT(*) as total, verified, unsubscribed FROM paper_birthday_subscriptions GROUP BY verified, unsubscribed;"

# See subscriptions for today (example: January 3rd)
psql $DATABASE_URL -c "SELECT COUNT(*) FROM paper_birthday_subscriptions WHERE publication_month_day = '01-03' AND verified = TRUE AND unsubscribed = FALSE;"
```

### Check GitHub Action Logs

Repository → Actions → "Send Daily Birthday Emails" → Latest run

---

## Troubleshooting

### Emails Not Sending

1. **Check API Key:**
   ```bash
   # Test API key manually
   curl -X POST 'https://api.resend.com/emails' \
     -H 'Authorization: Bearer YOUR_RESEND_API_KEY' \
     -H 'Content-Type: application/json' \
     -d '{
       "from": "onboarding@resend.dev",
       "to": ["your-email@example.com"],
       "subject": "Test Email",
       "html": "<p>Test email from Resend</p>"
     }'
   ```

2. **Check FROM_EMAIL domain:**
   - Must be a verified domain in Resend
   - For testing: use `onboarding@resend.dev`
   - For production: verify your domain first

3. **Check Resend Dashboard:**
   - Go to Emails section
   - Look for error messages
   - Check bounce/complaint rates

### Verification Links Not Working

1. **Check NEXT_PUBLIC_SITE_URL:**
   - Should be your production URL: `https://happybdaypaper.com`
   - No trailing slash

2. **Check database for verification_token:**
   ```bash
   psql $DATABASE_URL -c "SELECT email, verification_token, verified FROM paper_birthday_subscriptions WHERE email = 'test@example.com';"
   ```

3. **Try visiting verification URL manually:**
   ```
   https://happybdaypaper.com/api/verify-email/{TOKEN_FROM_DATABASE}
   ```

### GitHub Action Failing

1. **Check all secrets are added to GitHub:**
   - Repository → Settings → Secrets and variables → Actions
   - Verify all 6 secrets are present

2. **View workflow logs:**
   - Repository → Actions → Latest workflow run
   - Click on "send-emails" job
   - Expand steps to see error details

3. **Common issues:**
   - Wrong API key format (should start with `re_`)
   - DATABASE_URL not set or incorrect
   - FROM_EMAIL domain not verified in Resend

### Domain Verification Issues

1. **DNS records not propagating:**
   - DNS changes can take up to 48 hours
   - Use https://dnschecker.org to check propagation
   - Most changes happen within 1-2 hours

2. **Wrong DNS records:**
   - Double-check you added ALL records Resend provided
   - Usually includes: SPF, DKIM, DMARC records
   - Don't modify the values Resend gives you

---

## Usage Limits

### Resend Free Tier
- **100 emails per day**
- **3,000 emails per month**
- **No expiration** (unlike SendGrid's 60-day limit)
- **1 custom domain**

### Application Limits
- **Max subscriptions per email:** 5 (configured in code)

**Monitoring Usage:**
- Check Resend dashboard for current usage
- Emails reset daily/monthly automatically
- Upgrade to paid plan if you exceed limits

---

## Email Templates

### Verification Email
Sent when user subscribes to a paper. Contains verification link to confirm subscription.

**Subject:** `Confirm your Paper Birthday subscription`

### Birthday Email
Sent annually on the paper's publication date. Includes:
- 🎂 Paper title and age (e.g., "Happy 25th Birthday!")
- 📅 Publication date
- 📊 Citation count
- 🏷️ Field of study
- Link to read the paper
- Link to discover more papers from that date
- Unsubscribe link

---

## Testing Checklist

Before going live, test these scenarios:

- [ ] Database migration completed successfully
- [ ] Resend domain verified (or using onboarding domain for testing)
- [ ] Environment variables set in `.env`
- [ ] Search for a paper works
- [ ] Subscribe to a paper works
- [ ] Verification email received and can be opened
- [ ] Clicking verification link redirects to homepage with success message
- [ ] Database shows `verified = TRUE` after verification
- [ ] Unsubscribe link works (test after receiving birthday email)
- [ ] Environment variables added to Vercel
- [ ] Deployed to production successfully
- [ ] GitHub secrets added
- [ ] GitHub Action test run succeeds
- [ ] Resend dashboard shows sent emails

---

## Going Live

Once you've completed testing:

1. ✅ Verify your custom domain in Resend
2. ✅ Update `FROM_EMAIL` to use your domain
3. ✅ Add environment variables to Vercel
4. ✅ Deploy to production
5. ✅ Add GitHub secrets for daily emails
6. ✅ Test the full subscription flow on production
7. ✅ Monitor Resend dashboard for first few days

---

## Support

If you encounter issues:

1. Check this troubleshooting guide
2. Review Resend documentation: https://resend.com/docs
3. Check Resend dashboard for email status
4. Review GitHub Action logs
5. Verify all environment variables are set correctly

**Resend Support:**
- Documentation: https://resend.com/docs
- Status page: https://resend.com/status
- Contact: support@resend.com

---

## Alternative Email Services

If you prefer not to use Resend, the code also supports:

- **SendGrid** (set `EMAIL_SERVICE=sendgrid`)
- **Mailgun** (set `EMAIL_SERVICE=mailgun`)

See the original documentation for setup instructions for these services.
