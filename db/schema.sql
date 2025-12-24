-- Paper Birthdays Database Schema
-- PostgreSQL

-- Main papers table
CREATE TABLE IF NOT EXISTS papers (
    id SERIAL PRIMARY KEY,
    paper_id VARCHAR(255) UNIQUE NOT NULL,
    source VARCHAR(50) NOT NULL, -- 'semantic_scholar', 'openalex', 'arxiv'

    -- Core metadata
    title TEXT NOT NULL,
    abstract TEXT,
    authors TEXT[], -- Array: ['Jane Doe', 'John Smith']
    author_count INTEGER NOT NULL,

    -- Publication info
    publication_date DATE NOT NULL,
    publication_month_day VARCHAR(5) NOT NULL, -- MM-DD format for fast filtering
    year INTEGER NOT NULL, -- Separate year field for filtering (oldest paper, etc.)
    venue TEXT,
    venue_type VARCHAR(50), -- 'journal', 'conference', 'preprint'

    -- Classification
    field VARCHAR(100),
    subfield VARCHAR(100),
    fields_of_study TEXT[], -- Multiple fields possible

    -- Impact metrics
    citation_count INTEGER DEFAULT 0,
    influential_citation_count INTEGER DEFAULT 0,
    reference_count INTEGER DEFAULT 0,

    -- Links
    doi VARCHAR(255),
    url TEXT,
    pdf_url TEXT,

    -- Metadata
    is_open_access BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_citation_update DATE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_month_day ON papers(publication_month_day);
CREATE INDEX IF NOT EXISTS idx_field ON papers(field);
CREATE INDEX IF NOT EXISTS idx_citation_count ON papers(citation_count DESC);
CREATE INDEX IF NOT EXISTS idx_year ON papers(year);
CREATE INDEX IF NOT EXISTS idx_source ON papers(source);
CREATE INDEX IF NOT EXISTS idx_year_citation ON papers(year, citation_count DESC); -- For "oldest highly-cited papers"

-- Prevent duplicates across sources
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_doi ON papers(doi) WHERE doi IS NOT NULL;

-- Tracking table for ingestion jobs
CREATE TABLE IF NOT EXISTS ingestion_logs (
    id SERIAL PRIMARY KEY,
    run_date DATE NOT NULL,
    month_day VARCHAR(5) NOT NULL,
    source VARCHAR(50) NOT NULL,
    papers_fetched INTEGER,
    papers_new INTEGER,
    papers_updated INTEGER,
    papers_skipped INTEGER,
    status VARCHAR(50), -- 'success', 'partial', 'failed'
    error_message TEXT,
    duration_seconds INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Store failed fetches for retry
CREATE TABLE IF NOT EXISTS failed_fetches (
    id SERIAL PRIMARY KEY,
    paper_id VARCHAR(255),
    source VARCHAR(50),
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE papers IS 'Main table storing academic papers published on each day of the year';
COMMENT ON COLUMN papers.publication_month_day IS 'MM-DD format for fast date filtering (01-01 to 12-31)';
COMMENT ON COLUMN papers.year IS 'Separate year field enables filtering by decade, oldest papers, etc.';
COMMENT ON COLUMN papers.citation_count IS 'Total citations - updated periodically';
COMMENT ON TABLE ingestion_logs IS 'Tracks data ingestion runs for debugging and monitoring';
