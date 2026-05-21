import { test, expect } from "@playwright/test";
import { hasE2eEnv } from "../helpers/env";

test.describe("Login page", () => {
  test.skip(!hasE2eEnv(), "Missing Supabase credentials in .env.local");

  test.use({ storageState: { cookies: [], origins: [] } });

  test("shows Google sign-in for unauthenticated visitors", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Welcome to Resume Advisor" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Continue with Google/i })).toBeVisible();
  });

  test("redirects protected routes to login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});
