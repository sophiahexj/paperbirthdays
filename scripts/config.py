"""
Configuration for multi-source paper ingestion
Defines priorities, field mappings, and source-specific settings
"""

# ============================================
# Source Priority Configuration
# ============================================

# Priority: 1 = highest (trusted most), 5 = lowest
# Used for conflict resolution when same paper exists in multiple sources
SOURCE_PRIORITY = {
    'openalex': 1,           # Most comprehensive, open metadata
    'semantic_scholar': 2,   # Best citation data and field classification
    'arxiv': 3,             # Best for preprints, direct PDF access
    'pubmed': 4,            # Medical/biology papers
    'crossref': 5,          # DOI registry, minimal metadata
}

# ============================================
# Field Priority by Source
# ============================================

# Which source to trust for specific fields when merging duplicates
FIELD_PRIORITY = {
    'citation_count': 'semantic_scholar',       # Most accurate citation tracking
    'influential_citation_count': 'semantic_scholar',
    'abstract': 'openalex',                     # Most complete abstracts
    'pdf_url': 'arxiv',                         # Direct PDF access
    'fields_of_study': 'openalex',             # Most detailed classification
    'venue': 'crossref',                        # Most authoritative venue names
    'doi': 'crossref',                          # DOI registry
    'is_open_access': 'openalex',              # Tracks OA status best
    'publication_date': 'crossref',            # Most precise dates
}

# ============================================
# Field Normalization Mapping
# ============================================

# Maps source-specific field names to unified categories
FIELD_MAPPING = {
    'Medicine': ['Medicine', 'Clinical Medicine', 'Health Sciences'],
    'Biology': ['Biology', 'Life Sciences', 'Molecular Biology', 'Genetics'],
    'Computer Science': ['Computer Science', 'Artificial Intelligence', 'Machine Learning'],
    'Physics': ['Physics', 'Astrophysics', 'Quantum Physics'],
    'Chemistry': ['Chemistry', 'Materials Science', 'Chemical Engineering'],
    'Mathematics': ['Mathematics', 'Statistics', 'Applied Mathematics'],
    'Psychology': ['Psychology', 'Cognitive Science', 'Neuroscience'],
    'Engineering': ['Engineering', 'Electrical Engineering', 'Mechanical Engineering'],
    'Environmental Science': ['Environmental Science', 'Geology', 'Geography', 'Earth Sciences'],
    'Political Science': ['Political Science', 'Sociology', 'Social Sciences'],
    'Economics': ['Economics', 'Business', 'Finance', 'Management'],
    'Art': ['Art', 'Music', 'Performing Arts'],
    'Philosophy': ['Philosophy', 'Ethics'],
    'History': ['History', 'Archaeology'],
}

# ============================================
# Citation Thresholds by Field
# ============================================

# Different fields have different citation cultures
# Use these for filtering "significant" papers
CITATION_THRESHOLDS = {
    'Medicine': 50,           # High citation rate
    'Biology': 30,
    'Computer Science': 20,   # Rapid citation accumulation
    'Physics': 25,
    'Chemistry': 25,
    'default': 10,            # Fallback threshold
}

# ============================================
# Source-Specific Settings
# ============================================

SEMANTIC_SCHOLAR_CONFIG = {
    'api_base': 'https://api.semanticscholar.org',
    'bulk_dataset_base': 'https://api.semanticscholar.org/datasets/v1/release',
    'rate_limit': 100,  # requests per 5 minutes
    'fields': [
        'title', 'abstract', 'authors', 'year', 'publicationDate',
        'citationCount', 'influentialCitationCount', 'fieldsOfStudy',
        'venue', 'doi', 'externalIds', 'url', 'isOpenAccess'
    ],
}

ARXIV_CONFIG = {
    'api_base': 'http://export.arxiv.org/api/query',
    'oai_base': 'http://export.arxiv.org/oai2',
    'pdf_base': 'https://arxiv.org/pdf',
    'categories': [
        'cs.AI', 'cs.LG', 'physics', 'math', 'q-bio',
        'econ', 'stat', 'astro-ph', 'cond-mat', 'hep-th'
    ],
}

OPENALEX_CONFIG = {
    'api_base': 'https://api.openalex.org',
    'rate_limit': None,  # Polite pool: no hard limit
    'email': 'your-email@example.com',  # Get into polite pool
    'fields': [
        'id', 'doi', 'title', 'publication_year', 'publication_date',
        'cited_by_count', 'biblio', 'primary_location', 'open_access',
        'authorships', 'concepts', 'topics'
    ],
}

# ============================================
# Deduplication Settings
# ============================================

DEDUPLICATION_CONFIG = {
    # Which external IDs to use for exact matching (in order of preference)
    'exact_match_fields': ['doi', 'arxiv_id', 'pubmed_id', 'openalex_id'],

    # Fuzzy matching thresholds for title similarity
    'title_similarity_threshold': 0.85,  # 85% similar = likely duplicate

    # Year difference tolerance for fuzzy matching
    'year_tolerance': 1,  # Match papers ±1 year

    # Actions for different match confidence levels
    'auto_merge_threshold': 0.95,   # >95% confidence: auto-merge
    'manual_review_threshold': 0.75, # 75-95%: flag for review
    'ignore_threshold': 0.75,        # <75%: ignore as false positive
}

# ============================================
# Incremental Update Settings
# ============================================

UPDATE_CONFIG = {
    # How often to run incremental updates
    'daily_update_schedule': '02:00',   # 2am daily
    'weekly_full_sync': 'Monday',       # Full sync once per week
    'monthly_citation_update': 1,       # 1st of month

    # How far back to check for new papers
    'lookback_days_daily': 7,           # Check last 7 days
    'lookback_days_weekly': 30,         # Check last month

    # Batch sizes for API requests
    'batch_size_semantic_scholar': 100,
    'batch_size_arxiv': 1000,
    'batch_size_openalex': 200,
}

# ============================================
# Data Quality Settings
# ============================================

QUALITY_CONFIG = {
    # Minimum requirements for including a paper
    'require_exact_date': True,         # Must have YYYY-MM-DD date
    'require_title': True,
    'min_citation_count': 10,           # Global minimum
    'max_author_count': 500,            # Flag papers with >500 authors

    # Validation rules
    'valid_year_range': (1900, 2030),
    'max_title_length': 500,
    'min_title_length': 5,

    # Fields that should not be null for high-quality papers
    'required_fields': ['title', 'year', 'publication_date'],
}

# ============================================
# Helper Functions
# ============================================

def get_source_priority(source: str) -> int:
    """Get priority for a source (lower number = higher priority)"""
    return SOURCE_PRIORITY.get(source, 999)

def get_field_trusted_source(field: str) -> str:
    """Get the most trusted source for a specific field"""
    return FIELD_PRIORITY.get(field, 'semantic_scholar')

def normalize_field(raw_field: str, source: str = None) -> str:
    """
    Normalize a field name to canonical category

    Args:
        raw_field: Original field name from source
        source: Data source (for source-specific mappings)

    Returns:
        Normalized field category or 'Other'
    """
    if not raw_field:
        return 'Other'

    raw_lower = raw_field.lower()

    for canonical, variations in FIELD_MAPPING.items():
        for variation in variations:
            if variation.lower() in raw_lower:
                return canonical

    return 'Other'

def get_citation_threshold(field: str) -> int:
    """Get minimum citation count for a field"""
    return CITATION_THRESHOLDS.get(field, CITATION_THRESHOLDS['default'])

def should_include_paper(paper_data: dict) -> tuple[bool, str]:
    """
    Check if paper meets quality requirements

    Returns:
        (include: bool, reason: str)
    """
    # Check required fields
    for field in QUALITY_CONFIG['required_fields']:
        if field not in paper_data or not paper_data[field]:
            return False, f"Missing required field: {field}"

    # Check year range
    year = paper_data.get('year')
    if year:
        min_year, max_year = QUALITY_CONFIG['valid_year_range']
        if year < min_year or year > max_year:
            return False, f"Year {year} out of range"

    # Check citation count
    citations = paper_data.get('citation_count', 0)
    field = paper_data.get('field', 'default')
    threshold = get_citation_threshold(field)
    if citations < threshold:
        return False, f"Citations {citations} below threshold {threshold}"

    # Check exact date if required
    if QUALITY_CONFIG['require_exact_date']:
        pub_date = paper_data.get('publication_date', '')
        if len(pub_date) != 10:  # Not YYYY-MM-DD format
            return False, "Missing exact publication date"

    return True, "OK"

# ============================================
# Usage Examples
# ============================================

if __name__ == '__main__':
    # Example: Check field normalization
    print("Field Normalization Examples:")
    print(f"  'Machine Learning' -> '{normalize_field('Machine Learning')}'")
    print(f"  'Clinical Medicine' -> '{normalize_field('Clinical Medicine')}'")

    # Example: Check paper quality
    sample_paper = {
        'title': 'Sample Paper',
        'year': 2020,
        'publication_date': '2020-01-15',
        'citation_count': 25,
        'field': 'Computer Science'
    }
    include, reason = should_include_paper(sample_paper)
    print(f"\nSample paper quality check: {include} - {reason}")

    # Example: Source priorities
    print("\nSource Priorities (1=highest):")
    for source, priority in sorted(SOURCE_PRIORITY.items(), key=lambda x: x[1]):
        print(f"  {priority}. {source}")
