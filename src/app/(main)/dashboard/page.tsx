"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Dropdown, Tabs } from "@/components/ui";
import { useAccountStore } from "@/stores";
import { getUserResumes, getUserCoverLetters, deleteResume, deleteCoverLetter } from "@/lib/api-services";
import { TrashIcon, Pencil1Icon, FileTextIcon } from "@radix-ui/react-icons";

interface Document {
  id: string;
  jobId?: number;
  type: "resume" | "coverLetter";
  title: string;
  modifiedDate: string;
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

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("all");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const user = useAccountStore((state) => state.user);

  useEffect(() => {
    async function fetchDocuments() {
      try {
        // Fetch both resumes and cover letters
        const [resumesResponse, coverLettersResponse] = await Promise.all([
          getUserResumes(),
          getUserCoverLetters(),
        ]);

        const resumeDocs: Document[] = resumesResponse?.length
          ? resumesResponse.map((resume) => ({
              id: resume.id,
              jobId: resume.job_id,
              type: "resume" as const,
              title: resume.title || "Untitled Resume",
              modifiedDate: formatRelativeDate(resume.last_updated),
            }))
          : [];

        const coverLetterDocs: Document[] = coverLettersResponse?.length
          ? coverLettersResponse.map((coverLetter) => ({
              id: coverLetter.id.toString(),
              type: "coverLetter" as const,
              title: coverLetter.title || "Untitled Cover Letter",
              modifiedDate: formatRelativeDate(coverLetter.last_updated),
            }))
          : [];

        // Combine and sort by date
        const allDocs = [...resumeDocs, ...coverLetterDocs].sort((a, b) => {
          return new Date(b.modifiedDate).getTime() - new Date(a.modifiedDate).getTime();
        });

        setDocuments(allDocs);
      } catch (error) {
        console.error("Failed to fetch documents:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDocuments();
  }, []);

  // Handle document actions
  const handleEdit = (doc: Document) => {
    if (doc.type === "resume") {
      // Navigate to the first step of the resume workflow using query param
      router.push(`/resume?resumeId=${encodeURIComponent(doc.id)}`);
    } else {
      // Navigate to cover letter page with ID for editing
      router.push(`/cover-letter?id=${encodeURIComponent(doc.id)}`);
    }
  };

  const handleDelete = async (doc: Document) => {
    console.log("Delete document:", doc.id, "type:", doc.type);
    try {
      if (doc.type === "resume") {
        await deleteResume(doc.id);
      } else {
        await deleteCoverLetter(doc.id);
      }
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    } catch (error) {
      console.error("Failed to delete document:", error);
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    if (activeTab === "all") return true;
    return doc.type === activeTab;
  });

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
        {/* Create New Button */}
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

        {/* Document Tabs */}
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

        {/* Document Table */}
        <div className="mt-6 md:mt-8">
          {isLoading ? (
            <p className="text-center text-gray-500">Loading...</p>
          ) : filteredDocuments.length === 0 ? (
            <p className="text-center text-gray-500">
              No documents found. Create your first resume!
            </p>
          ) : (
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
                      <tr key={`${doc.type}-${doc.id}`} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center gap-3">
                            <FileTextIcon className="h-5 w-5 text-gray-400" />
                            <span className="font-medium text-gray-900">
                              {doc.title}
                            </span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {doc.type === "resume" ? "Resume" : "Cover Letter"}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {doc.modifiedDate}
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
                              onClick={() => handleDelete(doc)}
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
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <FileTextIcon className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {doc.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {doc.type === "resume" ? "Resume" : "Cover Letter"}{" "}
                            · {doc.modifiedDate}
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
                          onClick={() => handleDelete(doc)}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
