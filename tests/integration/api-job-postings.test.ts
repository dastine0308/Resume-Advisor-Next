import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { hasIntegrationEnv, isAppServerReachable } from "../helpers/env";
import { apiJson } from "../helpers/api";
import {
  createTestSession,
  deleteTestUser,
  type TestSession,
} from "../helpers/auth";
import { sampleJobPostingPayload } from "../helpers/fixtures";

const enabled = hasIntegrationEnv();

describe.skipIf(!enabled)("Job posting CRUD API", () => {
  let session: TestSession;
  let jobId: string;

  beforeAll(async () => {
    const reachable = await isAppServerReachable();
    if (!reachable) {
      throw new Error("App server not reachable. Start npm run dev first.");
    }

    session = await createTestSession();

    await apiJson("/api/user", {
      method: "POST",
      cookies: session.cookies,
      body: { first_name: "Job", last_name: "Tester" },
    });
  });

  afterAll(async () => {
    if (session?.userId) await deleteTestUser(session.userId);
  });

  it("rejects placeholder values on create", async () => {
    const { res, json } = await apiJson<{ success: boolean; error?: string }>(
      "/api/job-postings",
      {
        method: "POST",
        cookies: session.cookies,
        body: {
          title: "Unknown",
          company_name: "Unknown",
          job_location: "Unknown",
          requirements: [],
        },
      },
    );

    expect(res.status).toBe(422);
    expect(json?.success).toBe(false);
  });

  it("creates a job posting with requirements", async () => {
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
    jobId = json!.job_id;
  });

  it("GET /api/job-postings/[id] returns requirements", async () => {
    const { res, json } = await apiJson<{
      success: boolean;
      data: { requirements: string[]; selected_requirements: string[] };
    }>(`/api/job-postings/${jobId}`, { cookies: session.cookies });

    expect(res.status).toBe(200);
    expect(json?.data.requirements).toContain("React");
    expect(json?.data.selected_requirements).toContain("TypeScript");
  });

  it("rejects placeholder values on full save update", async () => {
    const { res, json } = await apiJson<{ success: boolean; error?: string }>(
      "/api/job-postings",
      {
        method: "POST",
        cookies: session.cookies,
        body: {
          job_id: jobId,
          title: "Unknown",
          company_name: "Unknown",
          job_location: "Unknown",
          requirements: [],
        },
      },
    );

    expect(res.status).toBe(422);
    expect(json?.success).toBe(false);
  });

  it("updates job posting requirements (delete + re-insert)", async () => {
    const { res, json } = await apiJson<{ success: boolean; job_id: string }>(
      "/api/job-postings",
      {
        method: "POST",
        cookies: session.cookies,
        body: {
          job_id: jobId,
          title: "Updated Software Engineer Intern",
          requirements: ["Go", "PostgreSQL"],
          selected_requirements: ["Go"],
        },
      },
    );

    expect(res.status).toBe(200);
    expect(json?.success).toBe(true);

    const { res: getRes, json: getJson } = await apiJson<{
      success: boolean;
      data: { title: string; requirements: string[]; selected_requirements: string[] };
    }>(`/api/job-postings/${jobId}`, { cookies: session.cookies });

    expect(getRes.status).toBe(200);
    expect(getJson?.data.title).toBe("Updated Software Engineer Intern");
    expect(getJson?.data.requirements).toEqual(["PostgreSQL"]);
    expect(getJson?.data.selected_requirements).toEqual(["Go"]);
  });

  it("persists selected_requirements on partial update without resending all fields", async () => {
    const { res, json } = await apiJson<{ success: boolean; job_id: string }>(
      "/api/job-postings",
      {
        method: "POST",
        cookies: session.cookies,
        body: {
          job_id: jobId,
          selected_requirements: ["Go", "PostgreSQL"],
        },
      },
    );

    expect(res.status).toBe(200);
    expect(json?.success).toBe(true);

    const { res: getRes, json: getJson } = await apiJson<{
      success: boolean;
      data: { requirements: string[]; selected_requirements: string[] };
    }>(`/api/job-postings/${jobId}`, { cookies: session.cookies });

    expect(getRes.status).toBe(200);
    expect(getJson?.data.selected_requirements).toEqual(["Go", "PostgreSQL"]);
    expect(getJson?.data.requirements).toEqual([]);
  });

  it("DELETE /api/job-postings/[id] removes the job posting", async () => {
    const { res, json } = await apiJson(`/api/job-postings/${jobId}`, {
      method: "DELETE",
      cookies: session.cookies,
    });

    expect(res.status).toBe(200);
    expect(json).toMatchObject({ success: true });

    const { res: getRes } = await apiJson(`/api/job-postings/${jobId}`, {
      cookies: session.cookies,
    });
    expect(getRes.status).toBe(404);
  });
});
