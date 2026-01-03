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
  const totalFields = Object.keys(fieldCounts).length;
  const topFields = Object.entries(fieldCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="bg-accent-light rounded-2xl border border-border p-6 mb-8">
      <h2 className="font-display text-xl font-semibold text-text-primary mb-4">Statistics</h2>

      <div className={`grid gap-4 mb-6 ${totalFields > 1 ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2 md:grid-cols-3'}`}>
        <div className="bg-surface rounded-lg p-4 border border-border">
          <div className="font-display text-2xl font-semibold text-accent">{totalPapers}</div>
          <div className="font-body text-sm text-text-secondary">Total Papers</div>
        </div>

        <div className="bg-surface rounded-lg p-4 border border-border">
          <div className="font-display text-2xl font-semibold text-accent">
            {yearRange[0]}-{yearRange[1]}
          </div>
          <div className="font-body text-sm text-text-secondary">Year Range</div>
        </div>

        <div className="bg-surface rounded-lg p-4 border border-border">
          <div className="font-display text-2xl font-semibold text-accent">
            {avgCitations.toLocaleString()}
          </div>
          <div className="font-body text-sm text-text-secondary">Avg Citations</div>
        </div>

        {totalFields > 1 && (
          <div className="bg-surface rounded-lg p-4 border border-border">
            <div className="font-display text-2xl font-semibold text-accent">{totalFields}</div>
            <div className="font-body text-sm text-text-secondary">Fields</div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Most Cited */}
        <a
          href={mostCited.url}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-surface rounded-lg p-4 border border-border hover:border-accent hover:bg-accent-light/20 transition-all cursor-pointer group"
        >
          <h3 className="font-body font-semibold text-text-primary mb-2 group-hover:text-accent transition-colors">
            Most Cited
          </h3>
          <p className="font-body text-sm text-text-secondary line-clamp-2">{mostCited.title}</p>
          <p className="font-body text-xs text-text-muted mt-1">
            {mostCited.citation_count.toLocaleString()} citations • {mostCited.year}
          </p>
        </a>

        {/* Oldest */}
        <a
          href={oldest.url}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-surface rounded-lg p-4 border border-border hover:border-accent hover:bg-accent-light/20 transition-all cursor-pointer group"
        >
          <h3 className="font-body font-semibold text-text-primary mb-2 group-hover:text-accent transition-colors">
            Oldest Paper
          </h3>
          <p className="font-body text-sm text-text-secondary line-clamp-2">{oldest.title}</p>
          <p className="font-body text-xs text-text-muted mt-1">
            {oldest.year} • {oldest.citation_count.toLocaleString()} citations
          </p>
        </a>
      </div>

      {/* Field Distribution - Only show if there are multiple fields */}
      {totalFields > 1 && (
        <div className="mt-4 bg-surface rounded-lg p-4 border border-border">
          <h3 className="font-body font-semibold text-text-primary mb-3">Top Fields</h3>
          <div className="space-y-2">
            {topFields.map(([field, count]) => (
              <div key={field} className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-body text-sm text-text-primary">{field}</span>
                    <span className="font-body text-xs text-text-muted">{count} papers</span>
                  </div>
                  <div className="w-full bg-tag-bg rounded-full h-2">
                    <div
                      className="bg-accent h-2 rounded-full transition-all"
                      style={{ width: `${(count / totalPapers) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
