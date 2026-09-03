import { EMBEDDING_DIMENSION } from "../config";
import type { EmbeddingProvider } from "./EmbeddingProvider";
import { HashEmbeddingProvider } from "./MockEmbeddingProvider";

interface OpenAIEmbeddingResponse {
  data: Array<{ embedding: number[]; index: number }>;
}

export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  readonly model: string;
  readonly dimension: number;

  constructor(model: string) {
    this.model = model;
    this.dimension = EMBEDDING_DIMENSION;
  }

  private getApiKey(): string {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not configured.");
    }
    return apiKey;
  }

  async embed(text: string): Promise<number[]> {
    const [embedding] = await this.embedBatch([text]);
    return embedding;
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
      return [];
    }

    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.getApiKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        input: texts,
      }),
    });

    if (!response.ok) {
      throw new Error(`Embedding request failed with status ${response.status}.`);
    }

    const payload = (await response.json()) as OpenAIEmbeddingResponse;
    return payload.data
      .sort((left, right) => left.index - right.index)
      .map((item) => item.embedding);
  }
}

export function createEmbeddingProvider(): EmbeddingProvider {
  const provider = process.env.EMBEDDING_PROVIDER ?? "hash";
  const model = process.env.EMBEDDING_MODEL ?? "text-embedding-3-small";

  switch (provider) {
    case "openai":
      return new OpenAIEmbeddingProvider(model);
    case "mock":
    case "hash":
    default:
      return new HashEmbeddingProvider(model);
  }
}
