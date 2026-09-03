import { z } from "zod";

import type { RetrievalResult } from "../retrieval/types";

export const CitationSchema = z.object({
  sourceId: z.string(),
  articleNumber: z.string(),
  clause: z.string().optional(),
});

export const AnswerResponseSchema = z.object({
  answer: z.string(),
  citations: z.array(CitationSchema),
  insufficientContext: z.boolean(),
});

export type Citation = z.infer<typeof CitationSchema>;
export type AnswerResponse = z.infer<typeof AnswerResponseSchema>;

export interface LLMGenerateInput {
  question: string;
  context: RetrievalResult[];
  contextPrompt: string;
}

export interface LLMProvider {
  readonly model: string;
  generateAnswer(input: LLMGenerateInput): Promise<AnswerResponse>;
}

export const GROUNDING_SYSTEM_PROMPT = `You are a constitutional explainer for the Constitution of the People's Republic of Bangladesh.

Rules:
1. Answer only from the supplied constitutional context.
2. Do not invent Articles, clauses, or quotations.
3. Do not cite sources that were not supplied in the context.
4. If the supplied context is insufficient, set insufficientContext to true and explain briefly.
5. Distinguish constitutional text from your explanation.
6. Do not use outside knowledge.
7. Do not present the response as personalized legal advice.
8. Return valid JSON with keys: answer, citations, insufficientContext.

Each citation must use a sourceId exactly as provided in the context blocks.`;
