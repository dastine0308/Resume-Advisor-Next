"use client";

import { Suspense, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Button, Dropdown, Tabs } from "@/components/ui";
import { useProfile } from "@/hooks/useProfile";
import {
  useSuspenseResumes,
  useSuspenseCoverLetters,
  useDeleteResume,
  useDeleteCoverLetter,
  RESUME_QUERY_KEY,
  JOB_POSTING_QUERY_KEY,
} from "@/hooks/useDocuments";
import { getResumeById, getJobPosting } from "@/lib/api-services";
import { TrashIcon, Pencil1Icon, FileTextIcon } from "@radix-ui/react-icons";
import { DashboardDocumentsSkeleton } from "@/components/ui/Skeleton";

interface Document {
  id: string;
  jobId?: string;
  type: "resume" | "coverLetter";
  title: string;
  modifiedDate: string;
}

function getEmptyDocumentsMessage(activeTab: string, totalDocuments: number): string {
  if (activeTab === "resume") {
    return totalDocuments > 0
      ? "No resumes match this filter."
      : "No resumes yet. Create your first resume!";
  }
  if (activeTab === "coverLetter") {
    return totalDocuments > 0
      ? "No cover letters match this filter."
      : "No cover letters yet. Create one from the dashboard.";
  }
  return "No documents found. Create your first resume!";
}

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  return date.toLocaleDateString(undefined, options);
}

function DashboardDocumentsFallback() {
  return <DashboardDocumentsSkeleton />;
}

function DashboardDocumentList({ activeTab }: { activeTab: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deleteConfirm, setDeleteConfirm] = useState<Document | null>(null);

  const { data: resumes } = useSuspenseResumes();
  const { data: coverLetters } = useSuspenseCoverLetters();

  const deleteResumeMutation = useDeleteResume();
  const deleteCLMutation = useDeleteCoverLetter();

  const documents = useMemo<Document[]>(() => {
    const resumeDocs: Document[] = resumes.map((r) => ({
      id: r.id,
      jobId: r.job_id,
      type: "resume",
      title: r.title || "Untitled Resume",
      modifiedDate: r.last_updated,
    }));
    const clDocs: Document[] = coverLetters.map((cl) => ({
      id: cl.id,
      type: "coverLetter",
      title: cl.title || "Untitled Cover Letter",
      modifiedDate: cl.last_updated,
    }));
    return [...resumeDocs, ...clDocs].sort(
      (a, b) => new Date(b.modifiedDate).getTime() - new Date(a.modifiedDate).getTime(),
    );
  }, [resumes, coverLetters]);

  const prefetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePrefetchResume = (doc: Document) => {
    if (doc.type !== "resume") return;
    if (prefetchTimerRef.current) clearTimeout(prefetchTimerRef.current);
    prefetchTimerRef.current = setTimeout(() => {
      queryClient.prefetchQuery({
        queryKey: RESUME_QUERY_KEY(doc.id),
        queryFn: () => getResumeById(doc.id),
        staleTime: 30_000,
      });
      if (doc.jobId) {
        queryClient.prefetchQuery({
          queryKey: JOB_POSTING_QUERY_KEY(doc.jobId),
          queryFn: () => getJobPosting(doc.jobId!),
          staleTime: 30_000,
        });
      }
    }, 300);
  };

  const handleCancelPrefetch = () => {
    if (prefetchTimerRef.current) {
      clearTimeout(prefetchTimerRef.current);
      prefetchTimerRef.current = null;
    }
  };

  const handleEdit = (doc: Document) => {
    if (doc.type === "resume") {
      router.push(`/resume?resumeId=${encodeURIComponent(doc.id)}`);
    } else {
      router.push(`/cover-letter?id=${encodeURIComponent(doc.id)}`);
    }
  };

  const handleDeleteClick = (doc: Document) => {
    if (doc.type === "resume") {
      setDeleteConfirm(doc);
    } else {
      deleteCLMutation.mutate(doc.id);
    }
  };

  const handleDeleteConfirm = () => {
    if (!deleteConfirm) return;
    deleteResumeMutation.mutate(deleteConfirm.id);
    setDeleteConfirm(null);
  };

  const filteredDocuments = documents.filter((doc) => {
    if (activeTab === "all") return true;
    return doc.type === activeTab;
  });

  const deleteConfirmModal = deleteConfirm ? (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={() => setDeleteConfirm(null)}
    >
      <div
        className="mx-4 w-full max-w-sm rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-gray-900">Delete Resume?</h3>
        <p className="mt-2 text-sm text-gray-600">
          Deleting{" "}
          <span className="font-medium">{`"${deleteConfirm.title}"`}</span> will also
          permanently delete any associated cover letters. This cannot be undone.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
            onClick={handleDeleteConfirm}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  ) : null;

  if (filteredDocuments.length === 0) {
    return (
      <>
        <p className="text-center text-gray-500">
          {getEmptyDocumentsMessage(activeTab, documents.length)}
        </p>
        {deleteConfirmModal}
      </>
    );
  }

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm md:block">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Modified
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filteredDocuments.map((doc) => (
              <tr
                key={`${doc.type}-${doc.id}`}
                className="hover:bg-gray-50"
                onMouseEnter={() => handlePrefetchResume(doc)}
                onMouseLeave={handleCancelPrefetch}
              >
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex items-center gap-3">
                    <FileTextIcon className="h-5 w-5 text-gray-400" />
                    <span className="font-medium text-gray-900">{doc.title}</span>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {doc.type === "resume" ? "Resume" : "Cover Letter"}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {formatRelativeDate(doc.modifiedDate)}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(doc)}
                      aria-label="Edit"
                    >
                      <Pencil1Icon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(doc)}
                      aria-label="Delete"
                      className="text-red-600 hover:bg-red-50"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List */}
      <div className="flex flex-col gap-3 md:hidden">
        {filteredDocuments.map((doc) => (
          <div
            key={`${doc.type}-${doc.id}`}
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
            onMouseEnter={() => handlePrefetchResume(doc)}
            onMouseLeave={handleCancelPrefetch}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <FileTextIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">{doc.title}</p>
                  <p className="text-xs text-gray-500">
                    {doc.type === "resume" ? "Resume" : "Cover Letter"} ·{" "}
                    {formatRelativeDate(doc.modifiedDate)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(doc)}
                  aria-label="Edit"
                >
                  <Pencil1Icon className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteClick(doc)}
                  aria-label="Delete"
                  className="text-red-600 hover:bg-red-50"
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {deleteConfirmModal}
    </>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("all");
  const { data: user } = useProfile();

  return (
    <div className="overflow-auto px-4 py-6 md:px-6 md:py-10">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-6 space-y-2">
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
            {user?.first_name
              ? `Welcome back, ${user.first_name}!`
              : "Welcome to your dashboard."}
          </h1>
          <p className="text-sm text-gray-600 md:text-base">
            Manage your resumes and cover letters.
          </p>
        </div>
        <div className="mb-6 md:mb-8">
          <Dropdown
            trigger={<Button variant="primary">+ Create New</Button>}
            items={[
              {
                label: "Resume",
                value: "resume",
                onClick: () => router.push("/resume"),
              },
              {
                label: "Cover Letter",
                value: "cover-letter",
                onClick: () => router.push("/cover-letter"),
              },
            ]}
          />
        </div>

        <Tabs
          items={[
            {
              label: "All Documents",
              active: activeTab === "all",
              onClick: () => setActiveTab("all"),
            },
            {
              label: "Resumes",
              active: activeTab === "resume",
              onClick: () => setActiveTab("resume"),
            },
            {
              label: "Cover Letters",
              active: activeTab === "coverLetter",
              onClick: () => setActiveTab("coverLetter"),
            },
          ]}
        />

        <div className="mt-6 md:mt-8">
          <Suspense fallback={<DashboardDocumentsFallback />}>
            <DashboardDocumentList activeTab={activeTab} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
