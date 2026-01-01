# Paper Birthdays - Data Architecture & Ingestion Strategy

## Goal
Ingest 1M+ papers once, then maintain with incremental updates. Support multiple data sources (Semantic Scholar, arXiv, OpenAlex, etc.) with proper deduplication.

---

## Phase 1: Complete Semantic Scholar Bulk Ingestion (ONE TIME)

### Option A: Cloud Server (Recommended)
**Why:** Laptop can sleep, more reliable, faster network

**Quick Setup (Railway - Free tier):**
1. Go to railway.app, sign up
2. Create new project → "Empty Project"
3. Add PostgreSQL database (auto-configured)
4. Add service → "GitHub Repo" (or empty service)
5. SSH into server:
   ```bash
   railway run bash
   ```
6. Clone your repo and run ingestion there
7. Takes 8-10 hours, you can close laptop

**Alternative: Render, Fly.io, AWS EC2**

### Option B: Local with Caffeinate (Simpler)
```bash
# Prevent Mac from sleeping during ingestion
caffeinate -s ./scripts/run_bulk_all.sh

# In another terminal, monitor:
watch -n 60 './scripts/check_progress.sh'
```

**Requirements:**
- Laptop plugged in
- Stable WiFi
- 8-10 hours runtime

---

## Phase 2: Database Schema for Multi-Source Support

### Current Schema Strengths
✅ Already has `source` column
✅ Has `paper_id` (unique per source)
✅ Has `updated_at` timestamp
✅ Unique constraint on DOI (cross-source deduplication)

### Schema Improvements Needed

```sql
-- Add source priority for conflicts
ALTER TABLE papers ADD COLUMN source_priority INTEGER DEFAULT 0;

-- Add external IDs for cross-source matching
ALTER TABLE papers ADD COLUMN arxiv_id VARCHAR(50);
ALTER TABLE papers ADD COLUMN pubmed_id VARCHAR(50);
ALTER TABLE papers ADD COLUMN openalex_id VARCHAR(50);

-- Create indexes for external IDs
CREATE INDEX idx_arxiv_id ON papers(arxiv_id) WHERE arxiv_id IS NOT NULL;
CREATE INDEX idx_pubmed_id ON papers(pubmed_id) WHERE pubmed_id IS NOT NULL;
CREATE INDEX idx_openalex_id ON papers(openalex_id) WHERE openalex_id IS NOT NULL;

-- Track which sources have been ingested
CREATE TABLE source_metadata (
    source VARCHAR(50) PRIMARY KEY,
    last_full_ingestion TIMESTAMP,
    last_incremental_update TIMESTAMP,
    total_papers INTEGER,
    status VARCHAR(50),
    notes TEXT
);
```

---

## Phase 3: Ingestion Strategy

### One-Time Full Ingestion (Per Source)
```
Semantic Scholar Bulk → 1M+ papers (doing now)
arXiv Bulk → 2M+ papers (future)
OpenAlex Snapshot → 250M+ papers (future, selective)
```

### Incremental Updates (Weekly/Monthly)
Instead of re-ingesting everything:

```python
# ingest_recent.py (already exists!)
# Runs weekly to get papers from last 7 days
# Uses API, not bulk download

# Example:
python scripts/ingest_recent.py 2026-01-01  # Today's papers
python scripts/ingest_recent.py --last-7-days  # Recent papers
```

### Citation Updates (Monthly)
```python
# update_citations.py (create this)
# Re-fetch citation counts for existing papers
# Only updates metrics, doesn't add new papers
```

---

## Phase 4: Multi-Source Architecture

### Deduplication Strategy

Papers can appear in multiple sources. Match by:
1. **DOI** (most reliable) - already unique in DB
2. **arXiv ID** (for preprints)
3. **Title + Year** (fuzzy match fallback)

### Conflict Resolution

When same paper exists in multiple sources, which field to trust?

```python
SOURCE_PRIORITY = {
    'openalex': 1,        # Most comprehensive metadata
    'semantic_scholar': 2, # Best citations + fields
    'arxiv': 3,           # Best for preprints
    'pubmed': 4,          # Best for medicine
}

FIELD_PRIORITY = {
    'citation_count': 'semantic_scholar',  # S2 has best citation data
    'abstract': 'openalex',                # OpenAlex has fullest abstracts
    'pdf_url': 'arxiv',                    # arXiv has direct PDFs
    'fields_of_study': 'openalex',         # OpenAlex has detailed fields
}
```

### Unified Ingestion Pipeline

```python
# scripts/ingest_unified.py (create this)

class UnifiedPaperIngester:
    def __init__(self, db):
        self.db = db

    def ingest_paper(self, paper_data, source):
        """
        Ingest paper with deduplication and conflict resolution
        """
        # 1. Check if paper exists (by DOI, arXiv ID, etc.)
        existing = self.find_existing_paper(paper_data)

        if existing:
            # 2. Merge data (keep best field from each source)
            merged = self.merge_papers(existing, paper_data, source)
            self.update_paper(merged)
        else:
            # 3. Insert new paper
            self.insert_paper(paper_data, source)

    def merge_papers(self, existing, new_data, new_source):
        """
        Smart merge: keep best field from each source
        """
        merged = existing.copy()

        for field, preferred_source in FIELD_PRIORITY.items():
            if new_source == preferred_source:
                if field in new_data and new_data[field]:
                    merged[field] = new_data[field]

        # Always update citation count to highest
        if new_data.get('citation_count', 0) > merged.get('citation_count', 0):
            merged['citation_count'] = new_data['citation_count']

        return merged
```

---

## Phase 5: Source-Specific Ingestors

### Semantic Scholar (Current)
- ✅ Bulk ingestion: `ingest_bulk.py`
- ✅ Incremental: `ingest_recent.py`
- Future: Citation updates

### arXiv (Future)
```python
# scripts/ingest_arxiv.py

import arxiv

def ingest_arxiv_by_date(date):
    """
    Fetch arXiv papers by publication date
    Uses: arXiv API or bulk metadata dump
    """
    search = arxiv.Search(
        query=f"submittedDate:[{date} TO {date}]",
        max_results=1000,
        sort_by=arxiv.SortCriterion.SubmittedDate
    )

    for paper in search.results():
        normalized = {
            'paper_id': paper.entry_id,
            'arxiv_id': paper.entry_id.split('/')[-1],
            'title': paper.title,
            'abstract': paper.summary,
            'authors': [a.name for a in paper.authors],
            'publication_date': paper.published.date(),
            'pdf_url': paper.pdf_url,
            'doi': paper.doi,
            # ... normalize to schema
        }

        ingest_paper(normalized, source='arxiv')
```

### OpenAlex (Future)
```python
# scripts/ingest_openalex.py

def ingest_openalex_by_date(date):
    """
    OpenAlex has 250M+ works, use filters
    Free, open, comprehensive
    """
    url = f"https://api.openalex.org/works?filter=publication_date:{date}"
    # ... fetch and normalize
```

---

## Phase 6: Maintenance Schedule

### One-Time (Doing Now)
- [ ] Semantic Scholar bulk ingestion (1M papers)
- [ ] Generate all JSON files

### Weekly (Automated)
```bash
# Cron job: Every Monday at 2am
0 2 * * 1 cd /path/to/project && venv/bin/python scripts/ingest_recent.py --last-7-days
```

### Monthly (Automated)
```bash
# Cron job: 1st of month at 3am
0 3 1 * * cd /path/to/project && venv/bin/python scripts/update_citations.py
```

### After Each Update
```bash
# Regenerate JSON files (takes 2-3 minutes)
venv/bin/python scripts/generate_json.py all
```

---

## Phase 7: Adding a New Source (Checklist)

When you want to add arXiv, OpenAlex, etc:

1. **Create source-specific ingester**
   ```bash
   cp scripts/ingest_bulk.py scripts/ingest_arxiv.py
   # Modify to match arXiv API/format
   ```

2. **Add source priority**
   ```python
   # In scripts/config.py
   SOURCE_PRIORITY['arxiv'] = 3
   ```

3. **Run initial bulk ingestion**
   ```bash
   python scripts/ingest_arxiv.py --bulk
   ```

4. **Add to weekly updates**
   ```bash
   # Add to cron
   python scripts/ingest_arxiv.py --recent
   ```

5. **Regenerate JSON**
   ```bash
   python scripts/generate_json.py all
   ```

---

## Key Principles

### ✅ DO
- Ingest each source's bulk data ONCE
- Use incremental updates (API) for new papers
- Update citations monthly (not daily)
- Trust DOI for deduplication
- Keep source metadata for debugging
- Version your ingestion scripts

### ❌ DON'T
- Re-download entire bulk datasets
- Delete old data when adding new sources
- Trust all sources equally (use priority)
- Ignore duplicates (merge them)
- Run full ingestion weekly (waste of bandwidth)

---

## Estimated Sizes

| Source | Papers | Bulk Download | Incremental/Week |
|--------|--------|---------------|------------------|
| Semantic Scholar | 200M total, 1M+ with dates | 90GB (60 files) | ~1K papers |
| arXiv | 2M+ | 150GB XML dump | ~3K papers |
| OpenAlex | 250M+ | Snapshot API | ~10K papers |
| PubMed | 35M+ | FTP bulk XML | ~5K papers |

**Your Strategy:**
- Semantic Scholar: 1M papers (bulk, done once)
- arXiv: Maybe 500K papers (add later)
- OpenAlex: Selective (only highly cited, add later)

Total target: **1-2M papers** is plenty for a great site.

---

## Next Steps (Today)

1. **Complete Semantic Scholar ingestion** (8-10 hours)
   - Use caffeinate or cloud server
   - Monitor with `./scripts/check_progress.sh`

2. **Generate JSON files** (3 minutes)
   ```bash
   venv/bin/python scripts/generate_json.py all
   ```

3. **Deploy and test**
   - Verify /aug-08 works
   - Check field distribution
   - Test random paper selection

4. **Set up weekly incremental updates** (later)
   - Cron job for new papers
   - Citation updates monthly

---

## Files to Create

Once bulk ingestion completes:

```bash
# Create these for maintainability:
scripts/
├── config.py              # Source priorities, field mappings
├── ingest_unified.py      # Multi-source ingestion logic
├── update_citations.py    # Monthly citation refresh
├── deduplication.py       # DOI/title matching logic
└── source_adapters/       # Normalize each source's format
    ├── semantic_scholar.py
    ├── arxiv.py
    └── openalex.py
```

This architecture will scale to millions of papers from multiple sources!
