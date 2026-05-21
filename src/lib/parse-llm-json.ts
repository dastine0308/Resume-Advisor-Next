/** Extract and parse JSON from LLM text that may include markdown fences. */
export function parseJsonFromLlmText<T>(text: string): T {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced?.[1] ?? trimmed).trim();
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new SyntaxError("No JSON object found in model output");
  }
  return JSON.parse(candidate.slice(start, end + 1)) as T;
}
