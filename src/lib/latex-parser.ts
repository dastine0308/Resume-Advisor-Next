import { v4 as uuidv4 } from "uuid";
import type {
  ResumeData,
  PersonalInfo,
  Education,
  Experience,
  Project,
  Leadership,
  TechnicalSkills,
} from "@/types/resume";

// Reverse of escapeLatex in latex-generator.ts
export function unescapeLatex(text: string): string {
  if (!text) return "";
  return text
    .replace(/\\textbackslash\{\}/g, "\\")
    .replace(/\\textasciitilde\{\}/g, "~")
    .replace(/\\textasciicircum\{\}/g, "^")
    .replace(/\\#/g, "#")
    .replace(/\\\$/g, "$")
    .replace(/\\%/g, "%")
    .replace(/\\&/g, "&")
    .replace(/\\_/g, "_")
    .replace(/\\{/g, "{")
    .replace(/\\}/g, "}");
}

// ATS/form layer: strip presentation macros, keep readable plain text.
const PLAIN_TEXT_COMMANDS = [
  "textbf",
  "emph",
  "textit",
  "underline",
  "textsc",
  "textrm",
  "texttt",
  "mbox",
] as const;

function unwrapLatexCommand(text: string, command: string): string {
  const pattern = new RegExp(
    `\\\\${command}\\*?(?:\\[[^\\]]*\\])?\\{`,
    "g",
  );
  let result = text;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(result)) !== null) {
    const braceStart = match.index + match[0].length - 1;
    const extracted = extractBalancedBraces(result, braceStart);
    if (!extracted) break;
    result =
      result.slice(0, match.index) +
      extracted.content +
      result.slice(extracted.end + 1);
    pattern.lastIndex = 0;
  }
  return result;
}

function unwrapHrefCommands(text: string): string {
  const pattern = /\\href\*?(?:\[[^\]]*\])?\{/g;
  let result = text;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(result)) !== null) {
    const urlStart = match.index + match[0].length - 1;
    const urlArg = extractBalancedBraces(result, urlStart);
    if (!urlArg) break;
    let pos = urlArg.end + 1;
    while (pos < result.length && /\s/.test(result[pos])) pos++;
    if (result[pos] !== "{") break;
    const labelArg = extractBalancedBraces(result, pos);
    if (!labelArg) break;
    result =
      result.slice(0, match.index) +
      labelArg.content +
      result.slice(labelArg.end + 1);
    pattern.lastIndex = 0;
  }
  return result;
}

/**
 * Convert LaTeX markup to ATS-friendly plain text for form fields.
 * Strips formatting commands (\textbf, \emph, …) while preserving content.
 */
export function latexToPlainText(text: string): string {
  if (!text) return "";
  let result = text;
  let changed = true;
  while (changed) {
    changed = false;
    const prev = result;
    for (const cmd of PLAIN_TEXT_COMMANDS) {
      result = unwrapLatexCommand(result, cmd);
    }
    result = unwrapHrefCommands(result);
    if (result !== prev) changed = true;
  }
  result = result.replace(/\s*\$\|\$\s*/g, " | ");
  result = result.replace(/\\vspace\*?(?:\[[^\]]*\])?\{[^}]*\}/g, "");
  result = result.replace(/\\hspace\*?(?:\[[^\]]*\])?\{[^}]*\}/g, "");
  result = unescapeLatex(result);
  result = result.replace(/\\[a-zA-Z@]+(\[[^\]]*\])?/g, "");
  return result.replace(/\s{2,}/g, " ").trim();
}

// Standard ATS section headings → canonical names used by the generator.
const SECTION_ALIASES: Record<string, string[]> = {
  Education: ["Education", "Academic Background"],
  "Relevant Coursework": ["Relevant Coursework", "Coursework", "Relevant Courses"],
  Experience: [
    "Experience",
    "Work Experience",
    "Professional Experience",
    "Employment",
    "Employment History",
  ],
  Projects: ["Projects", "Personal Projects", "Selected Projects", "Project Experience"],
  "Technical Skills": [
    "Technical Skills",
    "Skills",
    "Programming Skills",
    "Technical Proficiencies",
  ],
  "Leadership / Extracurricular": [
    "Leadership / Extracurricular",
    "Leadership",
    "Extracurricular",
    "Extracurriculars",
    "Clubs and Extracurriculars",
    "Clubs and Extracurricular",
    "Activities",
    "Involvement",
    "Volunteer",
    "Community Involvement",
  ],
};

const JOB_TITLE_HINTS =
  /\b(engineer|developer|architect|manager|analyst|scientist|intern|consultant|designer|administrator|specialist|coordinator|researcher|programmer|member|president|director|lead|officer|associate|fellow|technician|advisor)\b/i;

function looksLikeJobTitle(text: string): boolean {
  const plain = latexToPlainText(text);
  return JOB_TITLE_HINTS.test(plain);
}

/** Company lines often use a pipe between org name and tech stack. */
function looksLikeCompanyLine(text: string): boolean {
  const plain = latexToPlainText(text);
  if (/\$\s*\|\s*\$|\s\|\s/.test(plain)) return true;
  if (looksLikeJobTitle(text) && !/\|/.test(plain)) return false;
  return plain.split(",").length >= 4;
}

function splitCompanyFromLine(text: string): string {
  const plain = latexToPlainText(text);
  const [company] = plain.split(/\s*\$\s*\|\s*\$|\s\|\s/);
  return company.trim();
}

/**
 * Jake-style \\resumeSubheading row 1 is {A}{dates}, row 2 is {B}{location}.
 * A/B may be either {company, title} or {title, company|tech} depending on author.
 */
function resolveExperienceFields(args: string[]): {
  jobTitle: string;
  company: string;
  dates: string;
  location: string;
} {
  const dates = latexToPlainText(args[1]);
  const location = latexToPlainText(args[3]);
  const row1 = args[0];
  const row2 = args[2];

  const row1IsTitle =
    looksLikeJobTitle(row1) &&
    !looksLikeCompanyLine(row1);
  const row2IsTitle =
    looksLikeJobTitle(row2) &&
    !looksLikeCompanyLine(row2);

  if (row1IsTitle && !row2IsTitle) {
    return {
      jobTitle: latexToPlainText(row1),
      company: splitCompanyFromLine(row2),
      dates,
      location,
    };
  }
  if (row2IsTitle && !row1IsTitle) {
    return {
      jobTitle: latexToPlainText(row2),
      company: splitCompanyFromLine(row1),
      dates,
      location,
    };
  }
  if (looksLikeCompanyLine(row2)) {
    return {
      jobTitle: latexToPlainText(row1),
      company: splitCompanyFromLine(row2),
      dates,
      location,
    };
  }
  return {
    jobTitle: latexToPlainText(row2),
    company: splitCompanyFromLine(row1),
    dates,
    location,
  };
}

function mapSkillLabelToField(
  label: string,
): keyof TechnicalSkills | null {
  const normalized = label.toLowerCase().replace(/&/g, "and");
  if (/language|programming/.test(normalized)) return "languages";
  if (/framework|technolog|library|stack/.test(normalized)) {
    return "technologiesFrameworks";
  }
  if (/tool|platform|software|devops|cloud/.test(normalized)) {
    return "developerTools";
  }
  return null;
}

function appendSkillValue(current: string, value: string): string {
  if (!value) return current;
  return current ? `${current}, ${value}` : value;
}

// Extracts content inside balanced braces starting at `start` index.
// Handles backslash-escaped characters so \{ and \} don't affect depth.
function extractBalancedBraces(
  text: string,
  start: number,
): { content: string; end: number } | null {
  if (text[start] !== "{") return null;
  let depth = 0;
  let content = "";
  let i = start;
  while (i < text.length) {
    const ch = text[i];
    if (ch === "\\") {
      content += text[i] + (text[i + 1] ?? "");
      i += 2;
      continue;
    }
    if (ch === "{") {
      depth++;
      if (depth > 1) content += ch;
    } else if (ch === "}") {
      depth--;
      if (depth === 0) return { content, end: i };
      content += ch;
    } else {
      content += ch;
    }
    i++;
  }
  return null;
}

// Extracts up to `n` consecutive `{...}` arguments, skipping whitespace between them.
// Returns the extracted (still-escaped) arg strings and the position after the last arg.
function extractNArgs(
  text: string,
  n: number,
  startPos = 0,
): { args: string[]; endPos: number } {
  const args: string[] = [];
  let i = startPos;
  while (i < text.length && args.length < n) {
    while (i < text.length && /\s/.test(text[i])) i++;
    if (text[i] === "{") {
      const result = extractBalancedBraces(text, i);
      if (result) {
        args.push(result.content);
        i = result.end + 1;
      } else {
        break;
      }
    } else {
      break;
    }
  }
  return { args, endPos: i };
}

function extractTextbfContent(text: string): string {
  const match = text.match(/\\textbf\{/);
  if (!match || match.index === undefined) return latexToPlainText(text);
  const braceStart = match.index + match[0].length - 1;
  const result = extractBalancedBraces(text, braceStart);
  return result ? latexToPlainText(result.content) : latexToPlainText(text);
}

function extractBulletsFromBlock(block: string, opener: RegExp): string {
  const lines: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = opener.exec(block)) !== null) {
    const braceStart = match.index + match[0].length - 1;
    const result = extractBalancedBraces(block, braceStart);
    if (result) {
      const bullet = latexToPlainText(result.content).trim();
      if (bullet) lines.push(`- ${bullet}`);
    }
  }
  return lines.join("\n");
}

// Extracts bullet content from `\resumeItem{...}` and common `\item\small{...}` variants.
function extractResumeItems(block: string): string {
  const fromResumeItem = extractBulletsFromBlock(block, /\\resumeItem\{/g);
  if (fromResumeItem) return fromResumeItem;
  return extractBulletsFromBlock(block, /\\item\\small\s*\{/g);
}

function splitResumeSubheadings(content: string): string[] {
  return content.split(/\\resumeSubheading(?![A-Za-z])/i);
}

// Returns the content of a LaTeX \section{name} block,
// stopping at the next \section or \end{document}.
function extractSectionByName(
  latex: string,
  sectionName: string,
): string | null {
  const escaped = sectionName.replace(/[$()*+.?[\\\]^{|}]/g, "\\$&");
  const regex = new RegExp(
    `\\\\section\\*?\\{${escaped}\\}([\\s\\S]*?)(?=\\\\section\\*?\\{|\\\\end\\{document\\}|$)`,
    "i",
  );
  const match = latex.match(regex);
  return match ? match[1] : null;
}

function extractSection(latex: string, canonicalName: string): string | null {
  const names = SECTION_ALIASES[canonicalName] ?? [canonicalName];
  for (const name of names) {
    const content = extractSectionByName(latex, name);
    if (content?.trim()) return content;
  }
  return null;
}

function parsePersonalInfo(latex: string): PersonalInfo {
  const info: PersonalInfo = { name: "" };

  // Heading is inside \begin{center}...\end{center}
  const centerMatch = latex.match(
    /\\begin\{center\}([\s\S]*?)\\end\{center\}/,
  );
  const heading = centerMatch ? centerMatch[1] : latex;

  // Name: {\Huge \scshape Name} \\ \vspace{1pt}
  const nameMatch = heading.match(/\\Huge\s+\\scshape\s+(.+?)\s*\}/);
  if (nameMatch) info.name = latexToPlainText(nameMatch[1].trim());

  // Phone: \faPhone\ <number> or plain digits in heading line
  const phoneMatch = heading.match(/\\faPhone\\\s+([^~\\\n{}]+)/);
  if (phoneMatch) {
    info.phone = latexToPlainText(phoneMatch[1].trim());
  } else {
    const plainPhoneMatch = heading.match(
      /(\+?\d[\d\s().-]{8,}\d)/,
    );
    if (plainPhoneMatch) info.phone = plainPhoneMatch[1].trim();
  }

  // Address: line after name, before contact links
  const addressMatch = heading.match(
    /\\scshape\s+[^\\]+?\}\s*\\\\[^\\]*?\\vspace\{[^}]+\}\s*\\\\\s*\n\s*([^\\$]+?)\s*\\\\/,
  );
  if (addressMatch) {
    info.address = latexToPlainText(addressMatch[1].trim());
  }

  // Email: mailto:<email>
  const emailMatch = heading.match(/mailto:([^}]+)\}/);
  if (emailMatch) info.email = latexToPlainText(emailMatch[1].trim());

  // LinkedIn href (URL contains "linkedin")
  const linkedinMatch = heading.match(
    /\\href\{(https?:\/\/[^}]*linkedin[^}]*)\}/,
  );
  if (linkedinMatch) info.linkedin = latexToPlainText(linkedinMatch[1].trim());

  // GitHub href (URL contains "github")
  const githubMatch = heading.match(
    /\\href\{(https?:\/\/[^}]*github[^}]*)\}/,
  );
  if (githubMatch) info.github = latexToPlainText(githubMatch[1].trim());

  return info;
}

// Education section uses: \resumeSubheading{university}{location}{degree}{dates}
function parseEducation(content: string): Education[] {
  const result: Education[] = [];
  const parts = splitResumeSubheadings(content);
  for (let i = 1; i < parts.length; i++) {
    const { args } = extractNArgs(parts[i], 4);
    if (args.length >= 4) {
      result.push({
        id: uuidv4(),
        universityName: latexToPlainText(args[0]),
        location: latexToPlainText(args[1]),
        degree: latexToPlainText(args[2]),
        datesAttended: latexToPlainText(args[3]),
        order: result.length,
      });
    }
  }
  return result;
}

// Coursework section uses: \item\small <course name>
function parseCoursework(content: string): string[] {
  const items: string[] = [];
  const pattern = /\\item\\small\s+(.+?)(?=\n|$)/g;
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(content)) !== null) {
    const course = latexToPlainText(m[1].trim());
    if (course) items.push(course);
  }
  return items;
}

// Experience: \resumeSubheading with 4 args; title/company order varies by author.
function parseExperience(content: string): Experience[] {
  const result: Experience[] = [];
  const parts = splitResumeSubheadings(content);
  for (let i = 1; i < parts.length; i++) {
    const { args, endPos } = extractNArgs(parts[i], 4);
    if (args.length >= 4) {
      const descBlock = parts[i].slice(endPos);
      const fields = resolveExperienceFields(args);
      result.push({
        id: uuidv4(),
        ...fields,
        description: extractResumeItems(descBlock),
        order: result.length,
      });
    }
  }
  return result;
}

// Projects section uses: \resumeProjectHeading\n{\textbf{name} $|$ \emph{tech}}{date}
function parseProjects(content: string): Project[] {
  const result: Project[] = [];
  const headingPattern = /\\resumeProjectHeading/g;
  let match: RegExpExecArray | null;
  while ((match = headingPattern.exec(content)) !== null) {
    const after = content.slice(match.index + match[0].length);

    // First arg: {\textbf{name} $|$ \emph{tech}}
    let i = 0;
    while (i < after.length && /\s/.test(after[i])) i++;
    const firstArgResult = extractBalancedBraces(after, i);
    if (!firstArgResult) continue;

    const firstArg = firstArgResult.content;
    const projectName = extractTextbfContent(firstArg);
    const techMatch = firstArg.match(/\\emph\{/);
    let technologies = "";
    if (techMatch) {
      const techBraceStart =
        (techMatch.index ?? 0) + techMatch[0].length - 1;
      const techResult = extractBalancedBraces(firstArg, techBraceStart);
      if (techResult) technologies = latexToPlainText(techResult.content);
    }

    // Second arg: {date}
    let j = firstArgResult.end + 1;
    while (j < after.length && /\s/.test(after[j])) j++;
    const dateResult = extractBalancedBraces(after, j);
    const date = dateResult ? latexToPlainText(dateResult.content) : "";

    // Description from the block after the date, until next \resumeProjectHeading
    const descStart = dateResult ? dateResult.end + 1 : firstArgResult.end + 1;
    const nextHeading = after.indexOf("\\resumeProjectHeading", descStart);
    const descBlock =
      nextHeading === -1 ? after.slice(descStart) : after.slice(descStart, nextHeading);

    result.push({
      id: uuidv4(),
      projectName,
      technologies,
      date,
      description: extractResumeItems(descBlock),
      order: result.length,
    });
  }
  return result;
}

// Skills: any \\textbf{Category}{: value} rows; labels mapped by keyword heuristics.
function parseTechnicalSkills(content: string): TechnicalSkills {
  const skills: TechnicalSkills = {
    languages: "",
    developerTools: "",
    technologiesFrameworks: "",
  };

  const pattern = /\\textbf\{/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(content)) !== null) {
    const labelBrace = match.index + match[0].length - 1;
    const labelResult = extractBalancedBraces(content, labelBrace);
    if (!labelResult) continue;

    let pos = labelResult.end + 1;
    while (pos < content.length && /\s/.test(content[pos])) pos++;
    if (content[pos] !== "{") continue;

    const valueResult = extractBalancedBraces(content, pos);
    if (!valueResult) continue;

    const label = latexToPlainText(labelResult.content);
    const value = latexToPlainText(valueResult.content).replace(/^:\s*/, "");
    const field = mapSkillLabelToField(label);

    if (field) {
      skills[field] = appendSkillValue(skills[field], value);
    } else if (!skills.technologiesFrameworks) {
      skills.technologiesFrameworks = value;
    } else if (!skills.developerTools) {
      skills.developerTools = value;
    } else {
      skills.languages = appendSkillValue(skills.languages, value);
    }
  }

  return skills;
}

// Leadership section uses: \resumeSubheading{organization}{dates}\n{role}{}
function parseLeadership(content: string): Leadership[] {
  const result: Leadership[] = [];
  const parts = splitResumeSubheadings(content);
  for (let i = 1; i < parts.length; i++) {
    const { args, endPos } = extractNArgs(parts[i], 4);
    if (args.length >= 3) {
      const descBlock = parts[i].slice(endPos);
      result.push({
        id: uuidv4(),
        organization: latexToPlainText(args[0]),
        dates: latexToPlainText(args[1]),
        role: latexToPlainText(args[2]),
        description: extractResumeItems(descBlock),
        order: result.length,
      });
    }
  }
  return result;
}

/**
 * Parse a LaTeX resume document back into ResumeData.
 * Designed to round-trip with generateLatexFromData().
 */
export function parseLatexToData(latex: string): ResumeData {
  const educationContent = extractSection(latex, "Education");
  const courseworkContent = extractSection(latex, "Relevant Coursework");
  const experienceContent = extractSection(latex, "Experience");
  const projectsContent = extractSection(latex, "Projects");
  const skillsContent = extractSection(latex, "Technical Skills");
  const leadershipContent = extractSection(
    latex,
    "Leadership / Extracurricular",
  );

  const personalInfo = parsePersonalInfo(latex);

  const education = educationContent ? parseEducation(educationContent) : [];

  // Coursework is flattened across all edu entries by the generator;
  // merge it back into the first education entry.
  if (courseworkContent && education.length > 0) {
    const courses = parseCoursework(courseworkContent);
    if (courses.length > 0) {
      education[0].coursework = courses.join(", ");
    }
  }

  const experience = experienceContent ? parseExperience(experienceContent) : [];
  const projects = projectsContent ? parseProjects(projectsContent) : [];
  const technicalSkills = skillsContent
    ? parseTechnicalSkills(skillsContent)
    : { languages: "", developerTools: "", technologiesFrameworks: "" };
  const leadership = leadershipContent ? parseLeadership(leadershipContent) : [];

  return {
    personalInfo,
    education,
    experience,
    projects,
    leadership,
    technicalSkills,
  };
}
