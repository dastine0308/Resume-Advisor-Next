"use client";

import Link from "next/link";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function AccountCreationPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    location: "",
    phone: "",
    linkedin: "",
    github: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const formRef = useRef<HTMLFormElement | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signIn();
    router.push("/content-builder/new");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="mx-auto flex w-full max-w-[1150px] items-start justify-center gap-8 px-4">
        <div className="w-full rounded-lg bg-white p-8 shadow-md sm:w-[560px]">
          {/* Centered Header */}
          <div className="mb-6 text-center">
            <h1 className="text-lg font-semibold text-blue-600">
              Complete your profile
            </h1>
            <p className="text-sm text-gray-500">
              Fill in a few details to finish setting up your account
            </p>
          </div>

          {/* Step Indicator */}
          <div className="mb-8 flex items-center justify-center space-x-6">
            <div className="flex flex-col items-center">
              <span className="text-sm font-medium text-blue-600">Sign Up</span>
              <div className="mt-1 h-1.5 w-20 rounded-full bg-blue-600" />
            </div>
            <div className="h-0.5 w-12 bg-blue-600" />
            <div className="flex flex-col items-center">
              <span className="text-sm font-medium text-blue-600">Profile Setup</span>
              <div className="mt-1 h-1.5 w-20 rounded-full bg-blue-600" />
            </div>
          </div>

          {/* Form */}
            <form ref={(el) => { formRef.current = el; }} onSubmit={handleSubmit} className="space-y-4">
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

            {/* Buttons (hidden on small screens; mobile CTA is sticky) */}
            <div className="hidden sm:flex items-center justify-between gap-4 pt-2">
              <Button
                variant="outline"
                className="py-2"
                onClick={() => router.push("/signup")}
              >
                Back
              </Button>
              <button
                type="submit"
                style={{
                  background: "linear-gradient(to right, #3B82F6, #2563EB)",
                }}
                className="flex-1 rounded-md py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
              >
                Done
              </button>
            </div>
        {/* Mobile sticky CTA */}
        <div className="sm:hidden fixed inset-x-0 bottom-0 z-50 bg-white p-4 border-t border-gray-200">
          <div className="mx-auto max-w-md">
            <div className="flex gap-3">
              <button
                onClick={() => router.push("/signup")}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm"
              >
                Back
              </button>
              <button
                onClick={() => formRef.current?.requestSubmit()}
                style={{ background: "linear-gradient(to right, #3B82F6, #2563EB)" }}
                className="flex-1 rounded-md py-3 text-sm font-semibold text-white shadow-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
          </form>
        </div>
      </div>
    </div>
  );
}
