"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { DraggableSection } from "@/components/resume/DraggableSection";
import { useKeywordsStore, useResumeStore } from "@/stores";
import { Breadcrumb } from "@/components/resume/Breadcrumb";
import { FormField } from "@/components/resume/FormField";
import { Button } from "@/components/ui/Button";
import type {
  ResumeData,
  Education,
  Experience,
  Project,
  Leadership,
} from "@/types/resume";
import { generateLaTeXPreviewURL } from "@/lib/latex-client";
import { generateLatexFromData } from "@/lib/latex-generator";
import { MagicWandIcon } from "@radix-ui/react-icons";

export default function ContentBuilderForm() {
  const {
    resumeId,
    resumeData,
    setResumeData,
    latex,
    setLatex,
    mode,
    setMode,
    loading,
    setLoading,
    setPdfPreviewURL,
    compileError,
    setCompileError,
    pdfPreviewURL,
  } = useResumeStore();

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
      isCollapsed: false,
    };
    setResumeData((prev) => ({
      ...prev,
      education: [
        ...prev.education,
        { ...newEducation, order: prev.education.length },
      ],
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
      isCollapsed: false,
    };
    setResumeData((prev) => ({
      ...prev,
      experience: [
        ...prev.experience,
        { ...newExperience, order: prev.experience.length },
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
      isCollapsed: false,
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
      isCollapsed: false,
    };
    setResumeData((prev) => ({
      ...prev,
      leadership: [
        ...prev.leadership,
        { ...newLeadership, order: prev.leadership.length },
      ],
    }));
  };

  const toggleEducationCollapse = useCallback(
    (id: string) => {
      setResumeData((prev) => ({
        ...prev,
        education: prev.education.map((edu) =>
          edu.id === id ? { ...edu, isCollapsed: !edu.isCollapsed } : edu,
        ),
      }));
    },
    [setResumeData],
  );

  const toggleExperienceCollapse = useCallback(
    (id: string) => {
      setResumeData((prev) => ({
        ...prev,
        experience: prev.experience.map((exp) =>
          exp.id === id ? { ...exp, isCollapsed: !exp.isCollapsed } : exp,
        ),
      }));
    },
    [setResumeData],
  );

  const toggleProjectCollapse = useCallback(
    (id: string) => {
      setResumeData((prev) => ({
        ...prev,
        projects: prev.projects.map((proj) =>
          proj.id === id ? { ...proj, isCollapsed: !proj.isCollapsed } : proj,
        ),
      }));
    },
    [setResumeData],
  );

  const toggleLeadershipCollapse = useCallback(
    (id: string) => {
      setResumeData((prev) => ({
        ...prev,
        leadership: prev.leadership.map((lead) =>
          lead.id === id ? { ...lead, isCollapsed: !lead.isCollapsed } : lead,
        ),
      }));
    },
    [setResumeData],
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
      const latexContent =
        mode === "form" ? generateLatexFromData(resumeData) : latex;

      console.log("[Content Builder] Compiling LaTeX...");
      console.log("[Content Builder] LaTeX length:", latexContent.length);

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

  // Configure sensors with activation constraints to avoid accidental drags
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    }),
  );

  // Generic move helper by index for sortable lists
  const moveItemByIndex = useCallback(
    <T extends { id: string; order?: number }>(
      field: keyof Omit<ResumeData, "technicalSkills">,
      fromIndex: number,
      toIndex: number,
    ) => {
      setResumeData((prev) => {
        const array = [...(prev[field] as unknown as T[])];
        if (fromIndex === toIndex) return prev;
        const [item] = array.splice(fromIndex, 1);
        array.splice(toIndex, 0, item);
        const normalized = array.map((it, idx) => ({ ...it, order: idx }));
        return { ...prev, [field]: normalized } as ResumeData;
      });
    },
    [setResumeData],
  );

  const debounceRef = useRef<number | null>(null); // Sync LaTeX with form data whenever resumeData changes

  // Sync LaTeX with form data whenever resumeData changes
  useEffect(() => {
    if (mode === "form") {
      const generatedLatex = generateLatexFromData(resumeData);
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
      {/* Main Content */}
      <div className="flex min-h-0 flex-1 flex-col items-start justify-center overflow-hidden lg:flex-row">
        {/* Left Panel */}
        <div className="flex h-full w-full flex-col border-gray-200 bg-white lg:h-full lg:w-[720px] lg:border-r">
          {/* <div className="border-b p-4">
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
          </div> */}

          <Breadcrumb
            items={breadcrumbItems}
            onSelect={(id) => {
              if (!id) return;
              setBreadcrumbItems((prev) =>
                prev.map((it) => ({ ...it, active: it.id === id })),
              );
              const el = document.getElementById(id);
              if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          />
          <div className="h-full space-y-4 overflow-auto p-4 md:space-y-6 md:p-6 lg:h-full">
            {mode === "form" ? (
              <>
                {/* Education Section */}
                <section id="education">
                  <h2 className="mb-3 text-sm font-bold text-gray-900 md:mb-4 md:text-base">
                    Education
                  </h2>
                  <div className="space-y-3 rounded-md bg-gray-50 p-3 md:p-4">
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={(event) => {
                        const { active, over } = event as DragEndEvent;
                        if (!over) return;
                        const fromIndex = resumeData.education.findIndex(
                          (i) => i.id === String(active.id),
                        );
                        const toIndex = resumeData.education.findIndex(
                          (i) => i.id === String(over.id),
                        );
                        if (
                          fromIndex === -1 ||
                          toIndex === -1 ||
                          fromIndex === toIndex
                        )
                          return;
                        moveItemByIndex("education", fromIndex, toIndex);
                      }}
                    >
                      <SortableContext
                        items={resumeData.education.map((e) => e.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {resumeData.education.map((edu, idx) => (
                          <DraggableSection
                            key={edu.id}
                            item={edu}
                            index={idx}
                            totalCount={resumeData.education.length}
                            title={edu.universityName || "New Education"}
                            onUpdate={updateEducation}
                            onDelete={deleteEducation}
                            isOpen={!edu.isCollapsed}
                            onToggle={() => toggleEducationCollapse(edu.id)}
                            renderFields={(item) => (
                              <>
                                <FormField
                                  label="University Name"
                                  name="universityName"
                                  value={(item as Education).universityName}
                                  onChange={(_, value) =>
                                    updateEducation(
                                      (item as Education).id,
                                      "universityName",
                                      value,
                                    )
                                  }
                                />
                                <FormField
                                  label="Degree"
                                  name="degree"
                                  value={(item as Education).degree}
                                  onChange={(_, value) =>
                                    updateEducation(
                                      (item as Education).id,
                                      "degree",
                                      value,
                                    )
                                  }
                                />
                                <FormField
                                  label="Location"
                                  name="location"
                                  value={(item as Education).location}
                                  onChange={(_, value) =>
                                    updateEducation(
                                      (item as Education).id,
                                      "location",
                                      value,
                                    )
                                  }
                                />
                                <FormField
                                  label="Dates Attended"
                                  name="datesAttended"
                                  value={(item as Education).datesAttended}
                                  onChange={(_, value) =>
                                    updateEducation(
                                      (item as Education).id,
                                      "datesAttended",
                                      value,
                                    )
                                  }
                                />
                                <FormField
                                  label="Relevant Coursework"
                                  name="coursework"
                                  value={(item as Education).coursework || ""}
                                  onChange={(_, value) =>
                                    updateEducation(
                                      (item as Education).id,
                                      "coursework",
                                      value,
                                    )
                                  }
                                  type="textarea"
                                />
                              </>
                            )}
                          />
                        ))}
                        <Button
                          variant="ghost"
                          className="justfy-start mt-3 flex w-full"
                          onClick={addEducation}
                        >
                          + Add Education
                        </Button>
                      </SortableContext>
                    </DndContext>
                  </div>
                </section>

                {/* Experience Section */}
                <section id="experience">
                  <h2 className="mb-3 text-sm font-bold text-gray-900 md:mb-4 md:text-base">
                    Experience
                  </h2>
                  <div className="space-y-3 rounded-md bg-gray-50 p-3 md:p-4">
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={(event) => {
                        const { active, over } = event as DragEndEvent;
                        if (!over) return;
                        const fromIndex = resumeData.experience.findIndex(
                          (i) => i.id === String(active.id),
                        );
                        const toIndex = resumeData.experience.findIndex(
                          (i) => i.id === String(over.id),
                        );
                        if (
                          fromIndex === -1 ||
                          toIndex === -1 ||
                          fromIndex === toIndex
                        )
                          return;
                        moveItemByIndex("experience", fromIndex, toIndex);
                      }}
                    >
                      <SortableContext
                        items={resumeData.experience.map((e) => e.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {resumeData.experience.map((exp, idx) => (
                          <DraggableSection
                            key={exp.id}
                            item={exp}
                            index={idx}
                            totalCount={resumeData.experience.length}
                            title={`${exp.jobTitle || "New Position"}${exp.company ? `, ${exp.company}` : ""}`}
                            onUpdate={updateExperience}
                            onDelete={deleteExperience}
                            isOpen={!exp.isCollapsed}
                            onToggle={() => toggleExperienceCollapse(exp.id)}
                            renderFields={(item) => (
                              <>
                                <FormField
                                  label="Job Title"
                                  name="jobTitle"
                                  value={(item as Experience).jobTitle}
                                  onChange={(_, value) =>
                                    updateExperience(
                                      (item as Experience).id,
                                      "jobTitle",
                                      value,
                                    )
                                  }
                                />
                                <FormField
                                  label="Company"
                                  name="company"
                                  value={(item as Experience).company}
                                  onChange={(_, value) =>
                                    updateExperience(
                                      (item as Experience).id,
                                      "company",
                                      value,
                                    )
                                  }
                                />
                                <FormField
                                  label="Location"
                                  name="location"
                                  value={(item as Experience).location}
                                  onChange={(_, value) =>
                                    updateExperience(
                                      (item as Experience).id,
                                      "location",
                                      value,
                                    )
                                  }
                                />
                                <FormField
                                  label="Dates"
                                  name="dates"
                                  value={(item as Experience).dates}
                                  onChange={(_, value) =>
                                    updateExperience(
                                      (item as Experience).id,
                                      "dates",
                                      value,
                                    )
                                  }
                                />
                                <FormField
                                  label="Description"
                                  name="description"
                                  value={(item as Experience).description}
                                  onChange={(_, value) =>
                                    updateExperience(
                                      (item as Experience).id,
                                      "description",
                                      value,
                                    )
                                  }
                                  type="textarea"
                                />
                                <Button
                                  variant="primary"
                                  className="mt-2 flex w-48 items-center justify-center gap-2"
                                >
                                  <MagicWandIcon /> Enrich with AI
                                </Button>
                              </>
                            )}
                          />
                        ))}
                        <Button
                          variant="ghost"
                          className="mt-3 flex w-full justify-start"
                          onClick={addExperience}
                        >
                          + Add Experience
                        </Button>
                      </SortableContext>
                    </DndContext>
                  </div>
                </section>

                {/* Projects Section */}
                <section id="projects">
                  <h2 className="mb-3 text-sm font-bold text-gray-900 md:mb-4 md:text-base">
                    Projects
                  </h2>
                  <div className="space-y-3 rounded-md bg-gray-50 p-3 md:p-4">
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={(event) => {
                        const { active, over } = event as DragEndEvent;
                        if (!over) return;
                        const fromIndex = resumeData.projects.findIndex(
                          (i) => i.id === String(active.id),
                        );
                        const toIndex = resumeData.projects.findIndex(
                          (i) => i.id === String(over.id),
                        );
                        if (
                          fromIndex === -1 ||
                          toIndex === -1 ||
                          fromIndex === toIndex
                        )
                          return;
                        moveItemByIndex("projects", fromIndex, toIndex);
                      }}
                    >
                      <SortableContext
                        items={resumeData.projects.map((p) => p.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {resumeData.projects.map((proj, idx) => (
                          <DraggableSection
                            key={proj.id}
                            item={proj}
                            index={idx}
                            totalCount={resumeData.projects.length}
                            title={proj.projectName || "New Project"}
                            onUpdate={updateProject}
                            onDelete={deleteProject}
                            isOpen={!proj.isCollapsed}
                            onToggle={() => toggleProjectCollapse(proj.id)}
                            renderFields={(item) => (
                              <>
                                <FormField
                                  label="Project Name"
                                  name="projectName"
                                  value={(item as Project).projectName}
                                  onChange={(_, value) =>
                                    updateProject(
                                      (item as Project).id,
                                      "projectName",
                                      value,
                                    )
                                  }
                                />
                                <FormField
                                  label="Technologies"
                                  name="technologies"
                                  value={(item as Project).technologies}
                                  onChange={(_, value) =>
                                    updateProject(
                                      (item as Project).id,
                                      "technologies",
                                      value,
                                    )
                                  }
                                />
                                <FormField
                                  label="Date"
                                  name="date"
                                  value={(item as Project).date}
                                  onChange={(_, value) =>
                                    updateProject(
                                      (item as Project).id,
                                      "date",
                                      value,
                                    )
                                  }
                                />
                                <FormField
                                  label="Description (Bullet Points)"
                                  name="description"
                                  value={(item as Project).description}
                                  onChange={(_, value) =>
                                    updateProject(
                                      (item as Project).id,
                                      "description",
                                      value,
                                    )
                                  }
                                  type="textarea"
                                />
                              </>
                            )}
                          />
                        ))}
                        <Button
                          variant="ghost"
                          className="mt-3 flex w-full justify-start"
                          onClick={addProject}
                        >
                          + Add Project
                        </Button>
                      </SortableContext>
                    </DndContext>
                  </div>
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
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={(event) => {
                        const { active, over } = event as DragEndEvent;
                        if (!over) return;
                        const fromIndex = resumeData.leadership.findIndex(
                          (i) => i.id === String(active.id),
                        );
                        const toIndex = resumeData.leadership.findIndex(
                          (i) => i.id === String(over.id),
                        );
                        if (
                          fromIndex === -1 ||
                          toIndex === -1 ||
                          fromIndex === toIndex
                        )
                          return;
                        moveItemByIndex("leadership", fromIndex, toIndex);
                      }}
                    >
                      <SortableContext
                        items={resumeData.leadership.map((l) => l.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {resumeData.leadership.map((lead, idx) => (
                          <DraggableSection
                            key={lead.id}
                            item={lead}
                            index={idx}
                            totalCount={resumeData.leadership.length}
                            title={`${lead.role || "New Role"}${lead.organization ? `, ${lead.organization}` : ""}`}
                            onUpdate={updateLeadership}
                            onDelete={deleteLeadership}
                            isOpen={!lead.isCollapsed}
                            onToggle={() => toggleLeadershipCollapse(lead.id)}
                            renderFields={(item) => (
                              <>
                                <FormField
                                  label="Role"
                                  name="role"
                                  value={(item as Leadership).role}
                                  onChange={(_, value) =>
                                    updateLeadership(
                                      (item as Leadership).id,
                                      "role",
                                      value,
                                    )
                                  }
                                />
                                <FormField
                                  label="Organization"
                                  name="organization"
                                  value={(item as Leadership).organization}
                                  onChange={(_, value) =>
                                    updateLeadership(
                                      (item as Leadership).id,
                                      "organization",
                                      value,
                                    )
                                  }
                                />
                                <FormField
                                  label="Dates"
                                  name="dates"
                                  value={(item as Leadership).dates}
                                  onChange={(_, value) =>
                                    updateLeadership(
                                      (item as Leadership).id,
                                      "dates",
                                      value,
                                    )
                                  }
                                />
                                <FormField
                                  label="Description"
                                  name="description"
                                  value={(item as Leadership).description}
                                  onChange={(_, value) =>
                                    updateLeadership(
                                      (item as Leadership).id,
                                      "description",
                                      value,
                                    )
                                  }
                                  type="textarea"
                                />
                              </>
                            )}
                          />
                        ))}
                        <Button
                          variant="ghost"
                          className="mt-3 flex w-full justify-start"
                          onClick={addLeadership}
                        >
                          + Add Leadership
                        </Button>
                      </SortableContext>
                    </DndContext>
                  </div>
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
          </div>
        </div>

        {/* Right Panel - Preview (hidden on mobile) */}
        <div className="hidden h-full w-1/2 flex-col overflow-auto bg-white lg:flex">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-gray-50 px-5 py-4">
            <h3 className="text-md font-bold text-gray-800">Live Preview</h3>
          </div>

          <div className="flex-1 p-4">
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
            ) : loading ? (
              <div className="flex h-full items-center justify-center text-gray-500">
                <div className="text-center">
                  <div className="mb-2 text-lg">Generating PDF preview...</div>
                  <div className="text-xs">Converting LaTeX to PDF</div>
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-500">
                <div className="max-w-md text-center">
                  <div className="mb-2">
                    Edit the form or LaTeX to generate a PDF preview.
                  </div>
                  <div className="text-xs">
                    {compileError
                      ? "Please Contact Support to Activate PDF Preview"
                      : "Direct LaTeX to PDF conversion with LaTeX support."}
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
