import { api } from "./api-client";
import type { User } from "@/types/user";

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
  user_id: string;
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
