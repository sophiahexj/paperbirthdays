import { formatDateForDisplay } from '@/lib/dateUtils';
import { Paper } from '@/types/paper';
import PaperCard from '@/components/PaperCard';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { generatePaperSlug } from '@/lib/slugUtils';
import { getPapersForDate } from '@/lib/database';
import ShareButtons from '@/components/ShareButtons';

export const revalidate = 3600; // Revalidate every hour

interface PageProps {
  params: Promise<{
    date: string;
    slug: string;
  }>;
}

// Parse URLs like "dec-25"
function parseDateSlug(slug: string): { month: number; day: number } | null {
  const parts = slug.toLowerCase().split('-');
  if (parts.length !== 2) return null;

  const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const monthIndex = monthNames.indexOf(parts[0]);
  if (monthIndex === -1) return null;

  const day = parseInt(parts[1]);
  if (isNaN(day) || day < 1 || day > 31) return null;

  return { month: monthIndex + 1, day };
}

// Find paper matching the slug
function findPaperBySlug(papers: Paper[], targetSlug: string): Paper | null {
  for (const paper of papers) {
    const paperSlug = generatePaperSlug(paper);
    if (paperSlug === targetSlug) {
      return paper;
    }
  }
  return null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { date, slug } = await params;
  const parsed = parseDateSlug(date);

  if (!parsed) {
    return {
      title: 'Paper Birthdays',
    };
  }

  const monthDay = `${String(parsed.month).padStart(2, '0')}-${String(parsed.day).padStart(2, '0')}`;

  try {
    const papers = await getPapersForDate(monthDay);
    const paper = findPaperBySlug(papers, slug);

    if (!paper) {
      return {
        title: 'Paper Not Found | Paper Birthdays',
      };
    }

    const formattedDate = formatDateForDisplay(monthDay);

    return {
      title: `${paper.title} | Paper Birthdays`,
      description: `Published on ${formattedDate}, ${paper.year} • ${paper.citation_count.toLocaleString()} citations • ${paper.author_count} authors`,
      openGraph: {
        title: paper.title,
        description: `🎂 This groundbreaking paper was published on ${formattedDate}, ${paper.year}`,
        images: [{
          url: `/api/og?title=${encodeURIComponent(paper.title)}&date=${encodeURIComponent(formattedDate + ', ' + paper.year)}&citations=${paper.citation_count}&field=${encodeURIComponent(paper.field)}`,
          width: 1200,
          height: 630,
        }],
      },
      twitter: {
        card: 'summary_large_image',
        title: paper.title,
        description: `🎂 Published on ${formattedDate}, ${paper.year} • ${paper.citation_count.toLocaleString()} citations`,
      },
    };
  } catch (error) {
    return {
      title: 'Paper Birthdays',
      description: 'Celebrating papers published on today\'s date',
    };
  }
}

export default async function PaperPage({ params }: PageProps) {
  const { date, slug } = await params;
  const parsed = parseDateSlug(date);

  if (!parsed) {
    notFound();
  }

  const monthDay = `${String(parsed.month).padStart(2, '0')}-${String(parsed.day).padStart(2, '0')}`;
  const formattedDate = formatDateForDisplay(monthDay);

  // Fetch papers from database
  let papers: Paper[];

  try {
    papers = await getPapersForDate(monthDay);
  } catch (error) {
    console.error(`Error fetching papers for ${monthDay}`, error);
    notFound();
  }

  // Find the specific paper matching this slug
  const paper = findPaperBySlug(papers, slug);

  if (!paper) {
    notFound();
  }

  // Calculate paper age
  const currentYear = new Date().getFullYear();
  const paperAge = currentYear - paper.year;

  // Build share URL
  const shareUrl = `https://happybdaypaper.com/${date}/${slug}`;
  const shareText = `This Paper Turns ${paperAge} Today! 🎂 "${paper.title}" - Come celebrate!`;

  return (
    <main className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Navigation */}
        <div className="mb-8 flex justify-between items-center">
          <Link
            href="/"
            className="font-body text-accent hover:text-accent-hover font-medium inline-flex items-center gap-2"
          >
            ← Back to today
          </Link>
          <Link
            href={`/${date}`}
            className="font-body text-accent hover:text-accent-hover font-medium inline-flex items-center gap-2"
          >
            See all papers from this date →
          </Link>
        </div>

        <header className="text-center mb-8">
          <h1 className="font-display text-4xl sm:text-5xl font-semibold mb-3 text-text-primary">
            🎂 This Paper Turns {paperAge} Today!
          </h1>
          <p className="font-body text-lg text-text-secondary mb-2">
            Join the Birthday Celebration!
          </p>
          <p className="font-body text-sm text-text-muted">
            Someone thought you&apos;d enjoy celebrating this paper!
          </p>
          <p className="font-body text-base uppercase tracking-[0.15em] text-accent mt-4">
            Published {formattedDate}, {paper.year}
          </p>
        </header>

        {/* Paper Card */}
        <PaperCard paper={paper} />

        {/* Subscribe CTA */}
        <div className="mt-8 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200/60 rounded-2xl p-6 text-center">
          <h3 className="font-display text-xl font-semibold text-text-primary mb-2">
            Never Miss This Paper&apos;s Birthday Again!
          </h3>
          <p className="font-body text-sm text-text-secondary mb-4">
            Get an annual reminder to celebrate this paper&apos;s publication anniversary
          </p>
          <Link
            href="/#subscribe"
            className="inline-block px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent-hover transition-all duration-150 font-medium"
          >
            Subscribe to Birthday Reminders
          </Link>
        </div>

        {/* Social Sharing */}
        <ShareButtons url={shareUrl} text={shareText} />

        {/* Explore more link */}
        <div className="text-center mt-12">
          <Link
            href={`/${date}`}
            className="inline-block px-6 py-3 border-2 border-accent text-accent rounded-lg hover:bg-accent-light transition-all duration-150 font-medium"
          >
            Explore More Papers from {formattedDate}
          </Link>
        </div>
      </div>
    </main>
  );
}
