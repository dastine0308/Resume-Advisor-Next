"use client";

import React from "react";
import { ProgressBar } from "@/components/resume/ProgressBar";
import { useSignupStore } from "@/stores/useSignupStore";

export default function SignUpLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const steps = [{ label: "Sign Up" }, { label: "Profile Setup" }];

  const currentStep = useSignupStore((state) => state.currentStep);

  return (
    <div className="mx-auto w-full flex-none lg:w-[500px]">
      <ProgressBar currentStep={currentStep} totalSteps={2} steps={steps} />
      {children}
    </div>
  );
}
