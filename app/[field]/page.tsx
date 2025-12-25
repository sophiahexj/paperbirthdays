import { getTodayMMDD, formatDateForDisplay } from '@/lib/dateUtils';
import { DailyPapers } from '@/types/paper';
import PaperBrowser from '@/components/PaperBrowser';
import { promises as fs } from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export const revalidate = 3600; // Revalidate every hour

interface PageProps {
  params: Promise<{
    field: string;
  }>;
}

export default async function FieldPage({ params }: PageProps) {
  const today = getTodayMMDD();
  const todayFormatted = formatDateForDisplay(today);
  const { field } = await params;
  const fieldName = decodeURIComponent(field);

  // Capitalize field name properly (e.g., "environmental science" -> "Environmental Science")
  const capitalizedFieldName = fieldName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Fetch data from local JSON file
  const filePath = path.join(process.cwd(), 'public', 'data', `${today}.json`);

  let data: DailyPapers;

  try {
    const fileContents = await fs.readFile(filePath, 'utf8');
    data = JSON.parse(fileContents);
  } catch (error) {
    console.error(`No data file found for ${today}`, error);
    data = {
      date: today,
      total_papers: 0,
      papers: [],
    };
  }

  // Filter papers by field
  const fieldPapers = data.papers.filter(
    (p) => p.field.toLowerCase() === fieldName.toLowerCase()
  );

  if (fieldPapers.length === 0 && data.total_papers > 0) {
    notFound();
  }

  // Get all available fields for navigation
  const availableFields = Array.from(new Set(data.papers.map(p => p.field))).sort();

  return (
    <main className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Navigation */}
        <div className="mb-8">
          <Link
            href="/"
            className="font-body text-accent hover:text-accent-hover font-medium inline-flex items-center gap-2"
          >
            ← Back to all fields
          </Link>
        </div>

        <header className="text-center mb-12">
          <h1 className="font-display text-5xl font-semibold mb-2 text-text-primary">
            {capitalizedFieldName} Papers
          </h1>
          <p className="font-body text-base uppercase tracking-[0.15em] text-accent mb-2">
            {todayFormatted}
          </p>
          <p className="font-body text-sm text-text-muted mt-2">
            {fieldPapers.length} {fieldPapers.length === 1 ? 'paper' : 'papers'} in{' '}
            {capitalizedFieldName}
          </p>
        </header>

        {/* Field Navigation */}
        {availableFields.length > 1 && (
          <div className="mb-8">
            <p className="font-body text-xs text-text-muted mb-3 text-center">Browse other fields:</p>
            <div className="flex flex-wrap gap-3 justify-center">
              {availableFields.map((field) => (
                <a
                  key={field}
                  href={`/${encodeURIComponent(field.toLowerCase())}`}
                  className={`font-body text-sm transition ${
                    field.toLowerCase() === fieldName.toLowerCase()
                      ? 'text-accent font-medium underline'
                      : 'text-text-muted hover:text-accent'
                  }`}
                >
                  {field}
                </a>
              ))}
            </div>
          </div>
        )}

        {fieldPapers.length > 0 ? (
          <PaperBrowser papers={fieldPapers} />
        ) : (
          <div className="max-w-2xl mx-auto p-8 bg-surface rounded-2xl border border-border text-center">
            <h2 className="font-display text-2xl font-semibold mb-4 text-text-primary">No Papers Found</h2>
            <p className="font-body text-text-secondary mb-6">
              No {capitalizedFieldName} papers found for {todayFormatted}.
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent-hover transition font-medium"
            >
              View All Papers
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
