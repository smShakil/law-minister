import { NextRequest, NextResponse } from "next/server";

import {
  DEFAULT_SEARCH_LIMIT,
  MAX_QUERY_LENGTH,
  MAX_SEARCH_LIMIT,
} from "@/lib/constitution/config";
import { isEmptyQuery, searchConstitution } from "@/lib/constitution/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const rawQuery = searchParams.get("q");
  const rawLimit = searchParams.get("limit");

  if (rawQuery === null) {
    return NextResponse.json(
      { error: "Query parameter 'q' is required." },
      { status: 400 },
    );
  }

  if (isEmptyQuery(rawQuery)) {
    return NextResponse.json(
      { error: "Query parameter 'q' must not be empty." },
      { status: 400 },
    );
  }

  if (rawQuery.length > MAX_QUERY_LENGTH) {
    return NextResponse.json(
      {
        error: `Query parameter 'q' must be at most ${MAX_QUERY_LENGTH} characters.`,
      },
      { status: 400 },
    );
  }

  let limit = DEFAULT_SEARCH_LIMIT;
  if (rawLimit !== null) {
    const parsedLimit = Number.parseInt(rawLimit, 10);
    if (Number.isNaN(parsedLimit) || parsedLimit < 1) {
      return NextResponse.json(
        { error: "Query parameter 'limit' must be a positive integer." },
        { status: 400 },
      );
    }

    limit = Math.min(parsedLimit, MAX_SEARCH_LIMIT);
  }

  const results = searchConstitution(rawQuery, { limit });

  return NextResponse.json({
    query: rawQuery.trim(),
    results,
    total: results.length,
  });
}
