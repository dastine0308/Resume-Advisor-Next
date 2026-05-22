"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui";
import { ResumeContent } from "@/components/resume-content";
import { useSuspenseResume, type ResumeLoadResult } from "@/hooks/useDocuments";

type EditableResumeLoad = Extract<
  ResumeLoadResult,
  { kind: "new" } | { kind: "found" }
>;

function ResumeNotFound() {
  const router = useRouter();
  return (
    <div className="overflow-auto px-4 py-6 md:px-6 md:py-10">
      <div className="mx-auto w-full max-w-5xl text-center">
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
          Resume not found
        </h1>
        <p className="mt-2 text-sm text-gray-600 md:text-base">
          This resume may have been deleted or you may not have access to it.
        </p>
        <Button
          variant="primary"
          className="mt-6"
          onClick={() => router.push("/dashboard")}
        >
          Back to dashboard
        </Button>
      </div>
    </div>
  );
}

export function ResumePageContent() {
  const routeResumeId = useSearchParams().get("resumeId");
  const { data: resumeLoad } = useSuspenseResume(routeResumeId);
  const [formKey, setFormKey] = useState(() => routeResumeId ?? "__new__");
  const skipRemountForIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!routeResumeId) {
      skipRemountForIdRef.current = null;
      setFormKey("__new__");
      return;
    }
    if (skipRemountForIdRef.current === routeResumeId) {
      skipRemountForIdRef.current = null;
      return;
    }
    setFormKey(routeResumeId);
  }, [routeResumeId]);

  if (resumeLoad.kind === "not_found") {
    return <ResumeNotFound />;
  }

  return (
    <ResumeContent
      key={formKey}
      routeResumeId={routeResumeId}
      resumeLoad={resumeLoad as EditableResumeLoad}
      onFirstPersist={(id) => {
        skipRemountForIdRef.current = id;
      }}
    />
  );
}
