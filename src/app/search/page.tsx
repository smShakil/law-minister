import { Suspense } from "react";

import SearchPageContent from "./SearchPageContent";

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-10">
          <p className="text-sm text-slate-600">Loading search...</p>
        </main>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
