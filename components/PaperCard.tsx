'use client';

import { Paper } from '@/types/paper';
import { useState } from 'react';

interface PaperCardProps {
  paper: Paper;
}

export default function PaperCard({ paper }: PaperCardProps) {
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = `Check out this paper: "${paper.title}" (${paper.year}) - ${paper.citation_count.toLocaleString()} citations`;

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
    <div className="max-w-2xl mx-auto p-8 bg-white rounded-lg shadow-lg transition-all hover:shadow-xl">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-gray-500 uppercase tracking-wide">
          {paper.field} • {paper.year}
        </span>
        <button
          onClick={() => setShowShare(!showShare)}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          {showShare ? 'Hide Share' : 'Share'}
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
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-3">Share this paper:</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleCopyLink}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              {copied ? '✓ Copied!' : '📋 Copy Link'}
            </button>
            <button
              onClick={handleTwitterShare}
              className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600 transition"
            >
              🐦 Twitter
            </button>
            <button
              onClick={handleLinkedInShare}
              className="px-4 py-2 bg-blue-700 text-white rounded-md text-sm font-medium hover:bg-blue-800 transition"
            >
              💼 LinkedIn
            </button>
            <button
              onClick={handleEmailShare}
              className="px-4 py-2 bg-gray-700 text-white rounded-md text-sm font-medium hover:bg-gray-800 transition"
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
