import { createHash } from "crypto";
import type { createSupabaseServerClient } from "./supabase/server";
import { summarizeSectionChanges } from "./resume-version-diff";

type SupabaseClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export const MAX_RESUME_VERSIONS = 15;
export const AUTOSAVE_VERSION_INTERVAL_MS = 5 * 60 * 1000;

export type ResumeVersionSource = "autosave" | "manual" | "restore";

export interface ResumeVersionListItem {
  id: string;
  title: string;
  source: ResumeVersionSource;
  created_at: string;
  label: string | null;
  change_summary: string | null;
}

export interface CreateResumeVersionResult {
  created: boolean;
  versionId?: string;
  error?: string;
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys
    .map((key) => `${JSON.stringify(key)}:${stableStringify(obj[key])}`)
    .join(",")}}`;
}

export function hashResumeContent(content: unknown): string {
  return createHash("sha256").update(stableStringify(content)).digest("hex");
}

function isMissingColumnError(message: string): boolean {
  return (
    message.includes("change_summary") ||
    message.includes("label") ||
    message.includes("schema cache")
  );
}

async function pruneResumeVersions(
  supabase: SupabaseClient,
  resumeId: string,
  maxVersions: number,
): Promise<void> {
  const { data: versions, error } = await supabase
    .from("resume_versions")
    .select("id")
    .eq("resume_id", resumeId)
    .order("created_at", { ascending: false });

  if (error || !versions || versions.length <= maxVersions) return;

  const idsToDelete = versions.slice(maxVersions).map((version) => version.id);
  await supabase.from("resume_versions").delete().in("id", idsToDelete);
}

export async function getVersionBaselineContent(
  supabase: SupabaseClient,
  resumeId: string,
  resumeContentBeforeUpdate: Record<string, unknown> | null,
): Promise<Record<string, unknown> | null> {
  const { data: latestVersion } = await supabase
    .from("resume_versions")
    .select("content")
    .eq("resume_id", resumeId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestVersion?.content) {
    return latestVersion.content as Record<string, unknown>;
  }

  return resumeContentBeforeUpdate;
}

export async function maybeCreateResumeVersion(
  supabase: SupabaseClient,
  params: {
    userId: string;
    resumeId: string;
    title: string;
    content: Record<string, unknown>;
    source?: ResumeVersionSource;
    label?: string | null;
    changeSummary?: string | null;
    baselineContent?: Record<string, unknown> | null;
  },
): Promise<CreateResumeVersionResult> {
  const source = params.source ?? "autosave";
  const contentHash = hashResumeContent(params.content);

  const { data: latest, error: latestError } = await supabase
    .from("resume_versions")
    .select("id, content_hash, created_at, content")
    .eq("resume_id", params.resumeId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestError) {
    const message = `Failed to read latest resume version: ${latestError.message}`;
    console.error(message);
    return { created: false, error: message };
  }

  if (source !== "manual" && latest?.content_hash === contentHash) {
    return { created: false };
  }

  if (source === "autosave" && latest?.created_at) {
    const elapsed = Date.now() - new Date(latest.created_at).getTime();
    if (elapsed < AUTOSAVE_VERSION_INTERVAL_MS) {
      return { created: false };
    }
  }

  const baseline =
    params.baselineContent ??
    ((latest?.content as Record<string, unknown> | undefined) ?? null);
  const changeSummary =
    params.changeSummary ??
    summarizeSectionChanges(baseline, params.content);
  const label = params.label?.trim() || null;

  const baseRow = {
    resume_id: params.resumeId,
    user_id: params.userId,
    title: params.title,
    content: params.content,
    content_hash: contentHash,
    source,
  };

  let inserted: { id: string } | null = null;
  let insertErrorMessage: string | null = null;

  const { data: fullInsert, error: fullInsertError } = await supabase
    .from("resume_versions")
    .insert({
      ...baseRow,
      label,
      change_summary: changeSummary,
    })
    .select("id")
    .single();

  if (fullInsertError) {
    if (isMissingColumnError(fullInsertError.message)) {
      const { data: basicInsert, error: basicInsertError } = await supabase
        .from("resume_versions")
        .insert(baseRow)
        .select("id")
        .single();

      if (basicInsertError) {
        insertErrorMessage = basicInsertError.message;
      } else {
        inserted = basicInsert;
      }
    } else {
      insertErrorMessage = fullInsertError.message;
    }
  } else {
    inserted = fullInsert;
  }

  if (insertErrorMessage) {
    console.error("Failed to create resume version:", insertErrorMessage);
    return { created: false, error: insertErrorMessage };
  }

  if (!inserted) {
    return { created: false, error: "Failed to create resume version" };
  }

  await pruneResumeVersions(supabase, params.resumeId, MAX_RESUME_VERSIONS);
  return { created: true, versionId: inserted.id };
}

export async function listResumeVersions(
  supabase: SupabaseClient,
  resumeId: string,
  userId: string,
): Promise<ResumeVersionListItem[]> {
  const { data, error } = await supabase
    .from("resume_versions")
    .select("id, title, source, created_at, label, change_summary")
    .eq("resume_id", resumeId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(MAX_RESUME_VERSIONS);

  if (!error) {
    return (data ?? []) as ResumeVersionListItem[];
  }

  if (isMissingColumnError(error.message)) {
    const { data: fallback, error: fallbackError } = await supabase
      .from("resume_versions")
      .select("id, title, source, created_at")
      .eq("resume_id", resumeId)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(MAX_RESUME_VERSIONS);

    if (fallbackError) {
      throw new Error(fallbackError.message);
    }

    return (fallback ?? []).map((version) => ({
      ...(version as Omit<ResumeVersionListItem, "label" | "change_summary">),
      label: null,
      change_summary: null,
    }));
  }

  throw new Error(error.message);
}
