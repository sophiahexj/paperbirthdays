import { getTodayMMDD, formatDateForDisplay } from '@/lib/dateUtils';
import PaperBrowser from '@/components/PaperBrowser';
import { getPapersForDate } from '@/lib/database';
import { Paper } from '@/types/paper';
import ConfettiAnimation from '@/components/ConfettiAnimation';

export const revalidate = 3600; // Revalidate every hour

export default async function Home() {
  const today = getTodayMMDD();
  const todayFormatted = formatDateForDisplay(today);

  // Fetch papers from database
  let papers: Paper[];

  try {
    papers = await getPapersForDate(today);
  } catch (error) {
    // Fallback if database query fails
    console.error(`Error fetching papers for ${today}`, error);
    papers = [];
  }

  const currentYear = new Date().getFullYear();

  return (
    <main className="min-h-screen bg-background py-6 sm:py-12 px-4">
      <ConfettiAnimation />
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8 sm:mb-12">
          <h1 className="font-display text-2xl sm:text-3xl md:text-[2.5rem] font-semibold mb-4 sm:mb-6 text-text-primary">
            🎂 Happy Birthday, Paper! 🎂
          </h1>
          <p className="font-body text-base sm:text-lg text-text-secondary mb-4">
            Celebrating papers published on this day in history ✨
          </p>
          <p className="font-body text-sm sm:text-base uppercase tracking-[0.15em] text-accent mb-4">
            {todayFormatted}
          </p>
          {papers.length > 0 ? (
            <p className="text-sm text-text-muted">
              {papers.length} {papers.length === 1 ? 'paper shares' : 'papers share'} this birthday
            </p>
          ) : (
            <p className="text-sm text-text-muted">
              No papers found for today. Run the data ingestion script!
            </p>
          )}
        </header>

        {papers.length > 0 ? (
          <PaperBrowser
            papers={papers}
            allFields={Array.from(new Set(papers.map(p => p.field))).sort()}
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
