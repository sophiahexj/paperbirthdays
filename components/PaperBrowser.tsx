'use client';

import { useState, useEffect, useMemo } from 'react';
import { Paper } from '@/types/paper';
import { filterPapers, sortPapers, getRandomPaper } from '@/lib/paperUtils';
import PaperCard from './PaperCard';
import FilterPanel from './FilterPanel';
import StatsPanel from './StatsPanel';
import FieldNavigation from './FieldNavigation';
import ShareModal from './ShareModal';
import BirthdayInput from './BirthdayInput';

interface Props {
  papers: Paper[];
  allFields?: string[]; // Optional: all available fields for navigation
}

export default function PaperBrowser({ papers, allFields }: Props) {
  // Calculate available fields and year range first
  const availableFields = useMemo(() => {
    const fields = new Set(papers.map(p => p.field));
    return Array.from(fields).sort();
  }, [papers]);

  const yearRange = useMemo<[number, number]>(() => {
    if (papers.length === 0) return [2000, 2024];
    const years = papers.map(p => p.year);
    return [Math.min(...years), Math.max(...years)];
  }, [papers]);

  // Filter state - initialize with actual year range
  const [selectedField, setSelectedField] = useState<string>('all');
  const [selectedYearRange, setSelectedYearRange] = useState<[number, number]>(yearRange);
  const [minCitations, setMinCitations] = useState<number>(0); // Show all papers by default
  const [sortBy, setSortBy] = useState<'random' | 'citations' | 'year' | 'authors'>('random');

  // Sync selectedYearRange with yearRange when it changes
  useEffect(() => {
    setSelectedYearRange(yearRange);
  }, [yearRange]);

  // Display state
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  // Apply filters and sort
  const filteredPapers = useMemo(() => {
    let result = papers;

    // Apply filters
    result = filterPapers(result, {
      field: selectedField === 'all' ? undefined : selectedField,
      minYear: selectedYearRange[0],
      maxYear: selectedYearRange[1],
      minCitations: minCitations,
    });

    // Apply sort
    if (sortBy !== 'random') {
      result = sortPapers(result, sortBy, 'desc');
    }

    return result;
  }, [papers, selectedField, selectedYearRange, minCitations, sortBy]);

  // Update selected paper when filters change
  useEffect(() => {
    if (filteredPapers.length > 0) {
      if (sortBy === 'random') {
        setSelectedPaper(getRandomPaper(filteredPapers));
      } else {
        setSelectedPaper(filteredPapers[0]);
      }
    } else {
      setSelectedPaper(null);
    }
  }, [filteredPapers, sortBy]);

  const handleReset = () => {
    setSelectedField('all');
    setSelectedYearRange(yearRange);
    setMinCitations(0); // Reset to show all papers
    setSortBy('random');
  };

  const handleNewRandom = () => {
    if (filteredPapers.length > 0) {
      setSelectedPaper(getRandomPaper(filteredPapers));
    }
  };

  return (
    <div>
      {/* Paper Display - NOW AT THE TOP */}
      {selectedPaper ? (
        <div className="mb-8">
          <PaperCard
            paper={selectedPaper}
            onShareClick={() => setShowShareModal(true)}
          />
          {sortBy === 'random' && filteredPapers.length > 1 && (
            <div className="text-center mt-6">
              <button
                onClick={handleNewRandom}
                className="px-6 py-3 border-2 border-accent text-accent rounded-lg hover:bg-accent-light transition-all duration-150 font-medium"
              >
                🔀 Show Another Random Paper
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="max-w-2xl mx-auto p-8 bg-surface rounded-2xl border border-border text-center mb-8">
          <h2 className="font-display text-2xl font-semibold mb-4 text-text-primary">No Papers Found</h2>
          <p className="font-body text-text-secondary mb-6">
            No papers match your current filters. Try adjusting your criteria.
          </p>
          <button
            onClick={handleReset}
            className="px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent-hover transition font-medium"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Statistics Panel - Always visible */}
      <div className="mb-8">
        <StatsPanel papers={filteredPapers} />
      </div>

      {/* Birthday Input - Find papers by your birthday */}
      <div className="mb-8">
        <BirthdayInput />
      </div>

      {/* Field Navigation */}
      {allFields && allFields.length > 0 && (
        <div className="mb-8">
          <FieldNavigation fields={allFields} />
        </div>
      )}

      {/* Filter Panel */}
      <FilterPanel
        fields={availableFields}
        selectedField={selectedField}
        onFieldChange={setSelectedField}
        yearRange={yearRange}
        selectedYearRange={selectedYearRange}
        onYearRangeChange={setSelectedYearRange}
        minCitations={minCitations}
        onMinCitationsChange={setMinCitations}
        sortBy={sortBy}
        onSortChange={setSortBy}
        onReset={handleReset}
      />

      {/* Share Modal */}
      {selectedPaper && (
        <ShareModal
          paper={selectedPaper}
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}
