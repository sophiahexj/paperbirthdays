'use client';

import { Paper } from '@/types/paper';
import { useState } from 'react';

interface PaperCardProps {
  paper: Paper;
}

export default function PaperCard({ paper }: PaperCardProps) {
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);

  // Create memorable share URL format like /dec-25-2024
  const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const today = new Date();
  const month = monthNames[today.getMonth()];
  const day = today.getDate();
  const memorableUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/${month}-${day}-${paper.year}`
    : '';

  const shareUrl = memorableUrl;
  const shareText = `🎂 This paper shares a birthday with today! "${paper.title}" was published ${paper.year} years ago with ${paper.citation_count.toLocaleString()} citations`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleTwitterShare = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank');
  };

  const handleLinkedInShare = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank');
  };

  const handleEmailShare = () => {
    const subject = `Interesting Paper: ${paper.title}`;
    const body = `${shareText}\n\n${shareUrl}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white rounded-xl shadow-xl transition-all hover:shadow-2xl border border-gray-100">
      <div className="mb-6 flex items-center justify-between">
        <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">
          {paper.field} • {paper.year}
        </span>
        <button
          onClick={() => setShowShare(!showShare)}
          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full text-sm font-semibold hover:from-blue-600 hover:to-purple-700 transition shadow-md flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          {showShare ? 'Hide' : 'Share This Birthday'}
        </button>
      </div>

      <h1 className="text-3xl font-bold mb-4 text-gray-900 leading-tight">
        {paper.title}
      </h1>

      <div className="flex gap-6 mb-6 text-gray-600">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span className="font-semibold">{paper.author_count}</span>
          <span className="text-sm">author{paper.author_count !== 1 ? 's' : ''}</span>
        </div>

        <div className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="font-semibold">{paper.citation_count.toLocaleString()}</span>
          <span className="text-sm">citations</span>
        </div>
      </div>

      <div className="mb-6">
        <p className="text-sm text-gray-600">Published in</p>
        <p className="font-medium text-gray-800">{paper.venue}</p>
      </div>

      {/* Share Options */}
      {showShare && (
        <div className="mb-8 p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200">
          <div className="text-center mb-4">
            <h3 className="text-lg font-bold text-gray-900 mb-1">🎂 Share This Paper Birthday!</h3>
            <p className="text-sm text-gray-600">Help others discover this gem</p>
          </div>

          {/* Share URL Display */}
          <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500 mb-1 font-medium">Your shareable link:</p>
            <code className="text-sm text-blue-600 font-mono break-all">{shareUrl}</code>
          </div>

          {/* Share Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleCopyLink}
              className="px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm"
            >
              {copied ? '✓ Copied!' : '📋 Copy Link'}
            </button>
            <button
              onClick={handleTwitterShare}
              className="px-4 py-3 bg-blue-500 text-white rounded-lg text-sm font-semibold hover:bg-blue-600 transition-all shadow-md hover:shadow-lg"
            >
              𝕏 Twitter
            </button>
            <button
              onClick={handleLinkedInShare}
              className="px-4 py-3 bg-blue-700 text-white rounded-lg text-sm font-semibold hover:bg-blue-800 transition-all shadow-md hover:shadow-lg"
            >
              💼 LinkedIn
            </button>
            <button
              onClick={handleEmailShare}
              className="px-4 py-3 bg-gray-700 text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition-all shadow-md hover:shadow-lg"
            >
              ✉️ Email
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-4">
        <a
          href={paper.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
        >
          Read Paper →
        </a>
      </div>
    </div>
  );
}
