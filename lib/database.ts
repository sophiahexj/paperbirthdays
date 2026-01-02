import { Pool } from 'pg';
import { Paper } from '@/types/paper';

// Create a connection pool
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
  }
  return pool;
}

/**
 * Fetch papers for a specific MM-DD date
 */
export async function getPapersForDate(monthDay: string): Promise<Paper[]> {
  const db = getPool();

  const result = await db.query(`
    SELECT
      paper_id, title, author_count, year, citation_count,
      fields_of_study, subfield, venue, url
    FROM papers
    WHERE publication_month_day = $1
    ORDER BY citation_count DESC
  `, [monthDay]);

  return result.rows.map(row => ({
    id: row.paper_id,
    title: row.title,
    author_count: row.author_count,
    year: row.year,
    citation_count: row.citation_count,
    field: normalizeField(row.fields_of_study),
    subfield: row.subfield,
    venue: row.venue || 'Unknown Venue',
    url: row.url || 'https://example.com'
  }));
}

/**
 * Get total count of papers in database
 */
export async function getTotalPaperCount(): Promise<number> {
  const db = getPool();
  const result = await db.query('SELECT COUNT(*) as count FROM papers');
  return parseInt(result.rows[0].count);
}

/**
 * Get field distribution across all papers
 */
export async function getFieldDistribution(): Promise<Record<string, number>> {
  const db = getPool();
  const result = await db.query(`
    SELECT field, COUNT(*) as count
    FROM papers
    GROUP BY field
    ORDER BY count DESC
  `);

  const distribution: Record<string, number> = {};
  for (const row of result.rows) {
    if (row.field) {
      distribution[row.field] = parseInt(row.count);
    }
  }
  return distribution;
}

/**
 * Map primary field to canonical category (uses FIRST field only)
 */
function normalizeField(fieldsOfStudy: string[] | null): string {
  if (!fieldsOfStudy || fieldsOfStudy.length === 0) {
    return 'Other';
  }

  const fieldMapping: Record<string, string[]> = {
    'Medicine': ['Medicine'],
    'Biology': ['Biology'],
    'Computer Science': ['Computer Science'],
    'Economics': ['Economics', 'Business'],
    'Physics': ['Physics'],
    'Mathematics': ['Mathematics'],
    'Psychology': ['Psychology'],
    'Engineering': ['Engineering'],
    'Chemistry': ['Chemistry', 'Materials Science'],
    'Environmental Science': ['Environmental Science', 'Geology', 'Geography'],
    'Political Science': ['Political Science', 'Sociology'],
    'Art': ['Art'],
    'Philosophy': ['Philosophy'],
    'History': ['History'],
  };

  // Use the FIRST field (primary field) to prevent misclassification
  const primaryField = fieldsOfStudy[0];
  const fieldName = String(primaryField);

  for (const [category, keywords] of Object.entries(fieldMapping)) {
    for (const keyword of keywords) {
      if (fieldName.toLowerCase().includes(keyword.toLowerCase())) {
        return category;
      }
    }
  }

  return 'Other';
}
