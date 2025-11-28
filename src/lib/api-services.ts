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

/**
 * Auth API Services
 */

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user_id: number;
}

export interface SignupRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone: string;
  location?: string;
  linkedin_profile_url?: string;
  github_profile_url?: string;
}

export interface SignupResponse {
  success: boolean;
  message?: string;
  user?: User;
}

/**
 * Login user
 * Note: This is called from NextAuth authorize function
 */
export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  return api.post<LoginResponse>("/auth/login", credentials);
}

/**
 * Register new user
 */
export async function signup(data: SignupRequest): Promise<SignupResponse> {
  return api.post<SignupResponse>("/auth/signup", data);
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

/**
 * Get current user data
 */
export async function getUserData(): Promise<User> {
  return api.get<User>("/user");
}

/**
 * Update user profile
 */
export async function updateUserData(data: UserUpdateRequest): Promise<User> {
  return api.put<User>("/user", data);
}

/**
 * Delete user account
 */
export async function deleteUser(): Promise<{ success: boolean }> {
  return api.delete<{ success: boolean }>("/user");
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
  job_id: number;
  last_updated: string;
  title: string;
}

/**
 * Get all resumes for the current user
 */
export async function getUserResumes(): Promise<ResumesResponse[]> {
  return api.get<ResumesResponse[]>("/user/resumes");
}

export interface ResumeCreateUpdateRequest {
  id?: string;
  job_id: number;
  sections: ResumeDataSection;
  title: string;
}

export interface ResumeCreateUpdateResponse {
  resume_id: string;
  success: boolean;
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
  id: number;
  job_id: number;
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
  return api.get<ResumeDataResponse>(`/resumes/${id}`);
}

/**
 * Delete a specific resume by ID
 */
export async function deleteResume(id: string): Promise<{ success: boolean }> {
  return api.delete<{ success: boolean }>(`/resumes/${id}`);
}

/**
 * Job Posting API Services
 */

export interface createOrUpdateJobPostingResponse {
  job_id: number;
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
export async function getJobPosting(id: string): Promise<JobPosting> {
  return api.get<JobPosting>(`/job-postings/${id}`);
}

/**
 * Analyze a job description and extract structured keywords
 */
export async function analyzeJobDescription(data: string): Promise<JobPosting> {
  return api.post<JobPosting>("/ai/analyze-job", data);
}

/**
 * Cover Letter API Services
 */

/**
 * Get all cover letters for the current user
 */
export async function getUserCoverLetters(): Promise<CoverLetterListItem[]> {
  return api.get<CoverLetterListItem[]>("/user/coverletters");
}

/**
 * Get a specific cover letter by ID
 */
export async function getCoverLetterById(id: string): Promise<CoverLetter> {
  return api.get<CoverLetter>(`/cover-letters/${id}`);
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
