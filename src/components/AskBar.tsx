"use client";

import { FormEvent, useState } from "react";

interface AskBarProps {
  initialQuestion?: string;
  onAsk: (question: string) => void;
  isLoading?: boolean;
}

export function AskBar({
  initialQuestion = "",
  onAsk,
  isLoading = false,
}: AskBarProps) {
  const [question, setQuestion] = useState(initialQuestion);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onAsk(question.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl">
      <div className="flex items-center gap-3 rounded-2xl border border-violet-200 bg-white p-2 shadow-sm">
        <input
          type="text"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask a constitutional question..."
          aria-label="Ask a constitutional question"
          className="flex-1 bg-transparent px-4 py-3 text-base text-slate-900 outline-none placeholder:text-slate-400"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-xl bg-violet-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Thinking..." : "Ask"}
        </button>
      </div>
    </form>
  );
}
