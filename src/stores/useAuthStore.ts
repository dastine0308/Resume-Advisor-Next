import { create } from "zustand";
import { useResumeStore } from "./useResumeStore";
import { useJobPostingStore } from "./useJobPostingStore";
import { useSignupStore } from "./useSignupStore";
import { useAccountStore } from "./useAccountStore";
import { useCoverLetterStore } from "./useCoverLetterStore";

const TOKEN_COOKIE_NAME = "auth-token";

// Clear all persisted store data from localStorage and reset state
function clearAllStores() {
  // Reset all store states
  useResumeStore.getState().resetStore();
  useJobPostingStore.getState().resetStore();
  useSignupStore.getState().resetSignupForm();
  useAccountStore.getState().resetUser();
  useCoverLetterStore.getState().resetStore();

  // Clear localStorage for persisted stores
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem("resume-storage");
    localStorage.removeItem("job-posting-storage");
    localStorage.removeItem("signup-storage");
    localStorage.removeItem("account-storage");
  }
}

// Cookie utility functions
function setCookie(name: string, value: string, days: number = 7) {
  if (typeof document === "undefined") return;
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? match[2] : null;
}

function deleteCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
}

interface AuthState {
  isAuthenticated: boolean;
  setAuth: (token: string, userId: number) => void;
  logout: () => void;
  getToken: () => string | null;
}

export const useAuthStore = create<AuthState>()((set) => ({
  isAuthenticated: typeof document !== "undefined" && !!getCookie(TOKEN_COOKIE_NAME),
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setAuth: (token: string, userId: number) => {
    setCookie(TOKEN_COOKIE_NAME, token);
    set({ isAuthenticated: true });
  },
  logout: () => {
    deleteCookie(TOKEN_COOKIE_NAME);
    clearAllStores();
    set({ isAuthenticated: false });
  },
  getToken: () => getCookie(TOKEN_COOKIE_NAME),
}));

export { TOKEN_COOKIE_NAME };
