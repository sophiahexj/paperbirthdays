# Annual Paper Ingestion

## Overview

The annual ingestion process refreshes the paper database once per year with the following logic:

1. **Ingest new papers** published since the last ingestion with citations > 10
2. **Trim dataset** to keep only the top 1000 papers per day (by citation count)
3. **VACUUM database** to reclaim storage space

## Schedule

- **Automatic**: Runs every January 1st at 2:00 AM UTC via GitHub Actions
- **Manual**: Can be triggered manually via GitHub Actions UI

## How It Works

### Step 1: Fetch New Papers
The script queries Semantic Scholar API for papers published after the last ingestion date:

- Fetches papers for each unique month-day combination in the database
- Only includes papers from years not yet ingested
- Filters for papers with **more than 10 citations**
- Uses pagination to handle large result sets
- Respects rate limits with automatic retries

### Step 2: Trim to Top 1000 Per Day
After ingestion, the database is trimmed to maintain quality:

```sql
DELETE FROM papers
WHERE paper_id IN (
    SELECT paper_id FROM (
        SELECT paper_id,
            ROW_NUMBER() OVER (
                PARTITION BY publication_month_day
                ORDER BY citation_count DESC
            ) as rank
        FROM papers
    ) ranked
    WHERE rank > 1000
);
```

This ensures:
- Each day (e.g., "01-15") has exactly 1000 papers maximum
- Only the highest-cited papers are kept
- Database size stays manageable (~200-300 MB)

### Step 3: VACUUM Database
Runs `VACUUM FULL` to reclaim disk space from deleted papers.

## Running Manually

### Via GitHub Actions
1. Go to the repository on GitHub
2. Click "Actions" tab
3. Select "Annual Paper Ingestion" workflow
4. Click "Run workflow"
5. Monitor the logs for progress

### Locally (for testing)
```bash
# Ensure you have the required environment variables
export DATABASE_URL="postgresql://..."
export SEMANTIC_SCHOLAR_API_KEY="..."

# Run the script
python3 scripts/annual_ingestion.py
```

## Expected Results

- **New papers ingested**: Varies by year (typically 10,000 - 50,000 papers)
- **Papers deleted**: Excess papers beyond top 1000 per day
- **Final database size**: ~200-300 MB
- **Duration**: 2-6 hours depending on volume

## Monitoring

The script logs:
- Initial database statistics (paper count, size)
- Progress for each month-day being processed
- API rate limiting and retries
- Final statistics and changes
- Entry in `ingestion_logs` table

## Configuration

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (required)
- `SEMANTIC_SCHOLAR_API_KEY`: API key for Semantic Scholar (required)

### GitHub Secrets
Ensure these secrets are set in the repository:
- `DATABASE_URL`
- `SEMANTIC_SCHOLAR_API_KEY`

## Troubleshooting

### "Rate limited" errors
The script automatically handles rate limits with exponential backoff. This is normal and expected.

### Database size limit exceeded
If the database exceeds Neon's free tier limit (512 MB):
1. The script will trim to top 1000 papers per day
2. VACUUM will reclaim space
3. If still too large, reduce to top 800 or 500 papers per day

### API timeout errors
Increase the timeout in the script or run during off-peak hours.

## Migration from Railway

The old Railway continuous ingestion has been replaced with this annual process:

**Before**: Railway worker ran continuously, ingesting papers 24/7
**After**: GitHub Action runs once per year on January 1st

**Removed files**:
- `railway.json`
- `railway_auto.py`
- `run_ingestion.sh`

**Benefits**:
- Reduced API costs (once per year vs continuous)
- Simpler maintenance (GitHub Actions vs Railway)
- More predictable database growth
- No Railway deployment costs

## Database Schema

The script uses the `ingestion_logs` table to track runs:

```sql
CREATE TABLE IF NOT EXISTS ingestion_logs (
    id SERIAL PRIMARY KEY,
    status VARCHAR(50) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Each run is logged with:
- Status: 'completed' or 'failed'
- Notes: Summary of papers ingested/deleted
- Timestamp: When the ingestion ran
