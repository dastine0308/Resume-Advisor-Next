import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "@/types/user";

interface SignupForm extends Omit<User, "id"> {
  password: string;
  confirmPassword?: string;
}

interface SignupStore {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  signupForm: SignupForm;
  setSignupForm: (data: SignupForm) => void;
  resetSignupForm: () => void;
}

export const useSignupStore = create<SignupStore>()(
  persist(
    (set) => ({
      currentStep: 1,
      setCurrentStep: (step) => set({ currentStep: step }),

      signupForm: {
        email: "",
        password: "",
        confirmPassword: "",
        first_name: "",
        last_name: "",
        phone: "",
        github: "",
        linkedin: "",
        location: "",
      },
      setSignupForm: (data) => set({ signupForm: data }),

      resetSignupForm: () =>
        set({
          currentStep: 1,
          signupForm: {
            email: "",
            password: "",
            confirmPassword: "",
            first_name: "",
            last_name: "",
            phone: "",
            github: "",
            linkedin: "",
            location: "",
          },
        }),
    }),
    {
      name: "signup-storage",
    },
  ),
);
