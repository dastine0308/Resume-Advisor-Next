import axios from "axios";
import https from "https";
import { api } from "./api-client";
import type { User } from "@/types/user";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1";

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

export interface ResumesResponse {
  id: string;
  job_id: number;
  last_updated: string;
  title: string;
}
[];

/**
 * Get all resumes for the current user
 */
export async function getUserResumes(): Promise<ResumesResponse[]> {
  return api.get<ResumesResponse[]>("/user/resumes");
}

export interface ResumeDataResponse {
  id: string;
  job_id: number;
  last_updated: string;
  title: string;
  personal_info?: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    linkedin?: string;
    github?: string;
  };
  education: Array<{
    id: string;
    university_name: string;
    degree: string;
    location: string;
    dates_attended: string;
    coursework?: string;
    order?: number;
  }>;
  experience: Array<{
    id: string;
    job_title: string;
    company: string;
    location: string;
    dates: string;
    description: string;
    order?: number;
  }>;
  projects: Array<{
    id: string;
    project_name: string;
    technologies: string;
    date: string;
    description: string;
    order?: number;
  }>;
  leadership: Array<{
    id: string;
    role: string;
    organization: string;
    dates: string;
    description: string;
    order?: number;
  }>;
  technical_skills: {
    languages: string;
    developer_tools: string;
    technologies_frameworks: string;
  };
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
