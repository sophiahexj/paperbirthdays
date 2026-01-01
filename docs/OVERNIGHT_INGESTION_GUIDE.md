# Overnight Ingestion Guide - Complete Setup

## Current Status
- **Papers**: 143,821 (up from 141,821)
- **Files**: Processing file 52 and file 1 (60 total)
- **Time remaining**: ~6-8 hours
- **Target**: 1M+ papers

---

## Step-by-Step: Run Ingestion Overnight

### 1. Prevent Mac from Sleeping

```bash
# Open Terminal and run this:
caffeinate -s
```

**Keep this terminal window open!** It prevents sleep while power is connected.

### 2. Check Your Setup

```bash
# Verify ingestion is running:
ps aux | grep ingest_bulk

# Check progress anytime:
cd /Users/sophia/Desktop/paper\ birthdays/paperbirthdays
./scripts/check_progress.sh
```

### 3. Mac Settings (Important!)

**System Settings → Energy:**
- [x] Prevent automatic sleeping when display is off
- [x] Keep Mac awake when plugged in
- [ ] Put hard disks to sleep (UNCHECK this)

**System Settings → Network:**
- Make sure WiFi doesn't disconnect when sleeping

### 4. Monitor Progress (Optional)

Create a monitoring script to log progress:

```bash
# In a new terminal:
cd /Users/sophia/Desktop/paper\ birthdays/paperbirthdays

while true; do
  date >> ingestion_progress.txt
  ./scripts/check_progress.sh >> ingestion_progress.txt
  echo "---" >> ingestion_progress.txt
  sleep 300  # Check every 5 minutes
done
```

### 5. If Something Goes Wrong

**Ingestion stops? Restart it:**
```bash
cd /Users/sophia/Desktop/paper\ birthdays/paperbirthdays
nohup ./scripts/run_bulk_all.sh > bulk_ingestion.log 2>&1 &
```

**Check what file it stopped on:**
```bash
tail -50 bulk_ingestion.log
```

**Resume from specific file:**
```bash
# If it stopped at file 30:
venv/bin/python scripts/ingest_bulk.py 30 1
```

---

## Morning After: Completion Checklist

### 1. Verify Ingestion Completed

```bash
cd /Users/sophia/Desktop/paper\ birthdays/paperbirthdays

# Check final stats:
./scripts/check_progress.sh

# Look for "COMPLETE!" in log:
tail -50 bulk_ingestion.log
```

**Expected results:**
- Total papers: 800K - 1.2M
- All 366 dates covered
- Average citations: 50-60

### 2. Generate JSON Files (3 minutes)

```bash
venv/bin/python scripts/generate_json.py all
```

**This creates:**
- 366 JSON files in `public/data/`
- `metadata.json` with global stats
- Each file: ~100KB - 2MB

### 3. Test Locally

```bash
# Start development server:
npm run dev

# Open browser to:
http://localhost:3000
http://localhost:3000/aug-08
http://localhost:3000/field/physics
```

**Check:**
- [ ] Homepage shows today's papers
- [ ] Field distribution is balanced (not 90% one field)
- [ ] Statistics match database count
- [ ] Random paper selection works
- [ ] All dates have papers

### 4. Deploy to Production

```bash
# Build for production:
npm run build

# Deploy to Vercel:
vercel --prod

# Or push to GitHub (if connected to Vercel):
git add .
git commit -m "Complete data ingestion: 1M+ papers"
git push origin main
```

---

## Troubleshooting

### Problem: Mac Went to Sleep
**Solution:** Ingestion should resume automatically. Check:
```bash
ps aux | grep ingest_bulk
```
If not running, restart from last completed file.

### Problem: WiFi Disconnected
**Solution:** Ingestion will fail with connection error. Check log:
```bash
tail -100 bulk_ingestion.log | grep -i error
```
Restart from last file if needed.

### Problem: Disk Space Full
**Check space:**
```bash
df -h
```

**The script streams data** (doesn't save bulk files), so you shouldn't run out. But database needs ~5-10GB for 1M papers.

### Problem: Process Killed
**Check system resources:**
```bash
top -l 1 | grep -E "CPU|Memory"
```

If memory is low (>90%), Mac might kill the process. In that case:
- Close other apps
- Restart ingestion with smaller batches

---

## After First Full Ingestion

### You'll Never Need to Do This Again!

Instead, use **incremental updates**:

### Weekly Update Script

```bash
#!/bin/bash
# scripts/weekly_update.sh

cd /Users/sophia/Desktop/paper\ birthdays/paperbirthdays

# Get papers from last 7 days
for i in {0..6}; do
  date=$(date -v-${i}d +%Y-%m-%d)
  venv/bin/python scripts/ingest_recent.py "$date"
done

# Regenerate JSON for updated dates
venv/bin/python scripts/generate_json.py all

echo "✓ Weekly update complete!"
```

**Set up as cron job:**
```bash
# Run every Monday at 2am:
crontab -e

# Add this line:
0 2 * * 1 /Users/sophia/Desktop/paper\ birthdays/paperbirthdays/scripts/weekly_update.sh
```

### Monthly Citation Update

```bash
#!/bin/bash
# scripts/monthly_citations.sh

# Update citation counts for existing papers
# (Create this script later - refreshes metrics only)
venv/bin/python scripts/update_citations.py

# Regenerate JSON
venv/bin/python scripts/generate_json.py all
```

---

## Performance Tips

### Speed Up Future JSON Generation

If you have 1M+ papers, regeneration might take 5-10 minutes. Optimize:

**Option 1: Parallel Generation**
```python
# In generate_json.py, add multiprocessing:
from multiprocessing import Pool

with Pool(4) as p:
    p.map(generate_file_for_date, all_dates)
```

**Option 2: Only Regenerate Changed Dates**
```bash
# If you only added papers for Jan 1-7:
for date in 01-01 01-02 01-03 01-04 01-05 01-06 01-07; do
  venv/bin/python scripts/generate_json.py "$date"
done
```

---

## Success Metrics

After completion, you should have:

✅ **Database:**
- 800K - 1.2M papers
- All 366 dates covered
- Balanced field distribution:
  - Medicine: 35-45%
  - Computer Science: 10-15%
  - Physics: 8-12%
  - Biology: 3-5%
  - Others: 30-40%

✅ **JSON Files:**
- 366 files in `public/data/`
- Total size: ~50-150MB
- Each date has 1K - 5K papers

✅ **Website:**
- Fast loading (<500ms)
- All date URLs work (/aug-08, /dec-25, etc.)
- Field navigation works
- Statistics accurate

✅ **Future-Proof:**
- Schema supports multiple sources
- Incremental updates set up
- No need to re-ingest bulk data

---

## Questions?

**During ingestion:**
- Monitor: `./scripts/check_progress.sh`
- Logs: `tail -f bulk_ingestion.log`

**After completion:**
- Test: `npm run dev`
- Deploy: `vercel --prod`
- Monitor: Check website analytics

This is a ONE-TIME effort. After tonight, you'll only need 5-minute weekly updates! 🎉
