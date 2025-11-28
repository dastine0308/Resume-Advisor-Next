import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";

interface ResumeData {
  sections?: {
    work_experience?: Array<{
      jobTitle?: string;
      job_title?: string;
      company: string;
      dates: string;
      description?: string;
    }>;
    projects?: Array<{
      projectName?: string;
      project_name?: string;
      technologies: string;
      description?: string;
    }>;
    leadership?: Array<{
      role: string;
      organization: string;
      dates: string;
      description?: string;
    }>;
    education?: Array<{
      degree: string;
      universityName?: string;
      university_name?: string;
      datesAttended?: string;
      dates_attended?: string;
    }>;
    skills?: {
      languages?: string;
      developerTools?: string;
      developer_tools?: string;
      technologiesFrameworks?: string;
      technologies_frameworks?: string;
    };
  };
}

interface PersonalInfo {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  github?: string;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      resumeData,
      keywords = [],
      jobDescription = "",
      jobCompany = "",
      jobPosition = "",
      recipient,
      company,
      position,
      tone,
      userPrompt,
      closing,
      personalInfo,
    } = body as {
      resumeData: ResumeData;
      keywords?: string[];
      jobDescription?: string;
      jobCompany?: string;
      jobPosition?: string;
      recipient?: string;
      company?: string;
      position?: string;
      tone: string;
      userPrompt: string;
      closing?: string;
      personalInfo?: PersonalInfo;
    };

    // Validate required fields
    if (!resumeData) {
      return Response.json(
        { error: "Resume data is required" },
        { status: 400 },
      );
    }

    if (!userPrompt || userPrompt.trim() === "") {
      return Response.json(
        { error: "Descriptive prompt is required and cannot be empty" },
        { status: 400 },
      );
    }

    if (
      !["Professional", "Friendly", "Enthusiastic", "Formal"].includes(tone)
    ) {
      return Response.json(
        {
          error:
            "Invalid tone. Must be Professional, Friendly, Enthusiastic, or Formal",
        },
        { status: 400 },
      );
    }

    // Build context from resume data
    const resumeContext = buildResumeContext(resumeData, personalInfo);

    // Build the prompt based on tone
    const systemPrompt = buildSystemPrompt(tone);
    const userMessage = buildUserMessage({
      recipient: recipient || "Hiring Manager",
      company: company || jobCompany || "[Company Name]",
      position: position || jobPosition || "[Position]",
      userPrompt,
      closing: closing || "[Your Name]",
      resumeContext,
      keywords,
      jobDescription,
    });

    // Stream the cover letter generation
    const result = streamText({
      model: openai("gpt-4o-mini"),
      system: systemPrompt,
      prompt: userMessage,
      temperature: 0.8,
    });

    // Create a custom streaming response that sends the text chunks
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.textStream) {
            const data = `0:${JSON.stringify({ text: chunk })}\n`;
            controller.enqueue(encoder.encode(data));
          }
          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("Error generating cover letter:", error);
    return Response.json(
      { error: "Failed to generate cover letter" },
      { status: 500 },
    );
  }
}

function buildSystemPrompt(tone: string): string {
  const toneInstructions = {
    Professional: `Write in a formal, professional tone. Use sophisticated language, maintain a respectful distance, and focus on qualifications and achievements. Avoid casual language and contractions.`,
    Friendly: `Write in a warm, personable tone while maintaining professionalism. Use a conversational style that shows enthusiasm and personality. You can use occasional contractions and show genuine interest.`,
    Enthusiastic: `Write in an energetic, passionate tone. Show excitement about the role and company. Use positive language and exclamation points where appropriate. Highlight eagerness to contribute and grow with the organization.`,
    Formal: `Write in a very formal and traditional tone. Use polite and respectful language throughout. Avoid contractions and slang. Focus on qualifications, experience, and a strong closing statement.`,
  };

  return `You are an expert cover letter writer helping job seekers create compelling, tailored cover letters.

Tone: ${toneInstructions[tone as keyof typeof toneInstructions]}

General Guidelines:
1. Write a complete cover letter with proper formatting
2. Start with "Dear [Recipient],"
3. Create 2-3 body paragraphs that flow naturally
4. End with "Sincerely," followed by the closing name
5. Use the resume context to highlight relevant experiences and skills
6. Incorporate keywords naturally when they align with the candidate's background
7. Make specific connections between the candidate's experience and the position
8. Show genuine enthusiasm for the role and company
9. Keep the total length to 300-400 words
10. Do NOT fabricate experiences - only reference what's in the resume context

Return ONLY the cover letter text, properly formatted with line breaks between paragraphs.`;
}

interface UserMessageParams {
  recipient: string;
  company: string;
  position: string;
  userPrompt: string;
  closing: string;
  resumeContext: string;
  keywords: string[];
  jobDescription: string;
}

function buildUserMessage(params: UserMessageParams): string {
  const {
    recipient,
    company,
    position,
    userPrompt,
    closing,
    resumeContext,
    keywords,
    jobDescription,
  } = params;

  return `Generate a cover letter with the following details:

Recipient: ${recipient}
Company: ${company}
Position: ${position}

${jobDescription ? `Job Description:\n${jobDescription.substring(0, 2000)}${jobDescription.length > 2000 ? "..." : ""}\n\n` : ""}User's Specific Instructions:
${userPrompt}

Resume Context (use this to highlight relevant qualifications):
${resumeContext}

${keywords.length > 0 ? `Target Keywords (incorporate naturally if relevant):\n${keywords.join(", ")}\n\n` : ""}Closing Name: ${closing}

Write a compelling cover letter that addresses the user's instructions while showcasing relevant qualifications from their resume${jobDescription ? " and aligning with the job description requirements" : ""}.`;
}

function buildResumeContext(resumeData: ResumeData, personalInfo?: PersonalInfo): string {
  const sections: string[] = [];

  // Personal Info from account
  if (personalInfo) {
    const name = [personalInfo.firstName, personalInfo.lastName].filter(Boolean).join(" ");
    if (name) {
      sections.push("Personal Information:");
      sections.push(`- Name: ${name}`);
      if (personalInfo.email) sections.push(`- Email: ${personalInfo.email}`);
      if (personalInfo.phone) sections.push(`- Phone: ${personalInfo.phone}`);
      if (personalInfo.location) sections.push(`- Location: ${personalInfo.location}`);
      if (personalInfo.linkedin) sections.push(`- LinkedIn: ${personalInfo.linkedin}`);
      if (personalInfo.github) sections.push(`- GitHub: ${personalInfo.github}`);
      sections.push("");
    }
  }

  if (resumeData.sections) {
    // Work Experience
    if (
      resumeData.sections.work_experience &&
      resumeData.sections.work_experience.length > 0
    ) {
      sections.push("Work Experience:");
      resumeData.sections.work_experience.forEach((exp) => {
        sections.push(
          `- ${exp.jobTitle || exp.job_title} at ${exp.company} (${exp.dates})`,
        );
        if (exp.description) {
          sections.push(`  ${exp.description.substring(0, 200)}...`);
        }
      });
    }

    // Projects
    if (
      resumeData.sections.projects &&
      resumeData.sections.projects.length > 0
    ) {
      sections.push("\nProjects:");
      resumeData.sections.projects.forEach((proj) => {
        sections.push(
          `- ${proj.projectName || proj.project_name}: ${proj.technologies}`,
        );
        if (proj.description) {
          sections.push(`  ${proj.description.substring(0, 150)}...`);
        }
      });
    }

    // Leadership
    if (
      resumeData.sections.leadership &&
      resumeData.sections.leadership.length > 0
    ) {
      sections.push("\nLeadership:");
      resumeData.sections.leadership.forEach((lead) => {
        sections.push(`- ${lead.role} at ${lead.organization} (${lead.dates})`);
        if (lead.description) {
          sections.push(`  ${lead.description.substring(0, 150)}...`);
        }
      });
    }

    // Education
    if (
      resumeData.sections.education &&
      resumeData.sections.education.length > 0
    ) {
      sections.push("\nEducation:");
      resumeData.sections.education.forEach((edu) => {
        sections.push(
          `- ${edu.degree} from ${edu.universityName || edu.university_name} (${edu.datesAttended || edu.dates_attended})`,
        );
      });
    }

    // Skills
    if (resumeData.sections.skills) {
      const skills = resumeData.sections.skills;
      const skillsList: string[] = [];
      if (skills.languages) skillsList.push(skills.languages);
      const devTools = skills.developerTools || skills.developer_tools;
      if (devTools) skillsList.push(devTools);
      const techFrameworks =
        skills.technologiesFrameworks || skills.technologies_frameworks;
      if (techFrameworks) skillsList.push(techFrameworks);

      if (skillsList.length > 0) {
        sections.push("\nTechnical Skills:");
        sections.push(skillsList.join(", "));
      }
    }
  }

  return sections.join("\n");
}
