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
      AND venue IS NOT NULL
      AND venue != 'Unknown Venue'
      AND TRIM(venue) != ''
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

/**
 * Search papers by title or author (for subscription feature)
 */
export async function searchPapers(query: string, limit: number = 20): Promise<Paper[]> {
  const db = getPool();

  // Search in title only (we don't have author names in current schema)
  const result = await db.query(`
    SELECT
      paper_id, title, author_count, year, citation_count,
      fields_of_study, subfield, venue, url, publication_month_day
    FROM papers
    WHERE title ILIKE $1
      AND venue IS NOT NULL
      AND venue != 'Unknown Venue'
      AND TRIM(venue) != ''
    ORDER BY citation_count DESC
    LIMIT $2
  `, [`%${query}%`, limit]);

  return result.rows.map(row => ({
    id: row.paper_id,
    title: row.title,
    author_count: row.author_count,
    year: row.year,
    citation_count: row.citation_count,
    field: normalizeField(row.fields_of_study),
    subfield: row.subfield,
    venue: row.venue || 'Unknown Venue',
    url: row.url || 'https://example.com',
    publication_month_day: row.publication_month_day
  }));
}

/**
 * Get paper details by paper_id (for subscription confirmation)
 */
export async function getPaperById(paperId: string): Promise<Paper | null> {
  const db = getPool();

  const result = await db.query(`
    SELECT
      paper_id, title, author_count, year, citation_count,
      fields_of_study, subfield, venue, url, publication_month_day
    FROM papers
    WHERE paper_id = $1
  `, [paperId]);

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.paper_id,
    title: row.title,
    author_count: row.author_count,
    year: row.year,
    citation_count: row.citation_count,
    field: normalizeField(row.fields_of_study),
    subfield: row.subfield,
    venue: row.venue || 'Unknown Venue',
    url: row.url || 'https://example.com',
    publication_month_day: row.publication_month_day
  };
}

/**
 * Create a new paper birthday subscription
 */
export async function createSubscription(
  email: string,
  paperId: string,
  paperTitle: string,
  publicationMonthDay: string,
  verificationToken: string,
  unsubscribeToken: string
): Promise<{ success: boolean; error?: string }> {
  const db = getPool();

  try {
    // Check if subscription already exists
    const existing = await db.query(
      'SELECT id, verified FROM paper_birthday_subscriptions WHERE email = $1 AND paper_id = $2',
      [email, paperId]
    );

    if (existing.rows.length > 0) {
      if (existing.rows[0].verified) {
        return { success: false, error: 'You are already subscribed to this paper' };
      } else {
        return { success: false, error: 'A verification email has already been sent. Please check your inbox.' };
      }
    }

    // Check subscription limit (max 5 per email)
    const count = await db.query(
      'SELECT COUNT(*) as count FROM paper_birthday_subscriptions WHERE email = $1',
      [email]
    );

    if (parseInt(count.rows[0].count) >= 5) {
      return { success: false, error: 'Maximum 5 subscriptions per email address' };
    }

    // Create subscription
    await db.query(`
      INSERT INTO paper_birthday_subscriptions
        (email, paper_id, paper_title, publication_month_day, verification_token, unsubscribe_token)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [email, paperId, paperTitle, publicationMonthDay, verificationToken, unsubscribeToken]);

    return { success: true };
  } catch (error) {
    console.error('Error creating subscription:', error);
    return { success: false, error: 'Database error' };
  }
}

/**
 * Verify email subscription
 */
export async function verifySubscription(token: string): Promise<{ success: boolean; error?: string }> {
  const db = getPool();

  try {
    const result = await db.query(
      'SELECT id, verified FROM paper_birthday_subscriptions WHERE verification_token = $1',
      [token]
    );

    if (result.rows.length === 0) {
      return { success: false, error: 'Invalid verification token' };
    }

    if (result.rows[0].verified) {
      return { success: false, error: 'Email already verified' };
    }

    await db.query(
      'UPDATE paper_birthday_subscriptions SET verified = TRUE, verified_at = NOW() WHERE verification_token = $1',
      [token]
    );

    return { success: true };
  } catch (error) {
    console.error('Error verifying subscription:', error);
    return { success: false, error: 'Database error' };
  }
}

/**
 * Unsubscribe from paper birthday emails
 */
export async function unsubscribeEmail(token: string): Promise<{ success: boolean; error?: string }> {
  const db = getPool();

  try {
    const result = await db.query(
      'SELECT id, unsubscribed FROM paper_birthday_subscriptions WHERE unsubscribe_token = $1',
      [token]
    );

    if (result.rows.length === 0) {
      return { success: false, error: 'Invalid unsubscribe token' };
    }

    if (result.rows[0].unsubscribed) {
      return { success: false, error: 'Already unsubscribed' };
    }

    await db.query(
      'UPDATE paper_birthday_subscriptions SET unsubscribed = TRUE, unsubscribed_at = NOW() WHERE unsubscribe_token = $1',
      [token]
    );

    return { success: true };
  } catch (error) {
    console.error('Error unsubscribing:', error);
    return { success: false, error: 'Database error' };
  }
}

/**
 * Get all subscriptions for an email (for management page)
 */
export async function getSubscriptionsByEmail(email: string) {
  const db = getPool();

  const result = await db.query(`
    SELECT
      id, paper_id, paper_title, publication_month_day,
      verified, unsubscribed, created_at, unsubscribe_token
    FROM paper_birthday_subscriptions
    WHERE email = $1
    ORDER BY created_at DESC
  `, [email]);

  return result.rows;
}

/**
 * Get subscriptions to send birthday emails for today
 */
export async function getTodayBirthdaySubscriptions(monthDay: string, currentYear: number) {
  const db = getPool();

  const result = await db.query(`
    SELECT
      s.id, s.email, s.paper_id, s.paper_title,
      s.publication_month_day, s.unsubscribe_token,
      p.year, p.citation_count, p.url, p.venue, p.fields_of_study
    FROM paper_birthday_subscriptions s
    JOIN papers p ON s.paper_id = p.paper_id
    WHERE s.publication_month_day = $1
      AND s.verified = TRUE
      AND s.unsubscribed = FALSE
      AND (s.last_sent_year IS NULL OR s.last_sent_year < $2)
  `, [monthDay, currentYear]);

  return result.rows;
}

/**
 * Mark subscription as sent for this year
 */
export async function markSubscriptionSent(subscriptionId: number, year: number) {
  const db = getPool();

  await db.query(
    'UPDATE paper_birthday_subscriptions SET last_sent_year = $1 WHERE id = $2',
    [year, subscriptionId]
  );
}
