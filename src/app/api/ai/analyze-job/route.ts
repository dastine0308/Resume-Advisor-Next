import { groq } from "@/lib/groq";
import { getAuthUser } from "@/lib/auth-helper";
import {
  logAiUsage,
  refundAiCredits,
  requireAiCredits,
} from "@/lib/ai-credits.server";
import {
  isJobDescriptionTooShort,
  isLowQualityJobAnalysis,
  JOB_DESCRIPTION_TOO_SHORT_ERROR,
  JOB_LOCATION_NOT_SPECIFIED,
  LOW_QUALITY_JOB_ANALYSIS_ERROR,
  normalizeAnalyzedJobLocation,
  nullIfUnknown,
} from "@/lib/job-analysis-quality";
import { parseJsonFromLlmText } from "@/lib/parse-llm-json";
import { generateText } from "ai";
import { z } from "zod";
import type { JobPosting } from "@/types/job-posting";

const jobPostingSchema = z.object({
  company_name: z.string().describe("Company name, or 'Unknown' if not found"),
  title: z.string().describe("Job title"),
  job_location: z
    .string()
    .describe(
      "Job location: city/region, Remote, Hybrid, On-site, or Not specified if absent",
    ),
  company_industry: z.string().optional().describe("Industry the company operates in"),
  company_location: z.string().optional().describe("Physical location of the company"),
  company_website: z.string().optional().describe("Company website URL"),
  description: z.string().optional().describe("Brief summary of the role"),
  requirements: z
    .array(z.string())
    .describe(
      "List of technical skills, tools, languages, and key requirements extracted from the job description",
    ),
});

export async function POST(req: Request) {
  const { user, supabase, error: authError } = await getAuthUser();
  if (authError) return authError;

  const credits = await requireAiCredits(supabase!, user!.id, "analyze_job");
  if (!credits.ok) return credits.response;

  try {
    const body = await req.json();

    const jobDescription: string = body.job_description;

    if (!jobDescription?.trim()) {
      await refundAiCredits(user!.id, credits.cost);
      return Response.json(
        { error: "job_description is required" },
        { status: 400 },
      );
    }

    if (isJobDescriptionTooShort(jobDescription)) {
      await refundAiCredits(user!.id, credits.cost);
      return Response.json(
        { error: JOB_DESCRIPTION_TOO_SHORT_ERROR, code: "JOB_DESCRIPTION_TOO_SHORT" },
        { status: 422 },
      );
    }

    const { text, usage } = await generateText({
      model: groq.chat("llama-3.3-70b-versatile"),
      prompt: `Analyze the following job posting and extract structured information. Return ONLY valid JSON with no markdown, no code blocks, no extra text.

Required JSON structure:
{
  "company_name": "Company name, or Unknown if not found",
  "title": "Job title",
  "job_location": "Job location",
  "company_industry": "Industry (optional)",
  "company_location": "Physical location of company (optional)",
  "company_website": "Company website URL (optional)",
  "description": "Brief summary of the role (optional)",
  "requirements": ["skill1", "skill2", ...]
}

Rules for job_location (never use "Unknown" for location):
- If the posting says Remote, Hybrid, On-site, or a city/region, use that exact wording.
- If work arrangement is implied (e.g. "work from anywhere", "distributed team"), use "Remote".
- If location is genuinely absent, use "${JOB_LOCATION_NOT_SPECIFIED}".

Focus on extracting specific technical skills, programming languages, frameworks, tools, and methodologies as individual keywords in the requirements array.

Job Posting:
${jobDescription}`,
    });

    const parsed = jobPostingSchema.parse(parseJsonFromLlmText(text));
    const job_location = normalizeAnalyzedJobLocation(parsed.job_location);
    const normalized = { ...parsed, job_location };

    if (isLowQualityJobAnalysis(normalized)) {
      await refundAiCredits(user!.id, credits.cost);
      return Response.json(
        { error: LOW_QUALITY_JOB_ANALYSIS_ERROR, code: "LOW_QUALITY_INPUT" },
        { status: 422 },
      );
    }

    const result: JobPosting = {
      ...normalized,
      company_industry: nullIfUnknown(parsed.company_industry) ?? undefined,
      company_location: nullIfUnknown(parsed.company_location) ?? undefined,
      company_website: nullIfUnknown(parsed.company_website) ?? undefined,
      description: nullIfUnknown(parsed.description) ?? undefined,
      requirements: parsed.requirements ?? [],
    };

    await logAiUsage(
      user!.id,
      "analyze_job",
      credits.cost,
      usage?.totalTokens,
    );

    return Response.json(result);
  } catch (error) {
    await refundAiCredits(user!.id, credits.cost);
    console.error("Error analyzing job description:", error);
    return Response.json(
      { error: "Failed to analyze job description" },
      { status: 500 },
    );
  }
}
