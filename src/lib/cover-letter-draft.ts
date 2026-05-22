import { createOrUpdateCoverLetter } from "@/lib/api-services";
import { emptyCoverLetterContent } from "@/lib/cover-letter-normalize";
import type { CoverLetterContent } from "@/types/cover-letter";
import type { CoverLetterLoadResult } from "@/hooks/useDocuments";
import type { CreateUpdateCoverLetterResponse } from "@/types/cover-letter";

export type CoverLetterResumeListEntry = {
  id: string | null;
  jobId: string;
  title: string;
  modifiedDate: string | null;
};

export function mapResumeToListEntry(resume: {
  id?: string | null;
  job_id: string;
  title?: string | null;
  last_updated?: string | null;
}): CoverLetterResumeListEntry {
  return {
    id: resume.id || null,
    jobId: resume.job_id,
    title: resume.title || "Untitled Resume",
    modifiedDate: resume.last_updated ?? null,
  };
}

export function findLinkedResume(
  resumeList: CoverLetterResumeListEntry[],
  coverLetter: {
    job_id: string;
    content: { resume_id: string | null };
  },
): CoverLetterResumeListEntry | null {
  const savedResumeId = coverLetter.content.resume_id;
  if (savedResumeId) {
    const byId = resumeList.find(
      (r) => r.id != null && String(r.id) === String(savedResumeId),
    );
    if (byId) return byId;
  }
  return (
    resumeList.find((r) => String(r.jobId) === String(coverLetter.job_id)) ??
    null
  );
}

export function contentWithLinkedResumeId<T extends { resume_id: string | null }>(
  content: T,
  linked: CoverLetterResumeListEntry | null,
): T {
  if (content.resume_id || !linked?.id) return content;
  return { ...content, resume_id: linked.id };
}

export type CoverLetterDraft = {
  coverLetterId: string | null;
  jobId: string | null;
  content: CoverLetterContent;
};

export function buildCoverLetterDraft(
  load: Extract<CoverLetterLoadResult, { kind: "new" } | { kind: "found" }>,
  linkedResume: CoverLetterResumeListEntry | null,
): CoverLetterDraft {
  if (load.kind === "new") {
    return {
      coverLetterId: null,
      jobId: null,
      content: emptyCoverLetterContent(),
    };
  }

  const { coverLetter } = load;
  return {
    coverLetterId: coverLetter.id,
    jobId: coverLetter.job_id,
    content: contentWithLinkedResumeId(
      { ...coverLetter.content },
      linkedResume,
    ),
  };
}

export function previewTextToParagraphs(text: string): string[] {
  return text
    .split("\n\n")
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

export function coverLetterTitleFromContent(content: CoverLetterContent): string {
  return `${content.company || "Cover Letter"} - ${content.position || "Position"}`;
}

export async function persistCoverLetterDraft(
  draft: CoverLetterDraft,
  routeCoverLetterId?: string | null,
): Promise<CreateUpdateCoverLetterResponse | null> {
  if (!draft.jobId || draft.content.paragraphs.length === 0) return null;

  const coverLetterId = draft.coverLetterId ?? routeCoverLetterId ?? null;

  return createOrUpdateCoverLetter({
    id: coverLetterId ?? undefined,
    job_id: draft.jobId,
    title: coverLetterTitleFromContent(draft.content),
    content: { ...draft.content },
  });
}
