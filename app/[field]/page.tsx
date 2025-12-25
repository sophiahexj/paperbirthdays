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
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Navigation */}
        <div className="mb-8">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-2"
          >
            ← Back to all fields
          </Link>
        </div>

        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-2 text-gray-900">
            {capitalizedFieldName} Papers
          </h1>
          <p className="text-xl text-gray-600">
            Published on <span className="font-semibold">{todayFormatted}</span>
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {fieldPapers.length} {fieldPapers.length === 1 ? 'paper' : 'papers'} in{' '}
            {capitalizedFieldName}
          </p>
        </header>

        {/* Field Navigation */}
        {availableFields.length > 1 && (
          <div className="mb-8 p-4 bg-white rounded-lg shadow-md">
            <p className="text-sm font-medium text-gray-700 mb-3">Browse other fields:</p>
            <div className="flex flex-wrap gap-2">
              {availableFields.map((field) => (
                <a
                  key={field}
                  href={`/${encodeURIComponent(field.toLowerCase())}`}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                    field.toLowerCase() === fieldName.toLowerCase()
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
          <div className="max-w-2xl mx-auto p-8 bg-white rounded-lg shadow-lg text-center">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">No Papers Found</h2>
            <p className="text-gray-600 mb-6">
              No {capitalizedFieldName} papers found for {todayFormatted}.
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              View All Papers
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
