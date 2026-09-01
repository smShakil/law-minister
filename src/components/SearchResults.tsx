import type { ConstitutionSearchResult } from "@/lib/constitution";

import { SearchResult } from "./SearchResult";

interface SearchResultsProps {
  query: string;
  results: ConstitutionSearchResult[];
}

export function SearchResults({ query, results }: SearchResultsProps) {
  return (
    <section className="w-full max-w-4xl space-y-4">
      <div className="border-b border-slate-200 pb-4">
        <p className="text-sm text-slate-500">Search results for</p>
        <h2 className="text-2xl font-semibold text-slate-900">&quot;{query}&quot;</h2>
        <p className="mt-1 text-sm text-slate-500">
          {results.length} result{results.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="space-y-4">
        {results.map((result) => (
          <SearchResult key={result.id} result={result} query={query} />
        ))}
      </div>
    </section>
  );
}
