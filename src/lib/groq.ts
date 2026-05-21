import { createOpenAI } from "@ai-sdk/openai";

// Groq is OpenAI-compatible — only the baseURL differs
export const groq = createOpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});
