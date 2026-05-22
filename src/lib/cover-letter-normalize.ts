import type { CoverLetter, CoverLetterContent } from "@/types/cover-letter";

const TONE_VALUES = [
  "Professional",
  "Friendly",
  "Enthusiastic",
  "Formal",
] as const;

type Tone = CoverLetterContent["tone"];

function isTone(value: unknown): value is Tone {
  return (
    typeof value === "string" &&
    (TONE_VALUES as readonly string[]).includes(value)
  );
}

export function emptyCoverLetterContent(): CoverLetterContent {
  return {
    paragraphs: [],
    closing_signature: "",
    company: "",
    descriptive_prompt: "",
    position: "",
    recipient: "",
    resume_id: null,
    tone: "Professional",
  };
}

/** Normalize JSONB / legacy API shapes into CoverLetterContent. */
export function parseCoverLetterContent(raw: unknown): CoverLetterContent {
  let record: Record<string, unknown> | null = null;

  if (typeof raw === "string") {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        record = parsed as Record<string, unknown>;
      }
    } catch {
      record = null;
    }
  } else if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    record = raw as Record<string, unknown>;
  }

  if (!record) {
    return emptyCoverLetterContent();
  }

  return {
    paragraphs: Array.isArray(record.paragraphs)
      ? record.paragraphs.map((p) => String(p))
      : [],
    closing_signature: String(record.closing_signature ?? ""),
    company: String(record.company ?? ""),
    descriptive_prompt: String(record.descriptive_prompt ?? ""),
    position: String(record.position ?? ""),
    recipient: String(record.recipient ?? ""),
    resume_id:
      record.resume_id != null && record.resume_id !== ""
        ? String(record.resume_id)
        : null,
    tone: isTone(record.tone) ? record.tone : "Professional",
  };
}

/** Coerce Supabase row fields and nested content into a CoverLetter. */
export function normalizeCoverLetter(raw: Record<string, unknown>): CoverLetter {
  const content = parseCoverLetterContent(raw.content);

  return {
    id: String(raw.id),
    title: String(raw.title ?? ""),
    job_id: String(raw.job_id),
    creation_date: String(raw.creation_date ?? ""),
    last_updated: String(raw.last_updated ?? ""),
    content,
  };
}

export function coverLetterPreviewText(content: CoverLetterContent): string {
  return content.paragraphs.filter(Boolean).join("\n\n");
}
