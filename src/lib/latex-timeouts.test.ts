import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getLatexCompileTimeoutMs } from "./latex-timeouts";

describe("getLatexCompileTimeoutMs", () => {
  const envKeys = ["LATEX_COMPILE_TIMEOUT_MS", "LATEX_COMPILE_QUEUE_WAIT_MS"];

  beforeEach(() => {
    for (const key of envKeys) delete process.env[key];
  });

  afterEach(() => {
    for (const key of envKeys) delete process.env[key];
  });

  it("defaults to queue wait + pdflatex budget + buffer", () => {
    expect(getLatexCompileTimeoutMs()).toBe(190_000);
  });

  it("honours LATEX_COMPILE_TIMEOUT_MS override", () => {
    process.env.LATEX_COMPILE_TIMEOUT_MS = "300000";
    expect(getLatexCompileTimeoutMs()).toBe(300_000);
  });

  it("derives timeout from LATEX_COMPILE_QUEUE_WAIT_MS", () => {
    process.env.LATEX_COMPILE_QUEUE_WAIT_MS = "60000";
    expect(getLatexCompileTimeoutMs()).toBe(130_000);
  });
});
