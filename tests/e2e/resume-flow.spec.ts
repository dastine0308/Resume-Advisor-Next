import { test, expect } from "@playwright/test";
import { hasE2eEnv, isLatexServiceReachable } from "../helpers/env";
import { sampleJobPostingPayload, sampleResumeSections } from "../helpers/fixtures";

test.describe("Resume builder flow", () => {
  test.skip(!hasE2eEnv(), "Missing Supabase credentials in .env.local");

  test("creates a resume through the UI and exports PDF", async ({ page }) => {
    const latexUp = await isLatexServiceReachable();
    test.skip(!latexUp, "LaTeX service is not reachable");

    await page.goto("/dashboard");
    await page.getByRole("button", { name: "+ Create New" }).click();
    await page.getByText("Resume", { exact: true }).click();
    await expect(page).toHaveURL(/\/resume/);

    await page.getByLabel("Resume title").fill("E2E Flow Resume");
    await page
      .getByLabel("Job description text area")
      .fill("Software engineer role requiring TypeScript and React experience.");

    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(page.getByText("Content Builder")).toBeVisible();

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export" }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/resume-.*\.pdf$/);
    const path = await download.path();
    expect(path).toBeTruthy();
  });

  test("opens an existing resume for editing", async ({ page, request }) => {
    const jobRes = await request.post("/api/job-postings", {
      data: sampleJobPostingPayload({ title: "QA Engineer" }),
    });
    const { job_id: jobId } = (await jobRes.json()) as { job_id: string };

    const resumeRes = await request.post("/api/resumes", {
      data: {
        title: "E2E Edit Resume",
        job_id: jobId,
        sections: sampleResumeSections(),
      },
    });
    const { resume_id: resumeId } = (await resumeRes.json()) as { resume_id: string };

    await page.goto(`/resume?resumeId=${encodeURIComponent(resumeId)}`);
    await expect(page.getByLabel("Resume title")).toHaveValue("E2E Edit Resume");
    await expect(page.getByLabel("Job description text area")).toBeVisible();
  });
});
