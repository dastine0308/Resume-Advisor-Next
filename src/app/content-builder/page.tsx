"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Navigation } from "@/components/resume/Navigation";
import { ProgressBar } from "@/components/resume/ProgressBar";
import { Breadcrumb } from "@/components/resume/Breadcrumb";
import { SectionCard } from "@/components/resume/SectionCard";
import { FormField } from "@/components/resume/FormField";
import { Button } from "@/components/ui/Button";
import type {
  ResumeData,
  Education,
  Experience,
  Project,
  Leadership,
} from "@/types/resume";
import { DownloadIcon } from "@radix-ui/react-icons";
import { generateLaTeXPreviewURL } from "@/lib/latex-client";
import { generateLatexFromData } from "@/lib/latex-generator";

export default function ContentBuilderPage() {
  // State for PDF generation
  const [pdfPreviewURL, setPdfPreviewURL] = useState<string | null>(null);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);

  // Resume form state (restored from previous implementation)
  const [resumeData, setResumeData] = useState<ResumeData>({
    personalInfo: {
      name: "First Last",
      address: "123 Street Name, Town, State 12345",
      phone: "123-456-7890",
      email: "email@gmail.com",
      linkedin: "linkedin.com/in/username",
      github: "github.com/username",
    },
    education: [
      {
        id: "1",
        universityName: "State University",
        degree: "Bachelor of Science in Computer Science",
        location: "City, State",
        datesAttended: "Sep. 2017 – May 2021",
        coursework:
          "Data Structures, Software Methodology, Algorithms Analysis, Database Management, Artificial Intelligence, Internet Technology, Systems Programming, Computer Architecture",
        order: 0,
      },
    ],
    experience: [
      {
        id: "1",
        jobTitle: "Software Engineer Intern",
        company: "Electronics Company",
        location: "City, State",
        dates: "May 2020 – August 2020",
        description:
          "• Developed a service to automatically perform a set of unit tests daily on a product in development in order to decrease time needed for team members to identify and fix bugs/issues.\n• Incorporated scripts using Python and PowerShell to aggregate XML test results into an organized format and to load the latest build code onto the hardware, so that daily testing can be performed.\n• Utilized Jenkins to provide a continuous integration service in order to automate the entire process of loading the latest build code and test files, running the tests, and generating a report of the results once per day.\n• Explored ways to visualize and send a daily report of test results to team members using HTML, Javascript, and CSS.",
        order: 0,
      },
      {
        id: "2",
        jobTitle: "Front End Developer Intern",
        company: "Startup, Inc",
        location: "City, State",
        dates: "May 2019 – August 2019",
        description:
          "• Assisted in development of the front end of a mobile application for iOS/Android using Dart and the Flutter framework.\n• Worked with Google Firebase to manage user inputted data across multiple platforms including web and mobile apps.\n• Collaborated with team members using version control systems such as Git to organize modifications and assign tasks.\n• Utilized Android Studio as a development environment in order to visualize the application in both iOS and Android.",
        order: 1,
      },
    ],
    projects: [
      {
        id: "1",
        projectName: "Gym Reservation Bot",
        technologies: "Python, Selenium, Google Cloud Console",
        date: "January 2021",
        description:
          "• Developed an automatic bot using Python and Google Cloud Console to register myself for a timeslot at my school gym.\n• Implemented Selenium to create an instance of Chrome in order to interact with the correct elements of the web page.\n• Created a Linux virtual machine to run on Google Cloud so that the program is able to run everyday from the cloud.\n• Used Cron to schedule the program to execute automatically at 11 AM every morning so a reservation is made for me.",
        order: 0,
      },
      {
        id: "2",
        projectName: "Ticket Price Calculator App",
        technologies: "Java, Android Studio",
        date: "November 2020",
        description:
          "• Created an Android application using Java and Android Studio to calculate ticket prices for trips to museums in NYC.\n• Processed user inputted information in the back-end of the app to return a subtotal price based on the tickets selected.\n• Utilized the layout editor to create a UI for the application in order to allow different scenes to interact with each other.",
        order: 1,
      },
      {
        id: "3",
        projectName: "Transaction Management GUI",
        technologies: "Java, Eclipse, JavaFX",
        date: "October 2020",
        description:
          "• Designed a sample banking transaction system using Java to simulate the common functions of using a bank account.\n• Used JavaFX to create a GUI that supports actions such as creating an account, deposit, withdraw, list all accounts, etc.\n• Implemented object-oriented programming practices such as inheritance to create different acount types and databases.",
        order: 2,
      },
    ],
    leadership: [
      {
        id: "1",
        role: "President",
        organization: "Fraternity",
        dates: "Spring 2020 – Present",
        description:
          "• Achieved a 4-star fraternity ranking by the Office of Fraternity and Sorority Affairs (highest possible ranking).\n• Managed executive board of 5 members and ran weekly meetings to oversee progress in essential parts of the chapter.\n• Led chapter of 30+ members to work towards goals that improve and promote community service, academics, and unity.",
        order: 0,
      },
    ],
    technicalSkills: {
      languages: "Python, Java, C, HTML/CSS, JavaScript, SQL",
      developerTools: "VS Code, Eclipse, Google Cloud Platform, Android Studio",
      technologiesFrameworks: "Linux, Jenkins, GitHub, JUnit, WordPress",
    },
  });

  const [breadcrumbItems, setBreadcrumbItems] = useState([
    { id: "education", label: "Education", active: true },
    { id: "experience", label: "Experience", active: false },
    { id: "projects", label: "Projects", active: false },
    { id: "technical-skills", label: "Skills", active: false },
    { id: "leadership", label: "Leadership", active: false },
  ]);

  const updateEducation = (
    id: string,
    field: keyof Education,
    value: string,
  ) => {
    setResumeData((prev) => ({
      ...prev,
      education: prev.education.map((edu) =>
        edu.id === id ? { ...edu, [field]: value } : edu,
      ),
    }));
  };

  const updateExperience = (
    id: string,
    field: keyof Experience,
    value: string,
  ) => {
    setResumeData((prev) => ({
      ...prev,
      experience: prev.experience.map((exp) =>
        exp.id === id ? { ...exp, [field]: value } : exp,
      ),
    }));
  };

  const addExperience = () => {
    const newExperience: Experience = {
      id: Date.now().toString(),
      jobTitle: "",
      company: "",
      location: "",
      dates: "",
      description: "",
      order: 0,
    };
    setResumeData((prev) => ({
      ...prev,
      experience: [
        ...prev.experience,
        { ...newExperience, order: prev.experience.length },
      ],
    }));
  };

  const updateProject = (id: string, field: keyof Project, value: string) => {
    setResumeData((prev) => ({
      ...prev,
      projects: prev.projects.map((proj) =>
        proj.id === id ? { ...proj, [field]: value } : proj,
      ),
    }));
  };

  const updateLeadership = (
    id: string,
    field: keyof Leadership,
    value: string,
  ) => {
    setResumeData((prev) => ({
      ...prev,
      leadership: prev.leadership.map((lead) =>
        lead.id === id ? { ...lead, [field]: value } : lead,
      ),
    }));
  };

  const addEducation = () => {
    const newEducation: Education = {
      id: Date.now().toString(),
      universityName: "",
      degree: "",
      location: "",
      datesAttended: "",
      coursework: "",
      order: 0,
    };
    setResumeData((prev) => ({
      ...prev,
      education: [
        ...prev.education,
        { ...newEducation, order: prev.education.length },
      ],
    }));
  };

  const addProject = () => {
    const newProject: Project = {
      id: Date.now().toString(),
      projectName: "",
      technologies: "",
      date: "",
      description: "",
      order: 0,
    };
    setResumeData((prev) => ({
      ...prev,
      projects: [
        ...prev.projects,
        { ...newProject, order: prev.projects.length },
      ],
    }));
  };

  const addLeadership = () => {
    const newLeadership: Leadership = {
      id: Date.now().toString(),
      role: "",
      organization: "",
      dates: "",
      description: "",
      order: 0,
    };
    setResumeData((prev) => ({
      ...prev,
      leadership: [
        ...prev.leadership,
        { ...newLeadership, order: prev.leadership.length },
      ],
    }));
  };

  // Generic move helper for any top-level array in resumeData
  const moveItemIn = useCallback(
    <T extends { id: string; order?: number }>(
      field: keyof Omit<ResumeData, "technicalSkills">,
      id: string,
      direction: "up" | "down",
    ) => {
      setResumeData((prev) => {
        const array = [...(prev[field] as unknown as T[])];
        const index = array.findIndex((it) => it.id === id);
        if (index === -1) return prev;
        if (
          (direction === "up" && index === 0) ||
          (direction === "down" && index === array.length - 1)
        ) {
          return prev;
        }
        const newIndex = direction === "up" ? index - 1 : index + 1;
        [array[index], array[newIndex]] = [array[newIndex], array[index]];
        const normalized = array.map((item, idx) => ({ ...item, order: idx }));
        return { ...prev, [field]: normalized } as ResumeData;
      });
    },
    [],
  );

  // small helper to remove an item by id and normalize orders
  const removeAndNormalize = useCallback(
    <T extends { id: string; order?: number }>(items: T[], id: string) =>
      items
        .filter((i) => i.id !== id)
        .map((item, idx) => ({ ...item, order: idx })),
    [],
  );

  const deleteEducation = useCallback(
    (id: string) => {
      setResumeData((prev) => ({
        ...prev,
        education: removeAndNormalize(prev.education, id),
      }));
    },
    [removeAndNormalize],
  );

  const deleteExperience = useCallback(
    (id: string) => {
      setResumeData((prev) => ({
        ...prev,
        experience: removeAndNormalize(prev.experience, id),
      }));
    },
    [removeAndNormalize],
  );

  const deleteProject = useCallback(
    (id: string) => {
      setResumeData((prev) => ({
        ...prev,
        projects: removeAndNormalize(prev.projects, id),
      }));
    },
    [removeAndNormalize],
  );

  const deleteLeadership = useCallback(
    (id: string) => {
      setResumeData((prev) => ({
        ...prev,
        leadership: removeAndNormalize(prev.leadership, id),
      }));
    },
    [removeAndNormalize],
  );

  const compileLaTeX = async () => {
    setLoading(true);
    setCompileError(null);
    setPdfPreviewURL(null); // Clear previous preview

    try {
      // 從表單數據生成 LaTeX
      const latexContent =
        mode === "form" ? generateLatexFromData(resumeData) : latex;

      console.log("[Content Builder] Compiling LaTeX...");
      console.log("[Content Builder] LaTeX length:", latexContent.length);

      // 編譯並獲取預覽 URL
      const previewURL = await generateLaTeXPreviewURL(latexContent);
      console.log("[Content Builder] Preview URL:", previewURL);

      setPdfPreviewURL(previewURL);
      console.log("[Content Builder] Preview generated successfully");
    } catch (error) {
      console.error("[Content Builder] LaTeX compilation failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : "LaTeX compilation failed";
      setCompileError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Download PDF
   */
  async function downloadPdf() {
    setIsPdfGenerating(true);
    setCompileError(null);

    try {
      // Use the current LaTeX content (from form or editor)
      const latexContent =
        mode === "latex" ? latex : generateLatexFromData(resumeData);

      // Call the API to compile LaTeX to PDF
      const response = await fetch("/api/compile-latex", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ latex: latexContent }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to compile LaTeX");
      }

      // Get the PDF blob
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `resume-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      console.log("PDF downloaded successfully!");
    } catch (err) {
      const error = err as Error;
      console.error("PDF download failed:", error);
      setCompileError(error.message || "Failed to download PDF");
    } finally {
      setIsPdfGenerating(false);
    }
  }

  // LaTeX editor
  const [latex, setLatex] = useState("");
  const [loading, setLoading] = useState(false);
  const [compileError, setCompileError] = useState<string | null>(null);
  const debounceRef = useRef<number | null>(null);

  // UI mode: 'form' or 'latex'
  const [mode, setMode] = useState<"form" | "latex">("form");

  // Sync LaTeX with form data whenever resumeData changes
  useEffect(() => {
    if (mode === "form") {
      const generatedLatex = generateLatexFromData(resumeData);
      console.log(
        "[Content Builder] Syncing LaTeX with form data",
        generatedLatex,
      );
      setLatex(generatedLatex);
    }
  }, [resumeData, mode]);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      void compileLaTeX();
    }, 700);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latex]);

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-gradient-to-r from-gray-50 to-gray-50">
      {/* Navigation */}
      <Navigation />

      {/* Progress Bar */}
      <ProgressBar
        currentStep={3}
        totalSteps={3}
        label="Step 3 of 3 - Resume Content"
      />

      {/* Main Content */}
      <div className="flex min-h-0 flex-1 flex-col items-start justify-center overflow-hidden lg:flex-row">
        {/* Left Panel */}
        <div className="flex h-full w-full flex-col border-gray-200 bg-white lg:h-full lg:w-[720px] lg:border-r">
          <div className="border-b p-4">
            <div className="flex items-center gap-2">
              <button
                className={`rounded px-3 py-1 ${mode === "form" ? "bg-gray-100 font-semibold" : "text-gray-600"}`}
                onClick={() => setMode("form")}
              >
                Form
              </button>
              <button
                className={`rounded px-3 py-1 ${mode === "latex" ? "bg-gray-100 font-semibold" : "text-gray-600"}`}
                onClick={() => setMode("latex")}
              >
                LaTeX
              </button>
            </div>
          </div>

          <div className="h-full space-y-4 overflow-auto p-4 md:space-y-6 md:p-6 lg:h-full">
            {mode === "form" ? (
              <>
                <Breadcrumb
                  items={breadcrumbItems}
                  onSelect={(id) => {
                    if (!id) return;
                    setBreadcrumbItems((prev) =>
                      prev.map((it) => ({ ...it, active: it.id === id })),
                    );
                    const el = document.getElementById(id);
                    if (el)
                      el.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                />

                {/* Education Section */}
                <section id="education">
                  <h2 className="mb-3 text-sm font-bold text-gray-900 md:mb-4 md:text-base">
                    Education
                  </h2>
                  <div className="space-y-3 rounded-md bg-gray-50 p-3 md:p-4">
                    {resumeData.education.map((edu, idx) => {
                      const count = resumeData.education.length;
                      const pos =
                        typeof edu.order === "number" ? edu.order : idx;
                      const showControls = count > 1;
                      return (
                        <SectionCard
                          key={edu.id}
                          title={edu.universityName || "New Education"}
                          showControls={showControls}
                          onDelete={() => deleteEducation(edu.id)}
                          onMoveUp={() => moveItemIn("education", edu.id, "up")}
                          onMoveDown={() =>
                            moveItemIn("education", edu.id, "down")
                          }
                          disableMoveUp={pos === 0}
                          disableMoveDown={pos === count - 1}
                        >
                          <FormField
                            label="University Name"
                            name="universityName"
                            value={edu.universityName}
                            onChange={(_, value) =>
                              updateEducation(edu.id, "universityName", value)
                            }
                          />
                          <FormField
                            label="Degree"
                            name="degree"
                            value={edu.degree}
                            onChange={(_, value) =>
                              updateEducation(edu.id, "degree", value)
                            }
                          />
                          <FormField
                            label="Location"
                            name="location"
                            value={edu.location}
                            onChange={(_, value) =>
                              updateEducation(edu.id, "location", value)
                            }
                          />
                          <FormField
                            label="Dates Attended"
                            name="datesAttended"
                            value={edu.datesAttended}
                            onChange={(_, value) =>
                              updateEducation(edu.id, "datesAttended", value)
                            }
                          />
                          <FormField
                            label="Relevant Coursework"
                            name="coursework"
                            value={edu.coursework || ""}
                            onChange={(_, value) =>
                              updateEducation(edu.id, "coursework", value)
                            }
                            type="textarea"
                          />
                        </SectionCard>
                      );
                    })}
                  </div>
                  <Button
                    variant="secondary"
                    className="mt-3 w-full"
                    onClick={addEducation}
                  >
                    + Add Education
                  </Button>
                </section>

                {/* Experience Section */}
                <section id="experience">
                  <h2 className="mb-3 text-sm font-bold text-gray-900 md:mb-4 md:text-base">
                    Experience
                  </h2>
                  <div className="space-y-3 rounded-md bg-gray-50 p-3 md:p-4">
                    {resumeData.experience.map((exp, idx) => {
                      const count = resumeData.experience.length;
                      const pos =
                        typeof exp.order === "number" ? exp.order : idx;
                      const showControls = count > 1;
                      return (
                        <SectionCard
                          key={exp.id}
                          title={`${exp.jobTitle || "New Position"}${exp.company ? `, ${exp.company}` : ""}`}
                          showControls={showControls}
                          onDelete={() => deleteExperience(exp.id)}
                          onMoveUp={() =>
                            moveItemIn("experience", exp.id, "up")
                          }
                          onMoveDown={() =>
                            moveItemIn("experience", exp.id, "down")
                          }
                          disableMoveUp={pos === 0}
                          disableMoveDown={pos === count - 1}
                        >
                          <FormField
                            label="Job Title"
                            name="jobTitle"
                            value={exp.jobTitle}
                            onChange={(_, value) =>
                              updateExperience(exp.id, "jobTitle", value)
                            }
                          />
                          <FormField
                            label="Company"
                            name="company"
                            value={exp.company}
                            onChange={(_, value) =>
                              updateExperience(exp.id, "company", value)
                            }
                          />
                          <FormField
                            label="Location"
                            name="location"
                            value={exp.location}
                            onChange={(_, value) =>
                              updateExperience(exp.id, "location", value)
                            }
                          />
                          <FormField
                            label="Dates"
                            name="dates"
                            value={exp.dates}
                            onChange={(_, value) =>
                              updateExperience(exp.id, "dates", value)
                            }
                          />
                          <FormField
                            label="Description"
                            name=""
                            value={exp.description}
                            onChange={(_, value) =>
                              updateExperience(exp.id, "description", value)
                            }
                            type="textarea"
                          />
                          <Button variant="gradient" className="mt-2 w-full">
                            ✨ Smartfill (AI)
                          </Button>
                        </SectionCard>
                      );
                    })}
                  </div>
                  <Button
                    variant="secondary"
                    className="mt-3 w-full"
                    onClick={addExperience}
                  >
                    + Add Experience
                  </Button>
                </section>

                {/* Projects Section */}
                <section id="projects">
                  <h2 className="mb-3 text-sm font-bold text-gray-900 md:mb-4 md:text-base">
                    Projects
                  </h2>
                  <div className="space-y-3 rounded-md bg-gray-50 p-3 md:p-4">
                    {resumeData.projects.map((proj, idx) => {
                      const count = resumeData.projects.length;
                      const pos =
                        typeof proj.order === "number" ? proj.order : idx;
                      const showControls = count > 1;
                      return (
                        <SectionCard
                          key={proj.id}
                          title={proj.projectName || "New Project"}
                          showControls={showControls}
                          onDelete={() => deleteProject(proj.id)}
                          onMoveUp={() => moveItemIn("projects", proj.id, "up")}
                          onMoveDown={() =>
                            moveItemIn("projects", proj.id, "down")
                          }
                          disableMoveUp={pos === 0}
                          disableMoveDown={pos === count - 1}
                        >
                          <FormField
                            label="Project Name"
                            name="projectName"
                            value={proj.projectName}
                            onChange={(_, value) =>
                              updateProject(proj.id, "projectName", value)
                            }
                          />
                          <FormField
                            label="Technologies"
                            name="technologies"
                            value={proj.technologies}
                            onChange={(_, value) =>
                              updateProject(proj.id, "technologies", value)
                            }
                          />
                          <FormField
                            label="Date"
                            name="date"
                            value={proj.date}
                            onChange={(_, value) =>
                              updateProject(proj.id, "date", value)
                            }
                          />
                          <FormField
                            label="Description (Bullet Points)"
                            name="description"
                            value={proj.description}
                            onChange={(_, value) =>
                              updateProject(proj.id, "description", value)
                            }
                            type="textarea"
                          />
                        </SectionCard>
                      );
                    })}
                  </div>
                  <Button
                    variant="secondary"
                    className="mt-3 w-full"
                    onClick={addProject}
                  >
                    + Add Project
                  </Button>
                </section>

                {/* Technical Skills Section */}
                <section id="technical-skills">
                  <h2 className="mb-3 text-sm font-bold text-gray-900 md:mb-4 md:text-base">
                    Technical Skills
                  </h2>
                  <div className="space-y-3">
                    <FormField
                      label="Languages"
                      name="languages"
                      value={resumeData.technicalSkills.languages}
                      onChange={(_, value) =>
                        setResumeData((prev) => ({
                          ...prev,
                          technicalSkills: {
                            ...prev.technicalSkills,
                            languages: value,
                          },
                        }))
                      }
                    />
                    <FormField
                      label="Developer Tools"
                      name="developerTools"
                      value={resumeData.technicalSkills.developerTools}
                      onChange={(_, value) =>
                        setResumeData((prev) => ({
                          ...prev,
                          technicalSkills: {
                            ...prev.technicalSkills,
                            developerTools: value,
                          },
                        }))
                      }
                    />
                    <FormField
                      label="Technologies/Frameworks"
                      name="technologiesFrameworks"
                      value={resumeData.technicalSkills.technologiesFrameworks}
                      onChange={(_, value) =>
                        setResumeData((prev) => ({
                          ...prev,
                          technicalSkills: {
                            ...prev.technicalSkills,
                            technologiesFrameworks: value,
                          },
                        }))
                      }
                    />
                  </div>
                </section>

                {/* Leadership Section */}
                <section id="leadership">
                  <h2 className="mb-3 text-sm font-bold text-gray-900 md:mb-4 md:text-base">
                    Leadership / Extracurricular
                  </h2>
                  <div className="space-y-3 rounded-md bg-gray-50 p-3 md:p-4">
                    {resumeData.leadership.map((lead, idx) => {
                      const count = resumeData.leadership.length;
                      const pos =
                        typeof lead.order === "number" ? lead.order : idx;
                      const showControls = count > 1;
                      return (
                        <SectionCard
                          key={lead.id}
                          title={`${lead.role || "New Role"}${lead.organization ? `, ${lead.organization}` : ""}`}
                          showControls={showControls}
                          onDelete={() => deleteLeadership(lead.id)}
                          onMoveUp={() =>
                            moveItemIn("leadership", lead.id, "up")
                          }
                          onMoveDown={() =>
                            moveItemIn("leadership", lead.id, "down")
                          }
                          disableMoveUp={pos === 0}
                          disableMoveDown={pos === count - 1}
                        >
                          <FormField
                            label="Role"
                            name="role"
                            value={lead.role}
                            onChange={(_, value) =>
                              updateLeadership(lead.id, "role", value)
                            }
                          />
                          <FormField
                            label="Organization"
                            name="organization"
                            value={lead.organization}
                            onChange={(_, value) =>
                              updateLeadership(lead.id, "organization", value)
                            }
                          />
                          <FormField
                            label="Dates"
                            name="dates"
                            value={lead.dates}
                            onChange={(_, value) =>
                              updateLeadership(lead.id, "dates", value)
                            }
                          />
                          <FormField
                            label="Description"
                            name="description"
                            value={lead.description}
                            onChange={(_, value) =>
                              updateLeadership(lead.id, "description", value)
                            }
                            type="textarea"
                          />
                        </SectionCard>
                      );
                    })}
                  </div>
                  <Button
                    variant="secondary"
                    className="mt-3 w-full"
                    onClick={addLeadership}
                  >
                    + Add Leadership/Extracurricular
                  </Button>
                </section>
              </>
            ) : (
              // LaTeX editor mode
              <div className="flex h-full flex-col">
                <h2 className="mb-3 text-sm font-bold text-gray-900 md:mb-4 md:text-base">
                  LaTeX Editor
                </h2>
                <div className="flex-1">
                  <textarea
                    className="h-full w-full rounded-md border border-gray-300 bg-white p-4 font-mono text-sm"
                    value={latex}
                    onChange={(e) => setLatex(e.target.value)}
                    placeholder="Edit your LaTeX code here..."
                    spellCheck={false}
                  />
                </div>
                {compileError && (
                  <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3">
                    <p className="text-sm text-red-800">{compileError}</p>
                  </div>
                )}
              </div>
            )}
            <div>
              <Button
                variant="primary"
                className="flex w-full items-center justify-center"
                onClick={() => void downloadPdf()}
                disabled={loading || isPdfGenerating}
              >
                <DownloadIcon className="mr-1 h-4 w-4" />
                {isPdfGenerating
                  ? "Generating PDF..."
                  : loading
                    ? "Generating..."
                    : "Download PDF"}
              </Button>
            </div>
          </div>
        </div>

        {/* Right Panel - Preview (hidden on mobile) */}
        <div className="hidden h-full w-[720px] overflow-auto bg-white lg:block lg:h-full">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-gray-50 px-5 py-4">
            <h3 className="text-sm font-bold text-gray-800">Live Preview</h3>
          </div>

          <div className="h-[calc(100vh-72px)] p-4">
            {pdfPreviewURL ? (
              <iframe
                src={pdfPreviewURL}
                className="h-full w-full border bg-white"
                title="PDF Preview"
                style={{
                  maxWidth: "210mm",
                  margin: "0 auto",
                }}
              />
            ) : compileError ? (
              <div className="flex h-full items-center justify-center">
                <div className="max-w-2xl rounded-lg border border-red-200 bg-red-50 p-6">
                  <h4 className="mb-3 text-lg font-bold text-red-900">
                    ⚠️ Generation Error
                  </h4>
                  <p className="mb-4 text-sm text-red-800">{compileError}</p>
                  <Button
                    variant="secondary"
                    className="mt-4"
                    onClick={() => void compileLaTeX()}
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            ) : loading ? (
              <div className="flex h-full items-center justify-center text-gray-500">
                <div className="text-center">
                  <div className="mb-2 text-lg">
                    ⏳ Generating PDF preview...
                  </div>
                  <div className="text-xs">Converting LaTeX to PDF</div>
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-500">
                <div className="max-w-md text-center">
                  <div className="mb-2">
                    📄 Edit the form or LaTeX to generate a PDF preview.
                  </div>
                  <div className="text-xs">
                    Direct LaTeX to PDF conversion with LaTeX support.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
