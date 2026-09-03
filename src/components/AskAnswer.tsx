interface AskAnswerProps {
  answer: string;
  insufficientContext?: boolean;
}

export function AskAnswer({ answer, insufficientContext = false }: AskAnswerProps) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Answer</h2>
        <p className="mt-1 text-sm text-slate-600">
          {insufficientContext
            ? "The system could not find enough relevant constitutional context."
            : "AI-generated explanation grounded in retrieved constitutional text."}
        </p>
      </div>

      <div
        className={`rounded-2xl border p-5 shadow-sm ${
          insufficientContext
            ? "border-amber-200 bg-amber-50"
            : "border-violet-100 bg-white"
        }`}
      >
        <p className="whitespace-pre-wrap text-sm leading-7 text-slate-800">
          {answer}
        </p>
      </div>
    </section>
  );
}
