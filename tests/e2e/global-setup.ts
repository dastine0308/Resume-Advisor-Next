import { mkdirSync, writeFileSync } from "fs";
import { resolve } from "path";
import { apiJson } from "../helpers/api";
import {
  createTestSession,
  toPlaywrightCookies,
} from "../helpers/auth";
import { getTestBaseUrl, hasE2eEnv, isAppServerReachable } from "../helpers/env";

export default async function globalSetup() {
  if (!hasE2eEnv()) return;

  const baseURL = getTestBaseUrl();
  const reachable = await isAppServerReachable(baseURL);
  if (!reachable) {
    throw new Error(
      `E2E setup: app not reachable at ${baseURL}. Start the dev server first.`,
    );
  }

  const authDir = resolve(process.cwd(), "tests/e2e/.auth");
  mkdirSync(authDir, { recursive: true });

  const session = await createTestSession();

  await apiJson("/api/user", {
    method: "POST",
    cookies: session.cookies,
    body: { first_name: "E2E", last_name: "User" },
  });

  writeFileSync(
    resolve(authDir, "test-user.json"),
    JSON.stringify({ userId: session.userId, email: session.email }),
  );

  writeFileSync(
    resolve(authDir, "user.json"),
    JSON.stringify({
      cookies: toPlaywrightCookies(session.cookies, baseURL),
      origins: [],
    }),
  );
}
