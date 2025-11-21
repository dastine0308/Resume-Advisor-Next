"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button, DashboardCard, Tabs } from "@/components/ui";

const mockData = {
  totalResumes: 3,
  coverLetters: 2,
  savedJobPostings: 5,
  documents: [
    {
      id: "1",
      type: "resume",
      title: "Senior Engineer Resume",
      subtitle: "Senior Engineer",
      modifiedDate: "2 days ago",
    },
    {
      id: "2",
      type: "resume",
      title: "Product Manager Resume",
      subtitle: "Product Manager",
      modifiedDate: "1 week ago",
    },
    {
      id: "3",
      type: "coverLetter",
      title: "Tech Corp Cover Letter",
      subtitle: "Tech Corp",
      modifiedDate: "3 days ago",
    },
    {
      id: "4",
      type: "resume",
      title: "Data Scientist Resume",
      subtitle: "Data Scientist",
      modifiedDate: "5 days ago",
    },
  ],
};

export default function DashboardPage() {
  const { isSignedIn, signOut, loaded } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("all");
  const [menuOpen, setMenuOpen] = useState(false);

  // redirect only after auth status is loaded
  if (!loaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-lg text-gray-600">Loading...</p>
      </div>
    );
  }

  // Handle document actions
  const handleEdit = (id: string) => {
    // Navigate to the first step of the resume workflow using query param
    router.push(`/resume?resumeId=${encodeURIComponent(id)}`);
  };

  const handleExport = (id: string) => {
    // Implement export functionality
    console.log("Export document:", id);
  };

  const filteredDocuments = mockData.documents.filter((doc) => {
    if (activeTab === "all") return true;
    return doc.type === activeTab;
  });

  return (
    <div className="overflow-auto bg-gray-50">
      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-5 md:px-5 md:py-10">
        {/* Welcome Section */}
        <div className="mb-6 space-y-2 md:mb-8">
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
            Welcome back, Alex!
          </h1>
          <p className="text-base text-gray-600">
            Manage your resumes, cover letters, and job postings
          </p>
        </div>

        {/* Mobile stats row (horizontal scroll) */}
        <div className="mb-6 block w-full md:hidden">
          <div className="-mx-4 overflow-x-auto px-4">
            <div className="flex w-max gap-3">
              <div className="min-w-[180px] rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <p className="text-xs text-gray-500">Total Resumes</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {mockData.totalResumes}
                </p>
              </div>
              <div className="min-w-[180px] rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <p className="text-xs text-gray-500">Cover Letters</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {mockData.coverLetters}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mb-6 grid grid-cols-1 gap-5 md:mb-8 md:grid-cols-3">
          <DashboardCard
            variant="summary"
            title="Total Resumes"
            value={mockData.totalResumes}
          />
          <DashboardCard
            variant="summary"
            title="Cover Letters"
            value={mockData.coverLetters}
          />
        </div>

        {/* Create New Button */}
        <div className="mb-6 md:mb-8">
          <Button variant="primary" onClick={() => router.push("/resume")}>
            + Create New Resume
          </Button>
        </div>

        {/* Mobile floating action button */}
        <div className="md:hidden">
          <button
            onClick={() => router.push("/resume")}
            aria-label="Create new"
            className="fixed bottom-6 right-4 z-50 inline-flex items-center justify-center rounded-full bg-indigo-500 p-4 text-white shadow-lg"
          >
            +
          </button>
        </div>

        {/* Document Tabs & Grid */}
        <div>
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

          <div className="mt-6 grid grid-cols-1 gap-5 md:mt-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredDocuments.map((doc) => (
              <DashboardCard
                key={doc.id}
                title={doc.title}
                subtitle={doc.subtitle}
                modifiedDate={doc.modifiedDate}
                onEdit={() => handleEdit(doc.id)}
                onExport={() => handleExport(doc.id)}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
