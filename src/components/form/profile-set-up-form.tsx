"use client";

import React, { useRef } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useSignupStore } from "@/stores/useSignupStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useAccountStore } from "@/stores/useAccountStore";
import { z } from "zod";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { profileSchema } from "@/lib/utils";

export default function ProfileSetUpForm() {
  const router = useRouter();
  const [error, setError] = React.useState<Record<string, string>>({});
  const { setAuth } = useAuthStore();
  const { setUser } = useAccountStore();

  const { signupForm: form, setSignupForm: setForm } = useSignupStore();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const formRef = useRef<HTMLFormElement | null>(null);

  const validateForm = () => {
    try {
      profileSchema.parse(form);
      setError({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          const path = err.path[0] as string;
          newErrors[path] = err.message;
        });
        setError(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("Submitting form:", form);
    console.log("validateForm():", validateForm());

    if (!validateForm()) {
      return;
    }

    try {
      // Import API service
      const { signup, login, getUserData } = await import("@/lib/api-services");

      await signup({
        email: form.email,
        password: form.password,
        first_name: form.first_name,
        last_name: form.last_name,
        phone: form.phone,
        location: form.location,
        linkedin_profile_url: form.linkedin,
        github_profile_url: form.github,
      });

      // Login after signup
      const result = await login({
        email: form.email,
        password: form.password,
      });

      if (result.success && result.token) {
        setAuth(result.token, result.user_id);
        // Fetch and store user data
        const userData = await getUserData();
        setUser(userData);
        router.push("/");
      } else {
        console.error("Error signing in after signup");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      return;
    }
  };

  return (
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
          label="First name"
          name="first_name"
          value={form.first_name}
          onChange={handleChange}
          placeholder="First name"
          required
        />
        {error.first_name && (
          <p className="mt-0 text-sm text-red-500">{error.first_name}</p>
        )}

        <Input
          label="Last name"
          name="last_name"
          value={form.last_name}
          onChange={handleChange}
          placeholder="Last name"
          required
        />
        {error.last_name && (
          <p className="mt-0 text-sm text-red-500">{error.last_name}</p>
        )}

        <Input
          label="Location (City, Province)"
          name="location"
          value={form.location}
          onChange={handleChange}
          placeholder="Calgary, AB"
        />
        {error.location && (
          <p className="mt-0 text-sm text-red-500">{error.location}</p>
        )}

        <div className="flex w-full flex-col gap-1.5">
          <label className="text-xs font-bold text-gray-800 md:text-sm">
            Phone Number
          </label>
        </div>
        <PhoneInput
          id="phone"
          label="Phone Number"
          name="phone"
          value={form.phone}
          onChange={(value) => setForm({ ...form, phone: value || "" })}
          defaultCountry="CA"
          maxLength={14}
        />
        {error.phone && (
          <p className="mt-0 text-sm text-red-500">{error.phone}</p>
        )}

        <Input
          label="LinkedIn profile"
          name="linkedin"
          value={form.linkedin}
          onChange={handleChange}
          placeholder="https://linkedin.com/in/username"
        />
        {error.linkedin && (
          <p className="mt-0 text-sm text-red-500">{error.linkedin}</p>
        )}

        <Input
          label="GitHub profile"
          name="github"
          value={form.github}
          onChange={handleChange}
          placeholder="https://github.com/username"
        />
        {error.github && (
          <p className="!mt-0 text-sm text-red-500">{error.github}</p>
        )}

        <div className="flex items-center justify-between gap-4 pt-2">
          <Button
            variant="outline"
            className="py-2"
            onClick={() => {
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
  );
}
