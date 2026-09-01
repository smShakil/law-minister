import { DEFAULT_SEARCH_LIMIT, MAX_SEARCH_LIMIT } from "./config";

export function parseSearchLimit(rawLimit: string | null): number {
  if (rawLimit === null) {
    return DEFAULT_SEARCH_LIMIT;
  }

  const parsed = Number.parseInt(rawLimit, 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    return DEFAULT_SEARCH_LIMIT;
  }

  return Math.min(parsed, MAX_SEARCH_LIMIT);
}

export function buildSearchApiUrl(query: string, limit: number): string {
  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
  });

  return `/api/constitution/search?${params.toString()}`;
}

export function buildSearchPageUrl(query: string, limit?: number): string {
  const params = new URLSearchParams({ q: query });

  if (limit !== undefined && limit !== DEFAULT_SEARCH_LIMIT) {
    params.set("limit", String(limit));
  }

  return `/search?${params.toString()}`;
}
