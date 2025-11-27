import { Suspense } from "react";
import { ResumeContent } from "@/components/resume-content";

interface ResumePageProps {
  searchParams: Promise<{ resumeId?: string }>;
}

export default async function ResumePage({ searchParams }: ResumePageProps) {
  const params = await searchParams;
  const resumeId = params?.resumeId ?? null;

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResumeContent resumeId={resumeId} />
    </Suspense>
  );
}
