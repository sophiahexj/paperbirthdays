import { Paper } from '@/types/paper';

interface PaperCardProps {
  paper: Paper;
}

export default function PaperCard({ paper }: PaperCardProps) {
  return (
    <div className="max-w-2xl mx-auto p-8 bg-white rounded-lg shadow-lg">
      <div className="mb-4">
        <span className="text-sm text-gray-500 uppercase tracking-wide">
          {paper.field} • {paper.year}
        </span>
      </div>

      <h1 className="text-3xl font-bold mb-4 text-gray-900">
        {paper.title}
      </h1>

      <div className="flex gap-6 mb-6 text-gray-600">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{paper.author_count}</span>
          <span className="text-sm">author{paper.author_count !== 1 ? 's' : ''}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-semibold">{paper.citation_count.toLocaleString()}</span>
          <span className="text-sm">citations</span>
        </div>
      </div>

      <div className="mb-6">
        <p className="text-sm text-gray-600">Published in</p>
        <p className="font-medium text-gray-800">{paper.venue}</p>
      </div>

      <div className="flex gap-4">
        <a
          href={paper.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
        >
          Read Paper →
        </a>

        <button
          onClick={() => window.location.reload()}
          className="inline-block bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition"
        >
          Show Another
        </button>
      </div>
    </div>
  );
}
