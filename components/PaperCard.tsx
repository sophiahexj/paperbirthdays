'use client';

import { Paper } from '@/types/paper';

interface PaperCardProps {
  paper: Paper;
  onShareClick?: () => void;
}

export default function PaperCard({ paper, onShareClick }: PaperCardProps) {
  // Truncate authors list
  const getAuthorsDisplay = () => {
    if (paper.author_count <= 3) {
      return `${paper.author_count} ${paper.author_count === 1 ? 'author' : 'authors'}`;
    }
    return `${paper.author_count} authors`;
  };

  return (
    <div className="max-w-[640px] mx-auto p-8 bg-surface rounded-2xl border border-border transition-all hover:shadow-lg">
      {/* Field and Year - Top Corners */}
      <div className="flex items-center justify-between mb-6">
        <span className="font-body text-xs uppercase tracking-wider font-medium text-tag-text bg-tag-bg px-3 py-1.5 rounded-md">
          {paper.field}
        </span>
        <span className="font-body text-base font-light text-text-secondary">
          {paper.year}
        </span>
      </div>

      {/* Paper Title */}
      <h1 className="font-display text-[1.75rem] font-semibold leading-[1.3] text-text-primary mb-6">
        {paper.title}
      </h1>

      {/* Authors */}
      <p className="font-body text-[0.9rem] text-text-secondary mb-4">
        {getAuthorsDisplay()}
      </p>

      {/* Venue and Citations */}
      <div className="mb-6 space-y-1">
        <p className="font-body text-[0.9rem] text-text-secondary">
          Published in {paper.venue}
        </p>
        <p className="font-body text-[0.9rem] text-text-secondary">
          {paper.citation_count.toLocaleString()} citations
        </p>
      </div>

      {/* CTAs - Side by Side */}
      <div className="flex gap-3">
        <a
          href={paper.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-center bg-accent text-white px-6 py-3 rounded-lg hover:bg-accent-hover transition-all duration-150 font-medium hover:scale-[1.02]"
        >
          Read Paper →
        </a>
        <button
          onClick={onShareClick}
          className="flex-1 text-center border-2 border-accent text-accent px-6 py-3 rounded-lg hover:bg-accent-light transition-all duration-150 font-medium"
        >
          Share 🔗
        </button>
      </div>
    </div>
  );
}
