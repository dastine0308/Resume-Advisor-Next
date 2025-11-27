import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "@/types/user";

interface AccountStore {
  user: Omit<User, "id" | "password">;
  setUser: (user: Omit<User, "id" | "password">) => void;
  resetUser: () => void;
}

export const useAccountStore = create<AccountStore>()(
  persist(
    (set) => ({
      user: {
        email: "",
        phone: "",
        first_name: "",
        last_name: "",
        github: "",
        linkedin: "",
        location: "",
      },
      setUser: (user: Omit<User, "id" | "password">) => set({ user }),
      resetUser: () =>
        set({
          user: {
            email: "",
            phone: "",
            first_name: "",
            last_name: "",
            github: "",
            linkedin: "",
            location: "",
          },
        }),
    }),
    {
      name: "account-storage", // localStorage key
    },
  ),
);
