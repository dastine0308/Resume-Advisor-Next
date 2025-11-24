"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, DashboardCard, Tabs } from "@/components/ui";
import { useAccountStore } from "@/stores";

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
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("all");
  const user = useAccountStore((state) => state.user);

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
          <Button variant="primary" onClick={() => router.push("/resume")}>
            + Create New Resume
          </Button>
        </div>

        {/* Document Tabs & Grid */}
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
    </div>
  );
}
