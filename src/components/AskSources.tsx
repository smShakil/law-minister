import Link from "next/link";

import { getArticleUrl } from "@/lib/constitution/normalize";
import type { AskSource } from "@/lib/constitution/ask/types";

interface AskSourcesProps {
  sources: AskSource[];
}

function formatSourceLabel(source: AskSource): string {
  let label = `Article ${source.articleNumber}`;
  if (source.clause) {
    label += `(${source.clause})`;
  }
  if (source.subClause) {
    label += `(${source.subClause})`;
  }
  return label;
}

export function AskSources({ sources }: AskSourcesProps) {
  if (sources.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">
          Constitutional Sources
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Exact constitutional text retrieved to ground the answer.
        </p>
      </div>

      <div className="space-y-4">
        {sources.map((source) => (
          <article
            key={source.sourceId}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="mb-3 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {formatSourceLabel(source)}
                </h3>
                {source.title ? (
                  <p className="text-sm text-slate-600">{source.title}</p>
                ) : null}
              </div>
              <Link
                href={getArticleUrl(source.articleNumber, source.clause)}
                className="shrink-0 text-sm font-semibold text-violet-700 hover:text-violet-900"
              >
                View Article
              </Link>
            </div>
            <blockquote className="border-l-4 border-violet-200 pl-4 text-sm leading-7 text-slate-700">
              {source.text}
            </blockquote>
          </article>
        ))}
      </div>
    </section>
  );
}
