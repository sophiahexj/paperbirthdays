'use client';

import { useState } from 'react';
import { Paper } from '@/types/paper';
import PaperCard from './PaperCard';
import StatsPanel from './StatsPanel';

interface Props {
  papers: Paper[];
  initialPaper: Paper;
}

export default function DatePaperDisplay({ papers, initialPaper }: Props) {
  const [selectedPaper, setSelectedPaper] = useState<Paper>(initialPaper);
  const [showStats, setShowStats] = useState(false);

  const handleShowAnother = () => {
    // Get a random paper that's different from the current one
    if (papers.length > 1) {
      let newPaper = papers[Math.floor(Math.random() * papers.length)];
      // Try to get a different paper (avoid showing the same one)
      let attempts = 0;
      while (newPaper.id === selectedPaper.id && attempts < 10) {
        newPaper = papers[Math.floor(Math.random() * papers.length)];
        attempts++;
      }
      setSelectedPaper(newPaper);
    }
  };

  return (
    <>
      {/* Paper Card */}
      <PaperCard paper={selectedPaper} />

      {/* Show Another Button */}
      {papers.length > 1 && (
        <div className="text-center mt-8">
          <button
            onClick={handleShowAnother}
            className="px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent-hover transition-all duration-150 font-medium"
          >
            🔀 Show me another one!
          </button>
        </div>
      )}

      {/* Statistics Section - Prominent collapsible panel */}
      <div className="mt-8">
        <button
          onClick={() => setShowStats(!showStats)}
          className="w-full bg-gradient-to-br from-accent-light via-surface to-background border-2 border-accent/30 rounded-2xl p-6 shadow-lg hover:border-accent/50 transition-all duration-200 group"
        >
          <div className="flex items-center justify-between">
            <div className="text-left">
              <h3 className="font-display text-xl font-semibold text-text-primary group-hover:text-accent transition-colors">
                📊 Paper Statistics
              </h3>
            </div>
            <div className="text-3xl group-hover:scale-110 transition-transform">
              {showStats ? '▼' : '▶'}
            </div>
          </div>
        </button>

        {/* Statistics Panel */}
        {showStats && (
          <div className="mt-4">
            <StatsPanel papers={papers} />
          </div>
        )}
      </div>
    </>
  );
}
