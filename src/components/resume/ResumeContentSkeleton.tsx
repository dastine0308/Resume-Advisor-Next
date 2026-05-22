import { FormSectionSkeleton, Skeleton } from "@/components/ui/Skeleton";

export function ResumeContentSkeleton() {
  return (
    <>
      <div className="border-b border-gray-200">
        <div className="w-full bg-white px-4 pb-4 pt-4 md:px-5">
          <Skeleton className="mb-2 h-3 w-44" />
          <Skeleton className="h-1.5 w-full rounded-full" />
          <div className="mt-4 flex justify-between">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-16" />
          </div>
        </div>
        <div className="px-4 pb-3 md:px-5">
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      <main className="flex w-full flex-1 justify-center overflow-scroll">
        <div className="w-full max-w-5xl space-y-0">
          <FormSectionSkeleton />
          <FormSectionSkeleton inputHeight="h-[120px]" contentBlocks={2} />
          <div className="p-6 md:p-8">
            <div className="grid gap-6 lg:grid-cols-[250px_1fr]">
              <div className="space-y-2">
                <Skeleton className="h-6 w-44" />
                <Skeleton className="h-4 w-full max-w-[220px]" />
                <Skeleton className="h-4 w-3/4 max-w-[200px]" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="min-h-[300px] rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
