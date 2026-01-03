'use client';

import { useState } from 'react';

interface FilterPanelProps {
  fields: string[];
  selectedField: string;
  onFieldChange: (field: string) => void;
  yearRange: [number, number];
  selectedYearRange: [number, number];
  onYearRangeChange: (range: [number, number]) => void;
  minCitations: number;
  onMinCitationsChange: (min: number) => void;
  sortBy: 'random' | 'citations' | 'year' | 'authors';
  onSortChange: (sort: 'random' | 'citations' | 'year' | 'authors') => void;
  onReset: () => void;
}

export default function FilterPanel({
  fields,
  selectedField,
  onFieldChange,
  yearRange,
  selectedYearRange,
  onYearRangeChange,
  minCitations,
  onMinCitationsChange,
  sortBy,
  onSortChange,
  onReset,
}: FilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-surface rounded-2xl border border-border overflow-hidden">
      {/* Toggle Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-background transition-colors"
      >
        <span className="font-body font-medium text-text-primary">
          Filters & Browse
        </span>
        <svg
          className={`w-5 h-5 text-text-secondary transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="px-6 pb-6 border-t border-border">
          <div className="flex items-center justify-end mb-4 pt-4">
            <button
              onClick={onReset}
              className="font-body text-sm text-accent hover:text-accent-hover font-medium"
            >
              Reset All
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Field Filter */}
            <div>
              <label className="block font-body text-sm font-medium text-text-secondary mb-2">
                Field
              </label>
              <select
                value={selectedField}
                onChange={(e) => onFieldChange(e.target.value)}
                className="w-full px-3 py-2 font-body border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-surface text-text-primary"
              >
                <option value="all">All Fields</option>
                {fields.map((field) => (
                  <option key={field} value={field}>
                    {field}
                  </option>
                ))}
              </select>
            </div>

            {/* Year Range */}
            <div>
              <label className="block font-body text-sm font-medium text-text-secondary mb-2">
                Year Range
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={selectedYearRange[0]}
                  onChange={(e) => {
                    const newStart = parseInt(e.target.value);
                    // Ensure start year doesn't exceed end year
                    const newEnd = Math.max(newStart, selectedYearRange[1]);
                    onYearRangeChange([newStart, newEnd]);
                  }}
                  min={yearRange[0]}
                  max={yearRange[1]}
                  className="w-20 px-2 py-2 font-body border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-surface text-text-primary"
                />
                <span className="text-text-muted">-</span>
                <input
                  type="number"
                  value={selectedYearRange[1]}
                  onChange={(e) => {
                    const newEnd = parseInt(e.target.value);
                    // Ensure end year doesn't go below start year
                    const newStart = Math.min(newEnd, selectedYearRange[0]);
                    onYearRangeChange([newStart, newEnd]);
                  }}
                  min={yearRange[0]}
                  max={yearRange[1]}
                  className="w-20 px-2 py-2 font-body border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-surface text-text-primary"
                />
              </div>
            </div>

            {/* Min Citations */}
            <div>
              <label className="block font-body text-sm font-medium text-text-secondary mb-2">
                Min Citations
              </label>
              <select
                value={minCitations}
                onChange={(e) => onMinCitationsChange(parseInt(e.target.value))}
                className="w-full px-3 py-2 font-body border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-surface text-text-primary"
              >
                <option value="0">Any</option>
                <option value="10">10+</option>
                <option value="50">50+</option>
                <option value="100">100+</option>
                <option value="500">500+</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block font-body text-sm font-medium text-text-secondary mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) =>
                  onSortChange(e.target.value as 'random' | 'citations' | 'year' | 'authors')
                }
                className="w-full px-3 py-2 font-body border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-surface text-text-primary"
              >
                <option value="random">Random</option>
                <option value="citations">Most Cited</option>
                <option value="year">Oldest First</option>
                <option value="authors">Most Authors</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
