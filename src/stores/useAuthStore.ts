import { create } from "zustand";
import { supabase } from "@/lib/supabase/client";
import { useResumeUIStore } from "./useResumeUIStore";
import { useAccountStore } from "./useAccountStore";

export function clearAllClientStores() {
  useResumeUIStore.getState().resetUI();
  useAccountStore.getState().resetUser();

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
