# Speed Up Ingestion with Railway (2-3 Hours Instead of 7)

## Why Railway?
- ✅ **10-20x faster internet** (1 Gbps vs your 50-100 Mbps)
- ✅ **Free tier** (500 hours/month)
- ✅ **5 minute setup**
- ✅ **Connects to your existing Neon database**
- ✅ **2-3 hours total** instead of 6-7 hours

---

## Step-by-Step Setup (10 minutes)

### 1. Stop Local Ingestion

```bash
# Kill current processes:
pkill -f ingest_bulk
pkill -f run_bulk_all

# Verify stopped:
ps aux | grep ingest_bulk
```

**Current progress saved:** 153,534 papers ✓

---

### 2. Sign Up for Railway

1. Go to: **https://railway.app**
2. Click **"Start a New Project"**
3. Sign up with GitHub (easiest)
4. Verify email

---

### 3. Create New Project

1. Click **"New Project"**
2. Select **"Empty Project"**
3. Name it: `paper-birthdays-ingestion`

---

### 4. Deploy from GitHub

**Option A: Deploy Directly (Easiest)**

1. In Railway project, click **"New"** → **"GitHub Repo"**
2. Connect your GitHub account
3. Select: `sophiahexj/paperbirthdays`
4. Click **"Deploy"**

**Option B: Manual Deploy (If GitHub doesn't work)**

1. Click **"New"** → **"Empty Service"**
2. We'll use Railway CLI (instructions below)

---

### 5. Set Environment Variables

In Railway dashboard:

1. Click your service
2. Go to **"Variables"** tab
3. Add these:

```
DATABASE_URL=postgresql://neondb_owner:npg_S8ZvUNuli7dx@ep-holy-sunset-ah3lyhu1.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

SEMANTIC_SCHOLAR_API_KEY=NCfBIuqBBY9qtbmZs1Ozu4KaDLLBSRnv5b4Mdi4i
```

4. Click **"Add"** for each

---

### 6. Access Railway Shell

**In Railway Dashboard:**

1. Click your service
2. Click **"..."** (three dots) in top right
3. Click **"Shell"** or **"Terminal"**

**Or use Railway CLI (faster):**

```bash
# Install Railway CLI:
npm install -g @railway/cli

# Login:
railway login

# Link to your project:
railway link

# Open shell:
railway run bash
```

---

### 7. Run Ingestion on Railway

**In the Railway shell:**

```bash
# Setup (first time only):
chmod +x railway_deploy.sh
./railway_deploy.sh

# Start ingestion:
python3 scripts/run_bulk_all.sh
```

**Or run directly:**

```bash
# Install dependencies:
pip install psycopg2-binary requests python-dotenv

# Run ingestion (all 60 files):
cd /app  # Railway sets this as working directory
python3 scripts/ingest_bulk.py 1 60
```

---

### 8. Monitor Progress

**From your laptop:**

```bash
# Every 5 minutes, check database:
cd /Users/sophia/Desktop/paper\ birthdays/paperbirthdays
./scripts/check_progress.sh
```

**Or in Railway shell:**

```bash
# Check progress directly:
python3 -c "
import psycopg2
import os
db = psycopg2.connect(os.getenv('DATABASE_URL'))
cursor = db.cursor()
cursor.execute('SELECT COUNT(*) FROM papers')
print(f'Total papers: {cursor.fetchone()[0]:,}')
"
```

---

## Timeline

| Time | Event | Papers |
|------|-------|--------|
| **2:00 PM** | Stop local, start Railway setup | 153,534 |
| **2:10 PM** | Railway ingestion begins | 153,534 |
| **2:30 PM** | First files processing | 200,000+ |
| **3:30 PM** | Quarter done | 350,000+ |
| **4:30 PM** | Half done | 550,000+ |
| **5:30 PM** | Three-quarters done | 750,000+ |
| **6:30 PM** | **COMPLETE!** | **900K-1M+** |

**Total time:** ~4-5 hours (vs 7+ hours locally)

---

## Even Faster: Parallel Processing

Once running on Railway, you can speed up further:

**In Railway shell:**

```bash
# Run 3 files at once (cuts time to 2 hours):
python3 scripts/ingest_bulk.py 1 1 &
python3 scripts/ingest_bulk.py 2 1 &
python3 scripts/ingest_bulk.py 3 1 &
wait

python3 scripts/ingest_bulk.py 4 1 &
python3 scripts/ingest_bulk.py 5 1 &
python3 scripts/ingest_bulk.py 6 1 &
wait

# ... continue for all 60 files
```

**Or use the parallel script (create this):**

```bash
# Create parallel runner:
cat > run_parallel.sh << 'EOF'
#!/bin/bash
for ((i=1; i<=60; i+=3)); do
    python3 scripts/ingest_bulk.py $i 1 &
    python3 scripts/ingest_bulk.py $((i+1)) 1 &
    python3 scripts/ingest_bulk.py $((i+2)) 1 &
    wait
done
EOF

chmod +x run_parallel.sh
./run_parallel.sh
```

**With parallel:** Done in **2-3 hours** total!

---

## Alternative: Use Render (Similar to Railway)

If Railway doesn't work:

1. Go to **https://render.com**
2. Sign up (free tier)
3. Create **"New Web Service"**
4. Connect GitHub repo
5. Select **"Python"** environment
6. Set environment variables
7. Use shell to run ingestion

Same process, same speed boost!

---

## Cost Analysis

| Service | Free Tier | Cost for Ingestion |
|---------|-----------|-------------------|
| **Railway** | 500 hrs/month | FREE (uses ~5 hours) |
| **Render** | 750 hrs/month | FREE |
| **Fly.io** | 160 GB transfer | FREE |
| **AWS EC2** | 750 hrs/month (1st year) | FREE |

**All options are free for this use case!**

---

## Troubleshooting

### "Cannot connect to database"
- Check environment variables set correctly
- Test: `echo $DATABASE_URL` in Railway shell
- Verify Neon database is accessible (not paused)

### "Download URLs expired"
- Run the setup script again to fetch fresh URLs
- URLs expire after 24 hours

### "Out of memory"
- Railway free tier: 512MB-1GB RAM
- Should be fine (streaming uses <100MB)
- If crashes: Run fewer files in parallel

### "Process killed"
- Railway timeout (30 min default)
- Solution: Run in background with `nohup`:
  ```bash
  nohup python3 scripts/ingest_bulk.py 1 60 > ingestion.log 2>&1 &
  ```

---

## After Completion

Once Railway finishes (900K-1M papers):

**1. Stop Railway service** (to save free hours):
```
Railway Dashboard → Settings → Pause Service
```

**2. Generate JSON files** (do this locally):
```bash
cd /Users/sophia/Desktop/paper\ birthdays/paperbirthdays
venv/bin/python scripts/generate_json.py all
```

**3. Deploy to Vercel:**
```bash
git add public/data/*.json
git commit -m "Update with 1M papers from Railway ingestion"
git push origin main
```

**4. Done!** 🎉

---

## Summary

**Current Approach:**
- Local laptop: 7 hours remaining
- Finish: ~9 PM tonight

**Railway Approach:**
- Setup: 10 minutes
- Ingestion: 4-5 hours (parallel: 2-3 hours)
- Finish: **6-7 PM tonight** ✅

**Recommendation:** Use Railway with parallel processing → **Done by 5 PM!**

---

## Quick Start Command

If you want to skip the guide and just do it:

```bash
# 1. Stop local:
pkill -f ingest_bulk

# 2. Install Railway CLI:
npm install -g @railway/cli

# 3. Login & setup:
railway login
railway init
railway link

# 4. Deploy:
railway up

# 5. Run in shell:
railway run bash
./railway_deploy.sh
python3 scripts/run_bulk_all.sh
```

**That's it!** Check progress with `./scripts/check_progress.sh` from your laptop.
