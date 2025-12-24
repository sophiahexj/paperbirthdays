'use client';

import { useState, useEffect } from 'react';
import { Paper } from '@/types/paper';
import { getRandomPaper } from '@/lib/paperUtils';
import PaperCard from './PaperCard';

interface Props {
  papers: Paper[];
}

export default function RandomPaperDisplay({ papers }: Props) {
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);

  useEffect(() => {
    // Randomize on mount (client-side only)
    if (papers && papers.length > 0) {
      setSelectedPaper(getRandomPaper(papers));
    }
  }, [papers]);

  if (!selectedPaper) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return <PaperCard paper={selectedPaper} />;
}
