import Link from "next/link";
import { notFound } from "next/navigation";

import { getArticleByNumber, getPartForArticle } from "@/lib/constitution/server";

interface ArticlePageProps {
  params: Promise<{
    articleNumber: string;
  }>;
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { articleNumber } = await params;
  const decodedArticleNumber = decodeURIComponent(articleNumber);
  const article = getArticleByNumber(decodedArticleNumber);

  if (!article) {
    notFound();
  }

  const part = getPartForArticle(article.article);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-10">
      <Link href="/search" className="text-sm font-semibold text-emerald-700">
        ← Back to search
      </Link>

      <article className="space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Article {article.article}
          </p>
          <h1 className="text-3xl font-bold text-slate-900">{article.title}</h1>
          {part.part ? (
            <p className="text-sm text-slate-500">
              Part {part.part}
              {part.partTitle ? `: ${part.partTitle}` : ""}
            </p>
          ) : null}
        </div>

        <div className="space-y-4 text-base leading-8 text-slate-700">
          <p>{article.text}</p>

          {article.clauses.map((clause) => (
            <section
              key={clause.clause}
              id={`clause-${clause.clause}`}
              className="scroll-mt-24 border-t border-slate-100 pt-4"
            >
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                Clause ({clause.clause})
              </h2>
              <p>{clause.text}</p>
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}

export async function generateStaticParams() {
  const { loadConstitutionDataset } = await import("@/lib/constitution/server");
  const dataset = loadConstitutionDataset();

  return dataset.articles.map((article) => ({
    articleNumber: article.article,
  }));
}
