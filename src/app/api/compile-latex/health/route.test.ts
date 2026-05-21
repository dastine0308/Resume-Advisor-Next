import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";

vi.mock("@/lib/latex-service-url", () => ({
  getLatexServiceUrl: () => "http://latex.test",
}));

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

describe("GET /api/compile-latex/health", () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it("returns ok when readiness endpoint responds", async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200 });

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://latex.test/health/ready",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("returns degraded 503 when readiness queue is saturated", async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 503 });

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(503);
    expect(json).toEqual({ ok: false, degraded: true, reason: "busy" });
  });

  it("returns 503 when readiness endpoint is down", async () => {
    fetchMock.mockRejectedValueOnce(new Error("connection refused"));

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(503);
    expect(json).toEqual({ ok: false });
  });
});
