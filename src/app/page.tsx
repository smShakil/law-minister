"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { EmptySearchState } from "@/components/EmptySearchState";
import { SearchBar } from "@/components/SearchBar";

export default function HomePage() {
  const router = useRouter();

  function handleSearch(query: string) {
    if (!query) {
      return;
    }

    router.push(`/search?q=${encodeURIComponent(query)}`);
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-gradient-to-b from-emerald-50 via-white to-white px-6 py-16">
      <div className="flex w-full max-w-4xl flex-col items-center gap-8 text-center">
        <div className="space-y-4">
          <p className="text-4xl" aria-hidden="true">
            🇧🇩
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Bangladesh Constitution
          </h1>
          <p className="text-lg text-slate-600">
            Search and ask questions about the Constitution
          </p>
        </div>

        <SearchBar onSearch={handleSearch} />

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/search"
            className="rounded-xl border border-emerald-200 bg-white px-5 py-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50"
          >
            Open Search
          </Link>
          <Link
            href="/ask"
            className="rounded-xl bg-violet-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-800"
          >
            Ask a Question
          </Link>
        </div>

        <p className="max-w-xl text-sm leading-7 text-slate-500">
          Use deterministic search for exact lookups, or ask a question to receive
          a grounded AI explanation with cited constitutional sources.
        </p>

        <EmptySearchState
          title="Try a search or question"
          description='Search for "freedom of speech" or ask "What does Article 39 say?"'
        />
      </div>
    </main>
  );
}
