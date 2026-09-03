import "server-only";

import { isDevelopment } from "../config";
import { buildContext, buildContextPrompt } from "../context/buildContext";
import { createLLMProvider } from "../llm/createLLMProvider";
import { processQuery } from "../query/processQuery";
import { hybridSearch } from "../retrieval/hybridSearch";
import type { HybridSearchDebugInfo, RetrievalResult } from "../retrieval/types";
import type { AskResponse, AskSource } from "./types";
import { validateCitations } from "./validateCitations";

const INSUFFICIENT_CONTEXT_MESSAGE =
  "I could not find sufficiently relevant constitutional provisions to answer this question reliably. Please try rephrasing your question or refer to a specific Article.";

export interface AskDependencies {
  hybridSearchFn?: typeof hybridSearch;
  llmProvider?: ReturnType<typeof createLLMProvider>;
}

function toAskSources(results: RetrievalResult[]): AskSource[] {
  return results.map((result) => ({
    sourceId: result.sourceId,
    articleNumber: result.articleNumber,
    clause: result.clause,
    subClause: result.subClause,
    title: result.title ?? result.articleTitle,
    text: result.text,
  }));
}

export async function askConstitution(
  question: string,
  dependencies: AskDependencies = {},
): Promise<AskResponse> {
  const processedQuery = processQuery(question);
  const searchFn = dependencies.hybridSearchFn ?? hybridSearch;
  const llm = dependencies.llmProvider ?? createLLMProvider();

  const retrieval = await searchFn(processedQuery);

  if (!retrieval.sufficient || retrieval.results.length === 0) {
    return {
      answer: INSUFFICIENT_CONTEXT_MESSAGE,
      sources: [],
      citations: [],
      insufficientContext: true,
      debug: isDevelopment ? retrieval.debug : undefined,
    };
  }

  const context = buildContext(retrieval.results);
  const contextPrompt = buildContextPrompt(context);

  const llmResponse = validateCitations(
    await llm.generateAnswer({
      question: processedQuery.normalizedQuery,
      context: retrieval.results,
      contextPrompt,
    }),
    retrieval.results,
  );

  if (llmResponse.insufficientContext) {
    return {
      answer:
        llmResponse.answer ||
        "The retrieved constitutional context appears insufficient to answer this question.",
      sources: toAskSources(retrieval.results),
      citations: llmResponse.citations,
      insufficientContext: true,
      debug: isDevelopment ? retrieval.debug : undefined,
    };
  }

  return {
    answer: llmResponse.answer,
    sources: toAskSources(retrieval.results),
    citations: llmResponse.citations,
    insufficientContext: false,
    debug: isDevelopment ? retrieval.debug : undefined,
  };
}
