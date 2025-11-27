import { create } from "zustand";

const TOKEN_COOKIE_NAME = "auth-token";

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
  setAuth: (token: string, _userId: number) => {
    setCookie(TOKEN_COOKIE_NAME, token);
    set({ isAuthenticated: true });
  },
  logout: () => {
    deleteCookie(TOKEN_COOKIE_NAME);
    set({ isAuthenticated: false });
  },
  getToken: () => getCookie(TOKEN_COOKIE_NAME),
}));

export { TOKEN_COOKIE_NAME };
