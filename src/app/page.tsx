"use client";

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
          <p className="text-lg text-slate-600">Search the Constitution</p>
        </div>

        <SearchBar onSearch={handleSearch} />

        <p className="max-w-xl text-sm leading-7 text-slate-500">
          Search Articles, clauses, and provisions using deterministic keyword
          search. No AI — just the authoritative constitutional text.
        </p>

        <EmptySearchState
          title="Try a search"
          description='Enter a phrase like "freedom of speech", a topic like "personal liberty", or a direct reference like "Article 32".'
        />
      </div>
    </main>
  );
}
