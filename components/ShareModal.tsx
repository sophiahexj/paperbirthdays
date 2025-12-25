'use client';

import { Paper } from '@/types/paper';
import { useState, useEffect } from 'react';
import { generatePaperSlug } from '@/lib/slugUtils';

interface ShareModalProps {
  paper: Paper;
  isOpen: boolean;
  onClose: () => void;
}

export default function ShareModal({ paper, isOpen, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Create unique share URL format like /dec-25/causal-inference-2016
  const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const today = new Date();
  const month = monthNames[today.getMonth()];
  const day = today.getDate();
  const slug = generatePaperSlug(paper);
  const memorableUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/${month}-${day}/${slug}`
    : '';

  const shareText = `🎂 This paper shares a birthday with today! "${paper.title}" was published ${paper.year} years ago with ${paper.citation_count.toLocaleString()} citations`;

  // Animate in when opened
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 200); // Match animation duration
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(memorableUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleTwitterShare = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(memorableUrl)}`;
    window.open(url, '_blank');
  };

  const handleLinkedInShare = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(memorableUrl)}`;
    window.open(url, '_blank');
  };

  const handleEmailShare = () => {
    const subject = `Interesting Paper: ${paper.title}`;
    const body = `${shareText}\n\n${memorableUrl}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${
        isAnimating ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className={`relative bg-surface rounded-2xl shadow-2xl max-w-md w-full p-6 transition-all duration-250 ${
          isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors"
          aria-label="Close modal"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="font-display text-2xl font-semibold text-text-primary mb-2">
            🎂 Share This Paper Birthday
          </h2>
          <p className="font-body text-sm text-text-secondary">
            Help others discover this gem
          </p>
        </div>

        {/* Share URL Display */}
        <div className="mb-6 p-4 bg-background rounded-lg border border-border">
          <p className="font-body text-xs text-text-muted mb-2 font-medium">Your shareable link:</p>
          <input
            type="text"
            value={memorableUrl}
            readOnly
            onFocus={(e) => e.target.select()}
            className="w-full font-body text-sm text-accent font-mono bg-transparent border-none outline-none"
          />
        </div>

        {/* Share Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleCopyLink}
            className="px-4 py-3 bg-background border-2 border-border rounded-lg font-body text-sm font-semibold text-text-primary hover:bg-tag-bg hover:border-tag-text transition-all"
          >
            {copied ? '✓ Copied!' : '📋 Copy Link'}
          </button>
          <button
            onClick={handleTwitterShare}
            className="px-4 py-3 bg-[#1DA1F2] text-white rounded-lg font-body text-sm font-semibold hover:bg-[#1a8cd8] transition-all"
          >
            𝕏 Twitter
          </button>
          <button
            onClick={handleLinkedInShare}
            className="px-4 py-3 bg-[#0077B5] text-white rounded-lg font-body text-sm font-semibold hover:bg-[#006399] transition-all"
          >
            💼 LinkedIn
          </button>
          <button
            onClick={handleEmailShare}
            className="px-4 py-3 bg-text-primary text-white rounded-lg font-body text-sm font-semibold hover:bg-text-secondary transition-all"
          >
            ✉️ Email
          </button>
        </div>
      </div>
    </div>
  );
}
