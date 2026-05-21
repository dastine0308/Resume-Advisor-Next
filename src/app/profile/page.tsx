"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/stores/useAuthStore";

type ProfileData = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  location: string | null;
  linkedin: string | null;
  github: string | null;
};

export default function ProfilePage() {
  const { logout } = useAuthStore();
  const router = useRouter();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Omit<ProfileData, "id" | "email">>({
    first_name: "",
    last_name: "",
    phone: "",
    location: "",
    linkedin: "",
    github: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/user", { credentials: "include" })
      .then((r) => r.json())
      .then((json) => {
        if (!json.success || !json.data) return;
        const data = json.data as ProfileData;
        setProfile(data);
        setForm({
          first_name: data.first_name ?? "",
          last_name: data.last_name ?? "",
          phone: data.phone ?? "",
          location: data.location ?? "",
          linkedin: data.linkedin ?? "",
          github: data.github ?? "",
        });
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/user", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    setSaving(false);
    if (json.success) {
      setProfile((p) => p && { ...p, ...form });
      setEditing(false);
      setMessage({ type: "success", text: "Profile updated." });
    } else {
      setMessage({ type: "error", text: json.error ?? "Failed to save." });
    }
  };

  const handleSignOut = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900">
      <header className="flex items-center justify-between bg-white px-8 py-4 shadow-sm">
        <Link href="/" className="text-2xl font-bold text-blue-700">
          Resume Advisor
        </Link>
        <button
          onClick={handleSignOut}
          className="rounded-lg border px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          Logout
        </button>
      </header>

      <main className="flex flex-1 flex-col items-center px-4 py-10">
        <div className="w-full max-w-lg rounded-xl bg-white p-8 shadow-lg">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Your Profile</h2>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Edit
              </button>
            )}
          </div>

          {message && (
            <p
              className={`mb-4 rounded-lg px-4 py-2 text-sm ${
                message.type === "success"
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {message.text}
            </p>
          )}

          {!profile ? (
            <p className="text-gray-500">Loading profile…</p>
          ) : editing ? (
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              {(
                [
                  ["first_name", "First Name"],
                  ["last_name", "Last Name"],
                  ["phone", "Phone"],
                  ["location", "Location"],
                  ["linkedin", "LinkedIn URL"],
                  ["github", "GitHub URL"],
                ] as const
              ).map(([key, label]) => (
                <div key={key}>
                  <label className="mb-1 block text-sm font-medium">{label}</label>
                  <input
                    type="text"
                    value={form[key] ?? ""}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-lg bg-blue-600 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="flex-1 rounded-lg border py-2 font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <dl className="flex flex-col gap-4">
              <Row label="Email" value={profile.email} />
              <Row label="First Name" value={profile.first_name} />
              <Row label="Last Name" value={profile.last_name} />
              <Row label="Phone" value={profile.phone} />
              <Row label="Location" value={profile.location} />
              <Row label="LinkedIn" value={profile.linkedin} />
              <Row label="GitHub" value={profile.github} />
            </dl>
          )}
        </div>
      </main>

      <footer className="py-4 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} Resume Advisor
      </footer>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex flex-col gap-1 border-b pb-3 last:border-b-0">
      <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</dt>
      <dd className="text-gray-800">{value || <span className="italic text-gray-400">—</span>}</dd>
    </div>
  );
}
