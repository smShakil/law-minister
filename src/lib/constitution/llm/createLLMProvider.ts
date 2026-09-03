import type { LLMGenerateInput, LLMProvider } from "./LLMProvider";
import { AnswerResponseSchema, GROUNDING_SYSTEM_PROMPT } from "./LLMProvider";

interface OpenAIChatResponse {
  choices: Array<{
    message: {
      content: string | null;
    };
  }>;
}

function extractJson(content: string): string {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) {
    return fenced[1].trim();
  }
  return content.trim();
}

export class OpenAILLMProvider implements LLMProvider {
  readonly model: string;

  constructor(model: string) {
    this.model = model;
  }

  private getApiKey(): string {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not configured.");
    }
    return apiKey;
  }

  async generateAnswer(input: LLMGenerateInput) {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.getApiKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: GROUNDING_SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              `Question: ${input.question}`,
              "",
              "Constitutional context:",
              input.contextPrompt,
              "",
              "Respond with JSON: { answer, citations: [{ sourceId, articleNumber, clause? }], insufficientContext }",
            ].join("\n"),
          },
        ],
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      throw new Error(`LLM request failed with status ${response.status}.`);
    }

    const payload = (await response.json()) as OpenAIChatResponse;
    const content = payload.choices[0]?.message?.content;
    if (!content) {
      throw new Error("LLM returned an empty response.");
    }

    const parsed = JSON.parse(extractJson(content));
    return AnswerResponseSchema.parse(parsed);
  }
}

export class MockLLMProvider implements LLMProvider {
  readonly model = "mock";

  async generateAnswer(input: LLMGenerateInput) {
    const first = input.context[0];
    return AnswerResponseSchema.parse({
      answer: first
        ? `Based on the retrieved constitutional text, ${first.articleTitle ?? `Article ${first.articleNumber}`} is relevant to your question.`
        : "The supplied constitutional context is insufficient to answer this question.",
      citations: first
        ? [
            {
              sourceId: first.sourceId,
              articleNumber: first.articleNumber,
              clause: first.clause,
            },
          ]
        : [],
      insufficientContext: input.context.length === 0,
    });
  }
}

export function createLLMProvider(): LLMProvider {
  const provider = process.env.LLM_PROVIDER ?? "mock";
  const model = process.env.LLM_MODEL ?? "gpt-4o-mini";

  switch (provider) {
    case "openai":
      return new OpenAILLMProvider(model);
    case "mock":
    default:
      return new MockLLMProvider();
  }
}
