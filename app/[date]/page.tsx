import { getTodayMMDD, formatDateForDisplay } from '@/lib/dateUtils';
import { Paper } from '@/types/paper';
import PaperCard from '@/components/PaperCard';
import { getPapersForDate } from '@/lib/database';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';

export const revalidate = 3600; // Revalidate every hour

interface PageProps {
  params: Promise<{
    date: string;
  }>;
}

// Parse URLs like "dec-25-2024" or "dec-25"
function parseDateSlug(slug: string): { month: number; day: number; year?: number } | null {
  const parts = slug.toLowerCase().split('-');
  if (parts.length < 2) return null;

  const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const monthIndex = monthNames.indexOf(parts[0]);
  if (monthIndex === -1) return null;

  const day = parseInt(parts[1]);
  if (isNaN(day) || day < 1 || day > 31) return null;

  let year: number | undefined;
  if (parts.length === 3) {
    year = parseInt(parts[2]);
    if (isNaN(year) || year < 1900 || year > 2100) return null;
  }

  return { month: monthIndex + 1, day, year };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { date } = await params;
  const parsed = parseDateSlug(date);

  if (!parsed) {
    return {
      title: 'Paper Birthdays',
    };
  }

  const monthDay = `${String(parsed.month).padStart(2, '0')}-${String(parsed.day).padStart(2, '0')}`;

  try {
    // Fetch papers from database
    let papers = await getPapersForDate(monthDay);

    // Filter by year if specified
    if (parsed.year) {
      papers = papers.filter(p => p.year === parsed.year);
    }

    const randomPaper = papers.length > 0 ? papers[Math.floor(Math.random() * papers.length)] : null;
    const formattedDate = formatDateForDisplay(monthDay);
    const yearText = parsed.year ? ` ${parsed.year}` : '';

    if (randomPaper) {
      return {
        title: `${randomPaper.title} | Paper Birthdays`,
        description: `Published on ${formattedDate}${yearText} • ${randomPaper.citation_count.toLocaleString()} citations • ${randomPaper.author_count} authors`,
        openGraph: {
          title: randomPaper.title,
          description: `🎂 This groundbreaking paper was published on ${formattedDate}${yearText}`,
          images: [{
            url: `/api/og?title=${encodeURIComponent(randomPaper.title)}&date=${encodeURIComponent(formattedDate + yearText)}&citations=${randomPaper.citation_count}&field=${encodeURIComponent(randomPaper.field)}`,
            width: 1200,
            height: 630,
          }],
        },
        twitter: {
          card: 'summary_large_image',
          title: randomPaper.title,
          description: `🎂 Published on ${formattedDate}${yearText} • ${randomPaper.citation_count.toLocaleString()} citations`,
        },
      };
    }

    return {
      title: `Papers from ${formattedDate}${yearText} | Paper Birthdays`,
      description: `Discover academic papers published on ${formattedDate}${yearText}`,
    };
  } catch (error) {
    return {
      title: 'Paper Birthdays',
      description: 'Celebrating papers published on today\'s date',
    };
  }
}

export default async function DatePage({ params }: PageProps) {
  const { date } = await params;
  const parsed = parseDateSlug(date);

  if (!parsed) {
    notFound();
  }

  const monthDay = `${String(parsed.month).padStart(2, '0')}-${String(parsed.day).padStart(2, '0')}`;
  const formattedDate = formatDateForDisplay(monthDay);
  const yearText = parsed.year ? ` ${parsed.year}` : '';

  // Fetch papers from database
  let papers: Paper[];

  try {
    papers = await getPapersForDate(monthDay);
  } catch (error) {
    notFound();
  }

  // Filter by year if specified
  if (parsed.year) {
    papers = papers.filter(p => p.year === parsed.year);
  }

  if (papers.length === 0) {
    notFound();
  }

  // Show a random paper from the filtered set
  const randomPaper = papers[Math.floor(Math.random() * papers.length)];

  return (
    <main className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Navigation */}
        <div className="mb-8">
          <Link
            href="/"
            className="font-body text-accent hover:text-accent-hover font-medium inline-flex items-center gap-2"
          >
            ← Back to today
          </Link>
        </div>

        <header className="text-center mb-12">
          <h1 className="font-display text-5xl font-semibold mb-2 text-text-primary">
            🎂 Paper Birthday
          </h1>
          <p className="font-body text-base uppercase tracking-[0.15em] text-accent mb-2">
            {formattedDate}{yearText}
          </p>
          <p className="font-body text-sm text-text-muted mt-2">
            {papers.length} {papers.length === 1 ? 'paper celebrates' : 'papers celebrate'} this birthday
          </p>
        </header>

        {/* Paper Card */}
        <PaperCard paper={randomPaper} />

        {/* More papers link */}
        {papers.length > 1 && (
          <div className="text-center mt-8">
            <Link
              href={`/?date=${monthDay}`}
              className="inline-block px-6 py-3 border-2 border-accent text-accent rounded-lg hover:bg-accent-light transition-all duration-150 font-medium"
            >
              See All {papers.length} Papers from This Birthday
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
