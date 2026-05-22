import { v4 as uuidv4 } from "uuid";
import {
  createOrUpdateResume,
  type ResumeCreateUpdateResponse,
  type ResumeDataResponse,
} from "@/lib/api-services";
import type { ResumeData } from "@/types/resume";

export type ProfileForResumeDraft = {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  linkedin?: string | null;
  github?: string | null;
  location?: string | null;
} | null | undefined;

export type ResumeDraft = {
  resumeId: string | null;
  jobId: string | null;
  title: string;
  resumeData: ResumeData;
};

export type SaveResumeEvaluation =
  | { status: "ready" }
  | { status: "skipped"; reason: "not_dirty" | "missing_job_id" };

export type SaveResumeOptions = {
  force?: boolean;
  isDirty: boolean;
  versionSource?: "manual" | "autosave";
  versionLabel?: string;
};

export type SaveResumeResult =
  | {
      status: "saved";
      response: ResumeCreateUpdateResponse;
      draft: ResumeDraft;
    }
  | { status: "skipped"; reason: "not_dirty" | "missing_job_id" };

const emptySkills = {
  languages: "",
  developerTools: "",
  technologiesFrameworks: "",
};

export function makeInitialResumeData(): ResumeData {
  return {
    personalInfo: {
      name: "",
      email: "",
      phone: "",
      linkedin: "",
      github: "",
      address: "",
    },
    education: [
      {
        id: uuidv4(),
        universityName: "",
        degree: "",
        location: "",
        datesAttended: "",
        coursework: "",
        order: 0,
        isCollapsed: false,
      },
    ],
    experience: [
      {
        id: uuidv4(),
        jobTitle: "",
        company: "",
        location: "",
        dates: "",
        description: "",
        order: 0,
        isCollapsed: false,
      },
    ],
    projects: [
      {
        id: uuidv4(),
        projectName: "",
        technologies: "",
        date: "",
        description: "",
        order: 0,
        isCollapsed: false,
      },
    ],
    leadership: [
      {
        id: uuidv4(),
        role: "",
        organization: "",
        dates: "",
        description: "",
        order: 0,
        isCollapsed: false,
      },
    ],
    technicalSkills: { ...emptySkills },
  };
}

export function emptyResumeDraft(): ResumeDraft {
  return {
    resumeId: null,
    jobId: null,
    title: "",
    resumeData: makeInitialResumeData(),
  };
}

export function resumeSyncKey(resumeId: string, lastUpdated: string): string {
  return `${resumeId}:${lastUpdated}`;
}

export function buildResumeDraftFromApi(
  resume: ResumeDataResponse,
  profile: ProfileForResumeDraft,
): ResumeDraft {
  const profileName = `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim();

  return {
    resumeId: String(resume.id),
    jobId: String(resume.job_id),
    title: resume.title,
    resumeData: {
      personalInfo: {
        name: profileName,
        email: profile?.email ?? "",
        phone: profile?.phone ?? "",
        linkedin: profile?.linkedin ?? "",
        github: profile?.github ?? "",
        address: profile?.location ?? "",
      },
      education: resume.sections?.education ?? [],
      experience: resume.sections?.work_experience ?? [],
      projects: resume.sections?.projects ?? [],
      leadership: resume.sections?.leadership ?? [],
      technicalSkills:
        (resume.sections?.skills as ResumeData["technicalSkills"]) ?? {
          ...emptySkills,
        },
    },
  };
}

export function mergeProfileIntoResumeDraft(
  draft: ResumeDraft,
  profile: ProfileForResumeDraft,
): ResumeDraft {
  if (!profile) return draft;

  const name = `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim();

  return {
    ...draft,
    resumeData: {
      ...draft.resumeData,
      personalInfo: {
        ...draft.resumeData.personalInfo,
        ...(draft.resumeData.personalInfo.name.trim()
          ? {}
          : name
            ? { name }
            : {}),
        email: profile.email || draft.resumeData.personalInfo.email,
        phone: profile.phone || draft.resumeData.personalInfo.phone,
        linkedin: profile.linkedin || draft.resumeData.personalInfo.linkedin,
        github: profile.github || draft.resumeData.personalInfo.github,
        address: profile.location || draft.resumeData.personalInfo.address,
      },
    },
  };
}

export function evaluateResumeSave(
  draft: ResumeDraft,
  options: Pick<SaveResumeOptions, "force" | "isDirty">,
): SaveResumeEvaluation {
  if (!options.force && !options.isDirty) {
    return { status: "skipped", reason: "not_dirty" };
  }
  if (!draft.jobId) {
    return { status: "skipped", reason: "missing_job_id" };
  }
  return { status: "ready" };
}

export function buildResumeSavePayload(
  draft: ResumeDraft,
  options: Pick<SaveResumeOptions, "versionSource" | "versionLabel"> = {},
) {
  const versionLabel = options.versionLabel?.trim();

  return {
    id: draft.resumeId ?? undefined,
    job_id: draft.jobId!,
    sections: {
      education: draft.resumeData.education,
      projects: draft.resumeData.projects,
      skills: draft.resumeData.technicalSkills,
      work_experience: draft.resumeData.experience,
      leadership: draft.resumeData.leadership,
    },
    title: draft.title || "Untitled Resume",
    version_source: options.versionSource ?? "autosave",
    ...(versionLabel ? { version_label: versionLabel } : {}),
  };
}

export function resumeQueryDataFromDraft(
  draft: ResumeDraft,
  existing?: ResumeDataResponse | null,
  savedAt?: Date,
): ResumeDataResponse {
  const last_updated = savedAt?.toISOString() ?? existing?.last_updated ?? new Date().toISOString();

  return {
    id: String(draft.resumeId ?? existing?.id ?? ""),
    job_id: String(draft.jobId ?? existing?.job_id ?? ""),
    title: draft.title,
    creation_date: existing?.creation_date ?? last_updated,
    last_updated,
    sections: {
      education: draft.resumeData.education,
      work_experience: draft.resumeData.experience,
      projects: draft.resumeData.projects,
      leadership: draft.resumeData.leadership,
      skills: draft.resumeData.technicalSkills,
    },
  };
}

let saveResumeInFlight: Promise<SaveResumeResult> | null = null;

export async function saveResumeDraft(
  draft: ResumeDraft,
  options: SaveResumeOptions,
): Promise<SaveResumeResult> {
  const evaluation = evaluateResumeSave(draft, options);
  if (evaluation.status === "skipped") {
    return evaluation;
  }

  if (saveResumeInFlight) {
    return saveResumeInFlight;
  }

  saveResumeInFlight = (async (): Promise<SaveResumeResult> => {
    try {
      const response = await createOrUpdateResume(
        buildResumeSavePayload(draft, options),
      );

      if (!response.success || !response.resume_id) {
        throw new Error("Resume save failed");
      }

      return {
        status: "saved",
        response,
        draft: {
          ...draft,
          resumeId: String(response.resume_id),
        },
      };
    } finally {
      saveResumeInFlight = null;
    }
  })();

  return saveResumeInFlight;
}
