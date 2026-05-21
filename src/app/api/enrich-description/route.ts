import { groq } from "@/lib/groq";
import { getAuthUser } from "@/lib/auth-helper";
import {
  logAiUsage,
  refundAiCredits,
  requireAiCredits,
} from "@/lib/ai-credits.server";
import { streamText } from "ai";

// Section-specific prompts
const PROMPTS = {
  experience: (description: string, keywords: string[]) =>
    `You are an expert resume writer. Enhance the following work experience description to make it more impactful and ATS-friendly.

User's Current Description:
${description}

${keywords.length > 0 ? `Target Keywords to incorporate naturally (if relevant):\n${keywords.join(", ")}` : ""}

Instructions:
1. Use strong action verbs (Led, Developed, Implemented, Architected, etc.)
2. Quantify achievements with metrics where possible (e.g., "Improved performance by 40%")
3. Use bullet point format with a hyphen-dash "-" at the start of each line (NOT bullet symbols like • or *)
${keywords.length > 0 ? "4. Incorporate target keywords naturally and contextually - don't force them if they don't fit" : "4. Focus on impactful, professional wording"}
5. Focus on impact and results, not just responsibilities
6. Keep it concise - aim for 3-5 bullet points
7. Use past tense for previous roles
8. Preserve the core facts and experiences from the user's description - enhance, don't fabricate
9. IMPORTANT: Use only ASCII characters. Do not use special Unicode characters like smart quotes, em-dashes, or bullet symbols.
10. Do NOT use LaTeX markup (no \\textbf{}, \\emph{}, or other backslash commands). Plain text only.

Return ONLY the enhanced description in bullet point format using "-" for each bullet.`,

  project: (description: string, keywords: string[]) =>
    `You are an expert resume writer. Enhance the following project description to make it more impressive and technical.

User's Current Description:
${description}

${keywords.length > 0 ? `Target Keywords to incorporate naturally (if relevant):\n${keywords.join(", ")}` : ""}

Instructions:
1. Use technical action verbs (Developed, Engineered, Built, Designed, etc.)
2. Highlight technical challenges and solutions
3. Use bullet point format with a hyphen-dash "-" at the start of each line (NOT bullet symbols like • or *)
${keywords.length > 0 ? "4. Incorporate target keywords and technologies naturally - don't force them if they don't fit" : "4. Focus on technical impact and achievements"}
5. Focus on technical achievements and functionality
6. Keep it concise - aim for 3-4 bullet points
7. Use past tense
8. Preserve the core facts and technical details from the user's description - enhance, don't fabricate
9. IMPORTANT: Use only ASCII characters. Do not use special Unicode characters like smart quotes, em-dashes, or bullet symbols.
10. Do NOT use LaTeX markup (no \\textbf{}, \\emph{}, or other backslash commands). Plain text only.

Return ONLY the enhanced description in bullet point format using "-" for each bullet.`,

  leadership: (description: string, keywords: string[]) =>
    `You are an expert resume writer. Enhance the following leadership/extracurricular description to showcase leadership skills and impact.

User's Current Description:
${description}

${keywords.length > 0 ? `Target Keywords to incorporate naturally (if relevant):\n${keywords.join(", ")}` : ""}

Instructions:
1. Use leadership-focused action verbs (Led, Managed, Coordinated, Organized, etc.)
2. Quantify impact (team size, people affected, goals achieved)
3. Use bullet point format with a hyphen-dash "-" at the start of each line (NOT bullet symbols like • or *)
${keywords.length > 0 ? "4. Incorporate target keywords naturally - don't force them if they don't fit" : "4. Focus on leadership qualities and impact"}
5. Highlight soft skills and leadership qualities
6. Keep it concise - aim for 3-4 bullet points
7. Use past tense for completed roles, present tense for current roles
8. Preserve the core facts and leadership experiences from the user's description - enhance, don't fabricate
9. IMPORTANT: Use only ASCII characters. Do not use special Unicode characters like smart quotes, em-dashes, or bullet symbols.
10. Do NOT use LaTeX markup (no \\textbf{}, \\emph{}, or other backslash commands). Plain text only.

Return ONLY the enhanced description in bullet point format using "-" for each bullet.`,
};

export async function POST(req: Request) {
  const { user, supabase, error: authError } = await getAuthUser();
  if (authError) return authError;

  const credits = await requireAiCredits(supabase!, user!.id, "enrich");
  if (!credits.ok) return credits.response;

  try {
    const body = await req.json();
    const { sectionType, description, keywords = [] } = body as {
      sectionType: "experience" | "project" | "leadership";
      description: string;
      keywords?: string[];
    };

    if (!["experience", "project", "leadership"].includes(sectionType)) {
      await refundAiCredits(user!.id, credits.cost);
      return Response.json(
        { error: "Invalid section type" },
        { status: 400 },
      );
    }

    if (!description || description.trim() === "") {
      await refundAiCredits(user!.id, credits.cost);
      return Response.json(
        { error: "Description is required and cannot be empty" },
        { status: 400 },
      );
    }

    const prompt = PROMPTS[sectionType](description, keywords);

    const result = streamText({
      model: groq.chat("llama-3.3-70b-versatile"),
      prompt,
      temperature: 0.7,
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.textStream) {
            const data = `0:${JSON.stringify({ text: chunk })}\n`;
            controller.enqueue(encoder.encode(data));
          }

          const usage = await result.usage;
          await logAiUsage(
            user!.id,
            "enrich",
            credits.cost,
            usage?.totalTokens,
          );
          controller.close();
        } catch (error) {
          await refundAiCredits(user!.id, credits.cost);
          console.error("Stream error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    await refundAiCredits(user!.id, credits.cost);
    console.error("Error enriching description:", error);
    return Response.json(
      { error: "Failed to enrich description" },
      { status: 500 },
    );
  }
}
