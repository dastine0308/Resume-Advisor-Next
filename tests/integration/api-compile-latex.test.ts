import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { hasIntegrationEnv, isAppServerReachable, isLatexServiceReachable } from "../helpers/env";
import { apiFetch } from "../helpers/api";
import {
  createTestSession,
  deleteTestUser,
  type TestSession,
} from "../helpers/auth";
import { minimalResumeLatex } from "../helpers/latex";

const enabled = hasIntegrationEnv();

describe.skipIf(!enabled)("POST /api/compile-latex", () => {
  let session: TestSession;
  let latexAvailable = false;

  beforeAll(async () => {
    const reachable = await isAppServerReachable();
    if (!reachable) {
      throw new Error("App server not reachable. Start npm run dev first.");
    }

    latexAvailable = await isLatexServiceReachable();
    session = await createTestSession();

    await apiFetch("/api/user", {
      method: "POST",
      cookies: session.cookies,
      body: { first_name: "LaTeX", last_name: "Tester" },
    });
  });

  afterAll(async () => {
    if (session?.userId) await deleteTestUser(session.userId);
  });

  it("returns 401 without auth", async () => {
    const res = await apiFetch("/api/compile-latex", {
      method: "POST",
      body: { latex: minimalResumeLatex() },
    });
    expect(res.status).toBe(401);
  });

  it("returns a PDF for valid LaTeX", async (ctx) => {
    if (!latexAvailable) ctx.skip();

    const res = await apiFetch("/api/compile-latex", {
      method: "POST",
      cookies: session.cookies,
      body: { latex: minimalResumeLatex() },
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/pdf");

    const buffer = Buffer.from(await res.arrayBuffer());
    expect(buffer.byteLength).toBeGreaterThan(100);
    expect(buffer.subarray(0, 4).toString()).toBe("%PDF");
  });
});
