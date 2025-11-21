import { create } from "zustand";

interface SignupForm {
  email: string;
  password: string;
  confirmPassword?: string;
}

interface SignupStore {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  signupForm: SignupForm | null;
  setSignupForm: (data: SignupForm) => void;
  clearSignupForm: () => void;
}

export const useSignupStore = create<SignupStore>((set) => ({
  currentStep: 1,
  setCurrentStep: (step) => set({ currentStep: step }),
  signupForm: null,
  setSignupForm: (data) => set({ signupForm: data }),
  clearSignupForm: () => set({ signupForm: null }),
}));
