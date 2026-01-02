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

      {/* Toggle Stats Button */}
      <div className="flex justify-end mt-8 mb-3">
        <button
          onClick={() => setShowStats(!showStats)}
          className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition"
        >
          {showStats ? 'Hide' : 'Show'} Statistics
        </button>
      </div>

      {/* Statistics Panel */}
      {showStats && <StatsPanel papers={papers} />}
    </>
  );
}
