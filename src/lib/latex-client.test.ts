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

  it("500 throws LaTeXServiceBusyError without marking service unavailable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ message: "Internal error" }),
      }),
    );

    await expect(compileLaTeXToPDF("x")).rejects.toBeInstanceOf(
      LaTeXServiceBusyError,
    );
    expect(getLatexServiceUnavailable()).toBe(false);
  });

  it("400 throws without marking service unavailable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          message: "Non-English characters detected",
        }),
      }),
    );

    await expect(compileLaTeXToPDF("x")).rejects.toThrow(
      "Non-English characters detected",
    );
    expect(getLatexServiceUnavailable()).toBe(false);
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

  it("network errors throw LaTeXServiceBusyError without marking service unavailable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
    );

    await expect(compileLaTeXToPDF("x")).rejects.toBeInstanceOf(
      LaTeXServiceBusyError,
    );
    expect(getLatexServiceUnavailable()).toBe(false);
  });

  it("recovers after a transient network error without manual reset", async () => {
    const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        blob: async () => new Blob([pdfBytes], { type: "application/pdf" }),
      });
    vi.stubGlobal("fetch", fetchMock);

    await expect(compileLaTeXToPDF("x")).rejects.toBeInstanceOf(
      LaTeXServiceBusyError,
    );
    expect(getLatexServiceUnavailable()).toBe(false);

    const blob = await compileLaTeXToPDF("x");
    expect(blob.type).toBe("application/pdf");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not short-circuit when service was previously marked unavailable", async () => {
    resetLatexServiceState();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        json: async () => ({ retryable: false }),
      }),
    );
    await expect(compileLaTeXToPDF("x")).rejects.toBeInstanceOf(
      LaTeXServiceUnavailableError,
    );
    expect(getLatexServiceUnavailable()).toBe(true);

    const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        blob: async () => new Blob([pdfBytes], { type: "application/pdf" }),
      }),
    );

    const blob = await compileLaTeXToPDF("x");
    expect(blob.type).toBe("application/pdf");
    expect(getLatexServiceUnavailable()).toBe(false);
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
