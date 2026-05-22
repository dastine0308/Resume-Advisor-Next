import { Skeleton, SkeletonField } from "@/components/ui/Skeleton";

export function CoverLetterContentSkeleton() {
  return (
    <div className="overflow-auto px-4 py-6 md:px-6 md:py-10">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-6 space-y-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-44 md:h-9" />
              <Skeleton className="h-4 w-full max-w-md" />
              <Skeleton className="h-4 w-3/4 max-w-sm" />
            </div>
            <Skeleton className="h-4 w-32 sm:pt-2" />
          </div>
        </div>

        <div className="flex min-h-screen flex-col bg-gray-50">
          <main className="flex w-full flex-1 justify-center">
            <div className="w-full max-w-5xl">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <section className="rounded-lg bg-white p-5 shadow-sm md:p-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {Array.from({ length: 2 }).map((_, i) => (
                        <SkeletonField key={i} labelWidth="w-20" />
                      ))}
                    </div>

                    <SkeletonField labelWidth="w-16" />

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {Array.from({ length: 2 }).map((_, i) => (
                        <SkeletonField key={i} />
                      ))}
                    </div>

                    <SkeletonField labelWidth="w-32" inputHeight="h-[140px]" />
                    <SkeletonField labelWidth="w-28" />

                    <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
                      <Skeleton className="h-10 w-full sm:w-24" />
                      <Skeleton className="h-10 w-full sm:w-40" />
                    </div>
                  </div>
                </section>

                <aside className="rounded-lg bg-white p-5 shadow-sm md:p-6">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="mt-4 h-[420px] rounded border border-gray-100" />
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Skeleton className="h-10 w-full sm:flex-1" />
                    <Skeleton className="h-10 w-full sm:flex-1" />
                  </div>
                </aside>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
