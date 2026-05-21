import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { hasIntegrationEnv, isAppServerReachable } from "../helpers/env";
import { apiJson } from "../helpers/api";
import {
  createTestSession,
  deleteTestUser,
  type TestSession,
} from "../helpers/auth";
import { sampleJobPostingPayload, sampleResumeSections } from "../helpers/fixtures";

const enabled = hasIntegrationEnv();

describe.skipIf(!enabled)("Resume CRUD API", () => {
  let session: TestSession;
  let jobId: string;
  let resumeId: string;

  beforeAll(async () => {
    const reachable = await isAppServerReachable();
    if (!reachable) {
      throw new Error("App server not reachable. Start npm run dev first.");
    }

    session = await createTestSession();

    await apiJson("/api/user", {
      method: "POST",
      cookies: session.cookies,
      body: { first_name: "Resume", last_name: "Tester" },
    });
  });

  afterAll(async () => {
    if (session?.userId) await deleteTestUser(session.userId);
  });

  it("creates a job posting", async () => {
    const { res, json } = await apiJson<{ success: boolean; job_id: string }>(
      "/api/job-postings",
      {
        method: "POST",
        cookies: session.cookies,
        body: sampleJobPostingPayload(),
      },
    );

    expect(res.status).toBe(201);
    expect(json?.success).toBe(true);
    expect(json?.job_id).toBeTruthy();
    jobId = json!.job_id;
  });

  it("creates a resume linked to the job", async () => {
    const { res, json } = await apiJson<{ success: boolean; resume_id: string }>(
      "/api/resumes",
      {
        method: "POST",
        cookies: session.cookies,
        body: {
          title: "Integration Test Resume",
          job_id: jobId,
          sections: sampleResumeSections(),
          version_source: "manual",
          version_label: "Initial version",
        },
      },
    );

    expect(res.status).toBe(201);
    expect(json?.success).toBe(true);
    resumeId = json!.resume_id;
  });

  it("GET /api/resumes/[id] returns saved resume", async () => {
    const { res, json } = await apiJson<{
      success: boolean;
      data: { id: string; title: string; sections: Record<string, unknown> };
    }>(`/api/resumes/${resumeId}`, { cookies: session.cookies });

    expect(res.status).toBe(200);
    expect(json?.data.id).toBe(resumeId);
    expect(json?.data.title).toBe("Integration Test Resume");
    expect(json?.data.sections).toBeTruthy();
  });

  it("GET /api/user/resumes lists the resume", async () => {
    const { res, json } = await apiJson<{
      success: boolean;
      data: { id: string; title: string }[];
    }>("/api/user/resumes", { cookies: session.cookies });

    expect(res.status).toBe(200);
    expect(json?.data.some((r) => r.id === resumeId)).toBe(true);
  });

  it("GET /api/resumes/[id]/versions returns version history", async () => {
    const { res, json } = await apiJson<{ success: boolean; data: unknown[] }>(
      `/api/resumes/${resumeId}/versions`,
      { cookies: session.cookies },
    );

    expect(res.status).toBe(200);
    expect(json?.success).toBe(true);
    expect(Array.isArray(json?.data)).toBe(true);
  });

  it("updates the resume", async () => {
    const { res, json } = await apiJson<{ success: boolean; resume_id: string }>(
      "/api/resumes",
      {
        method: "POST",
        cookies: session.cookies,
        body: {
          id: resumeId,
          title: "Updated Integration Resume",
          job_id: jobId,
          sections: sampleResumeSections(),
        },
      },
    );

    expect(res.status).toBe(200);
    expect(json?.success).toBe(true);
    expect(json?.resume_id).toBe(resumeId);
  });

  it("DELETE /api/resumes/[id] removes the resume", async () => {
    const { res, json } = await apiJson(`/api/resumes/${resumeId}`, {
      method: "DELETE",
      cookies: session.cookies,
    });

    expect(res.status).toBe(200);
    expect(json).toMatchObject({ success: true });

    const { res: getRes } = await apiJson(`/api/resumes/${resumeId}`, {
      cookies: session.cookies,
    });
    expect(getRes.status).toBe(404);
  });
});
