# Paper Birthdays - Complete Action Plan

## Overview
This guide provides step-by-step instructions for completing your ONE-TIME bulk ingestion and setting up a flexible, multi-source architecture.

---

## 🎯 **TONIGHT: Complete Bulk Ingestion**

### What's Happening Now
- **Status**: Ingestion running (files 1 & 52 of 60)
- **Progress**: 143,821 papers ingested
- **Time remaining**: 6-8 hours
- **Target**: 800K - 1.2M papers

### Action Items for Tonight

#### 1. Prevent Mac from Sleeping
```bash
# Open Terminal, run this command:
caffeinate -s
```
**Leave this terminal open all night!**

#### 2. Verify Settings
- Mac plugged into power ✓
- WiFi won't disconnect ✓
- Disk space: >10GB free ✓

#### 3. Monitor (Optional)
```bash
cd /Users/sophia/Desktop/paper\ birthdays/paperbirthdays

# Check progress anytime:
./scripts/check_progress.sh

# Or watch live:
tail -f bulk_ingestion.log
```

#### 4. Go to Sleep
The ingestion will complete overnight. Nothing more needed tonight!

---

## 🌅 **TOMORROW MORNING: Finalize Setup**

### Step 1: Verify Completion (2 minutes)

```bash
cd /Users/sophia/Desktop/paper\ birthdays/paperbirthdays

# Check final stats:
./scripts/check_progress.sh

# Expected output:
# Total papers: 800,000 - 1,200,000
# Unique dates covered: 366/366
# Average citations: 50-60
```

### Step 2: Generate JSON Files (3 minutes)

```bash
venv/bin/python scripts/generate_json.py all
```

**This creates:**
- 366 JSON files in `public/data/` (one per day)
- `metadata.json` with global statistics
- Total size: ~50-150MB

### Step 3: Test Locally (5 minutes)

```bash
# Start development server:
npm run dev

# Open browser and test:
# http://localhost:3000
# http://localhost:3000/aug-08
# http://localhost:3000/jan-01
# http://localhost:3000/field/physics
```

**Verify:**
- [ ] Homepage loads and shows today's papers
- [ ] `/aug-08` works (not empty!)
- [ ] Field distribution looks balanced (check statistics)
- [ ] Medicine ~40%, not 90%
- [ ] Random paper button works
- [ ] All filter controls work

### Step 4: Apply Schema Updates (1 minute)

```bash
# Connect to database and run updates:
venv/bin/python -c "
import psycopg2
import os
from dotenv import load_dotenv
load_dotenv()

db = psycopg2.connect(os.getenv('DATABASE_URL'))

with open('db/schema_updates.sql') as f:
    db.cursor().execute(f.read())

db.commit()
print('✓ Schema updated for multi-source support')
"
```

This adds:
- External ID columns (arXiv, OpenAlex, PubMed)
- Source priority tracking
- Deduplication logging
- Citation history

### Step 5: Deploy to Production (5 minutes)

```bash
# Build production version:
npm run build

# Deploy to Vercel:
vercel --prod

# Or push to GitHub (if connected to Vercel):
git add .
git commit -m "Complete data ingestion: 1M+ papers, multi-source ready"
git push origin main
```

**Live site will be at:** `https://happybdaypaper.com`

---

## 📅 **ONGOING: Weekly Maintenance (5 minutes)**

### Option A: Manual Weekly Update

```bash
# Run every Monday:
cd /Users/sophia/Desktop/paper\ birthdays/paperbirthdays

# Get papers from last 7 days
for i in {0..6}; do
  date=$(date -v-${i}d +%Y-%m-%d)
  venv/bin/python scripts/ingest_recent.py "$date"
done

# Regenerate JSON (only takes 3 minutes)
venv/bin/python scripts/generate_json.py all

# Deploy
vercel --prod
```

### Option B: Automated Cron Job

```bash
# Edit crontab:
crontab -e

# Add this line (runs every Monday at 2am):
0 2 * * 1 cd /Users/sophia/Desktop/paper\ birthdays/paperbirthdays && venv/bin/python scripts/ingest_recent.py --last-7-days && venv/bin/python scripts/generate_json.py all
```

---

## 🔮 **FUTURE: Add More Data Sources**

When you're ready to add arXiv, OpenAlex, etc:

### Step 1: Choose Next Source

**Recommended order:**
1. **arXiv** (easy integration, 2M papers, great for CS/Physics/Math)
2. **OpenAlex** (comprehensive, 250M papers, but massive)
3. **PubMed** (medical papers, 35M papers)

### Step 2: Create Source Adapter

```bash
# Copy template:
cp scripts/ingest_bulk.py scripts/ingest_arxiv.py

# Modify to use arXiv API:
# - Change data source URL
# - Adapt field mappings
# - Use normalize_field() from config.py
```

### Step 3: Run Initial Ingestion

```bash
# Test with one date first:
venv/bin/python scripts/ingest_arxiv.py --date 2020-01-01

# Then bulk (overnight):
venv/bin/python scripts/ingest_arxiv.py --bulk
```

### Step 4: Handle Duplicates

The schema is ready! Duplicates will be:
- Detected by DOI/arXiv ID
- Logged in `deduplication_log` table
- Merged using source priority rules

### Step 5: Regenerate JSON

```bash
venv/bin/python scripts/generate_json.py all
```

Papers will show "Available on: Semantic Scholar, arXiv" with links to both!

---

## 📊 **Architecture Summary**

### Current Setup (After Tonight)
```
Semantic Scholar (1M papers)
  ↓
PostgreSQL Database
  ↓
366 JSON files
  ↓
Next.js Website
```

### Future Multi-Source Setup
```
Semantic Scholar ─┐
arXiv ───────────┼─→ PostgreSQL ─→ JSON ─→ Website
OpenAlex ────────┤    (Dedupe +      (Fast   (Fast
PubMed ──────────┘     Merge)        reads)  delivery)
```

### Key Principles

**✅ DO:**
- Bulk ingest each source ONCE
- Use incremental updates weekly (APIs)
- Trust source priorities for conflicts
- Regenerate JSON after DB updates
- Keep deduplication logs

**❌ DON'T:**
- Re-download bulk datasets
- Delete data when adding sources
- Ignore duplicate papers (merge them!)
- Query database from frontend
- Run full ingestion more than once per source

---

## 🗂️ **File Organization**

After tonight, your project will look like:

```
paperbirthdays/
├── app/                    # Next.js pages (frontend)
├── components/             # React components
├── lib/                    # Frontend utilities
├── scripts/                # Python data pipeline
│   ├── config.py          # ✨ NEW: Multi-source config
│   ├── ingest_bulk.py     # ✅ DONE: Bulk ingestion
│   ├── ingest_recent.py   # Weekly updates
│   ├── generate_json.py   # JSON generation
│   └── (future)
│       ├── ingest_arxiv.py
│       ├── ingest_openalex.py
│       └── update_citations.py
├── db/
│   ├── schema.sql         # Original schema
│   └── schema_updates.sql # ✨ NEW: Multi-source extensions
├── docs/                   # ✨ NEW: Architecture docs
│   ├── DATA_ARCHITECTURE.md
│   ├── OVERNIGHT_INGESTION_GUIDE.md
│   └── ACTION_PLAN.md (this file)
├── public/data/           # Generated JSON (366 files)
└── venv/                  # Python environment
```

---

## ✅ **Success Checklist**

After completing all steps, you should have:

### Database
- [ ] 800K - 1.2M papers ingested
- [ ] All 366 dates covered
- [ ] Balanced field distribution (~40% Medicine, not 90%)
- [ ] Schema updated for multi-source support
- [ ] Indexes created for fast queries

### JSON Files
- [ ] 366 date files generated
- [ ] `metadata.json` exists
- [ ] Total size: 50-150MB
- [ ] Each date has hundreds/thousands of papers

### Website
- [ ] Deployed to happybdaypaper.com
- [ ] Homepage loads in <500ms
- [ ] All date URLs work (/jan-01, /aug-08, etc.)
- [ ] Field navigation works
- [ ] Statistics are accurate
- [ ] Random paper selection works
- [ ] Share functionality works

### Future-Proof
- [ ] Config file created (`scripts/config.py`)
- [ ] Schema supports external IDs (arXiv, OpenAlex)
- [ ] Deduplication tables ready
- [ ] Weekly update schedule planned
- [ ] Documentation complete

---

## 🆘 **Troubleshooting**

### Problem: Ingestion Stopped
```bash
# Check if running:
ps aux | grep ingest_bulk

# Restart from last file (check log for file number):
tail -50 bulk_ingestion.log
venv/bin/python scripts/ingest_bulk.py [FILE_NUM] 1
```

### Problem: Not Enough Papers
```bash
# Check what was ingested:
./scripts/check_progress.sh

# If <500K papers, connection issues likely occurred
# Restart from file 1:
./scripts/run_bulk_all.sh
```

### Problem: JSON Generation Fails
```bash
# Check database connection:
venv/bin/python scripts/test_connections.py

# Try single date first:
venv/bin/python scripts/generate_json.py 01-01

# Then all dates:
venv/bin/python scripts/generate_json.py all
```

### Problem: Website Shows Old Data
```bash
# Regenerate JSON:
venv/bin/python scripts/generate_json.py all

# Rebuild Next.js:
npm run build

# Deploy:
vercel --prod
```

---

## 📞 **Next Steps**

### Immediate (Tonight → Tomorrow)
1. ✅ Bulk ingestion completes
2. ✅ Generate JSON files
3. ✅ Test locally
4. ✅ Deploy to production
5. ✅ Apply schema updates

### Short Term (Next Week)
1. Set up weekly incremental updates
2. Monitor site analytics
3. Gather user feedback
4. Plan arXiv integration

### Long Term (Next Month)
1. Add arXiv as second source
2. Implement citation updates
3. Add trending papers feature
4. Consider OpenAlex integration

---

## 🎉 **You're Almost Done!**

Once tonight's ingestion completes:
- You'll have **1M+ papers** in your database
- You'll **never need to bulk ingest Semantic Scholar again**
- Weekly updates will take **5 minutes**
- Your site will be **fast and scalable**
- You'll be **ready to add more sources** anytime

The hardest part (bulk ingestion) happens ONCE. After that, it's smooth sailing! 🚀

---

**Questions?**
- Monitor progress: `./scripts/check_progress.sh`
- Check logs: `tail -f bulk_ingestion.log`
- Docs: See `docs/` folder for detailed guides
