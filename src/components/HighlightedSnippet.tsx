import { escapeRegExp } from "@/lib/constitution/snippets";

interface HighlightedSnippetProps {
  text: string;
  terms: string[];
}

export function HighlightedSnippet({ text, terms }: HighlightedSnippetProps) {
  if (!text) {
    return null;
  }

  const uniqueTerms = [...new Set(terms.filter(Boolean))].sort(
    (left, right) => right.length - left.length,
  );

  if (uniqueTerms.length === 0) {
    return <p className="text-sm leading-7 text-slate-600">{text}</p>;
  }

  const pattern = new RegExp(
    `(${uniqueTerms.map((term) => escapeRegExp(term)).join("|")})`,
    "gi",
  );
  const parts = text.split(pattern);

  return (
    <p className="text-sm leading-7 text-slate-600">
      {parts.map((part, index) => {
        const isMatch = uniqueTerms.some(
          (term) => part.toLowerCase() === term.toLowerCase(),
        );

        if (isMatch) {
          return (
            <mark
              key={`${part}-${index}`}
              className="rounded bg-emerald-100 px-1 text-emerald-900"
            >
              {part}
            </mark>
          );
        }

        return <span key={`${part}-${index}`}>{part}</span>;
      })}
    </p>
  );
}
