"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { AskAnswer } from "@/components/AskAnswer";
import { AskBar } from "@/components/AskBar";
import { AskSources } from "@/components/AskSources";
import { EmptySearchState } from "@/components/EmptySearchState";
import type { AskResponse } from "@/lib/constitution/ask/types";

type AskStatus = "idle" | "loading" | "success" | "error";

export default function AskPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuestion = searchParams.get("q") ?? "";
  const trimmedQuestion = initialQuestion.trim();
  const [response, setResponse] = useState<AskResponse | null>(null);
  const [status, setStatus] = useState<AskStatus>(
    trimmedQuestion ? "loading" : "idle",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!trimmedQuestion) {
      return;
    }

    let cancelled = false;

    async function runAsk() {
      setStatus("loading");
      setErrorMessage(null);

      try {
        const apiResponse = await fetch("/api/constitution/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: trimmedQuestion }),
        });
        const payload = await apiResponse.json();

        if (!apiResponse.ok) {
          throw new Error(payload.error ?? "Unable to generate an answer.");
        }

        if (!cancelled) {
          setResponse(payload as AskResponse);
          setStatus("success");
        }
      } catch (error) {
        if (!cancelled) {
          setStatus("error");
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to generate an answer.",
          );
        }
      }
    }

    void runAsk();

    return () => {
      cancelled = true;
    };
  }, [trimmedQuestion]);

  function handleAsk(nextQuestion: string) {
    if (!nextQuestion) {
      return;
    }

    router.push(`/ask?q=${encodeURIComponent(nextQuestion)}`);
  }

  const displayStatus = trimmedQuestion ? status : "idle";

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-10">
      <div className="flex items-center justify-between gap-4">
        <Link href="/" className="text-sm font-semibold text-violet-700">
          ← Bangladesh Constitution
        </Link>
        <Link href="/search" className="text-sm font-semibold text-emerald-700">
          Search →
        </Link>
      </div>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Ask the Constitution</h1>
          <p className="mt-2 text-sm text-slate-600">
            Ask a question and receive a grounded answer with cited constitutional
            sources. Answers are based only on retrieved provisions.
          </p>
        </div>

        <AskBar
          key={initialQuestion}
          initialQuestion={initialQuestion}
          onAsk={handleAsk}
          isLoading={displayStatus === "loading"}
        />
      </div>

      {displayStatus === "idle" ? (
        <EmptySearchState
          title="Enter a question"
          description='Try "Can freedom of speech be restricted by law?" or "What does Article 39 say?"'
        />
      ) : null}

      {displayStatus === "loading" ? (
        <EmptySearchState
          title="Generating answer..."
          description="Retrieving relevant constitutional provisions and preparing a grounded response."
        />
      ) : null}

      {displayStatus === "error" ? (
        <EmptySearchState
          title="Unable to answer"
          description={errorMessage ?? "Something went wrong while generating an answer."}
        />
      ) : null}

      {displayStatus === "success" && response ? (
        <div className="space-y-8">
          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Question
            </p>
            <p className="mt-2 text-base text-slate-900">{trimmedQuestion}</p>
          </section>

          <AskAnswer
            answer={response.answer}
            insufficientContext={response.insufficientContext}
          />
          <AskSources sources={response.sources} />
        </div>
      ) : null}
    </main>
  );
}
