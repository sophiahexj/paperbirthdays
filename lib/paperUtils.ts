import { Paper } from '@/types/paper';

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function getRandomPaper(papers: Paper[]): Paper {
  const shuffled = shuffleArray(papers);
  return shuffled[0];
}

// Future: filter by citation count, author count, year, etc.
export interface PaperFilters {
  minCitations?: number;
  maxCitations?: number;
  field?: string;
  minYear?: number;
  maxYear?: number;
  minAuthors?: number;
  maxAuthors?: number;
}

export function filterPapers(papers: Paper[], filters: PaperFilters): Paper[] {
  return papers.filter(paper => {
    if (filters.minCitations && paper.citation_count < filters.minCitations) {
      return false;
    }
    if (filters.maxCitations && paper.citation_count > filters.maxCitations) {
      return false;
    }
    if (filters.field && paper.field !== filters.field) {
      return false;
    }
    if (filters.minYear && paper.year < filters.minYear) {
      return false;
    }
    if (filters.maxYear && paper.year > filters.maxYear) {
      return false;
    }
    if (filters.minAuthors && paper.author_count < filters.minAuthors) {
      return false;
    }
    if (filters.maxAuthors && paper.author_count > filters.maxAuthors) {
      return false;
    }
    return true;
  });
}

export function sortPapers(papers: Paper[], sortBy: 'year' | 'citations' | 'authors', order: 'asc' | 'desc' = 'desc'): Paper[] {
  const sorted = [...papers];
  sorted.sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'year':
        comparison = a.year - b.year;
        break;
      case 'citations':
        comparison = a.citation_count - b.citation_count;
        break;
      case 'authors':
        comparison = a.author_count - b.author_count;
        break;
    }
    return order === 'asc' ? comparison : -comparison;
  });
  return sorted;
}
