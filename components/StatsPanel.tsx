import { Paper } from '@/types/paper';

interface StatsPanelProps {
  papers: Paper[];
}

export default function StatsPanel({ papers }: StatsPanelProps) {
  if (papers.length === 0) {
    return null;
  }

  // Calculate statistics
  const totalPapers = papers.length;
  const yearRange = [
    Math.min(...papers.map((p) => p.year)),
    Math.max(...papers.map((p) => p.year)),
  ];
  const avgCitations = Math.round(
    papers.reduce((sum, p) => sum + p.citation_count, 0) / papers.length
  );
  const mostCited = papers.reduce((max, p) =>
    p.citation_count > max.citation_count ? p : max
  );
  const oldest = papers.reduce((old, p) => (p.year < old.year ? p : old));

  // Field distribution
  const fieldCounts: Record<string, number> = {};
  papers.forEach((p) => {
    fieldCounts[p.field] = (fieldCounts[p.field] || 0) + 1;
  });
  const topFields = Object.entries(fieldCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Statistics</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="text-2xl font-bold text-blue-600">{totalPapers}</div>
          <div className="text-sm text-gray-600">Total Papers</div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="text-2xl font-bold text-purple-600">
            {yearRange[0]}-{yearRange[1]}
          </div>
          <div className="text-sm text-gray-600">Year Range</div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="text-2xl font-bold text-green-600">
            {avgCitations.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">Avg Citations</div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="text-2xl font-bold text-orange-600">{topFields.length}</div>
          <div className="text-sm text-gray-600">Fields</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Most Cited */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-2">Most Cited</h3>
          <p className="text-sm text-gray-700 line-clamp-2">{mostCited.title}</p>
          <p className="text-xs text-gray-500 mt-1">
            {mostCited.citation_count.toLocaleString()} citations • {mostCited.year}
          </p>
        </div>

        {/* Oldest */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-2">Oldest Paper</h3>
          <p className="text-sm text-gray-700 line-clamp-2">{oldest.title}</p>
          <p className="text-xs text-gray-500 mt-1">
            {oldest.year} • {oldest.citation_count.toLocaleString()} citations
          </p>
        </div>
      </div>

      {/* Field Distribution */}
      <div className="mt-4 bg-white rounded-lg p-4 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-3">Top Fields</h3>
        <div className="space-y-2">
          {topFields.map(([field, count]) => (
            <div key={field} className="flex items-center gap-2">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700">{field}</span>
                  <span className="text-xs text-gray-500">{count} papers</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${(count / totalPapers) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
