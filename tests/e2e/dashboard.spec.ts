import { test, expect } from "@playwright/test";
import { hasE2eEnv } from "../helpers/env";
import { sampleJobPostingPayload, sampleResumeSections } from "../helpers/fixtures";

test.describe("Dashboard", () => {
  test.skip(!hasE2eEnv(), "Missing Supabase credentials in .env.local");

  test("shows welcome message and create menu", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: /Welcome back, E2E/i })).toBeVisible();
    await expect(page.getByRole("button", { name: "+ Create New" })).toBeVisible();
  });

  test("lists a seeded resume and can delete it", async ({ page, request }) => {
    const jobRes = await request.post("/api/job-postings", {
      data: sampleJobPostingPayload(),
    });
    expect(jobRes.ok()).toBeTruthy();
    const { job_id: jobId } = (await jobRes.json()) as { job_id: string };

    const resumeRes = await request.post("/api/resumes", {
      data: {
        title: "E2E Dashboard Resume",
        job_id: jobId,
        sections: sampleResumeSections(),
      },
    });
    expect(resumeRes.ok()).toBeTruthy();
    const { resume_id: resumeId } = (await resumeRes.json()) as { resume_id: string };

    await page.goto("/dashboard");
    await expect(page.locator("table").getByText("E2E Dashboard Resume")).toBeVisible();

    const row = page.locator("table tbody tr", { hasText: "E2E Dashboard Resume" });
    await row.getByRole("button", { name: "Delete" }).click();
    await expect(page.getByRole("heading", { name: "Delete Resume?" })).toBeVisible();

    const deleteResponse = page.waitForResponse(
      (res) =>
        res.request().method() === "DELETE" &&
        res.url().includes(`/api/resumes/${resumeId}`),
    );
    await page
      .locator("div.shadow-xl")
      .getByRole("button", { name: "Delete", exact: true })
      .click();
    const deleteRes = await deleteResponse;
    expect(deleteRes.status()).toBe(200);

    await expect(page.locator("table").getByText("E2E Dashboard Resume")).not.toBeVisible();

    const getRes = await request.get(`/api/resumes/${resumeId}`);
    expect(getRes.status()).toBe(404);
  });
});
