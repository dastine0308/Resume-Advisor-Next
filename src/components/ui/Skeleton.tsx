import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded bg-gray-200", className)}
    />
  );
}

export function SkeletonField({
  labelWidth = "w-16",
  inputHeight = "h-10",
  className,
}: {
  labelWidth?: string;
  inputHeight?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Skeleton className={cn("h-4", labelWidth)} />
      <Skeleton className={cn("w-full", inputHeight)} />
    </div>
  );
}

export function FormSectionSkeleton({
  inputHeight = "h-10",
  contentBlocks = 1,
}: {
  inputHeight?: string;
  contentBlocks?: number;
}) {
  return (
    <div className="border-b border-gray-300 p-6 md:p-8">
      <div className="grid gap-6 lg:grid-cols-[250px_1fr]">
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-full max-w-[220px]" />
          <Skeleton className="h-4 w-3/4 max-w-[180px]" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: contentBlocks }).map((_, i) => (
            <SkeletonField key={i} inputHeight={inputHeight} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function DashboardDocumentsSkeleton() {
  return (
    <>
      <div className="hidden overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm md:block">
        <div className="bg-gray-50 px-6 py-3">
          <div className="flex gap-16">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-3 w-16" />
            ))}
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-6 px-6 py-4">
              <div className="flex flex-1 items-center gap-3">
                <Skeleton className="h-5 w-5 shrink-0" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-32" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 md:hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-5 shrink-0" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-28" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
