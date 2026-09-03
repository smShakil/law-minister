#!/usr/bin/env tsx

import { closePool } from "../src/lib/db/client";
import { indexConstitution } from "../src/lib/constitution/indexing/indexConstitution";

async function main() {
  console.log("Starting constitution indexing...");

  try {
    const result = await indexConstitution();
    console.log("Indexing complete.");
    console.log(`  Total documents: ${result.total}`);
    console.log(`  Inserted:        ${result.inserted}`);
    console.log(`  Updated:         ${result.updated}`);
    console.log(`  Skipped:         ${result.skipped}`);
    console.log(`  Embeddings:      ${result.embedded}`);
  } catch (error) {
    console.error("Indexing failed.");
    if (error instanceof Error) {
      console.error(error.message);
    }
    process.exitCode = 1;
  } finally {
    await closePool();
  }
}

void main();
