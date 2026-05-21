import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import type { FullConfig } from "@playwright/test";
import { deleteTestUser } from "../helpers/auth";
import { hasE2eEnv } from "../helpers/env";

export default async function globalTeardown(_config: FullConfig) {
  if (!hasE2eEnv()) return;

  const metaPath = resolve(process.cwd(), "tests/e2e/.auth/test-user.json");
  if (!existsSync(metaPath)) return;

  const { userId } = JSON.parse(readFileSync(metaPath, "utf8")) as { userId: string };
  if (userId) await deleteTestUser(userId);
}
