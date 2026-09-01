# Phase 2 — Build Basic Constitution Search from Scratch

We are building a web application that answers questions based on the Constitution of the People's Republic of Bangladesh.

We have completed Phase 0 and have a structured Constitution JSON dataset:

`bangladesh_constitution_structured.json`

There is currently **NO frontend and NO backend project**.

We are starting the application completely from scratch.

The current task is:

> **Phase 2 — Build Basic Search WITHOUT AI**

The goal is to create a small but clean full-stack application where users can search the Constitution and see the most relevant Articles/Clauses.

---

# 1. Important scope

This phase must NOT contain AI.

Do NOT implement:

- LLMs
- OpenAI
- Gemini
- Claude
- Ollama
- embeddings
- vector databases
- pgvector
- RAG
- semantic search
- AI-generated answers
- chatbot memory
- external web search

We are intentionally building the deterministic search foundation first.

The architecture should be designed so that AI/RAG can be added later without rewriting the application.

---

# 2. Technology stack

Create the project using:

- Next.js
- TypeScript
- App Router
- React
- Tailwind CSS

Use the current stable versions available when creating the project.

Use npm unless the environment already uses another package manager.

Do NOT introduce a separate Express/NestJS backend.

Next.js will provide both:

```text
Frontend
+
Server-side API
```

This keeps Phase 2 simple.

---

# 3. Create the project

If there is no existing project, initialize a new Next.js application.

Suggested project name:

```text
bangladesh-constitution-ai
```

Use:

```text
TypeScript: Yes
ESLint: Yes
Tailwind CSS: Yes
App Router: Yes
src directory: Yes
```

After initialization, verify that the project runs successfully with:

```bash
npm run dev
```

---

# 4. Constitution dataset

Copy the existing:

```text
bangladesh_constitution_structured.json
```

into an appropriate project location.

Prefer:

```text
src/data/bangladesh_constitution_structured.json
```

if the JSON is imported safely by the application.

However, if the dataset structure makes static importing problematic, use an appropriate server-side data location.

The dataset must NOT be exposed through an unnecessary public URL.

The browser should communicate with the server-side search API rather than downloading the entire Constitution JSON.

---

# 5. First inspect the JSON

Before implementing the search engine:

1. Inspect the actual JSON structure.
2. Identify:

- metadata
- preamble
- parts
- chapters
- articles
- clauses
- sub-clauses
- schedules
- amendment/editorial notes

3. Do not assume the schema.

Create TypeScript interfaces matching the actual JSON.

For example, conceptually:

```ts
interface ConstitutionArticle {
  article: string;
  title?: string;
  text?: string;
  clauses?: ConstitutionClause[];
}
```

But adapt the interfaces to the real dataset.

Do not invent fields that don't exist.

---

# 6. Preserve constitutional hierarchy

The application must preserve:

```text
Part
  └── Chapter
        └── Article
              └── Clause
                    └── Sub-clause
```

Do not flatten the source in a way that loses this information.

Every search result should be traceable to an exact constitutional location.

For example:

```text
Article 39
Article 39(1)
Article 39(2)(a)
```

should be distinguishable.

---

# 7. Stable IDs

Create stable identifiers for constitutional provisions.

Do NOT use array indexes as IDs.

For example:

```text
article-32
article-32-clause-1
article-39
article-39-clause-2
article-39-clause-2-a
```

If the source contains lettered Articles:

```text
article-2a
article-4a
article-7a
article-7b
article-141a
article-141b
article-141c
```

Use appropriate normalization.

The stable IDs will later be used for:

- citations
- URLs
- RAG references
- article pages
- search results

---

# 8. Application architecture

Create a clean structure similar to:

```text
src/
├── app/
│   ├── page.tsx
│   ├── search/
│   │   └── page.tsx
│   └── api/
│       └── constitution/
│           └── search/
│               └── route.ts
│
├── components/
│   ├── SearchBar.tsx
│   ├── SearchResult.tsx
│   ├── SearchResults.tsx
│   └── EmptySearchState.tsx
│
├── data/
│   └── bangladesh_constitution_structured.json
│
├── lib/
│   └── constitution/
│       ├── types.ts
│       ├── loader.ts
│       ├── normalize.ts
│       ├── search.ts
│       ├── snippets.ts
│       └── index.ts
│
└── tests/
    └── constitution-search.test.ts
```

Adapt this if Next.js conventions require a different structure.

The important principle is separation between:

```text
UI
API
search logic
data
types
```

---

# 9. Search service

Create a reusable search service.

The core API should conceptually be:

```ts
searchConstitution(
  query: string,
  options?: SearchOptions
): ConstitutionSearchResult[]
```

Example:

```ts
const results = searchConstitution("freedom of speech", {
  limit: 10,
});
```

The search service must not know anything about React components.

It should be usable independently from the API and UI.

---

# 10. Load the Constitution once

Do not read and parse the JSON file on every search request if it can be avoided.

Create a server-side loader that loads the dataset once and keeps it available in memory.

Conceptually:

```text
First request
     ↓
Load JSON
     ↓
Build searchable index
     ↓
Cache index

Later requests
     ↓
Use cached index
```

The Constitution is relatively small, so an in-memory index is sufficient for this phase.

Do not introduce a database yet.

---

# 11. Build a searchable index

When loading the Constitution, transform it into searchable records.

Conceptually:

```ts
interface SearchDocument {
  id: string;

  articleNumber: string;
  articleTitle?: string;

  part?: string;
  partTitle?: string;

  chapter?: string;
  chapterTitle?: string;

  clause?: string;
  subClause?: string;

  text: string;

  searchableText: string;
}
```

Keep the original text separate from normalized search text.

For example:

```text
text
↓
original constitutional text

searchableText
↓
lowercase/normalized text used only for matching
```

NEVER replace the original constitutional text with normalized text.

---

# 12. Query normalization

Create:

```ts
normalizeQuery(query: string): string
```

It should:

- trim whitespace
- normalize repeated whitespace
- normalize case for matching
- normalize common punctuation
- tokenize words

Support queries such as:

```text
Article 32
article 32
ARTICLE 32
Art. 32
Article 32(1)
freedom of speech
Freedom of Speech
```

Do not aggressively modify the query.

Keep the original query for display.

---

# 13. Article reference detection

Create a dedicated utility:

```ts
detectArticleReference(query: string)
```

It should recognize:

```text
Article 32
article 32
Art. 32
Article 32(1)
Article 39(2)(a)
Article 2A
Article 7B
Article 141C
```

If an explicit Article reference is detected, that Article should receive a very high relevance score.

For example:

```text
Query:
"What does Article 32 say?"
```

must return:

```text
Article 32
```

as the first result.

---

# 14. Stop words

Implement a small English stop-word list.

Examples:

```text
the
a
an
is
are
of
to
in
what
does
do
can
how
why
for
on
and
or
```

Do not remove legally meaningful words.

Keep this list small and configurable.

---

# 15. Search scoring

Implement deterministic relevance scoring.

Use configurable weights.

For example:

```ts
const SEARCH_WEIGHTS = {
  exactArticleNumber: 100,
  exactArticleTitle: 50,
  exactPhrase: 25,
  titleToken: 20,
  articleTextToken: 5,
  clauseTextToken: 4,
  subClauseTextToken: 3,
  partChapterToken: 2,
};
```

These are initial values, not immutable requirements.

Keep them in one configuration object.

Do not scatter magic numbers throughout the code.

---

# 16. Search behavior

The search engine should consider:

### 1. Exact Article reference

Highest priority.

```text
Article 32
```

→ Article 32 should rank first.

### 2. Exact phrase

```text
freedom of speech
```

→ exact phrase matches should rank highly.

### 3. Article title

If the query matches the Article title, increase its score.

### 4. Article text

Match tokens in the Article text.

### 5. Clause/sub-clause

Match specific clauses and sub-clauses.

### 6. Part/Chapter

Use these as lower-weight signals.

---

# 17. Search snippets

Implement:

```ts
createSearchSnippet(
  text: string,
  queryTokens: string[]
): string
```

The snippet should show the relevant portion of the constitutional text.

Example:

```text
...freedom of thought and conscience, and of speech, is guaranteed...
```

Do not rewrite the text.

Do not paraphrase.

Do not use AI.

Keep the original wording exactly as it appears in the source dataset.

---

# 18. Search result structure

Create a strongly typed result structure.

Conceptually:

```ts
interface ConstitutionSearchResult {
  id: string;

  articleNumber: string;
  articleTitle?: string;

  part?: string;
  partTitle?: string;

  chapter?: string;
  chapterTitle?: string;

  clause?: string;
  subClause?: string;

  snippet: string;

  score: number;

  matchReasons: string[];
}
```

Adapt it to the actual dataset.

The `id` must be stable.

---

# 19. Search API

Create:

```http
GET /api/constitution/search?q=freedom%20of%20speech
```

Support:

```text
q
limit
```

Example:

```http
GET /api/constitution/search?q=Article%2032&limit=10
```

Response:

```json
{
  "query": "Article 32",
  "results": [
    {
      "id": "article-32",
      "articleNumber": "32",
      "articleTitle": "...",
      "snippet": "...",
      "score": 100,
      "matchReasons": ["Exact Article number match"]
    }
  ],
  "total": 1
}
```

Do not return the entire Constitution with every request.

---

# 20. API validation

Validate:

```text
q
limit
```

Rules:

```text
q:
- required
- must not be empty
- reasonable maximum length

limit:
- optional
- default 10
- maximum 50
```

Do not allow arbitrary values to create unnecessary server work.

Return appropriate HTTP status codes.

---

# 21. Frontend

Create a simple clean homepage.

The primary purpose is Constitution search.

Example:

```text
┌───────────────────────────────────────────────┐
│                                               │
│       🇧🇩 Bangladesh Constitution             │
│                                               │
│       Search the Constitution                 │
│                                               │
│  ┌─────────────────────────────────────────┐  │
│  │ freedom of speech                    🔍 │  │
│  └─────────────────────────────────────────┘  │
│                                               │
│       Search Articles, clauses & provisions   │
│                                               │
└───────────────────────────────────────────────┘
```

Keep the design clean and professional.

Do not make it look like a generic AI chatbot yet.

---

# 22. Search results UI

After searching:

```text
Search results for:

"freedom of speech"

────────────────────────────────────

Article 39
Freedom of thought and conscience,
and of speech

...freedom of thought and conscience,
and of speech, is guaranteed...

[View provision]

────────────────────────────────────

Article 37
Freedom of assembly

...
```

Display:

- Article number
- Article title
- Part
- Chapter if available
- relevant snippet
- match reason where useful

Do not show unnecessary technical information to normal users.

The score can be hidden from the production UI.

---

# 23. Highlight matching terms

Highlight the matching query terms in snippets.

Example:

```text
...freedom of **speech** and expression...
```

Use UI highlighting rather than modifying the underlying source text.

Make sure highlighting is safe and does not create an XSS vulnerability.

---

# 24. Search interaction

Support:

- Enter key to search
- Search button
- loading state
- empty query state
- no-result state
- API error state

Do not make the user wait unnecessarily before seeing results.

---

# 25. Article result links

Every search result should have a stable URL.

For example:

```text
/constitution/article/32
/constitution/article/39
```

For clauses, we should eventually support:

```text
/constitution/article/39#clause-2
```

Implement the structure so this can be added cleanly.

A future Phase 2.5 or Phase 3 can build the complete Article viewer.

---

# 26. Testing

Set up a testing solution appropriate for the Next.js project.

Prefer a lightweight unit testing setup such as:

```text
Vitest
```

if no testing system already exists.

Write tests for the search service, not only the UI.

Test at least:

### Query normalization

```text
"  Article   32  "
```

### Case-insensitivity

```text
Freedom of Speech
freedom of speech
FREEDOM OF SPEECH
```

### Article references

```text
Article 32
Article 32(1)
Article 2A
Article 7B
Article 141C
```

### Exact Article ranking

```text
Article 32
```

must return Article 32 first.

### Phrase search

```text
freedom of speech
```

must rank the appropriate provision highly.

### No results

```text
xyzabc123
```

must return no results.

### Result limits

```text
limit = 5
```

must return at most 5 results.

### Empty query

```text
""
"   "
```

must not execute a meaningful search.

---

# 27. Search evaluation dataset

Create a small evaluation dataset.

For example:

```ts
const SEARCH_EVALUATION_CASES = [
  {
    query: "Article 32",
    expectedArticles: ["32"],
  },
  {
    query: "freedom of speech",
    expectedArticles: ["39"],
  },
  {
    query: "personal liberty",
    expectedArticles: ["32"],
  },
  {
    query: "fundamental rights",
    expectedArticles: ["..."],
  },
];
```

IMPORTANT:

Do not blindly use the example expected Article numbers.

Verify them against the actual uploaded Constitution dataset.

The purpose is to allow us to improve the search algorithm later.

---

# 28. Performance

The Constitution is small enough that we should keep the implementation simple.

Target architecture:

```text
Application startup/request
        ↓
Load Constitution JSON
        ↓
Build in-memory search index
        ↓
Cache index
        ↓
Search
```

Do not add:

- Redis
- Elasticsearch
- PostgreSQL
- vector DB
- external search service

at this stage.

We will revisit the storage/search architecture when implementing semantic search and RAG.

---

# 29. Security

Even though this is only a search application:

- validate API input
- escape/highlight text safely
- don't use `dangerouslySetInnerHTML` unnecessarily
- don't expose the raw JSON file publicly unless necessary
- don't execute user input as code
- don't trust query parameters

The constitutional text itself should be treated as data.

---

# 30. Legal-data integrity

This is extremely important.

The Constitution text must remain unchanged.

Search normalization is allowed internally:

```text
originalText
normalizedText
```

But:

```text
originalText
```

must always be displayed when showing constitutional text.

Never:

- paraphrase
- "correct" grammar
- rewrite
- summarize
- modernize wording
- remove brackets
- remove amendment notation

during the search/indexing process.

The source dataset is the source of truth.

---

# 31. Do NOT build AI yet

This project will eventually become:

```text
User Question
      ↓
Search
      ↓
Relevant Constitution provisions
      ↓
LLM
      ↓
Answer
      ↓
Citations
```

But right now we are implementing only:

```text
User Query
      ↓
Deterministic Search
      ↓
Relevant Constitution provisions
```

Keep the search service independent so that Phase 3 can consume it.

For example, Phase 3 should eventually be able to do:

```ts
const sources = searchConstitution(question);

const answer = await generateAnswer({
  question,
  sources,
});
```

without changing the search implementation.

---

# 32. Development process

Follow this order:

### Step 1

Create the Next.js project.

### Step 2

Run it and verify the default application works.

### Step 3

Add the Constitution JSON.

### Step 4

Inspect the real JSON schema.

### Step 5

Create TypeScript types.

### Step 6

Implement Constitution loader.

### Step 7

Implement search index.

### Step 8

Implement query normalization.

### Step 9

Implement Article-reference detection.

### Step 10

Implement scoring.

### Step 11

Implement snippets.

### Step 12

Implement API endpoint.

### Step 13

Implement frontend search page.

### Step 14

Implement result display.

### Step 15

Implement tests.

### Step 16

Run the application and manually test realistic searches.

---

# 33. Before coding

First inspect the uploaded Constitution JSON and explain briefly:

1. Its actual structure.
2. How you will map it to searchable documents.
3. Proposed project structure.
4. Search algorithm.
5. Testing approach.

Then implement it.

Do not ask unnecessary questions if you can make a reasonable engineering decision.

---

# 34. Definition of Done

Phase 2 is complete when:

- [ ] A new Next.js + TypeScript application runs.
- [ ] Constitution JSON is integrated.
- [ ] Constitution hierarchy is preserved.
- [ ] Stable Article/provision IDs exist.
- [ ] Search works without AI.
- [ ] Article number searches work.
- [ ] Lettered Article numbers work.
- [ ] Clause references can be recognized.
- [ ] Title searches work.
- [ ] Full-text searches work.
- [ ] Phrase matching works.
- [ ] Results are deterministically ranked.
- [ ] Search snippets work.
- [ ] Matching terms are highlighted safely.
- [ ] Search API works.
- [ ] Search UI works.
- [ ] No-result state works.
- [ ] Error/loading states work.
- [ ] Article results have stable URLs/IDs.
- [ ] Unit tests exist.
- [ ] Search evaluation cases exist.
- [ ] No LLM, embeddings, vector DB, or RAG has been introduced.

At the end, provide:

1. Final project structure.
2. Files created/modified.
3. Dependencies installed.
4. Search algorithm explanation.
5. API documentation.
6. Tests created.
7. Example searches tested.
8. Known limitations.
9. Recommended next step for Phase 3.

Do not implement Phase 3.
