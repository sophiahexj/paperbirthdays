-- Schema Updates for Multi-Source Support
-- Run this AFTER initial Semantic Scholar ingestion completes
-- Purpose: Enable arXiv, OpenAlex, PubMed integration with deduplication

-- ============================================
-- Add External ID Columns for Cross-Source Matching
-- ============================================

-- arXiv identifier (e.g., "2301.12345")
ALTER TABLE papers ADD COLUMN IF NOT EXISTS arxiv_id VARCHAR(50);

-- PubMed identifier
ALTER TABLE papers ADD COLUMN IF NOT EXISTS pubmed_id VARCHAR(50);

-- OpenAlex identifier (e.g., "W2741809807")
ALTER TABLE papers ADD COLUMN IF NOT EXISTS openalex_id VARCHAR(50);

-- Microsoft Academic Graph ID (legacy, optional)
ALTER TABLE papers ADD COLUMN IF NOT EXISTS mag_id VARCHAR(50);

-- ============================================
-- Add Source Priority for Conflict Resolution
-- ============================================

-- Higher priority = trust this source more for metadata
-- 1 = highest (OpenAlex), 5 = lowest
ALTER TABLE papers ADD COLUMN IF NOT EXISTS source_priority INTEGER DEFAULT 2;

-- Update Semantic Scholar papers to priority 2
UPDATE papers SET source_priority = 2 WHERE source = 'semantic_scholar';

-- ============================================
-- Create Indexes for Fast Lookups
-- ============================================

-- Index external IDs for deduplication queries
CREATE INDEX IF NOT EXISTS idx_arxiv_id ON papers(arxiv_id) WHERE arxiv_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pubmed_id ON papers(pubmed_id) WHERE pubmed_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_openalex_id ON papers(openalex_id) WHERE openalex_id IS NOT NULL;

-- Composite index for finding papers by any external ID
CREATE INDEX IF NOT EXISTS idx_external_ids ON papers(doi, arxiv_id, pubmed_id, openalex_id);

-- ============================================
-- Track Source Metadata
-- ============================================

CREATE TABLE IF NOT EXISTS source_metadata (
    source VARCHAR(50) PRIMARY KEY,
    display_name VARCHAR(100),
    last_full_ingestion TIMESTAMP,
    last_incremental_update TIMESTAMP,
    total_papers INTEGER DEFAULT 0,
    papers_with_citations INTEGER DEFAULT 0,
    status VARCHAR(50), -- 'active', 'paused', 'failed'
    priority INTEGER,   -- Default priority for this source
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert Semantic Scholar metadata
INSERT INTO source_metadata (source, display_name, last_full_ingestion, total_papers, status, priority)
VALUES ('semantic_scholar', 'Semantic Scholar', NOW(),
    (SELECT COUNT(*) FROM papers WHERE source = 'semantic_scholar'),
    'active', 2)
ON CONFLICT (source) DO UPDATE SET
    last_full_ingestion = EXCLUDED.last_full_ingestion,
    total_papers = EXCLUDED.total_papers,
    updated_at = NOW();

-- ============================================
-- Track Field Mappings (for each source)
-- ============================================

CREATE TABLE IF NOT EXISTS field_mappings (
    id SERIAL PRIMARY KEY,
    source VARCHAR(50) NOT NULL,
    raw_field VARCHAR(200) NOT NULL,
    normalized_field VARCHAR(100) NOT NULL,
    confidence FLOAT DEFAULT 1.0,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(source, raw_field)
);

-- Insert current Semantic Scholar mappings
INSERT INTO field_mappings (source, raw_field, normalized_field) VALUES
('semantic_scholar', 'Medicine', 'Medicine'),
('semantic_scholar', 'Biology', 'Biology'),
('semantic_scholar', 'Computer Science', 'Computer Science'),
('semantic_scholar', 'Physics', 'Physics'),
('semantic_scholar', 'Chemistry', 'Chemistry'),
('semantic_scholar', 'Materials Science', 'Chemistry'),
('semantic_scholar', 'Mathematics', 'Mathematics'),
('semantic_scholar', 'Psychology', 'Psychology'),
('semantic_scholar', 'Engineering', 'Engineering'),
('semantic_scholar', 'Environmental Science', 'Environmental Science'),
('semantic_scholar', 'Geology', 'Environmental Science'),
('semantic_scholar', 'Geography', 'Environmental Science'),
('semantic_scholar', 'Political Science', 'Political Science'),
('semantic_scholar', 'Sociology', 'Political Science'),
('semantic_scholar', 'Economics', 'Economics'),
('semantic_scholar', 'Business', 'Economics'),
('semantic_scholar', 'Art', 'Art'),
('semantic_scholar', 'Philosophy', 'Philosophy'),
('semantic_scholar', 'History', 'History')
ON CONFLICT (source, raw_field) DO NOTHING;

-- ============================================
-- Deduplication Log
-- ============================================

CREATE TABLE IF NOT EXISTS deduplication_log (
    id SERIAL PRIMARY KEY,
    primary_paper_id VARCHAR(255) NOT NULL,
    duplicate_paper_id VARCHAR(255) NOT NULL,
    matched_on VARCHAR(50), -- 'doi', 'arxiv_id', 'title_year', etc.
    confidence FLOAT,
    action VARCHAR(50), -- 'merged', 'ignored', 'flagged'
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dedup_primary ON deduplication_log(primary_paper_id);

-- ============================================
-- Citation History (track changes over time)
-- ============================================

CREATE TABLE IF NOT EXISTS citation_history (
    id SERIAL PRIMARY KEY,
    paper_id VARCHAR(255) NOT NULL,
    source VARCHAR(50) NOT NULL,
    citation_count INTEGER NOT NULL,
    influential_citation_count INTEGER,
    recorded_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_citation_history ON citation_history(paper_id, recorded_at);

-- ============================================
-- Helper Functions
-- ============================================

-- Function to find potential duplicates by title + year
CREATE OR REPLACE FUNCTION find_duplicate_papers(
    search_title TEXT,
    search_year INTEGER,
    threshold FLOAT DEFAULT 0.85
)
RETURNS TABLE (
    paper_id VARCHAR,
    title TEXT,
    year INTEGER,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.paper_id,
        p.title,
        p.year,
        similarity(p.title, search_title) as sim
    FROM papers p
    WHERE
        p.year = search_year
        AND similarity(p.title, search_title) > threshold
    ORDER BY sim DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- Enable similarity extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================
-- Views for Analysis
-- ============================================

-- View: Papers with multiple source IDs (potential duplicates)
CREATE OR REPLACE VIEW papers_with_multiple_sources AS
SELECT
    paper_id,
    source,
    title,
    year,
    doi,
    arxiv_id,
    openalex_id,
    pubmed_id
FROM papers
WHERE
    (doi IS NOT NULL OR
     arxiv_id IS NOT NULL OR
     openalex_id IS NOT NULL OR
     pubmed_id IS NOT NULL)
ORDER BY title;

-- View: Source statistics
CREATE OR REPLACE VIEW source_statistics AS
SELECT
    source,
    COUNT(*) as total_papers,
    COUNT(DISTINCT publication_month_day) as dates_covered,
    AVG(citation_count) as avg_citations,
    MAX(citation_count) as max_citations,
    COUNT(CASE WHEN doi IS NOT NULL THEN 1 END) as papers_with_doi,
    COUNT(CASE WHEN citation_count > 100 THEN 1 END) as highly_cited
FROM papers
GROUP BY source
ORDER BY total_papers DESC;

-- View: Field distribution by source
CREATE OR REPLACE VIEW field_distribution_by_source AS
SELECT
    source,
    field,
    COUNT(*) as paper_count,
    ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (PARTITION BY source), 1) as percentage
FROM papers
GROUP BY source, field
ORDER BY source, paper_count DESC;

-- ============================================
-- Data Quality Checks
-- ============================================

-- Check for papers with same DOI from different sources
CREATE OR REPLACE VIEW duplicate_dois AS
SELECT
    doi,
    COUNT(DISTINCT source) as source_count,
    STRING_AGG(DISTINCT source, ', ') as sources,
    COUNT(*) as total_papers
FROM papers
WHERE doi IS NOT NULL
GROUP BY doi
HAVING COUNT(DISTINCT source) > 1;

-- Check for papers missing critical fields
CREATE OR REPLACE VIEW papers_missing_metadata AS
SELECT
    paper_id,
    source,
    title,
    CASE WHEN doi IS NULL THEN 'missing_doi' END as issue_1,
    CASE WHEN field IS NULL THEN 'missing_field' END as issue_2,
    CASE WHEN venue IS NULL THEN 'missing_venue' END as issue_3,
    CASE WHEN citation_count = 0 THEN 'zero_citations' END as issue_4
FROM papers
WHERE
    doi IS NULL OR
    field IS NULL OR
    venue IS NULL OR
    citation_count = 0
LIMIT 100;

-- ============================================
-- Comments for Documentation
-- ============================================

COMMENT ON TABLE source_metadata IS 'Tracks ingestion status and metadata for each data source';
COMMENT ON TABLE field_mappings IS 'Maps source-specific field names to normalized categories';
COMMENT ON TABLE deduplication_log IS 'Records when duplicate papers are found and merged';
COMMENT ON TABLE citation_history IS 'Tracks citation count changes over time for trending analysis';

COMMENT ON COLUMN papers.arxiv_id IS 'arXiv identifier for preprints (e.g., 2301.12345)';
COMMENT ON COLUMN papers.openalex_id IS 'OpenAlex work ID (e.g., W2741809807)';
COMMENT ON COLUMN papers.source_priority IS 'Higher priority sources override lower for conflicts (1=highest)';

-- ============================================
-- Verification Queries
-- ============================================

-- Run these after applying schema updates to verify:

-- 1. Check columns added:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'papers' AND column_name IN ('arxiv_id', 'openalex_id', 'source_priority');

-- 2. Check indexes created:
-- SELECT indexname FROM pg_indexes WHERE tablename = 'papers' AND indexname LIKE '%external%';

-- 3. Check source metadata:
-- SELECT * FROM source_metadata;

-- 4. Check field mappings:
-- SELECT source, COUNT(*) FROM field_mappings GROUP BY source;

-- ============================================
-- Future Source Priorities (Reference)
-- ============================================

/*
When adding new sources, use these priorities:

INSERT INTO source_metadata (source, display_name, priority, status) VALUES
('openalex', 'OpenAlex', 1, 'inactive'),     -- Most comprehensive metadata
('semantic_scholar', 'Semantic Scholar', 2, 'active'), -- Best citations
('arxiv', 'arXiv', 3, 'inactive'),           -- Best for preprints/PDFs
('pubmed', 'PubMed', 4, 'inactive'),         -- Medical papers
('crossref', 'Crossref', 5, 'inactive');     -- DOI registry, minimal metadata

Field Priority Rules:
- citation_count: semantic_scholar (most accurate)
- abstract: openalex (most complete)
- pdf_url: arxiv (direct access)
- fields_of_study: openalex (most detailed)
- venue: crossref (most authoritative)
*/
