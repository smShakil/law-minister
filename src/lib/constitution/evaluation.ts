import type { SearchEvaluationCase } from "./types";

export const SEARCH_EVALUATION_CASES: SearchEvaluationCase[] = [
  {
    query: "Article 32",
    expectedArticles: ["32"],
    description: "Direct article reference should return Article 32 first.",
  },
  {
    query: "freedom of speech",
    expectedArticles: ["39"],
    description: "Phrase search should surface Article 39 on speech.",
  },
  {
    query: "personal liberty",
    expectedArticles: ["32"],
    description: "Article 32 protects life and personal liberty.",
  },
  {
    query: "fundamental rights",
    expectedArticles: ["26", "27"],
    description:
      "Fundamental rights queries should surface Part III provisions such as Articles 26 and 27.",
  },
  {
    query: "state religion",
    expectedArticles: ["2A"],
    description: "Title search should find the state religion article.",
  },
  {
    query: "freedom of assembly",
    expectedArticles: ["37"],
    description: "Assembly rights are guaranteed in Article 37.",
  },
];
