'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function BirthdayInput() {
  const [month, setMonth] = useState<string>('');
  const [day, setDay] = useState<string>('');
  const [error, setError] = useState<string>('');
  const router = useRouter();

  const monthNames = [
    { value: '01', label: 'January', short: 'jan' },
    { value: '02', label: 'February', short: 'feb' },
    { value: '03', label: 'March', short: 'mar' },
    { value: '04', label: 'April', short: 'apr' },
    { value: '05', label: 'May', short: 'may' },
    { value: '06', label: 'June', short: 'jun' },
    { value: '07', label: 'July', short: 'jul' },
    { value: '08', label: 'August', short: 'aug' },
    { value: '09', label: 'September', short: 'sep' },
    { value: '10', label: 'October', short: 'oct' },
    { value: '11', label: 'November', short: 'nov' },
    { value: '12', label: 'December', short: 'dec' },
  ];

  // Get days in selected month (simplified - uses max 31)
  const getDaysInMonth = (monthValue: string): number => {
    const daysInMonth: { [key: string]: number } = {
      '01': 31, '02': 29, '03': 31, '04': 30, '05': 31, '06': 30,
      '07': 31, '08': 31, '09': 30, '10': 31, '11': 30, '12': 31,
    };
    return daysInMonth[monthValue] || 31;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!month || !day) {
      setError('Please select both month and day');
      return;
    }

    const dayNum = parseInt(day);
    const maxDays = getDaysInMonth(month);

    if (dayNum < 1 || dayNum > maxDays) {
      setError(`Invalid day for selected month`);
      return;
    }

    // Get month abbreviation
    const monthObj = monthNames.find(m => m.value === month);
    if (!monthObj) {
      setError('Invalid month selected');
      return;
    }

    // Navigate to date page (e.g., /aug-08)
    const url = `/${monthObj.short}-${day.padStart(2, '0')}`;
    router.push(url);
  };

  return (
    <div className="bg-gradient-to-br from-accent-light via-surface to-background border-2 border-accent/30 rounded-2xl p-6 shadow-lg">
      <div className="text-center mb-4">
        <h3 className="font-display text-xl font-semibold text-text-primary mb-2">
          🎂 Find Your Birthday Papers
        </h3>
        <p className="font-body text-sm text-text-secondary">
          Discover papers that share your birthday!
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-3 flex-wrap sm:flex-nowrap">
          {/* Month Selector */}
          <div className="flex-1 min-w-[150px]">
            <label htmlFor="month" className="block text-xs font-medium text-text-secondary mb-1.5">
              Month
            </label>
            <select
              id="month"
              value={month}
              onChange={(e) => {
                setMonth(e.target.value);
                setError('');
              }}
              className="w-full px-3 py-2.5 bg-white border border-border rounded-lg font-body text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition"
            >
              <option value="">Select month</option>
              {monthNames.map(m => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Day Selector */}
          <div className="flex-1 min-w-[100px]">
            <label htmlFor="day" className="block text-xs font-medium text-text-secondary mb-1.5">
              Day
            </label>
            <select
              id="day"
              value={day}
              onChange={(e) => {
                setDay(e.target.value);
                setError('');
              }}
              className="w-full px-3 py-2.5 bg-white border border-border rounded-lg font-body text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition"
              disabled={!month}
            >
              <option value="">Day</option>
              {Array.from(
                { length: month ? getDaysInMonth(month) : 31 },
                (_, i) => i + 1
              ).map(d => (
                <option key={d} value={d.toString().padStart(2, '0')}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Submit Button */}
          <div className="flex-shrink-0 self-end">
            <button
              type="submit"
              disabled={!month || !day}
              className="px-6 py-2.5 bg-accent text-white rounded-lg hover:bg-accent-hover disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-150 font-medium whitespace-nowrap"
            >
              Find Papers
            </button>
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
            {error}
          </div>
        )}
      </form>

    </div>
  );
}
