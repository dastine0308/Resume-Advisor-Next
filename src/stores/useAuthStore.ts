import { create } from "zustand";
import { supabase } from "@/lib/supabase/client";
import { useResumeStore } from "./useResumeStore";
import { useJobPostingStore } from "./useJobPostingStore";
import { useAccountStore } from "./useAccountStore";
import { useCoverLetterStore } from "./useCoverLetterStore";

export function clearAllClientStores() {
  useResumeStore.getState().resetStore();
  useJobPostingStore.getState().resetStore();
  useAccountStore.getState().resetUser();
  useCoverLetterStore.getState().resetStore();

  if (typeof localStorage !== "undefined") {
    localStorage.removeItem("resume-storage");
    localStorage.removeItem("job-posting-storage");
  }
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  setIsAuthenticated: (v: boolean) => void;
  setIsLoading: (v: boolean) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set) => ({
  isAuthenticated: false,
  isLoading: true,
  setIsAuthenticated: (v: boolean) =>
    set((state) => state.isAuthenticated === v ? state : { isAuthenticated: v }),
  setIsLoading: (v: boolean) =>
    set((state) => state.isLoading === v ? state : { isLoading: v }),
  logout: async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Still clear local session if the route fails
    }
    await supabase.auth.signOut();
    clearAllClientStores();
    set({ isAuthenticated: false });
  },
}));
