# Phase 3 — RAG: Query Processing, Hybrid Retrieval & Grounded AI Answers

We are building a web application that answers user questions based **only on the Constitution of the People’s Republic of Bangladesh**.

## Existing project

Phase 0:
- Obtained the Constitution source.
- Created a structured JSON representation of the Constitution.
- The JSON preserves the constitutional hierarchy such as Parts, Articles, clauses and sub-clauses.

Phase 2:
- Created the initial Next.js + TypeScript + React + Tailwind application.
- Added deterministic constitutional lexical search.
- Added query normalization/basic Article reference detection.
- Added search API.
- Added frontend search UI.
- Added tests.

Now implement **Phase 3: RAG**.

The goal of this phase is to introduce:

```text
User Question
      ↓
Query Processing
      ↓
Hybrid Retrieval
 ┌────┴─────┐
 ↓          ↓
Lexical   Semantic
Search    Vector Search
 └────┬─────┘
      ↓
Hybrid Ranking
      ↓
Relevant Constitutional Provisions
      ↓
Context Builder
      ↓
LLM
      ↓
Grounded Answer
      ↓
Article/Clause Citations
```

Do not replace or unnecessarily rewrite the Phase 2 implementation.

---

# 1. First inspect the existing project

Before writing code:

1. Inspect the complete existing project structure.
2. Inspect `package.json`.
3. Inspect the existing Constitution JSON.
4. Inspect the existing search implementation.
5. Inspect existing API routes.
6. Inspect existing query-processing utilities.
7. Inspect existing tests.
8. Understand the current TypeScript types/interfaces.
9. Reuse existing code wherever practical.

Do NOT blindly recreate functionality that already exists.

If the Phase 2 implementation differs from assumptions in this prompt, adapt to the actual project.

Do not introduce unnecessary architectural changes.

---

# 2. Phase 3 objectives

Implement these capabilities:

### A. Improved query processing

Convert the user's raw question into a structured retrieval query.

It should support:

- query normalization
- Article reference detection
- clause reference detection where practical
- extraction of useful search terms
- preservation of meaningful constitutional/legal terms
- detection of explicit Article numbers

Example:

```text
"What does Article 39 say?"
```

should identify:

```text
detectedArticles: ["39"]
```

Example:

```text
"Can freedom of speech be restricted by law?"
```

should produce a normalized search query suitable for both lexical and semantic retrieval.

Do not use an LLM for query processing in this phase.

Use deterministic logic first.

---

# 3. Query processing design

Create a clear query-processing abstraction.

For example:

```ts
interface ProcessedQuery {
  originalQuery: string;
  normalizedQuery: string;
  detectedArticles: string[];
  detectedClauses: string[];
  searchTerms: string[];
}
```

The exact interface may be adapted to the existing project.

Create appropriate modules, for example:

```text
src/constitution/query/
  normalizeQuery.ts
  detectArticleReferences.ts
  processQuery.ts
```

Do not duplicate existing Phase 2 utilities. Refactor/reuse them if appropriate.

---

# 4. Article reference detection

The retrieval system must give special treatment to explicit constitutional references.

Examples:

```text
Article 39
article 39
Article 39(2)
Article 32
Articles 31 and 32
Article 39 clause 2
```

At minimum, reliably detect standard Article references.

If the user explicitly asks about an Article, that Article should receive a strong retrieval boost.

For example:

```text
"What does Article 39 say?"
```

should strongly prioritize:

```text
Article 39
```

over semantically related Articles.

Do not allow semantic similarity to override an obvious exact Article reference.

---

# 5. PostgreSQL + pgvector

Introduce PostgreSQL as the retrieval/index database.

Use `pgvector` for semantic vector search.

Important architectural principle:

> The existing Constitution JSON remains the canonical source representation.

The database is an indexed/retrieval representation of that source.

Do not make the database the only source of constitutional truth.

---

# 6. Constitutional document/chunk model

Do NOT blindly split the Constitution into arbitrary fixed-size chunks.

The Constitution has a meaningful hierarchy.

Preserve:

```text
Part
  ↓
Article
  ↓
Clause
  ↓
Sub-clause
```

Create retrieval documents/chunks according to constitutional structure.

For example:

```text
Article 39
```

may contain multiple retrievable units:

```text
Article 39

Article 39(1)

Article 39(2)

Article 39(2)(a)

Article 39(2)(b)

...
```

Use the smallest meaningful unit where practical, while retaining enough surrounding context for interpretation.

Every retrieval document should have stable identifiers.

Example:

```text
article-39
article-39-clause-1
article-39-clause-2
article-39-clause-2-a
```

The exact IDs should follow the actual Constitution JSON structure.

---

# 7. Database schema

Design a simple schema for constitutional retrieval documents.

For example:

```text
constitution_documents

id
source_id
part_number
article_number
clause
sub_clause
title
text
content_hash
embedding
created_at
updated_at
```

Adapt the schema to the actual project.

Important:

- `source_id` must be stable.
- `content_hash` should allow detection of unchanged content.
- The original constitutional text must be preserved exactly.
- Metadata must allow the UI to generate useful citations.

Add appropriate indexes.

Use pgvector's appropriate vector index for the chosen embedding dimension/database setup.

Do not over-engineer the database.

---

# 8. Embedding provider abstraction

Do not tightly couple the application to one embedding vendor.

Create an abstraction such as:

```ts
interface EmbeddingProvider {
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
}
```

The exact API may differ.

The application should be able to use a configurable provider/model through environment variables.

For example:

```env
EMBEDDING_PROVIDER=
EMBEDDING_MODEL=
```

Do not hard-code API keys.

Keep the provider implementation isolated so that a local embedding model can be introduced later.

---

# 9. Constitution indexing pipeline

Create an indexing process that:

1. Reads the canonical Constitution JSON.
2. Converts constitutional structures into retrieval documents.
3. Generates embeddings.
4. Stores documents and embeddings in PostgreSQL.
5. Stores stable source IDs.
6. Stores content hashes.
7. Avoids unnecessarily regenerating embeddings for unchanged documents.

Create a command such as:

```bash
npm run constitution:index
```

The command should be safe to run multiple times.

It should behave approximately like:

```text
JSON
 ↓
Parse
 ↓
Create constitutional retrieval documents
 ↓
Calculate content hash
 ↓
Compare existing hash
 ↓
Generate embedding only when needed
 ↓
Insert/update database
```

Provide useful progress/error output.

---

# 10. Lexical retrieval

Reuse the Phase 2 lexical search implementation where practical.

The lexical retrieval layer should search the constitutional database/index and return structured results.

For example:

```ts
interface RetrievalResult {
  sourceId: string;
  articleNumber: string;
  clause?: string;
  title?: string;
  text: string;

  lexicalScore: number;
  semanticScore: number;
  referenceBoost: number;
  hybridScore: number;
}
```

Adapt this to the actual project.

Lexical search should be good at:

- exact constitutional terminology
- exact phrases
- Article numbers
- names
- specific legal wording
- keyword matches

---

# 11. Semantic/vector retrieval

Create a vector retrieval layer using pgvector.

Flow:

```text
User query
    ↓
Embedding Provider
    ↓
Query embedding
    ↓
pgvector similarity search
    ↓
Top semantic results
```

Return structured retrieval results.

Do not send the entire Constitution to the embedding model or LLM.

Retrieve only relevant constitutional provisions.

---

# 12. Hybrid retrieval

This is a core requirement of Phase 3.

Do NOT use vector search alone.

Implement:

```text
Lexical Search
      +
Semantic Search
      ↓
Merge
      ↓
Deduplicate
      ↓
Rank
      ↓
Top relevant sources
```

Initially retrieve more candidates from each method than the final number required.

For example:

```text
Lexical → top 10
Semantic → top 10

       ↓

Merge + deduplicate

       ↓

Rank

       ↓

Top 5–8 sources
```

Make the candidate counts configurable.

---

# 13. Hybrid scoring

Implement a deterministic, configurable ranking system.

For example:

```text
hybridScore =
    lexicalWeight * lexicalScore
  + semanticWeight * semanticScore
  + referenceWeight * referenceBoost
```

Initial configuration may be:

```text
lexicalWeight  = 0.35
semanticWeight = 0.45
referenceWeight = 0.20
```

These are initial values, not permanent assumptions.

Put them in configuration rather than scattering magic numbers throughout the code.

For example:

```env
RETRIEVAL_LEXICAL_WEIGHT=0.35
RETRIEVAL_SEMANTIC_WEIGHT=0.45
RETRIEVAL_REFERENCE_WEIGHT=0.20
```

Normalize scores where necessary so the different retrieval systems can be combined meaningfully.

---

# 14. Explicit Article-reference boost

If the query contains an explicit Article reference, apply a deterministic boost.

Example:

```text
User:
"What does Article 39 say?"
```

Then:

```text
Article 39
referenceBoost = high
```

while unrelated Articles receive:

```text
referenceBoost = 0
```

This is extremely important.

If the user asks for Article 39, Article 39 should be prioritized even if another Article happens to have slightly higher semantic similarity.

Do not allow an LLM to decide this.

---

# 15. Example hybrid retrieval

For:

```text
"Can freedom of speech be restricted by law?"
```

the system might produce:

```text
Lexical results:

Article 39 → 0.91
Article 26 → 0.63
Article 27 → 0.42
```

Semantic results:

```text
Article 39 → 0.95
Article 44 → 0.78
Article 26 → 0.73
```

After merging and ranking:

```text
1. Article 39
2. Article 26
3. Article 44
...
```

The exact scores are illustrative only.

Do not hard-code these example values.

---

# 16. Retrieval thresholds

Do not always answer regardless of retrieval quality.

Introduce a minimum retrieval-confidence mechanism.

If the system cannot find sufficiently relevant constitutional material:

```text
User question
     ↓
Poor retrieval
     ↓
DO NOT ask LLM to guess
     ↓
Return an appropriate "insufficient constitutional context" response
```

This is an important hallucination-control mechanism.

The threshold should be configurable.

Do not claim that a constitutional provision is relevant when retrieval confidence is very low.

---

# 17. Context builder

Create a context builder that converts retrieved sources into the exact structured context sent to the LLM.

Example:

```text
Source: Article 39(2)

[exact constitutional text]

Source: Article 26

[exact constitutional text]
```

The context should contain:

- Article number
- clause/sub-clause
- exact source text
- stable source ID
- enough metadata to validate citations

Do not unnecessarily rewrite constitutional text before sending it to the LLM.

The source text should remain faithful to the canonical Constitution data.

---

# 18. LLM provider abstraction

Do not tightly couple the application to one LLM provider.

Create an abstraction such as:

```ts
interface LLMProvider {
  generateAnswer(input: {
    question: string;
    context: RetrievalResult[];
  }): Promise<...>;
}
```

The exact interface should fit the application.

Support configuration through environment variables.

For example:

```env
LLM_PROVIDER=
LLM_MODEL=
```

Do not put API keys in frontend code.

LLM calls must happen server-side.

---

# 19. Grounding rules for the LLM

The LLM must receive a strict system instruction.

Core rules:

1. Answer only from the supplied constitutional context.
2. Do not invent Articles.
3. Do not invent clauses.
4. Do not fabricate quotations.
5. Do not cite sources that were not retrieved.
6. If the supplied context is insufficient, explicitly say so.
7. Distinguish constitutional text from explanation.
8. Do not pretend that an interpretation is the exact constitutional wording.
9. Do not use outside web knowledge in this phase.
10. Do not present the response as personalized legal advice.

The LLM should behave primarily as an **explainer of retrieved constitutional text**, not as an independent source of constitutional facts.

---

# 20. Structured LLM output

Do not rely on free-form text alone.

Prefer structured output such as:

```ts
interface AnswerResponse {
  answer: string;
  citations: Array<{
    sourceId: string;
    articleNumber: string;
    clause?: string;
  }>;
  insufficientContext: boolean;
}
```

Use Zod or an equivalent validation library.

If the LLM produces an invalid citation:

```text
LLM citation
      ↓
Validate against retrieved source IDs
      ↓
Invalid → remove/reject
```

Never blindly trust citation IDs generated by the LLM.

---

# 21. API

Create:

```http
POST /api/constitution/ask
```

Request:

```json
{
  "question": "Can freedom of speech be restricted by law?"
}
```

Response should contain:

```json
{
  "answer": "...",
  "sources": [
    {
      "sourceId": "article-39-clause-2",
      "articleNumber": "39",
      "clause": "2",
      "text": "..."
    }
  ]
}
```

Adapt the exact response shape to the existing application architecture.

Validate the request.

Handle:

- empty questions
- excessively long questions
- embedding failures
- database failures
- LLM failures
- insufficient retrieval
- invalid LLM output

Do not expose internal errors, API keys, prompts, or database details to the client.

---

# 22. Frontend

Extend the Phase 2 UI into an AI question-answering interface.

The user should be able to:

1. Enter a constitutional question.
2. Submit it.
3. See loading state.
4. See the generated answer.
5. See the constitutional sources used.
6. Click a source to identify the Article/Clause.
7. Clearly distinguish:
   - AI explanation
   - constitutional source text

Example:

```text
Question
────────────────────────────

Can freedom of speech be restricted by law?

Answer
────────────────────────────

[AI-generated grounded explanation]

Constitutional Sources
────────────────────────────

Article 39(2)
[relevant constitutional text]

Article 26
[relevant constitutional text]
```

Keep the UI clean and simple.

Do not build chat history yet.

Do not build authentication yet.

Do not build streaming unless it is trivial within the existing architecture.

---

# 23. Search and Ask should remain separate

Keep the existing search functionality.

The application should conceptually have:

```text
Search
→ deterministic constitutional search

Ask
→ RAG + LLM grounded answer
```

Do not make the normal search endpoint dependent on an LLM.

This separation is useful for debugging retrieval quality.

---

# 24. No external knowledge in Phase 3

For this phase, the knowledge boundary is strictly:

```text
Constitution of Bangladesh
```

Do NOT include:

- general web search
- news
- Wikipedia
- case law
- Supreme Court judgments
- other Acts
- legal commentary
- blogs
- external legal databases

Those can be introduced in later phases if desired.

---

# 25. Testing

Add automated tests for the new retrieval pipeline.

At minimum test:

### Query processing

```text
"What does Article 39 say?"
→ detects Article 39
```

```text
"freedom of speech"
→ normalized correctly
```

### Hybrid retrieval

Test that:

- lexical results are included
- semantic results are included
- duplicate documents are merged
- scores are combined correctly
- Article-reference boosts work
- ranking is deterministic

### Exact Article queries

For:

```text
"What does Article 39 say?"
```

Article 39 should rank above semantically related Articles.

### Insufficient context

A question unrelated to the Constitution should not automatically result in a confident constitutional answer.

### Citation validation

An LLM citation not present in retrieved sources must be rejected.

### API

Test:

- valid request
- empty question
- invalid request
- retrieval failure
- LLM failure
- successful grounded response

Mock the embedding and LLM providers in unit tests.

Do not make automated tests depend on external paid APIs.

---

# 26. Evaluation dataset

Create a small evaluation dataset specifically for retrieval quality.

Start with approximately 30–50 questions covering:

- exact Article questions
- keyword questions
- paraphrased questions
- questions involving clauses
- questions involving multiple Articles
- questions where semantic search is necessary
- questions where exact lexical matching is necessary
- irrelevant/non-constitutional questions

For each test question, define expected relevant Articles.

Example:

```json
{
  "question": "Can freedom of speech be restricted by law?",
  "expectedArticles": ["39"]
}
```

Use this dataset to evaluate retrieval independently from the LLM.

This is important.

If the final answer is wrong, we need to know whether:

```text
Retrieval failed
```

or:

```text
LLM failed despite correct retrieval
```

---

# 27. Logging/debugging

During development, make retrieval behavior observable.

For an `ask` request, internally log or expose in development mode:

```text
Original query
Normalized query
Detected Article references

Lexical candidates
Semantic candidates

Final ranked sources
Lexical score
Semantic score
Reference boost
Hybrid score
```

Do NOT expose sensitive provider credentials or internal prompts.

A developer should be able to understand:

> "Why did Article 39 get selected for this question?"

---

# 28. Error handling

Use clear server-side error handling.

Possible failures:

```text
Database unavailable
Embedding provider unavailable
Embedding generation failed
Vector search failed
LLM unavailable
LLM returned invalid structure
No sufficiently relevant constitutional sources
```

The frontend should show user-friendly messages.

Do not leak stack traces or infrastructure details to users.

---

# 29. Environment configuration

Create/update:

```text
.env.example
```

Include placeholders for:

```env
DATABASE_URL=

EMBEDDING_PROVIDER=
EMBEDDING_MODEL=

LLM_PROVIDER=
LLM_MODEL=

RETRIEVAL_LEXICAL_WEIGHT=0.35
RETRIEVAL_SEMANTIC_WEIGHT=0.45
RETRIEVAL_REFERENCE_WEIGHT=0.20

RETRIEVAL_LEXICAL_TOP_K=10
RETRIEVAL_SEMANTIC_TOP_K=10
RETRIEVAL_FINAL_TOP_K=6

RETRIEVAL_MIN_SCORE=
```

Use sensible defaults where appropriate.

Never commit actual secrets.

---

# 30. Suggested architecture

Adapt this to the existing project rather than forcing it:

```text
src/
├── app/
│   ├── api/
│   │   └── constitution/
│   │       ├── search/
│   │       └── ask/
│   │
│   └── ...
│
├── constitution/
│   ├── query/
│   │   ├── normalizeQuery.ts
│   │   ├── detectArticleReferences.ts
│   │   └── processQuery.ts
│   │
│   ├── retrieval/
│   │   ├── lexicalSearch.ts
│   │   ├── vectorSearch.ts
│   │   ├── hybridSearch.ts
│   │   └── rankResults.ts
│   │
│   ├── indexing/
│   │   ├── buildDocuments.ts
│   │   └── indexConstitution.ts
│   │
│   ├── context/
│   │   └── buildContext.ts
│   │
│   ├── embeddings/
│   │   ├── EmbeddingProvider.ts
│   │   └── ...
│   │
│   ├── llm/
│   │   ├── LLMProvider.ts
│   │   └── ...
│   │
│   └── types/
│
├── data/
│   └── constitution.json
│
└── ...
```

Do not create unnecessary files if the existing architecture has better locations.

---

# 31. Important architectural rules

Follow these rules throughout implementation:

### Rule 1

The Constitution JSON remains the canonical source.

### Rule 2

The database is an index/retrieval layer.

### Rule 3

Use hybrid retrieval, not vector-only retrieval.

### Rule 4

Exact Article references receive deterministic priority.

### Rule 5

The LLM never gets to invent constitutional sources.

### Rule 6

LLM citations must be validated against retrieved sources.

### Rule 7

If retrieval is weak, do not ask the LLM to guess.

### Rule 8

Keep provider integrations behind abstractions.

### Rule 9

No API keys in client-side code.

### Rule 10

Do not over-engineer Phase 3.

---

# 32. Do not implement these yet

Do NOT implement:

- conversation memory
- user accounts
- authentication
- chat history
- web search
- legal case-law retrieval
- multi-document legal search
- agents
- fine-tuning
- knowledge graphs
- reranking models
- autonomous query rewriting with an LLM
- complicated evaluation platforms
- complex observability infrastructure

Keep Phase 3 focused on:

```text
Query Processing
+
Hybrid Retrieval
+
RAG
+
Grounded LLM Answer
+
Citations
```

---

# 33. Definition of Done

Phase 3 is complete when:

- [ ] Existing Phase 2 functionality still works.
- [ ] PostgreSQL is integrated.
- [ ] pgvector is configured.
- [ ] Constitution JSON can be indexed.
- [ ] Indexing is idempotent.
- [ ] Constitutional hierarchy is preserved.
- [ ] Stable source IDs exist.
- [ ] Embedding provider abstraction exists.
- [ ] Embeddings can be generated and stored.
- [ ] Lexical retrieval works.
- [ ] Semantic/vector retrieval works.
- [ ] Hybrid retrieval merges both.
- [ ] Hybrid ranking is deterministic.
- [ ] Article references receive a boost.
- [ ] Retrieval thresholds exist.
- [ ] Context builder produces grounded context.
- [ ] LLM provider abstraction exists.
- [ ] LLM answers only from supplied context.
- [ ] LLM output is validated.
- [ ] Citations are validated against retrieved sources.
- [ ] `/api/constitution/ask` works.
- [ ] Frontend can ask questions and display answers.
- [ ] Sources are displayed with Article/Clause references.
- [ ] Failure cases are handled.
- [ ] Tests are added.
- [ ] Retrieval evaluation cases are added.
- [ ] `.env.example` is updated.
- [ ] No secrets are committed.

---

# 34. Implementation approach

Implement this incrementally.

Recommended order:

```text
1. Inspect Phase 2
        ↓
2. Database setup
        ↓
3. Constitutional document builder
        ↓
4. Indexing pipeline
        ↓
5. Embedding provider
        ↓
6. Semantic/vector search
        ↓
7. Improve/reuse lexical search
        ↓
8. Hybrid retrieval
        ↓
9. Article reference boosting
        ↓
10. Retrieval evaluation/tests
        ↓
11. Context builder
        ↓
12. LLM provider
        ↓
13. Grounded answer generation
        ↓
14. Citation validation
        ↓
15. /api/constitution/ask
        ↓
16. Frontend
        ↓
17. End-to-end testing
```

After each major step, run the relevant tests and verify the implementation before moving forward.

---

# 35. Important instruction about the Constitution data

Before implementing the indexing pipeline, inspect the actual Constitution JSON currently present in the repository.

Do not assume its exact schema.

Determine:

- how Parts are represented
- how Articles are represented
- how clauses are represented
- how sub-clauses are represented
- how Article titles are represented
- how Article numbers are represented
- whether text is stored as strings, arrays, or nested objects

Build the indexing pipeline around the actual data structure.

Do not silently modify constitutional text during indexing.

If the JSON appears incomplete, malformed, or inconsistent, report that clearly rather than silently inventing or correcting constitutional content.

---

# 36. Final response after implementation

When implementation is complete, provide a concise report containing:

### Implemented

List the major components created/changed.

### Architecture

Show the final RAG flow:

```text
Question
→ Query Processing
→ Lexical Search
→ Vector Search
→ Hybrid Ranking
→ Context Builder
→ LLM
→ Citation Validation
→ Answer
```

### Files changed

List important files.

### Database

Explain the tables/indexes created.

### Commands

Show commands such as:

```bash
npm run constitution:index
npm test
npm run dev
```

using the actual commands available in the project.

### Environment variables

List required variables without exposing secrets.

### Tests

Report what was tested.

### Known limitations

Clearly mention anything intentionally deferred to a future phase.

Do not claim something works unless you actually verified it.