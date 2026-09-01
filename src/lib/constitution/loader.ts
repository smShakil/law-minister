import { readFileSync } from "node:fs";
import { join } from "node:path";

import type {
  ConstitutionArticle,
  ConstitutionDataset,
  ConstitutionPart,
  SearchDocument,
} from "./types";
import {
  buildArticleId,
  buildClauseId,
  normalizeArticleNumber,
  normalizeText,
} from "./normalize";

interface ArticleLocation {
  part?: string;
  partTitle?: string;
}

let cachedDocuments: SearchDocument[] | null = null;

function getDatasetPath(): string {
  return join(process.cwd(), "src/data/bangladesh_constitution_structured.json");
}

export function loadConstitutionDataset(): ConstitutionDataset {
  const raw = readFileSync(getDatasetPath(), "utf8");
  return JSON.parse(raw) as ConstitutionDataset;
}

function buildArticleLocationMap(
  parts: ConstitutionPart[],
): Map<string, ArticleLocation> {
  const map = new Map<string, ArticleLocation>();

  for (const part of parts) {
    for (const articleNumber of part.articles) {
      map.set(normalizeArticleNumber(articleNumber), {
        part: part.part,
        partTitle: part.title,
      });
    }
  }

  return map;
}

function createArticleDocument(
  article: ConstitutionArticle,
  location: ArticleLocation,
): SearchDocument {
  const text = article.text;
  return {
    id: buildArticleId(article.article),
    articleNumber: article.article,
    articleTitle: article.title,
    part: location.part,
    partTitle: location.partTitle,
    text,
    searchableText: normalizeText(
      [article.title, article.article, text, location.partTitle]
        .filter(Boolean)
        .join(" "),
    ),
  };
}

function createClauseDocument(
  article: ConstitutionArticle,
  clauseNumber: string,
  clauseText: string,
  location: ArticleLocation,
  subClause?: string,
): SearchDocument {
  return {
    id: buildClauseId(article.article, clauseNumber, subClause),
    articleNumber: article.article,
    articleTitle: article.title,
    part: location.part,
    partTitle: location.partTitle,
    clause: clauseNumber,
    subClause,
    text: clauseText,
    searchableText: normalizeText(
      [
        article.title,
        article.article,
        clauseNumber,
        subClause,
        clauseText,
        location.partTitle,
      ]
        .filter(Boolean)
        .join(" "),
    ),
  };
}

function createPreambleDocument(preamble: string): SearchDocument {
  return {
    id: "preamble",
    articleNumber: "Preamble",
    articleTitle: "Preamble",
    text: preamble,
    searchableText: normalizeText(`preamble ${preamble}`),
  };
}

function extractSubClauseDocuments(
  article: ConstitutionArticle,
  clauseNumber: string,
  clauseText: string,
  location: ArticleLocation,
): SearchDocument[] {
  const subClausePattern = /\(([a-z])\)\s*([^()]+?)(?=\s*\([a-z]\)|$)/gi;
  const documents: SearchDocument[] = [];
  let match: RegExpExecArray | null;

  while ((match = subClausePattern.exec(clauseText)) !== null) {
    const [, subClause, subClauseText] = match;
    documents.push(
      createClauseDocument(
        article,
        clauseNumber,
        subClauseText.trim(),
        location,
        subClause.toLowerCase(),
      ),
    );
  }

  return documents;
}

export function buildSearchDocuments(dataset: ConstitutionDataset): SearchDocument[] {
  const locationMap = buildArticleLocationMap(dataset.parts);
  const documents: SearchDocument[] = [createPreambleDocument(dataset.preamble)];

  for (const article of dataset.articles) {
    const location =
      locationMap.get(normalizeArticleNumber(article.article)) ?? {};

    documents.push(createArticleDocument(article, location));

    for (const clause of article.clauses) {
      documents.push(
        createClauseDocument(
          article,
          clause.clause,
          clause.text,
          location,
        ),
      );

      documents.push(
        ...extractSubClauseDocuments(
          article,
          clause.clause,
          clause.text,
          location,
        ),
      );
    }
  }

  return documents;
}

export function getSearchDocuments(): SearchDocument[] {
  if (!cachedDocuments) {
    const dataset = loadConstitutionDataset();
    cachedDocuments = buildSearchDocuments(dataset);
  }

  return cachedDocuments;
}

export function resetSearchIndex(): void {
  cachedDocuments = null;
}

export function getArticleByNumber(
  articleNumber: string,
): ConstitutionArticle | undefined {
  const dataset = loadConstitutionDataset();
  return dataset.articles.find((article) =>
    normalizeArticleNumber(article.article) ===
    normalizeArticleNumber(articleNumber),
  );
}

export function getPartForArticle(articleNumber: string): ArticleLocation {
  const dataset = loadConstitutionDataset();
  const locationMap = buildArticleLocationMap(dataset.parts);
  return locationMap.get(normalizeArticleNumber(articleNumber)) ?? {};
}
