'use client';

import { useState, useEffect, useMemo } from 'react';
import { Paper } from '@/types/paper';
import { filterPapers, sortPapers, getRandomPaper } from '@/lib/paperUtils';
import PaperCard from './PaperCard';
import FilterPanel from './FilterPanel';
import StatsPanel from './StatsPanel';
import FieldNavigation from './FieldNavigation';

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
  const [minCitations, setMinCitations] = useState<number>(100); // Quality minimum: only show high-impact papers
  const [sortBy, setSortBy] = useState<'random' | 'citations' | 'year' | 'authors'>('random');

  // Display state
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [showStats, setShowStats] = useState(false);

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
    setMinCitations(100); // Reset to quality minimum
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
          <PaperCard paper={selectedPaper} />
          {sortBy === 'random' && filteredPapers.length > 1 && (
            <div className="text-center mt-6">
              <button
                onClick={handleNewRandom}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-md"
              >
                Show Another Random Paper
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="max-w-2xl mx-auto p-8 bg-white rounded-lg shadow-lg text-center mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">No Papers Found</h2>
          <p className="text-gray-600 mb-6">
            No papers match your current filters. Try adjusting your criteria.
          </p>
          <button
            onClick={handleReset}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Field Navigation - Below the paper */}
      {allFields && allFields.length > 0 && (
        <FieldNavigation fields={allFields} />
      )}

      {/* Results Info */}
      <div className="text-center mb-4">
        <p className="text-sm text-gray-600">
          Showing{' '}
          <span className="font-semibold text-gray-900">{filteredPapers.length}</span>{' '}
          {filteredPapers.length === 1 ? 'paper' : 'papers'}
          {sortBy !== 'random' && (
            <span className="text-gray-500 ml-2">
              (sorted by {sortBy})
            </span>
          )}
        </p>
      </div>

      {/* Toggle Stats Button */}
      <div className="flex justify-end mb-3">
        <button
          onClick={() => setShowStats(!showStats)}
          className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition"
        >
          {showStats ? 'Hide' : 'Show'} Statistics
        </button>
      </div>

      {/* Statistics Panel */}
      {showStats && <StatsPanel papers={filteredPapers} />}

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
    </div>
  );
}
