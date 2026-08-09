import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

/**
 * Provider swap = change three env vars in the Vercel dashboard. No code.
 * Featherless (hackathon sponsor) is the default; any OpenAI-compatible
 * endpoint (OpenRouter, Groq, …) drops in identically.
 */

export function isMockMode(): boolean {
  return process.env.LLM_MOCK === "1";
}

export function isProviderConfigured(): boolean {
  return Boolean(
    process.env.LLM_BASE_URL &&
      process.env.LLM_API_KEY &&
      process.env.LLM_MODEL_ID,
  );
}

export function getExtractionModel() {
  const provider = createOpenAICompatible({
    name: "llm",
    baseURL: process.env.LLM_BASE_URL as string,
    apiKey: process.env.LLM_API_KEY as string,
  });
  return provider(process.env.LLM_MODEL_ID as string);
}
