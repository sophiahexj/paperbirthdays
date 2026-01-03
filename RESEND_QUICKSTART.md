# Quick Start: Paper Birthday Subscriptions with Resend

Complete setup in ~15 minutes using Resend's free tier (100 emails/day, no expiration).

---

## Step 1: Database Migration (2 minutes)

```bash
psql $DATABASE_URL -f database/migrations/002_create_subscriptions_table.sql
```

---

## Step 2: Set Up Resend (5 minutes)

### A. Sign Up
1. Go to https://resend.com
2. Sign up for free account

### B. Get API Key
1. Dashboard → **API Keys**
2. Click **Create API Key**
3. Name: "Paper Birthdays"
4. Copy the key (starts with `re_`)

### C. Add Domain (For Testing: Skip to Step 3)
1. Dashboard → **Domains**
2. Click **Add Domain**
3. Enter: `happybdaypaper.com`
4. Add DNS records to your domain registrar
5. Wait for verification (~5-30 minutes)

**For Testing Only:** Use `onboarding@resend.dev` as your FROM_EMAIL

---

## Step 3: Configure Environment (1 minute)

Add to `.env`:

```bash
EMAIL_SERVICE=resend
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx
FROM_EMAIL=onboarding@resend.dev        # For testing
# FROM_EMAIL=noreply@happybdaypaper.com  # For production (after domain verification)
FROM_NAME=Paper Birthdays
NEXT_PUBLIC_SITE_URL=https://happybdaypaper.com
```

---

## Step 4: Test Locally (3 minutes)

```bash
# Start dev server
npm run dev

# In browser: http://localhost:3000
# 1. Scroll to "Subscribe to Paper Birthdays"
# 2. Search: "machine learning"
# 3. Select a paper
# 4. Enter your email
# 5. Subscribe
# 6. Check email for verification link
```

---

## Step 5: Deploy to Vercel (2 minutes)

### Add Environment Variables
Vercel Dashboard → Your Project → Settings → Environment Variables

Add:
```
DATABASE_URL=your-postgres-url
EMAIL_SERVICE=resend
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx
FROM_EMAIL=noreply@happybdaypaper.com
FROM_NAME=Paper Birthdays
NEXT_PUBLIC_SITE_URL=https://happybdaypaper.com
```

### Deploy
```bash
git add .
git commit -m "Add paper birthday subscriptions with Resend"
git push
```

---

## Step 6: GitHub Actions for Daily Emails (2 minutes)

Go to: **Repository → Settings → Secrets and variables → Actions**

Add these 6 secrets:

| Secret | Value |
|--------|-------|
| `DATABASE_URL` | Your Postgres connection string |
| `EMAIL_SERVICE` | `resend` |
| `RESEND_API_KEY` | Your Resend API key |
| `FROM_EMAIL` | `noreply@happybdaypaper.com` |
| `FROM_NAME` | `Paper Birthdays` |
| `NEXT_PUBLIC_SITE_URL` | `https://happybdaypaper.com` |

**Test it:**
- Repository → Actions → "Send Daily Birthday Emails"
- Run workflow manually
- Check logs

---

## Done! 🎉

The system will now:
- ✅ Accept subscriptions on your website
- ✅ Send verification emails via Resend
- ✅ Send birthday emails automatically every day at 9 AM EST

**Monitor:**
- Resend Dashboard: https://resend.com/emails
- GitHub Actions: Repository → Actions tab

---

## Quick Troubleshooting

**Emails not sending?**
```bash
# Test your API key
curl -X POST 'https://api.resend.com/emails' \
  -H 'Authorization: Bearer YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "from": "onboarding@resend.dev",
    "to": ["your-email@example.com"],
    "subject": "Test",
    "html": "<p>It works!</p>"
  }'
```

**Domain not verified?**
- Check DNS records at https://dnschecker.org
- Wait up to 48 hours for propagation (usually <2 hours)

**Need more help?**
- See full guide: `SUBSCRIPTION_SETUP.md`
- Resend docs: https://resend.com/docs

---

## Resend Free Tier Limits

- **100 emails/day**
- **3,000 emails/month**
- **No expiration** ✨
- **1 custom domain**

Perfect for getting started!
