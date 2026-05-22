import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  hasGroqEnv,
  hasIntegrationEnv,
  isAppServerReachable,
} from "../helpers/env";
import { apiJson } from "../helpers/api";
import {
  createTestSession,
  deleteTestUser,
  type TestSession,
} from "../helpers/auth";
import { MIN_JOB_DESCRIPTION_LENGTH } from "@/lib/job-analysis-quality";

const enabled = hasIntegrationEnv();
const groqEnabled = hasGroqEnv();

const SAMPLE_JOB_POSTING = `
Acme Corp is hiring a Software Engineer Intern in Calgary, AB (hybrid).

Responsibilities:
- Build and maintain React/Next.js features for our resume advisor product
- Write integration tests and participate in code review
- Collaborate with the team on API design and documentation

Requirements:
- TypeScript, React, and Node.js experience
- Familiarity with SQL and REST APIs
- Strong communication skills
`.trim();

describe.skipIf(!enabled)("POST /api/ai/analyze-job", () => {
  let session: TestSession;

  async function getCreditsBalance() {
    const { res, json } = await apiJson<{
      success: boolean;
      data: { ai_credits_balance?: number };
    }>("/api/user", { cookies: session.cookies });
    expect(res.status).toBe(200);
    return json?.data?.ai_credits_balance;
  }

  beforeAll(async () => {
    const reachable = await isAppServerReachable();
    if (!reachable) {
      throw new Error("App server not reachable. Start npm run dev first.");
    }

    session = await createTestSession();
    await apiJson("/api/user", {
      method: "POST",
      cookies: session.cookies,
      body: { first_name: "Analyze", last_name: "Tester" },
    });
  });

  afterAll(async () => {
    if (session?.userId) await deleteTestUser(session.userId);
  });

  it("returns 401 when not authenticated", async () => {
    const { res } = await apiJson("/api/ai/analyze-job", {
      method: "POST",
      body: { job_description: SAMPLE_JOB_POSTING },
    });
    expect(res.status).toBe(401);
  });

  it("returns 400 when job_description is missing and does not consume credits", async () => {
    const before = await getCreditsBalance();

    const { res, json } = await apiJson<{ error?: string }>("/api/ai/analyze-job", {
      method: "POST",
      cookies: session.cookies,
      body: {},
    });

    expect(res.status).toBe(400);
    expect(json?.error).toMatch(/job_description/i);

    const after = await getCreditsBalance();
    expect(after).toBe(before);
  });

  it("returns 422 JOB_DESCRIPTION_TOO_SHORT and refunds credits", async () => {
    const before = await getCreditsBalance();

    const { res, json } = await apiJson<{ error?: string; code?: string }>(
      "/api/ai/analyze-job",
      {
        method: "POST",
        cookies: session.cookies,
        body: {
          job_description: "too short",
        },
      },
    );

    expect(res.status).toBe(422);
    expect(json?.code).toBe("JOB_DESCRIPTION_TOO_SHORT");
    expect(json?.error).toBeTruthy();
    expect("too short".length).toBeLessThan(MIN_JOB_DESCRIPTION_LENGTH);

    const after = await getCreditsBalance();
    expect(after).toBe(before);
  });

  describe.skipIf(!groqEnabled)("with GROQ_API_KEY", () => {
    it("returns structured job posting for a complete description", async () => {
      const { res, json } = await apiJson<{
        company_name?: string;
        title?: string;
        job_location?: string;
        requirements?: string[];
      }>("/api/ai/analyze-job", {
        method: "POST",
        cookies: session.cookies,
        body: { job_description: SAMPLE_JOB_POSTING },
      });

      expect(res.status).toBe(200);
      expect(json?.company_name).toBeTruthy();
      expect(json?.title).toBeTruthy();
      expect(json?.job_location).toBeTruthy();
      expect(Array.isArray(json?.requirements)).toBe(true);
      expect((json?.requirements ?? []).length).toBeGreaterThan(0);
    }, 60_000);

    it("returns 422 LOW_QUALITY_INPUT for meaningless long text", async () => {
      const before = await getCreditsBalance();
      const junk = "lorem ipsum ".repeat(12).trim();

      const { res, json } = await apiJson<{ error?: string; code?: string }>(
        "/api/ai/analyze-job",
        {
          method: "POST",
          cookies: session.cookies,
          body: { job_description: junk },
        },
      );

      expect(res.status).toBe(422);
      expect(json?.code).toBe("LOW_QUALITY_INPUT");

      const after = await getCreditsBalance();
      expect(after).toBe(before);
    }, 60_000);
  });
});
