'use client';

import { useState } from 'react';
import { Paper } from '@/types/paper';

export default function PaperSearchSubscribe() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Paper[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (searchQuery.trim().length < 3) {
      setMessage({ type: 'error', text: 'Please enter at least 3 characters' });
      return;
    }

    setIsSearching(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/search-papers?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();

      if (data.success) {
        setSearchResults(data.papers);
        if (data.papers.length === 0) {
          setMessage({ type: 'error', text: 'No papers found. Try a different search term.' });
        }
      } else {
        setMessage({ type: 'error', text: data.error || 'Search failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to search. Please try again.' });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPaper) {
      setMessage({ type: 'error', text: 'Please select a paper first' });
      return;
    }

    if (!email.trim()) {
      setMessage({ type: 'error', text: 'Please enter your email' });
      return;
    }

    setIsSubscribing(true);
    setMessage(null);

    try {
      const response = await fetch('/api/subscribe-birthday', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          paperId: selectedPaper.id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: 'success',
          text: 'Check your email to verify your subscription!',
        });
        setEmail('');
        setSelectedPaper(null);
        setSearchResults([]);
        setSearchQuery('');
      } else {
        setMessage({ type: 'error', text: data.error || 'Subscription failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to subscribe. Please try again.' });
    } finally {
      setIsSubscribing(false);
    }
  };

  const formatDate = (monthDay?: string) => {
    if (!monthDay) return 'Unknown';
    const [month, day] = monthDay.split('-');
    const date = new Date(2000, parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200/60 rounded-2xl shadow-md overflow-hidden">
      <div className="p-6">
        <h2 className="font-display text-2xl font-semibold text-text-primary mb-2">
          Subscribe to Paper Birthdays
        </h2>
        <p className="font-body text-sm text-text-secondary mb-6">
          Get reminded every year when your favorite papers celebrate their publication anniversary
        </p>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a paper by title..."
              className="flex-1 px-4 py-3 border border-border rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            />
            <button
              type="submit"
              disabled={isSearching}
              className="px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent-hover transition-all duration-150 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>

        {/* Message Display */}
        {message && (
          <div
            className={`mb-4 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            <p className="font-body text-sm">{message.text}</p>
          </div>
        )}

        {/* Search Results */}
        {searchResults.length > 0 && !selectedPaper && (
          <div className="mb-6">
            <h3 className="font-body font-semibold text-text-primary mb-3">
              Select a paper ({searchResults.length} results)
            </h3>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {searchResults.map((paper) => (
                <button
                  key={paper.id}
                  onClick={() => setSelectedPaper(paper)}
                  className="w-full text-left bg-white p-4 rounded-lg border border-border hover:border-accent hover:bg-accent-light/20 transition-all"
                >
                  <h4 className="font-body font-medium text-text-primary mb-1 line-clamp-2">
                    {paper.title}
                  </h4>
                  <div className="flex flex-wrap gap-3 text-xs text-text-muted">
                    <span>{paper.year}</span>
                    <span>{paper.citation_count.toLocaleString()} citations</span>
                    <span>{paper.field}</span>
                    <span>Birthday: {formatDate(paper.publication_month_day)}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Selected Paper & Subscription Form */}
        {selectedPaper && (
          <div className="bg-white p-6 rounded-lg border-2 border-accent">
            <div className="mb-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-body font-semibold text-text-primary flex-1">
                  Selected Paper
                </h3>
                <button
                  onClick={() => setSelectedPaper(null)}
                  className="text-text-muted hover:text-text-primary text-sm"
                >
                  Change
                </button>
              </div>
              <p className="font-body text-sm text-text-secondary mb-2">
                {selectedPaper.title}
              </p>
              <div className="flex flex-wrap gap-3 text-xs text-text-muted">
                <span>{selectedPaper.year}</span>
                <span>{selectedPaper.citation_count.toLocaleString()} citations</span>
                <span>{selectedPaper.field}</span>
              </div>
              <div className="mt-3 p-3 bg-purple-50 rounded-lg">
                <p className="font-body text-sm text-purple-900">
                  You&apos;ll receive an email every <strong>{formatDate(selectedPaper.publication_month_day)}</strong> celebrating this paper&apos;s anniversary!
                </p>
              </div>
            </div>

            <form onSubmit={handleSubscribe}>
              <label className="block font-body text-sm font-medium text-text-primary mb-2">
                Your Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 border border-border rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent mb-4"
              />
              <button
                type="submit"
                disabled={isSubscribing}
                className="w-full px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent-hover transition-all duration-150 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubscribing ? 'Subscribing...' : 'Subscribe'}
              </button>
              <p className="mt-3 text-xs text-text-muted">
                We&apos;ll send you a verification email. Maximum 5 subscriptions per email address.
              </p>
            </form>
          </div>
        )}

        {/* Info Text */}
        {!selectedPaper && searchResults.length === 0 && !isSearching && (
          <div className="text-center py-8">
            <p className="font-body text-sm text-text-secondary">
              Search for a paper by title to get started
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
