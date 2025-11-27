"use client";

import { ProgressBar } from "@/components/resume/ProgressBar";
import { useSignupStore } from "@/stores/useSignupStore";
import SignUpForm from "@/components/form/sign-up-form";
import ProfileSetUpForm from "@/components/form/profile-set-up-form";
import { useEffect } from "react";

export default function SignUpLayout() {
  const steps = [{ label: "Sign Up" }, { label: "Profile Setup" }];

  const currentStep = useSignupStore((state) => state.currentStep);

  useEffect(() => {
    return () => {
      useSignupStore.getState().resetSignupForm();
      console.log("Signup form reset on unmount of SignUpLayout");
    };
  }, []);

  return (
    <div className="mx-auto w-full flex-none px-4 lg:w-[500px]">
      <ProgressBar currentStep={currentStep} totalSteps={2} steps={steps} />
      <div className="mx-auto">
        {currentStep === 1 && <SignUpForm />}
        {currentStep === 2 && <ProfileSetUpForm />}
      </div>
    </div>
  );
}
