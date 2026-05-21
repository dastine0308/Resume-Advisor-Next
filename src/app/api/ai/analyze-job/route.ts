import { groq } from "@/lib/groq";
import { getAuthUser } from "@/lib/auth-helper";
import {
  logAiUsage,
  refundAiCredits,
  requireAiCredits,
} from "@/lib/ai-credits.server";
import { parseJsonFromLlmText } from "@/lib/parse-llm-json";
import { generateText } from "ai";
import { z } from "zod";
import type { JobPosting } from "@/types/job-posting";

const jobPostingSchema = z.object({
  company_name: z.string().describe("Company name, or 'Unknown' if not found"),
  title: z.string().describe("Job title"),
  job_location: z
    .string()
    .describe("Job location (city, remote, hybrid, etc.), or 'Unknown'"),
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

    const { text, usage } = await generateText({
      model: groq.chat("llama-3.3-70b-versatile"),
      prompt: `Analyze the following job posting and extract structured information. Return ONLY valid JSON with no markdown, no code blocks, no extra text.

Required JSON structure:
{
  "company_name": "Company name, or Unknown if not found",
  "title": "Job title",
  "job_location": "Job location (city, remote, hybrid, etc.), or Unknown",
  "company_industry": "Industry (optional)",
  "company_location": "Physical location of company (optional)",
  "company_website": "Company website URL (optional)",
  "description": "Brief summary of the role (optional)",
  "requirements": ["skill1", "skill2", ...]
}

Focus on extracting specific technical skills, programming languages, frameworks, tools, and methodologies as individual keywords in the requirements array.

Job Posting:
${jobDescription}`,
    });

    const parsed = jobPostingSchema.parse(parseJsonFromLlmText(text));

    const result: JobPosting = {
      ...parsed,
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
