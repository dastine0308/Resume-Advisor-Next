"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type FormData = {
  first_name: string;
  last_name: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
};

const FIELDS: { key: keyof FormData; label: string; placeholder: string; required?: boolean }[] = [
  { key: "first_name", label: "First Name", placeholder: "Jane", required: true },
  { key: "last_name", label: "Last Name", placeholder: "Doe", required: true },
  { key: "location", label: "Location (City, Province)", placeholder: "Calgary, AB" },
  { key: "phone", label: "Phone Number", placeholder: "+1 (403) 555-0100" },
  { key: "linkedin", label: "LinkedIn URL", placeholder: "https://linkedin.com/in/username" },
  { key: "github", label: "GitHub URL", placeholder: "https://github.com/username" },
];

export default function ProfileSetupPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>({
    first_name: "",
    last_name: "",
    phone: "",
    location: "",
    linkedin: "",
    github: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Use getSession (reads from cookie, no network) just to pre-fill Google name.
    // Auth protection is handled by middleware.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      const meta = session.user.user_metadata;
      setForm((f) => ({
        ...f,
        first_name: meta.given_name ?? meta.name?.split(" ")[0] ?? "",
        last_name: meta.family_name ?? meta.name?.split(" ").slice(1).join(" ") ?? "",
      }));
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.first_name || !form.last_name) {
      setError("First and last name are required.");
      return;
    }
    setSaving(true);
    setError("");

    const res = await fetch("/api/user", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    setSaving(false);

    if (json.success) {
      router.push("/dashboard");
    } else {
      setError(json.error ?? "Failed to save profile.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-indigo-600">Set up your profile</h1>
          <p className="mt-1 text-sm text-gray-500">
            Just a few details before you get started
          </p>
        </div>

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {FIELDS.map(({ key, label, placeholder, required }) => (
            <div key={key}>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {label}
                {required && <span className="ml-1 text-red-500">*</span>}
              </label>
              <input
                type="text"
                name={key}
                value={form[key]}
                onChange={handleChange}
                placeholder={placeholder}
                required={required}
                className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={saving}
            className="mt-2 w-full rounded-lg bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Continue to Dashboard"}
          </button>
        </form>
      </div>
    </div>
  );
}
