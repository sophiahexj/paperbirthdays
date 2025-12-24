export interface Paper {
  id: string;
  title: string;
  author_count: number;
  year: number;
  citation_count: number;
  field: string;
  subfield?: string;
  venue: string;
  url: string;
}

export interface DailyPapers {
  date: string; // MM-DD
  total_papers: number;
  papers: Paper[];
  last_updated?: string;
}
