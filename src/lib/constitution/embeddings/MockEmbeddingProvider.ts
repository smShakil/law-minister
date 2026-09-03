import { createHash } from "node:crypto";

import { EMBEDDING_DIMENSION } from "../config";
import type { EmbeddingProvider } from "./EmbeddingProvider";

function hashToVector(text: string, dimension: number): number[] {
  const vector = new Array<number>(dimension).fill(0);
  const hash = createHash("sha256").update(text).digest();

  for (let index = 0; index < dimension; index += 1) {
    const byte = hash[index % hash.length];
    vector[index] = (byte / 127.5) - 1;
  }

  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  if (magnitude === 0) {
    return vector;
  }

  return vector.map((value) => value / magnitude);
}

export class HashEmbeddingProvider implements EmbeddingProvider {
  readonly model: string;
  readonly dimension: number;

  constructor(model = "hash-local", dimension = EMBEDDING_DIMENSION) {
    this.model = model;
    this.dimension = dimension;
  }

  async embed(text: string): Promise<number[]> {
    return hashToVector(text, this.dimension);
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map((text) => this.embed(text)));
  }
}

export class MockEmbeddingProvider extends HashEmbeddingProvider {
  constructor() {
    super("mock", EMBEDDING_DIMENSION);
  }
}
