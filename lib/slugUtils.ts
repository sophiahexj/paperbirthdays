/**
 * Utility functions for generating URL-friendly slugs from paper data
 */

import { Paper } from '@/types/paper';

/**
 * Convert a string to a URL-friendly slug
 * Example: "Causal Inference for Statistics" -> "causal-inference-for-statistics"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')      // Replace spaces with hyphens
    .replace(/--+/g, '-')      // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '');  // Trim hyphens from start/end
}

/**
 * Generate a unique slug for a paper
 * Format: first-few-words-of-title-YEAR
 * Example: "causal-inference-statistics-2016"
 */
export function generatePaperSlug(paper: Paper, maxWords: number = 5): string {
  // Take first few words of title
  const words = paper.title.split(' ').slice(0, maxWords);
  const titleSlug = slugify(words.join(' '));

  // Add year for uniqueness
  return `${titleSlug}-${paper.year}`;
}

/**
 * Generate the full paper URL path
 * Format: /MMM-DD/slug-YEAR
 * Example: /dec-25/causal-inference-statistics-2016
 */
export function generatePaperUrl(paper: Paper, date: string): string {
  const slug = generatePaperSlug(paper);
  return `/${date}/${slug}`;
}

/**
 * Extract date and slug from a paper URL path
 * Example: "/dec-25/causal-inference-2016" -> { date: "dec-25", slug: "causal-inference-2016" }
 */
export function parsePaperUrl(path: string): { date: string; slug: string } | null {
  const match = path.match(/^\/([a-z]{3}-\d{1,2})\/(.+)$/);
  if (!match) return null;

  return {
    date: match[1],
    slug: match[2],
  };
}
