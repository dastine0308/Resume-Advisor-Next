import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

vi.mock("@/lib/auth-helper", () => ({
  getAuthUser: vi.fn().mockResolvedValue({ error: null }),
}));

vi.mock("@/lib/latex-service-url", () => ({
  getLatexServiceUrl: () => "http://latex.test",
  MAX_LATEX_BODY_BYTES: 512 * 1024,
}));

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

function makeRequest(latex = "\\documentclass{article}\\begin{document}x\\end{document}") {
  return new NextRequest("http://localhost/api/compile-latex", {
    method: "POST",
    body: JSON.stringify({ latex }),
  });
}

describe("POST /api/compile-latex", () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it("returns retryable 503 when readiness check fails with upstream 503", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 503,
    });

    const res = await POST(makeRequest());
    const json = await res.json();

    expect(res.status).toBe(503);
    expect(json.retryable).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://latex.test/health/ready",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns non-retryable 502 when readiness check fails with upstream offline", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 502,
    });

    const res = await POST(makeRequest());
    const json = await res.json();

    expect(res.status).toBe(502);
    expect(json.retryable).toBe(false);
    expect(json.message).toContain("offline");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns retryable 503 when compile endpoint is busy", async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, status: 200 })
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({
          error: "Service busy",
          message: "Too many concurrent compilations.",
        }),
      });

    const res = await POST(makeRequest());
    const json = await res.json();

    expect(res.status).toBe(503);
    expect(json.retryable).toBe(true);
    expect(json.message).toContain("Too many concurrent");
  });

  it("returns retryable 503 on gateway timeout", async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, status: 200 })
      .mockRejectedValueOnce(
        Object.assign(new Error("The operation was aborted"), {
          name: "TimeoutError",
        }),
      );

    const res = await POST(makeRequest());
    const json = await res.json();

    expect(res.status).toBe(503);
    expect(json.retryable).toBe(true);
    expect(json.error).toBe("LaTeX service timeout");
  });
});
