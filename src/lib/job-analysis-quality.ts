const PLACEHOLDER_VALUES = new Set([
  "unknown",
  "unknown company",
  "unknown location",
  "untitled job posting",
]);

/** Minimum pasted text length before calling the LLM (industry norm: ~100+ chars). */
export const MIN_JOB_DESCRIPTION_LENGTH = 100;

export const MIN_MEANINGFUL_REQUIREMENTS = 3;

export const JOB_DESCRIPTION_TOO_SHORT_ERROR =
  "Job description is too short. Please paste a complete job posting with job title, responsibilities, and skill requirements.";

export const LOW_QUALITY_JOB_ANALYSIS_ERROR =
  "Could not extract job information from this text. Please paste a complete job posting with job title, responsibilities, and skill requirements.";

export const LOW_QUALITY_JOB_SAVE_ERROR =
  "Complete the company, job title, and location fields above to save this job posting.";

export const LOW_QUALITY_JOB_PERSIST_ERROR =
  "Cannot save job posting with placeholder values. Analyze a complete job description first.";

export function unknownFieldPersistError(label: string): string {
  return `Invalid ${label}: placeholder values cannot be saved.`;
}

export const JOB_POSTING_NOT_ANALYZED_ERROR =
  "Analyze the job description with AI before continuing.";

export type SkippedJobPostingSaveReason = "no_job_posting" | "low_quality";

export function getJobPostingSaveFailureMessage(
  reason: SkippedJobPostingSaveReason,
): string {
  switch (reason) {
    case "low_quality":
      return LOW_QUALITY_JOB_SAVE_ERROR;
    case "no_job_posting":
      return JOB_POSTING_NOT_ANALYZED_ERROR;
  }
}

export const JOB_LOCATION_NOT_SPECIFIED = "Not specified";

export type JobCoreField = "company_name" | "title" | "job_location";

export const JOB_CORE_FIELD_LABELS: Record<JobCoreField, string> = {
  company_name: "Company",
  title: "Job title",
  job_location: "Location",
};

const GENERIC_REQUIREMENT_TERMS = new Set([
  "test",
  "testing",
  "測試",
  "engineer",
  "engineering",
  "工程師",
  "developer",
  "development",
  "開發",
  "experience",
  "team",
  "work",
  "job",
  "role",
  "position",
  "skills",
  "ability",
  "strong",
  "responsible",
  "responsibilities",
]);

export function isUnknownField(value: string | undefined): boolean {
  const normalized = value?.trim().toLowerCase() ?? "";
  return normalized === "" || PLACEHOLDER_VALUES.has(normalized);
}

/** Map LLM/client placeholders to null for optional DB columns. */
export function nullIfUnknown(
  value: string | undefined,
): string | null | undefined {
  if (value === undefined) return undefined;
  return isUnknownField(value) ? null : value.trim();
}

export function hasRequiredJobFields(parsed: {
  company_name: string;
  title: string;
  job_location: string;
}): boolean {
  return (
    !isUnknownField(parsed.company_name) &&
    !isUnknownField(parsed.title) &&
    !isUnknownField(parsed.job_location)
  );
}

/** Core fields still using placeholder values and needing user input. */
export function getMissingCoreFields(parsed: {
  company_name: string;
  title: string;
  job_location: string;
}): JobCoreField[] {
  return (["company_name", "title", "job_location"] as const).filter((field) =>
    isUnknownField(parsed[field]),
  );
}

/** Map LLM "Unknown" location to a persistable fallback. */
export function normalizeAnalyzedJobLocation(value: string): string {
  const trimmed = value.trim();
  if (isUnknownField(trimmed)) return JOB_LOCATION_NOT_SPECIFIED;
  return trimmed;
}

export function isJobDescriptionTooShort(text: string): boolean {
  return text.trim().length < MIN_JOB_DESCRIPTION_LENGTH;
}

function isGenericRequirement(term: string): boolean {
  const normalized = term.trim().toLowerCase();
  return normalized.length < 2 || GENERIC_REQUIREMENT_TERMS.has(normalized);
}

/** Skills/keywords after removing generic role words the LLM may echo from short input. */
export function getMeaningfulRequirements(
  requirements: string[] | undefined,
): string[] {
  return [...new Set((requirements ?? []).map((r) => r.trim()).filter(Boolean))].filter(
    (requirement) => !isGenericRequirement(requirement),
  );
}

function countKnownCoreFields(parsed: {
  company_name: string;
  title: string;
  job_location: string;
}): number {
  return [parsed.company_name, parsed.title, parsed.job_location].filter(
    (field) => !isUnknownField(field),
  ).length;
}

export function canPersistJobPosting(parsed: {
  company_name: string;
  title: string;
  job_location: string;
  requirements?: string[];
}): boolean {
  if (isLowQualityJobAnalysis(parsed)) return false;
  return hasRequiredJobFields(parsed);
}

/** Why step 1 "Next" is blocked; null means the user may continue. */
export function getStep1AdvanceBlockReason(input: {
  resumeTitle: string;
  jobDescription: string;
  jobPosting: {
    company_name: string;
    title: string;
    job_location: string;
    requirements?: string[];
  } | null;
}): string | null {
  if (!input.resumeTitle.trim()) {
    return "Enter a resume title before continuing.";
  }
  if (!input.jobDescription.trim()) {
    return "Paste a job description before continuing.";
  }
  if (!input.jobPosting) {
    return JOB_POSTING_NOT_ANALYZED_ERROR;
  }

  const core = {
    company_name: input.jobPosting.company_name.trim(),
    title: input.jobPosting.title.trim(),
    job_location: input.jobPosting.job_location.trim(),
    requirements: input.jobPosting.requirements,
  };

  if (!canPersistJobPosting(core)) {
    const missing = getMissingCoreFields(core);
    if (missing.length > 0) {
      const labels = missing.map((field) => JOB_CORE_FIELD_LABELS[field]).join(", ");
      return `Complete ${labels} in Job Details before continuing.`;
    }
    return LOW_QUALITY_JOB_SAVE_ERROR;
  }

  return null;
}

/**
 * Post-LLM quality gate. Pass when:
 * - all core fields are present, or
 * - enough skill keywords were extracted, or
 * - two core fields plus at least two meaningful skills
 */
export function isLowQualityJobAnalysis(parsed: {
  company_name: string;
  title: string;
  job_location: string;
  requirements?: string[];
}): boolean {
  if (hasRequiredJobFields(parsed)) return false;

  const meaningfulRequirements = getMeaningfulRequirements(parsed.requirements);
  const knownCoreFields = countKnownCoreFields(parsed);

  if (meaningfulRequirements.length >= MIN_MEANINGFUL_REQUIREMENTS) {
    return false;
  }

  if (
    knownCoreFields >= 2 &&
    meaningfulRequirements.length >= 2
  ) {
    return false;
  }

  return true;
}
