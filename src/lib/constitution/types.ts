export interface ConstitutionMetadata {
  title: string;
  source_file: string;
  source_url: string;
  retrieved_date: string;
  language: string;
  document_pages: number;
  constitutional_text_pages: string;
  editorial_footnote_pages: string;
  article_count_extracted: number;
  note: string;
}

export interface ConstitutionPart {
  part: string;
  title: string;
  articles: string[];
}

export interface ConstitutionClause {
  clause: string;
  text: string;
}

export interface ConstitutionArticle {
  article: string;
  title: string;
  text: string;
  clauses: ConstitutionClause[];
}

export interface ConstitutionDataset {
  metadata: ConstitutionMetadata;
  preamble: string;
  parts: ConstitutionPart[];
  articles: ConstitutionArticle[];
}

export interface SearchDocument {
  id: string;
  articleNumber: string;
  articleTitle?: string;
  part?: string;
  partTitle?: string;
  chapter?: string;
  chapterTitle?: string;
  clause?: string;
  subClause?: string;
  text: string;
  searchableText: string;
}

export interface ConstitutionSearchResult {
  id: string;
  articleNumber: string;
  articleTitle?: string;
  part?: string;
  partTitle?: string;
  chapter?: string;
  chapterTitle?: string;
  clause?: string;
  subClause?: string;
  snippet: string;
  score: number;
  matchReasons: string[];
}

export interface SearchOptions {
  limit?: number;
}

export interface ArticleReference {
  articleNumber: string;
  clause?: string;
  subClause?: string;
}

export interface SearchApiResponse {
  query: string;
  results: ConstitutionSearchResult[];
  total: number;
}

export interface SearchEvaluationCase {
  query: string;
  expectedArticles: string[];
  description?: string;
}
