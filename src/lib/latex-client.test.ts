import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  checkLatexServiceHealth,
  compileLaTeXToPDF,
  getLatexServiceUnavailable,
  resetLatexServiceState,
  LaTeXServiceBusyError,
  LaTeXServiceUnavailableError,
} from "./latex-client";

beforeEach(() => {
  resetLatexServiceState();
  vi.restoreAllMocks();
});

describe("compileLaTeXToPDF", () => {
  it("503 throws LaTeXServiceBusyError without marking service unavailable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({
          message: "The LaTeX service is busy. Please try again in a moment.",
          retryable: true,
        }),
      }),
    );

    await expect(compileLaTeXToPDF("\\documentclass{article}")).rejects.toBeInstanceOf(
      LaTeXServiceBusyError,
    );
    expect(getLatexServiceUnavailable()).toBe(false);
  });

  it("500 marks service unavailable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ message: "Internal error" }),
      }),
    );

    await expect(compileLaTeXToPDF("x")).rejects.toBeInstanceOf(
      LaTeXServiceUnavailableError,
    );
    expect(getLatexServiceUnavailable()).toBe(true);
  });

  it("502 marks service unavailable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        json: async () => ({
          message: "The LaTeX compilation service is currently offline.",
          retryable: false,
        }),
      }),
    );

    await expect(compileLaTeXToPDF("x")).rejects.toBeInstanceOf(
      LaTeXServiceUnavailableError,
    );
    expect(getLatexServiceUnavailable()).toBe(true);
  });

  it("503 with retryable false marks service unavailable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({
          message: "The LaTeX compilation service is currently offline.",
          retryable: false,
        }),
      }),
    );

    await expect(compileLaTeXToPDF("x")).rejects.toBeInstanceOf(
      LaTeXServiceUnavailableError,
    );
    expect(getLatexServiceUnavailable()).toBe(true);
  });
});

describe("checkLatexServiceHealth", () => {
  it("returns true and clears unavailable flag when health is ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ ok: true }),
      }),
    );

    expect(await checkLatexServiceHealth()).toBe(true);
    expect(getLatexServiceUnavailable()).toBe(false);
  });

  it("returns false without marking unavailable when service is degraded (busy)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({ ok: false, degraded: true, reason: "busy" }),
      }),
    );

    expect(await checkLatexServiceHealth()).toBe(false);
    expect(getLatexServiceUnavailable()).toBe(false);
  });

  it("returns false when health endpoint is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("connection refused")));

    expect(await checkLatexServiceHealth()).toBe(false);
    expect(getLatexServiceUnavailable()).toBe(false);
  });
});
