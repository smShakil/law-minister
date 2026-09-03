"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { EmptySearchState } from "@/components/EmptySearchState";
import { SearchBar } from "@/components/SearchBar";
import { SearchResults } from "@/components/SearchResults";
import type { ConstitutionSearchResult } from "@/lib/constitution";
import {
  buildSearchApiUrl,
  buildSearchPageUrl,
  parseSearchLimit,
} from "@/lib/constitution";

type SearchStatus = "idle" | "loading" | "success" | "error";

export default function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const trimmedQuery = initialQuery.trim();
  const searchLimit = parseSearchLimit(searchParams.get("limit"));
  const [results, setResults] = useState<ConstitutionSearchResult[]>([]);
  const [status, setStatus] = useState<SearchStatus>(
    trimmedQuery ? "loading" : "idle",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!trimmedQuery) {
      return;
    }

    let cancelled = false;

    async function runSearch() {
      setStatus("loading");
      setErrorMessage(null);

      try {
        const response = await fetch(
          buildSearchApiUrl(trimmedQuery, searchLimit),
        );
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error ?? "Search failed.");
        }

        if (!cancelled) {
          setResults(payload.results);
          setStatus("success");
        }
      } catch (error) {
        if (!cancelled) {
          setStatus("error");
          setErrorMessage(
            error instanceof Error ? error.message : "Search failed.",
          );
        }
      }
    }

    void runSearch();

    return () => {
      cancelled = true;
    };
  }, [trimmedQuery, searchLimit]);

  function handleSearch(nextQuery: string) {
    if (!nextQuery) {
      return;
    }

    router.push(buildSearchPageUrl(nextQuery, searchLimit));
  }

  const displayStatus = trimmedQuery ? status : "idle";

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-10">
      <div className="flex items-center justify-between gap-4">
        <Link href="/" className="text-sm font-semibold text-emerald-700">
          ← Bangladesh Constitution
        </Link>
        <Link href="/ask" className="text-sm font-semibold text-violet-700">
          Ask a Question →
        </Link>
      </div>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Constitution Search</h1>
          <p className="mt-2 text-sm text-slate-600">
            Find Articles, clauses, and provisions from the Constitution of
            Bangladesh.
          </p>
        </div>

        <SearchBar
          key={initialQuery}
          initialQuery={initialQuery}
          onSearch={handleSearch}
          isLoading={displayStatus === "loading"}
        />
      </div>

      {displayStatus === "idle" ? (
        <EmptySearchState
          title="Enter a search query"
          description="Use the search box above to look up constitutional provisions."
        />
      ) : null}

      {displayStatus === "loading" ? (
        <EmptySearchState
          title="Searching..."
          description="Looking through the Constitution for matching provisions."
        />
      ) : null}

      {displayStatus === "error" ? (
        <EmptySearchState
          title="Search failed"
          description={errorMessage ?? "Something went wrong while searching."}
        />
      ) : null}

      {displayStatus === "success" && results.length === 0 ? (
        <EmptySearchState
          title="No results found"
          description={`We could not find any provisions matching "${trimmedQuery}". Try a different phrase or Article number.`}
        />
      ) : null}

      {displayStatus === "success" && results.length > 0 ? (
        <SearchResults query={trimmedQuery} results={results} />
      ) : null}
    </main>
  );
}
