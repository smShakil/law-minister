import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { askConstitution } from "@/lib/constitution/ask/askConstitution";
import { MAX_ASK_QUESTION_LENGTH } from "@/lib/constitution/config";
import { isEmptyQuery } from "@/lib/constitution/search";
import { isDatabaseConfigured } from "@/lib/db/client";

const AskRequestSchema = z.object({
  question: z.string(),
});

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = AskRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { question } = parsed.data;

  if (isEmptyQuery(question)) {
    return NextResponse.json(
      { error: "Question must not be empty." },
      { status: 400 },
    );
  }

  if (question.length > MAX_ASK_QUESTION_LENGTH) {
    return NextResponse.json(
      {
        error: `Question must be at most ${MAX_ASK_QUESTION_LENGTH} characters.`,
      },
      { status: 400 },
    );
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      {
        error:
          "The question-answering service is not available. Database configuration is missing.",
      },
      { status: 503 },
    );
  }

  try {
    const response = await askConstitution(question);
    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      {
        error:
          "Unable to generate an answer right now. Please try again later.",
      },
      { status: 500 },
    );
  }
}
