import Link from "next/link";

import type { ConstitutionSearchResult } from "@/lib/constitution";
import { getArticleUrl, tokenize } from "@/lib/constitution";

import { HighlightedSnippet } from "./HighlightedSnippet";

interface SearchResultProps {
  result: ConstitutionSearchResult;
  query: string;
}

function formatProvisionLabel(result: ConstitutionSearchResult): string {
  let label = `Article ${result.articleNumber}`;

  if (result.clause) {
    label += `(${result.clause})`;
  }

  if (result.subClause) {
    label += `(${result.subClause})`;
  }

  return label;
}

export function SearchResult({ result, query }: SearchResultProps) {
  const highlightTerms = tokenize(query, false);
  const href = getArticleUrl(result.articleNumber, result.clause);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="space-y-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
            {formatProvisionLabel(result)}
          </p>
          {result.articleTitle ? (
            <h3 className="mt-2 text-xl font-semibold text-slate-900">
              {result.articleTitle}
            </h3>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2 text-sm text-slate-500">
          {result.part ? (
            <span>
              Part {result.part}
              {result.partTitle ? `: ${result.partTitle}` : ""}
            </span>
          ) : null}
          {result.chapter ? (
            <span>
              Chapter {result.chapter}
              {result.chapterTitle ? `: ${result.chapterTitle}` : ""}
            </span>
          ) : null}
        </div>

        <HighlightedSnippet text={result.snippet} terms={highlightTerms} />

        {result.matchReasons.length > 0 ? (
          <p className="text-xs text-slate-400">
            Matched because: {result.matchReasons.join(", ")}
          </p>
        ) : null}

        <Link
          href={href}
          className="inline-flex text-sm font-semibold text-emerald-700 hover:text-emerald-900"
        >
          View provision
        </Link>
      </div>
    </article>
  );
}
