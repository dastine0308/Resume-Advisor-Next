import { describe, it, expect } from "vitest";
import { hasIntegrationEnv, isAppServerReachable, getTestBaseUrl } from "../helpers/env";
import { apiJson } from "../helpers/api";

const enabled = hasIntegrationEnv();

describe.skipIf(!enabled)("GET /api/compile-latex/health", () => {
  it("returns ok when LaTeX service is reachable", async () => {
    const reachable = await isAppServerReachable();
    if (!reachable) {
      throw new Error(
        `App server not reachable at ${getTestBaseUrl()}. Start it with npm run dev or docker compose.`,
      );
    }

    const { res, json } = await apiJson<{ ok: boolean }>("/api/compile-latex/health");
    expect(res.status).toBe(200);
    expect(json?.ok).toBe(true);
  });
});

describe("GET /api/compile-latex/health (unauthenticated)", () => {
  it.skipIf(!enabled)("does not require auth", async () => {
    const reachable = await isAppServerReachable();
    if (!reachable) return;

    const { res } = await apiJson("/api/compile-latex/health");
    expect(res.status).not.toBe(401);
  });
});
