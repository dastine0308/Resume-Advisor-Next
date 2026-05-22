import { Suspense } from "react";
import { ResumePageContent } from "@/components/resume/ResumePageContent";
import { ResumeContentSkeleton } from "@/components/resume/ResumeContentSkeleton";

export default function ResumePage() {
  return (
    <Suspense fallback={<ResumeContentSkeleton />}>
      <ResumePageContent />
    </Suspense>
  );
}
