"use client";

import Link from "next/link";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useSignupStore } from "@/stores/useSignupStore";

export default function ProfileSetupPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    location: "",
    phone: "",
    linkedin: "",
    github: "",
  });

  const signupForm = useSignupStore((s) => s.signupForm);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const formRef = useRef<HTMLFormElement | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signIn();
    router.push("/resume/job-description");
  };

  return (
    <div className="mx-auto px-4 py-6">
      <div className="rounded-xl bg-white p-6 shadow-md">
        {/* Centered Header */}
        <div className="mb-4 text-center">
          <h1 className="text-2xl font-bold text-indigo-600">
            Set up your profile
          </h1>
        </div>
        {/* Form */}

        <form
          ref={(el) => {
            formRef.current = el;
          }}
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <Input
            label="Full name"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="First Last"
            required
          />

          <Input
            label="Location (City, Province)"
            name="location"
            value={form.location}
            onChange={handleChange}
            placeholder="Calgary, AB"
          />

          <Input
            label="Phone number"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="(555) 555-5555"
          />

          <Input
            label="LinkedIn profile"
            name="linkedin"
            value={form.linkedin}
            onChange={handleChange}
            placeholder="https://linkedin.com/in/username"
          />

          <Input
            label="GitHub profile"
            name="github"
            value={form.github}
            onChange={handleChange}
            placeholder="https://github.com/username"
          />

          <div className="flex items-center justify-between gap-4 pt-2">
            <Button
              variant="outline"
              className="py-2"
              onClick={() => {
                router.push("/signup");
                useSignupStore.getState().setCurrentStep(1);
              }}
            >
              Back
            </Button>
            <Button type="submit" variant="primary">
              Done
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
