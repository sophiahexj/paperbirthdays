import { getTodayMMDD, formatDateForDisplay } from '@/lib/dateUtils';
import { DailyPapers } from '@/types/paper';
import PaperBrowser from '@/components/PaperBrowser';
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

  const currentYear = new Date().getFullYear();

  return (
    <main className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="font-display text-[2.5rem] font-semibold mb-6 text-text-primary">
            🎂 Paper Birthdays
          </h1>
          <p className="font-body text-base uppercase tracking-[0.15em] text-accent mb-2">
            {todayFormatted}
          </p>
          <p className="font-body text-[2rem] font-light text-text-secondary mb-4">
            ✨ {currentYear} ✨
          </p>
          {data.total_papers > 0 ? (
            <p className="text-sm text-text-muted">
              {data.total_papers} {data.total_papers === 1 ? 'paper shares' : 'papers share'} this birthday
            </p>
          ) : (
            <p className="text-sm text-text-muted">
              No papers found for today. Run the data ingestion script!
            </p>
          )}
        </header>

        {data.total_papers > 0 ? (
          <PaperBrowser
            papers={data.papers}
            allFields={Array.from(new Set(data.papers.map(p => p.field))).sort()}
          />
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
