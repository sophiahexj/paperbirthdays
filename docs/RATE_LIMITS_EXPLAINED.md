# Semantic Scholar Rate Limits Explained

## Your Question
> "The introductory rate limit for an API key is 1 RPS. Could the ingestion go faster?"

## Short Answer
**No, the bulk ingestion speed is NOT affected by the 1 RPS API rate limit.**

---

## Why Not?

### Bulk Ingestion Uses Direct Downloads (NOT API Calls)

Your current bulk ingestion (`ingest_bulk.py`) uses:
- **Direct S3 downloads** from AWS
- **NOT the Semantic Scholar API**
- Downloads are pre-signed URLs that bypass API rate limits

```python
# This is a direct download, NOT an API call:
response = requests.get(
    'https://ai2-s2ag.s3.amazonaws.com/staging/...',  # Direct S3 URL
    stream=True
)
```

**Rate limit does NOT apply to:**
- Bulk dataset downloads (what you're doing now)
- Pre-signed S3 URLs
- Direct file downloads

**Rate limit ONLY applies to:**
- API endpoint calls (e.g., `/paper/search`, `/paper/{id}`)
- Used by `ingest_recent.py` (weekly updates)

---

## What DOES Affect Bulk Ingestion Speed?

### 1. Network Bandwidth (Main Bottleneck)
- You're downloading ~90GB total (60 files × ~1.5GB each)
- Each file takes 5-15 minutes to download + process
- **Limited by your internet speed, not API limits**

### 2. Database Insert Speed
- Inserting 1M papers takes time
- Currently commits every 1,000 papers
- Could optimize with larger batch commits

### 3. Streaming Processing
- Processing line-by-line (memory efficient)
- Slightly slower than bulk insert but prevents crashes

---

## Where Rate Limits DO Matter

### Weekly Incremental Updates (`ingest_recent.py`)

This script DOES use the API and IS affected by rate limits:

```python
# API call - subject to 1 RPS limit:
response = requests.get(
    'https://api.semanticscholar.org/graph/v1/paper/search',
    params={'query': 'a', 'publicationDateOrYear': '2026-01-01'},
    headers={'x-api-key': api_key}
)
```

**Current Rate Limit: 1 RPS (1 request per second)**
- Max 3,600 requests/hour
- Max 100 papers per request
- Theoretical max: 360,000 papers/hour

**Your Weekly Update:**
- Checks 7 dates
- ~50-500 papers per date
- Takes ~7-30 seconds total
- **Rate limit is NOT a problem for weekly updates**

---

## Could You Speed Up Bulk Ingestion?

### Option 1: Parallel File Processing ⚡

**Current:** Files processed sequentially (1 at a time)
**Better:** Process 2-3 files simultaneously

```bash
# Modify run_bulk_all.sh to run in parallel:

# Process files 1-3 simultaneously:
venv/bin/python scripts/ingest_bulk.py 1 1 &
venv/bin/python scripts/ingest_bulk.py 2 1 &
venv/bin/python scripts/ingest_bulk.py 3 1 &
wait

# Then files 4-6:
venv/bin/python scripts/ingest_bulk.py 4 1 &
venv/bin/python scripts/ingest_bulk.py 5 1 &
venv/bin/python scripts/ingest_bulk.py 6 1 &
wait
```

**Speedup:** 2-3x faster (10 hours → 3-5 hours)
**Tradeoff:** Uses more CPU/memory/bandwidth

### Option 2: Larger Database Batches

**Current:** Commits every 1,000 papers
**Better:** Commit every 5,000 or 10,000 papers

```python
# In ingest_bulk.py, change:
if inserted_papers % 1000 == 0:  # Current
    db_connection.commit()

# To:
if inserted_papers % 5000 == 0:  # Faster
    db_connection.commit()
```

**Speedup:** ~20% faster inserts
**Tradeoff:** If crash occurs, lose more uncommitted data

### Option 3: Use Cloud Server

**Current:** Your laptop (consumer internet)
**Better:** Cloud server (datacenter speeds)

- AWS/Railway/Render have much faster download speeds
- 100-1000 Mbps vs your home ~50 Mbps
- Could reduce 10 hours → 2-3 hours

---

## Recommended Optimizations

### For Tonight's Ingestion (Already Running)

**Don't change anything** - let it complete!

### For Future Bulk Ingestions (Other Sources)

```bash
# scripts/run_bulk_parallel.sh

# Process 3 files at a time:
PARALLEL=3

for ((i=1; i<=60; i+=PARALLEL)); do
    for ((j=0; j<PARALLEL && i+j<=60; j++)); do
        FILE_NUM=$((i + j))
        venv/bin/python scripts/ingest_bulk.py $FILE_NUM 1 \
            >> logs/file_${FILE_NUM}.log 2>&1 &
    done
    # Wait for this batch to complete
    wait
    echo "Completed files $i to $((i+PARALLEL-1))"
done
```

---

## Rate Limit Upgrade Options

If you need faster API access (for future features):

### 1. Academic/Research Account
- Email: partnerships@semanticscholar.org
- Free for academic use
- Much higher limits (10-100 RPS)

### 2. Data Partners Program
- For commercial applications
- Custom rate limits
- Requires application

### 3. Current Limits Are Fine
For your use case:
- Bulk ingestion: **Not rate limited**
- Weekly updates: **1 RPS is plenty**
- No upgrade needed! ✓

---

## Summary

| Operation | Uses API? | Rate Limited? | Speed |
|-----------|-----------|---------------|-------|
| **Bulk ingestion** (tonight) | ❌ No (direct download) | ❌ No | ~10 hours |
| **Weekly updates** (`ingest_recent.py`) | ✅ Yes | ✅ Yes (1 RPS) | 7-30 seconds |
| **Citation updates** (monthly) | ✅ Yes | ✅ Yes (1 RPS) | 5-10 minutes |

**Bottom Line:**
- Your bulk ingestion is **NOT slowed by API rate limits**
- It's limited by **network speed** and **database insert speed**
- 1 RPS is **perfectly fine** for your weekly maintenance
- No need to upgrade API limits! ✓

---

## If You Want Faster Bulk Ingestion

**Easiest:** Let it run overnight (no changes needed)

**Moderate:** Use cloud server next time
- Deploy to Railway
- Run ingestion there
- 2-3x faster download speeds

**Advanced:** Parallel processing
- Modify `run_bulk_all.sh` to process 2-3 files simultaneously
- Requires more monitoring

**For tonight:** Just let it run! The current approach is solid. 🚀
