'use client';

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
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Filter & Sort</h2>
        <button
          onClick={onReset}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Reset All
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Field Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Field
          </label>
          <select
            value={selectedField}
            onChange={(e) => onFieldChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Year Range
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={selectedYearRange[0]}
              onChange={(e) =>
                onYearRangeChange([parseInt(e.target.value), selectedYearRange[1]])
              }
              min={yearRange[0]}
              max={yearRange[1]}
              className="w-20 px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-500">-</span>
            <input
              type="number"
              value={selectedYearRange[1]}
              onChange={(e) =>
                onYearRangeChange([selectedYearRange[0], parseInt(e.target.value)])
              }
              min={yearRange[0]}
              max={yearRange[1]}
              className="w-20 px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Min Citations */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Min Citations
          </label>
          <select
            value={minCitations}
            onChange={(e) => onMinCitationsChange(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sort By
          </label>
          <select
            value={sortBy}
            onChange={(e) =>
              onSortChange(e.target.value as 'random' | 'citations' | 'year' | 'authors')
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="random">Random</option>
            <option value="citations">Most Cited</option>
            <option value="year">Oldest First</option>
            <option value="authors">Most Authors</option>
          </select>
        </div>
      </div>
    </div>
  );
}
