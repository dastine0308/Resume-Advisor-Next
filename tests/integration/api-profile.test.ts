import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { hasIntegrationEnv, isAppServerReachable } from "../helpers/env";
import { apiJson } from "../helpers/api";
import {
  createTestSession,
  deleteTestUser,
  type TestSession,
} from "../helpers/auth";

const enabled = hasIntegrationEnv();

describe.skipIf(!enabled)("Profile API", () => {
  let session: TestSession;

  beforeAll(async () => {
    const reachable = await isAppServerReachable();
    if (!reachable) {
      throw new Error("App server not reachable. Start npm run dev first.");
    }
    session = await createTestSession();
  });

  afterAll(async () => {
    if (session?.userId) await deleteTestUser(session.userId);
  });

  it("GET /api/user returns email before profile setup", async () => {
    const { res, json } = await apiJson<{ success: boolean; data: { email?: string } }>(
      "/api/user",
      { cookies: session.cookies },
    );
    expect(res.status).toBe(200);
    expect(json?.success).toBe(true);
    expect(json?.data.email).toBe(session.email);
  });

  it("POST /api/user creates profile", async () => {
    const { res, json } = await apiJson("/api/user", {
      method: "POST",
      cookies: session.cookies,
      body: { first_name: "Integration", last_name: "Tester" },
    });
    expect(res.status).toBe(200);
    expect(json).toMatchObject({ success: true });
  });

  it("GET /api/user returns profile after setup", async () => {
    const { res, json } = await apiJson<{
      success: boolean;
      data: { first_name: string; last_name: string; plan: string };
    }>("/api/user", { cookies: session.cookies });

    expect(res.status).toBe(200);
    expect(json?.data.first_name).toBe("Integration");
    expect(json?.data.last_name).toBe("Tester");
    expect(json?.data.plan).toBe("free");
  });

  it("PUT /api/user updates profile fields", async () => {
    const { res, json } = await apiJson("/api/user", {
      method: "PUT",
      cookies: session.cookies,
      body: { location: "Calgary, AB" },
    });
    expect(res.status).toBe(200);
    expect(json).toMatchObject({ success: true });
  });
});
