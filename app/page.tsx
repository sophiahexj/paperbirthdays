import { getTodayMMDD, formatDateForDisplay } from '@/lib/dateUtils';
import { DailyPapers } from '@/types/paper';
import PaperBrowser from '@/components/PaperBrowser';
import FieldNavigation from '@/components/FieldNavigation';
import { promises as fs } from 'fs';
import path from 'path';

export const revalidate = 3600; // Revalidate every hour

export default async function Home() {
  const today = getTodayMMDD();
  const todayFormatted = formatDateForDisplay(today);

  // Fetch data from local JSON file
  const filePath = path.join(process.cwd(), 'public', 'data', `${today}.json`);

  let data: DailyPapers;

  try {
    const fileContents = await fs.readFile(filePath, 'utf8');
    data = JSON.parse(fileContents);
  } catch (error) {
    // Fallback if today's file doesn't exist yet
    console.error(`No data file found for ${today}`, error);
    data = {
      date: today,
      total_papers: 0,
      papers: [],
    };
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-2 text-gray-900">
            Paper Birthdays
          </h1>
          <p className="text-xl text-gray-600">
            Celebrating papers published on <span className="font-semibold">{todayFormatted}</span>
          </p>
          {data.total_papers > 0 ? (
            <p className="text-sm text-gray-500 mt-2">
              {data.total_papers} papers • Refresh for a new one
            </p>
          ) : (
            <p className="text-sm text-gray-500 mt-2">
              No papers found for today. Run the data ingestion script!
            </p>
          )}
        </header>

        {data.total_papers > 0 ? (
          <>
            <FieldNavigation
              fields={Array.from(new Set(data.papers.map(p => p.field))).sort()}
            />
            <PaperBrowser papers={data.papers} />
          </>
        ) : (
          <div className="max-w-2xl mx-auto p-8 bg-white rounded-lg shadow-lg text-center">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Getting Started</h2>
            <p className="text-gray-600 mb-4">
              To see papers, you need to:
            </p>
            <ol className="text-left text-gray-700 space-y-2 mb-6">
              <li>1. Set up your database (see db/schema.sql)</li>
              <li>2. Run the ingestion script (python scripts/ingest_papers.py)</li>
              <li>3. Generate JSON files (python scripts/generate_json.py)</li>
            </ol>
            <p className="text-sm text-gray-500">
              Check the README for detailed instructions
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
