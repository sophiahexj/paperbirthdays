import { getTodayMMDD, formatDateForDisplay } from '@/lib/dateUtils';
import { DailyPapers, Paper } from '@/types/paper';
import PaperCard from '@/components/PaperCard';
import { promises as fs } from 'fs';
import path from 'path';
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
  const filePath = path.join(process.cwd(), 'public', 'data', `${monthDay}.json`);

  try {
    const fileContents = await fs.readFile(filePath, 'utf8');
    const data: DailyPapers = JSON.parse(fileContents);

    // Filter by year if specified
    let papers = data.papers;
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

  // Fetch data from local JSON file
  const filePath = path.join(process.cwd(), 'public', 'data', `${monthDay}.json`);

  let data: DailyPapers;

  try {
    const fileContents = await fs.readFile(filePath, 'utf8');
    data = JSON.parse(fileContents);
  } catch (error) {
    notFound();
  }

  // Filter by year if specified
  let papers = data.papers;
  if (parsed.year) {
    papers = papers.filter(p => p.year === parsed.year);
  }

  if (papers.length === 0) {
    notFound();
  }

  // Show a random paper from the filtered set
  const randomPaper = papers[Math.floor(Math.random() * papers.length)];

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Navigation */}
        <div className="mb-8">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-2"
          >
            ← Back to today
          </Link>
        </div>

        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-2 text-gray-900">
            Paper Birthday 🎂
          </h1>
          <p className="text-xl text-gray-600">
            Published on <span className="font-semibold">{formattedDate}{yearText}</span>
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {papers.length} {papers.length === 1 ? 'paper' : 'papers'} celebrating this birthday
          </p>
        </header>

        {/* Paper Card */}
        <PaperCard paper={randomPaper} />

        {/* More papers link */}
        {papers.length > 1 && (
          <div className="text-center mt-8">
            <Link
              href={`/?date=${monthDay}`}
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              See All {papers.length} Papers from This Birthday
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
