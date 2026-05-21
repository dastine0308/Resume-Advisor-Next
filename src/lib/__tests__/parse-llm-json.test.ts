import { describe, it, expect } from "vitest";
import { parseJsonFromLlmText } from "../parse-llm-json";

describe("parseJsonFromLlmText", () => {
  it("parses raw JSON", () => {
    expect(parseJsonFromLlmText<{ title: string }>('{"title":"Engineer"}')).toEqual({
      title: "Engineer",
    });
  });

  it("parses JSON inside markdown fences", () => {
    const input = '```json\n{"title":"Engineer"}\n```';
    expect(parseJsonFromLlmText<{ title: string }>(input)).toEqual({ title: "Engineer" });
  });

  it("throws when no JSON object is present", () => {
    expect(() => parseJsonFromLlmText("not json")).toThrow();
  });
});
