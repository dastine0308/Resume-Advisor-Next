import { describe, it, expect } from "vitest";
import { hasIntegrationEnv, isAppServerReachable } from "../helpers/env";
import { apiJson } from "../helpers/api";

const enabled = hasIntegrationEnv();

describe.skipIf(!enabled)("API auth guards", () => {
  it("returns 401 for protected routes without session", async () => {
    const reachable = await isAppServerReachable();
    if (!reachable) return;

    const { res, json } = await apiJson("/api/user");
    expect(res.status).toBe(401);
    if (json) {
      expect(json).toMatchObject({ success: false, error: "Unauthorized" });
    }
  });

  it("returns 401 for resume creation without session", async () => {
    const { res, json } = await apiJson("/api/resumes", {
      method: "POST",
      body: { title: "x", job_id: "x", sections: {} },
    });
    expect(res.status).toBe(401);
    if (json) {
      expect(json).toMatchObject({ success: false, error: "Unauthorized" });
    }
  });
});
