const SNIPPET_RADIUS = 80;
const ELLIPSIS = "...";

export function createSearchSnippet(
  text: string,
  queryTokens: string[],
): string {
  if (!text) {
    return "";
  }

  if (queryTokens.length === 0) {
    return truncateText(text, 220);
  }

  const normalizedText = text.toLowerCase();
  let bestIndex = -1;
  let bestScore = -1;

  for (const token of queryTokens) {
    const index = normalizedText.indexOf(token.toLowerCase());
    if (index === -1) {
      continue;
    }

    const score = token.length;
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  }

  if (bestIndex === -1) {
    const phrase = queryTokens.join(" ");
    const phraseIndex = normalizedText.indexOf(phrase.toLowerCase());
    if (phraseIndex !== -1) {
      bestIndex = phraseIndex;
    }
  }

  if (bestIndex === -1) {
    return truncateText(text, 220);
  }

  const start = Math.max(0, bestIndex - SNIPPET_RADIUS);
  const end = Math.min(text.length, bestIndex + SNIPPET_RADIUS);
  const prefix = start > 0 ? ELLIPSIS : "";
  const suffix = end < text.length ? ELLIPSIS : "";

  return `${prefix}${text.slice(start, end).trim()}${suffix}`;
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength).trim()}${ELLIPSIS}`;
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
