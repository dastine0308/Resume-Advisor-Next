import { describe, expect, it } from "vitest";
import type { ResumeDataResponse } from "@/lib/api-services";
import {
  buildResumeDraftFromApi,
  buildResumeSavePayload,
  emptyResumeDraft,
  evaluateResumeSave,
  mergeProfileIntoResumeDraft,
  resumeQueryDataFromDraft,
  resumeSyncKey,
} from "../resume-draft";

const ibmResume: ResumeDataResponse = {
  id: "7",
  job_id: "8",
  title: "IBM",
  creation_date: "2026-05-22T00:00:00Z",
  last_updated: "2026-05-22T12:00:00Z",
  sections: {
    education: [],
    work_experience: [],
    projects: [
      {
        id: "p1",
        projectName: "Memory Mirror",
        technologies: "",
        date: "",
        description: "",
      },
    ],
    leadership: [],
    skills: {
      languages: "Python, JavaScript, HTML",
      developerTools: "",
      technologiesFrameworks: "",
    },
  },
};

describe("resumeSyncKey", () => {
  it("combines resume id and last_updated", () => {
    expect(resumeSyncKey("7", "2026-05-22T12:00:00Z")).toBe(
      "7:2026-05-22T12:00:00Z",
    );
  });
});

describe("buildResumeDraftFromApi", () => {
  it("maps api resume into draft shape including profile name", () => {
    const draft = buildResumeDraftFromApi(ibmResume, {
      first_name: "SHIH-TING",
      last_name: "LIN",
      email: "user@example.com",
    });

    expect(draft.resumeId).toBe("7");
    expect(draft.jobId).toBe("8");
    expect(draft.title).toBe("IBM");
    expect(draft.resumeData.personalInfo.name).toBe("SHIH-TING LIN");
    expect(draft.resumeData.technicalSkills.languages).toBe(
      "Python, JavaScript, HTML",
    );
  });

  it("coerces numeric ids from the database", () => {
    const draft = buildResumeDraftFromApi(
      {
        ...ibmResume,
        id: 7 as unknown as string,
        job_id: 8 as unknown as string,
      },
      null,
    );

    expect(draft.resumeId).toBe("7");
    expect(draft.jobId).toBe("8");
  });
});

describe("mergeProfileIntoResumeDraft", () => {
  it("fills personalInfo from profile when name is empty", () => {
    const merged = mergeProfileIntoResumeDraft(
      buildResumeDraftFromApi(ibmResume, null),
      {
        first_name: "Ada",
        last_name: "Lovelace",
        email: "ada@example.com",
      },
    );

    expect(merged.resumeData.personalInfo.email).toBe("ada@example.com");
    expect(merged.resumeData.personalInfo.name).toBe("Ada Lovelace");
  });

  it("preserves an existing resume name over profile", () => {
    const draft = buildResumeDraftFromApi(ibmResume, {
      first_name: "Existing",
      last_name: "Name",
    });

    const merged = mergeProfileIntoResumeDraft(draft, {
      first_name: "Ada",
      last_name: "Lovelace",
    });

    expect(merged.resumeData.personalInfo.name).toBe("Existing Name");
  });
});

describe("evaluateResumeSave", () => {
  it("skips when draft is clean and save is not forced", () => {
    expect(
      evaluateResumeSave(emptyResumeDraft(), { isDirty: false }),
    ).toEqual({ status: "skipped", reason: "not_dirty" });
  });

  it("skips when job id is missing", () => {
    expect(
      evaluateResumeSave(
        { ...emptyResumeDraft(), title: "My Resume" },
        { isDirty: true },
      ),
    ).toEqual({ status: "skipped", reason: "missing_job_id" });
  });

  it("allows save when dirty and job id exists", () => {
    expect(
      evaluateResumeSave(
        { ...emptyResumeDraft(), jobId: "8", title: "My Resume" },
        { isDirty: true },
      ),
    ).toEqual({ status: "ready" });
  });
});

describe("buildResumeSavePayload", () => {
  it("maps draft sections to API request shape", () => {
    const draft = buildResumeDraftFromApi(ibmResume, null);
    const payload = buildResumeSavePayload(draft, {
      versionSource: "manual",
      versionLabel: "Before interview",
    });

    expect(payload.id).toBe("7");
    expect(payload.job_id).toBe("8");
    expect(payload.title).toBe("IBM");
    expect(payload.sections.projects[0]?.projectName).toBe("Memory Mirror");
    expect(payload.version_source).toBe("manual");
    expect(payload.version_label).toBe("Before interview");
  });
});

describe("resumeQueryDataFromDraft", () => {
  it("builds query cache data after save", () => {
    const draft = buildResumeDraftFromApi(ibmResume, null);
    const cached = resumeQueryDataFromDraft(draft, ibmResume);

    expect(cached.id).toBe("7");
    expect(cached.title).toBe("IBM");
    expect(cached.sections.projects[0]?.projectName).toBe("Memory Mirror");
    expect(cached.last_updated).toBe(ibmResume.last_updated);
  });
});
