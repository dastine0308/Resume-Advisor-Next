"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/Input";

export default function AccountSettingsPage() {
  const router = useRouter();
  const { signOut } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    location: "",
    phone: "",
    linkedin: "",
    github: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const formRef = useRef<HTMLFormElement | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword || form.confirmPassword) {
      if (form.newPassword !== form.confirmPassword) {
        alert("New passwords do not match");
        return;
      }
      // In a real app, call change-password API here
    }

    // In a real app, persist profile changes. For now, pretend save succeeded.
    router.push("/");
  };

  const handleDelete = () => {
    // stub: in real app confirm + call API
    const ok = confirm("Delete your account? This cannot be undone.");
    if (ok) {
      // clear local auth state and redirect to signup
      signOut();
      router.push("/signup");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 pt-4">
      <div className="mx-auto w-full max-w-[980px] px-4">
        <div className="mx-auto w-full rounded-lg bg-white p-4 shadow-sm sm:p-8">

          {/* Mobile header: back + title */}
          <div className="sm:hidden mb-4 flex items-center gap-3">
            <button
              aria-label="Back"
              onClick={() => router.back()}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border bg-white text-gray-700 shadow-sm"
            >
              {/* simple chevron left */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path fillRule="evenodd" d="M12.293 16.293a1 1 0 010-1.414L15.586 11H4a1 1 0 110-2h11.586l-3.293-3.293a1 1 0 011.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-800">Account settings</h1>
              <p className="text-sm text-gray-500">Update your profile and password</p>
            </div>
          </div>

          {/* Avatar / summary for mobile */}
          <div className="sm:hidden mb-4 flex items-center gap-4">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-gray-100">
              {/* placeholder avatar */}
              <svg className="h-full w-full text-gray-300" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path d="M24 24H0c0-6.627 5.373-12 12-12s12 5.373 12 12zM12 12a6 6 0 100-12 6 6 0 000 12z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-800">Jane Doe</div>
              <div className="text-xs text-gray-500">you@example.com</div>
            </div>
            <button className="rounded-md border px-3 py-1 text-sm">Edit</button>
          </div>

          <form ref={(el) => { formRef.current = el; }} onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Full name" name="name" value={form.name} onChange={handleChange} placeholder="Jane Doe" />
              <Input label="Email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" type="email" />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Location" name="location" value={form.location} onChange={handleChange} placeholder="Calgary, AB" />
              <Input label="Phone" name="phone" value={form.phone} onChange={handleChange} placeholder="(555) 555-5555" />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="LinkedIn" name="linkedin" value={form.linkedin} onChange={handleChange} placeholder="https://linkedin.com/in/username" />
              <Input label="GitHub" name="github" value={form.github} onChange={handleChange} placeholder="https://github.com/username" />
            </div>

            <div className="mt-2 border-t pt-4">
              <h2 className="mb-3 text-sm font-medium text-gray-700">Change password</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Input label="Current password" name="currentPassword" value={form.currentPassword} onChange={handleChange} type="password" placeholder="••••••••" />
                <Input label="New password" name="newPassword" value={form.newPassword} onChange={handleChange} type="password" placeholder="••••••••" />
                <Input label="Confirm new" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} type="password" placeholder="••••••••" />
              </div>
            </div>

            {/* Desktop actions */}
            <div className="mt-6 hidden sm:flex items-center justify-between">
              <button type="button" onClick={() => router.push("/")} className="rounded-md border px-4 py-2 text-sm">
                Cancel
              </button>
              <div className="flex items-center gap-3">
                <button type="button" onClick={handleDelete} className="rounded-md border border-red-300 px-3 py-2 text-sm text-red-600">
                  Delete account
                </button>
                <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
                  Save changes
                </button>
              </div>
            </div>

            {/* Mobile sticky CTA */}
            <div className="sm:hidden fixed inset-x-0 bottom-0 z-50 bg-white p-4 border-t border-gray-200">
              <div className="mx-auto max-w-md">
                <div className="flex gap-3">
                  <button onClick={() => router.push("/")} className="rounded-md border border-gray-300 px-4 py-2 text-sm">
                    Cancel
                  </button>
                  <button onClick={() => { if (confirm('Delete your account?')) { handleDelete(); } }} className="rounded-md border border-red-300 px-3 py-2 text-sm text-red-600">
                    Delete
                  </button>
                  <button onClick={() => formRef.current?.requestSubmit()} className="flex-1 rounded-md bg-blue-600 py-3 text-sm font-semibold text-white">
                    Save
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
