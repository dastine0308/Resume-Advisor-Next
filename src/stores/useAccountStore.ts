import { create } from "zustand";
import { User } from "@/types/user";

interface AccountStore {
  user: Omit<User, "id" | "password">;
  setUser: (user: Omit<User, "id" | "password">) => void;
  resetUser: () => void;
}

const defaultUser = {
  email: "",
  phone: "",
  first_name: "",
  last_name: "",
  github: "",
  linkedin: "",
  location: "",
};

export const useAccountStore = create<AccountStore>()((set) => ({
  user: defaultUser,
  setUser: (user) => set({ user }),
  resetUser: () => set({ user: defaultUser }),
}));
