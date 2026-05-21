import { api } from "./api-client";
import type { User } from "@/types/user";
import type {
  Education,
  TechnicalSkills,
  Project,
  Experience,
  Leadership,
} from "@/types/resume";
import type { JobPosting } from "@/types/job-posting";
import type {
  CoverLetter,
  CoverLetterListItem,
  CreateUpdateCoverLetterRequest,
  CreateUpdateCoverLetterResponse,
} from "@/types/cover-letter";

export interface JobPostingResponse {
  id: string;
  title: string;
  description?: string;
  job_location: string;
  posted_date?: string;
  close_date?: string;
  company?: {
    id: string;
    name: string;
    location?: string;
    industry?: string;
    website?: string;
  };
  requirements?: string[];
  selected_requirements?: string[];
}

/**
 * User API Services
 */

export interface UserUpdateRequest {
  phone?: string;
  first_name?: string;
  last_name?: string;
  github?: string;
  linkedin?: string;
  location?: string;
}

export async function getUserData(): Promise<User> {
  const res = await api.get<{ success: boolean; data: User }>("/user");
  return res.data;
}

export async function updateUserData(data: UserUpdateRequest): Promise<void> {
  await api.put<{ success: boolean }>("/user", data);
}

/**
 * Delete user account
 */
export async function deleteUser(): Promise<{ success: boolean }> {
  return api.delete<{ success: boolean }>("/user");
}

export async function createStripeCheckout(): Promise<{ url: string }> {
  return api.post<{ url: string }>("/stripe/checkout");
}

export async function createStripePortal(): Promise<{ url: string }> {
  return api.post<{ url: string }>("/stripe/portal");
}

/**
 * Resume API Services
 */

export interface ResumeSection {
  education: [
    {
      coursework: string;
      datesAttended: string;
      degree: string;
      id: string;
      location: string;
      order: number;
      universityName: string;
    },
  ];
  order: string[];
  projects: unknown;
  skills: unknown;
  work_experience: unknown;
}

export interface ResumesResponse {
  id: string;
  job_id: string;
  last_updated: string;
  title: string;
}

/**
 * Get all resumes for the current user
 */
export async function getUserResumes(): Promise<ResumesResponse[]> {
  const res = await api.get<{ success: boolean; data: ResumesResponse[] }>("/user/resumes");
  return res.data;
}

export interface ResumeCreateUpdateRequest {
  id?: string;
  job_id: string;
  sections: ResumeDataSection;
  title: string;
  version_source?: "manual" | "autosave";
  version_label?: string;
}

export interface ResumeCreateUpdateResponse {
  resume_id: string;
  success: boolean;
  version_created?: boolean;
  version_error?: string | null;
}

export interface ResumeDataSection {
  education: Education[];
  order?: string[];
  projects: Project[];
  skills: TechnicalSkills;
  work_experience: Experience[];
  leadership?: Leadership[];
}

export interface ResumeDataResponse {
  creation_date: string;
  id: string;
  job_id: string;
  last_updated: string;
  sections: ResumeDataSection;
  title: string;
}

/**
 * Create or update a resume
 */
export async function createOrUpdateResume(
  data: ResumeCreateUpdateRequest,
): Promise<ResumeCreateUpdateResponse> {
  return api.post<ResumeCreateUpdateResponse>("/resumes", data);
}

/**
 * Get a specific resume by ID
 */
export async function getResumeById(id: string): Promise<ResumeDataResponse> {
  const res = await api.get<{ success: boolean; data: ResumeDataResponse }>(`/resumes/${id}`);
  return res.data;
}

/**
 * Delete a specific resume by ID
 */
export async function deleteResume(id: string): Promise<{ success: boolean }> {
  return api.delete<{ success: boolean }>(`/resumes/${id}`);
}

export interface ResumeVersionListItem {
  id: string;
  title: string;
  source: "autosave" | "manual" | "restore";
  created_at: string;
  label: string | null;
  change_summary: string | null;
}

export interface RestoreResumeVersionResponse {
  success: boolean;
  data: {
    title: string;
    sections: ResumeDataSection;
  };
  message: string;
}

/**
 * List saved versions for a resume (metadata only)
 */
export async function getResumeVersions(resumeId: string): Promise<ResumeVersionListItem[]> {
  const res = await api.get<{ success: boolean; data: ResumeVersionListItem[] }>(
    `/resumes/${resumeId}/versions`,
  );
  return res.data;
}

/**
 * Restore a resume to a previous version
 */
export async function restoreResumeVersion(
  resumeId: string,
  versionId: string,
): Promise<RestoreResumeVersionResponse> {
  return api.post<RestoreResumeVersionResponse>(
    `/resumes/${resumeId}/versions/${versionId}/restore`,
  );
}

/**
 * Job Posting API Services
 */

export interface createOrUpdateJobPostingResponse {
  job_id: string;
  message: string;
  success: boolean;
}

/**
 * Create or update a job posting
 */
export async function createOrUpdateJobPosting(
  data: JobPosting,
): Promise<createOrUpdateJobPostingResponse> {
  return api.post<createOrUpdateJobPostingResponse>("/job-postings", data);
}

/**
 * Get details of a job posting by ID
 */
export async function getJobPosting(id: string): Promise<JobPostingResponse> {
  const res = await api.get<{ success: boolean; data: JobPostingResponse }>(`/job-postings/${id}`);
  return res.data;
}

/**
 * Analyze a job description and extract structured keywords
 */
export async function analyzeJobDescription(jobDescription: string): Promise<JobPosting> {
  return api.post<JobPosting>("/ai/analyze-job", { job_description: jobDescription }, { timeout: 60000 });
}

/**
 * Cover Letter API Services
 */

/**
 * Get all cover letters for the current user
 */
export async function getUserCoverLetters(): Promise<CoverLetterListItem[]> {
  const res = await api.get<{ success: boolean; data: CoverLetterListItem[] }>("/user/cover-letters");
  return res.data;
}

/**
 * Get a specific cover letter by ID
 */
export async function getCoverLetterById(id: string): Promise<CoverLetter> {
  const res = await api.get<{ success: boolean; data: CoverLetter }>(`/cover-letters/${id}`);
  return res.data;
}

/**
 * Create or update a cover letter
 */
export async function createOrUpdateCoverLetter(
  data: CreateUpdateCoverLetterRequest,
): Promise<CreateUpdateCoverLetterResponse> {
  return api.post<CreateUpdateCoverLetterResponse>("/cover-letters", data);
}

/**
 * Delete a specific cover letter by ID
 */
export async function deleteCoverLetter(
  id: string,
): Promise<{ success: boolean; message: string }> {
  return api.delete<{ success: boolean; message: string }>(
    `/cover-letters/${id}`,
  );
}
