"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
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
import { useResumeUIStore } from "@/stores";
import type { CompileErrorKind } from "@/stores/useResumeUIStore";
import {
  useResumeDraftContext,
  useSetResumeData,
} from "@/contexts/ResumeDraftContext";
import { Breadcrumb } from "@/components/resume/Breadcrumb";
import { FormField } from "@/components/resume/FormField";
import { VersionHistoryDropdown } from "@/components/resume/VersionHistoryDropdown";
import { Button } from "@/components/ui/Button";
import type {
  ResumeData,
  Education,
  Experience,
  Project,
  Leadership,
} from "@/types/resume";
import {
  generateLaTeXPreviewURL,
  LaTeXServiceBusyError,
  LaTeXServiceUnavailableError,
  LaTeXValidationError,
} from "@/lib/latex-client";
import { LATEX_PREVIEW_UNAVAILABLE_MESSAGE } from "@/lib/latex-preview-feedback";
import {
  generateLatexFromData,
  validateResumeDataForLatex,
} from "@/lib/latex-generator";
import { parseLatexToData } from "@/lib/latex-parser";
import {
  CounterClockwiseClockIcon,
  MagicWandIcon,
} from "@radix-ui/react-icons";
import { toast } from "sonner";
import { parseCreditsErrorFromResponse } from "@/lib/ai-credits";
import { useQueryClient } from "@tanstack/react-query";
import { PROFILE_QUERY_KEY } from "@/hooks/useProfile";
import { useAiCredits } from "@/hooks/useAiCredits";
import { AiCreditHint } from "@/components/ui/AiCreditHint";
import { UpgradeProCta } from "@/components/ui/UpgradeProCta";
import {
  ENGLISH_RESUME_FORM_HINT,
  ENGLISH_RESUME_GUIDANCE,
} from "@/lib/utils";

const LATEX_SERVICE_TOAST_ID = "latex-service-unavailable";
const NORMAL_DEBOUNCE_MS = 700;
const BUSY_DEBOUNCE_MS = 3000;
const BUSY_COOLDOWN_MS = 5000;

const ERROR_KIND_STYLES: Record<
  CompileErrorKind,
  { card: string; text: string; title: string }
> = {
  busy: {
    card: "border-amber-200 bg-amber-50 text-amber-900",
    text: "text-amber-900",
    title: "PDF preview temporarily unavailable",
  },
  unavailable: {
    card: "border-gray-200 bg-gray-50 text-gray-700",
    text: "text-gray-700",
    title: "PDF preview unavailable",
  },
  validation: {
    card: "border-red-200 bg-red-50 text-red-800",
    text: "text-red-800",
    title: "Cannot generate preview",
  },
  other: {
    card: "border-red-200 bg-red-50 text-red-800",
    text: "text-red-800",
    title: "Preview failed",
  },
};

type ArraySectionKey = "education" | "experience" | "projects" | "leadership";
type EnrichSectionType = "experience" | "project" | "leadership";

type EnrichRestoreSnapshot = {
  sectionType: EnrichSectionType;
  itemId: string;
  description: string;
};

export default function ContentBuilderForm({
  onManualSave,
  isManualSaving,
  selectedKeywords,
}: {
  onManualSave?: (versionLabel?: string) => Promise<void>;
  isManualSaving?: boolean;
  selectedKeywords: string[];
}) {
  const queryClient = useQueryClient();
  const { canAfford, showUpgradeCta } = useAiCredits();
  const { draft } = useResumeDraftContext();
  const setResumeData = useSetResumeData();
  const resumeData = draft.resumeData;
  const {
    latex,
    setLatex,
    mode,
    setMode,
    loading,
    setLoading,
    setPdfPreviewURL,
    compileError,
    compileErrorKind,
    setCompileError,
    pdfPreviewURL,
  } = useResumeUIStore();

  const [breadcrumbItems, setBreadcrumbItems] = useState([
    { id: "education", label: "Education", active: true },
    { id: "experience", label: "Experience", active: false },
    { id: "projects", label: "Projects", active: false },
    { id: "technical-skills", label: "Skills", active: false },
    { id: "leadership", label: "Leadership", active: false },
  ]);

  // AI Enrichment state
  const [enrichingItemId, setEnrichingItemId] = useState<string | null>(null);
  const [enrichError, setEnrichError] = useState<string | null>(null);
  const [enrichRestore, setEnrichRestore] =
    useState<EnrichRestoreSnapshot | null>(null);

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

  const updateExperience = useCallback(
    (id: string, field: keyof Experience, value: string) => {
      setResumeData((prev) => ({
        ...prev,
        experience: prev.experience.map((exp) =>
          exp.id === id ? { ...exp, [field]: value } : exp,
        ),
      }));
    },
    [setResumeData],
  );

  const updateProject = useCallback(
    (id: string, field: keyof Project, value: string) => {
      setResumeData((prev) => ({
        ...prev,
        projects: prev.projects.map((proj) =>
          proj.id === id ? { ...proj, [field]: value } : proj,
        ),
      }));
    },
    [setResumeData],
  );

  const updateLeadership = useCallback(
    (id: string, field: keyof Leadership, value: string) => {
      setResumeData((prev) => ({
        ...prev,
        leadership: prev.leadership.map((lead) =>
          lead.id === id ? { ...lead, [field]: value } : lead,
        ),
      }));
    },
    [setResumeData],
  );

  const addEducation = useCallback(() => {
    setResumeData((prev) => ({
      ...prev,
      education: [
        ...prev.education,
        {
          id: uuidv4(),
          universityName: "",
          degree: "",
          location: "",
          datesAttended: "",
          coursework: "",
          order: prev.education.length,
          isCollapsed: false,
        },
      ],
    }));
  }, [setResumeData]);

  const addExperience = useCallback(() => {
    setResumeData((prev) => ({
      ...prev,
      experience: [
        ...prev.experience,
        {
          id: uuidv4(),
          jobTitle: "",
          company: "",
          location: "",
          dates: "",
          description: "",
          order: prev.experience.length,
          isCollapsed: false,
        },
      ],
    }));
  }, [setResumeData]);

  const addProject = useCallback(() => {
    setResumeData((prev) => ({
      ...prev,
      projects: [
        ...prev.projects,
        {
          id: uuidv4(),
          projectName: "",
          technologies: "",
          date: "",
          description: "",
          order: prev.projects.length,
          isCollapsed: false,
        },
      ],
    }));
  }, [setResumeData]);

  const addLeadership = useCallback(() => {
    setResumeData((prev) => ({
      ...prev,
      leadership: [
        ...prev.leadership,
        {
          id: uuidv4(),
          role: "",
          organization: "",
          dates: "",
          description: "",
          order: prev.leadership.length,
          isCollapsed: false,
        },
      ],
    }));
  }, [setResumeData]);

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
  const deleteWithUndo = useCallback(
    (key: ArraySectionKey, id: string) => {
      const items = draft.resumeData[key] as {
        id: string;
        order?: number;
      }[];
      const index = items.findIndex((i) => i.id === id);
      if (index === -1) return;

      const deleted = structuredClone(items[index]);

      setResumeData((prev) => ({
        ...prev,
        [key]: removeAndNormalize(
          prev[key] as { id: string; order?: number }[],
          id,
        ),
      }));

      toast("Section removed", {
        action: {
          label: "Restore",
          onClick: () => {
            setResumeData((prev) => {
              const arr = [
                ...(prev[key] as { id: string; order?: number }[]),
              ];
              if (arr.some((i) => i.id === deleted.id)) return prev;
              arr.splice(index, 0, deleted);
              return {
                ...prev,
                [key]: arr.map((item, idx) => ({ ...item, order: idx })),
              };
            });
          },
        },
        duration: 8000,
      });
    },
    [removeAndNormalize, setResumeData],
  );

  const deleteEducation = useCallback(
    (id: string) => deleteWithUndo("education", id),
    [deleteWithUndo],
  );
  const deleteExperience = useCallback(
    (id: string) => deleteWithUndo("experience", id),
    [deleteWithUndo],
  );
  const deleteProject = useCallback(
    (id: string) => deleteWithUndo("projects", id),
    [deleteWithUndo],
  );
  const deleteLeadership = useCallback(
    (id: string) => deleteWithUndo("leadership", id),
    [deleteWithUndo],
  );

  const handleApplyLatexToForm = useCallback(() => {
    const previousData = structuredClone(
      draft.resumeData,
    );
    try {
      const parsed = parseLatexToData(latex);
      setResumeData(parsed);
      setMode("form");
      toast.success("LaTeX applied to form", {
        action: {
          label: "Restore",
          onClick: () => {
            setResumeData(previousData);
            toast.success("Form restored");
          },
        },
        duration: 10000,
      });
    } catch {
      toast.error("Failed to parse LaTeX — check for syntax errors");
    }
  }, [latex, setResumeData, setMode]);

  const handleRestoreEnrich = useCallback(() => {
    if (!enrichRestore) return;
    const { sectionType, itemId, description } = enrichRestore;
    if (sectionType === "experience") {
      updateExperience(itemId, "description", description);
    } else if (sectionType === "project") {
      updateProject(itemId, "description", description);
    } else {
      updateLeadership(itemId, "description", description);
    }
    setEnrichRestore(null);
    toast.success("Description restored");
  }, [enrichRestore, updateExperience, updateProject, updateLeadership]);

  const showServiceUnavailableToast = useCallback(() => {
    toast.warning(LATEX_PREVIEW_UNAVAILABLE_MESSAGE, {
      id: LATEX_SERVICE_TOAST_ID,
      duration: 8000,
    });
  }, []);

  const debounceRef = useRef<number | null>(null);
  const compileInFlightRef = useRef(false);
  const pendingCompileRef = useRef(false);
  const busyUntilRef = useRef(0);

  const getCompileDelayMs = () => {
    const remaining = busyUntilRef.current - Date.now();
    if (remaining > 0) {
      return Math.max(BUSY_DEBOUNCE_MS, remaining);
    }
    return NORMAL_DEBOUNCE_MS;
  };

  const compileLaTeX = async () => {
    if (compileInFlightRef.current) {
      pendingCompileRef.current = true;
      return;
    }

    compileInFlightRef.current = true;
    setLoading(true);
    const stillInBusyCooldown =
      compileErrorKind === "busy" && busyUntilRef.current > Date.now();
    if (!stillInBusyCooldown) {
      setCompileError(null);
    }

    const previousPreviewURL = pdfPreviewURL;

    try {
      // Validate resume data for non-English characters before generating LaTeX
      if (mode === "form") {
        validateResumeDataForLatex(resumeData);
      }

      const latexContent =
        mode === "form" ? generateLatexFromData(resumeData, true) : latex;

      const previewURL = await generateLaTeXPreviewURL(latexContent);

      // Success - dismiss any existing error toast
      toast.dismiss(LATEX_SERVICE_TOAST_ID);
      setPdfPreviewURL(previewURL);
      if (previousPreviewURL && previousPreviewURL !== previewURL) {
        URL.revokeObjectURL(previousPreviewURL);
      }
    } catch (error) {
      console.error("[Content Builder] LaTeX compilation failed:", error);

      // Handle validation errors (non-English characters)
      if (error instanceof LaTeXValidationError) {
        const fieldInfo = error.fieldName ? ` in "${error.fieldName}"` : "";
        toast.error(`Non-English characters detected${fieldInfo}`, {
          description: ENGLISH_RESUME_GUIDANCE,
          duration: 5000,
        });
        setCompileError(
          `Non-English characters found${fieldInfo}. ${ENGLISH_RESUME_GUIDANCE}`,
          "validation",
        );
        return;
      }

      if (error instanceof LaTeXServiceBusyError) {
        busyUntilRef.current = Date.now() + BUSY_COOLDOWN_MS;
        setCompileError(error.message, "busy");
        return;
      }

      if (error instanceof LaTeXServiceUnavailableError) {
        if (!previousPreviewURL) {
          showServiceUnavailableToast();
        }
        setCompileError("LaTeX service is unavailable", "unavailable");
        return;
      }

      const errorMessage =
        error instanceof Error ? error.message : "LaTeX compilation failed";
      setCompileError(errorMessage, "other");
    } finally {
      compileInFlightRef.current = false;
      setLoading(false);

      if (pendingCompileRef.current) {
        pendingCompileRef.current = false;
        if (debounceRef.current) window.clearTimeout(debounceRef.current);
        debounceRef.current = window.setTimeout(() => {
          void compileLaTeX();
        }, getCompileDelayMs());
      }
    }
  };

  const renderEnrichActions = (
    sectionType: EnrichSectionType,
    item: { id: string; description: string },
  ) => {
    const canRestore =
      enrichRestore?.itemId === item.id &&
      enrichingItemId === null &&
      enrichRestore.description !== item.description;

    return (
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button
          variant="primary"
          className="inline-flex items-center justify-center gap-2"
          onClick={() =>
            handleEnrichDescription(
              sectionType,
              item.id,
              item.description,
            )
          }
          disabled={
            enrichingItemId === item.id ||
            !item.description?.trim() ||
            !canAfford("enrich")
          }
        >
          <MagicWandIcon />
          {enrichingItemId === item.id ? (
            "Enriching..."
          ) : (
            <>
              Enrich with AI
              <AiCreditHint action="enrich" />
            </>
          )}
        </Button>
        {canRestore && (
          <Button
            variant="outline"
            className="flex items-center justify-center gap-2"
            onClick={handleRestoreEnrich}
          >
            <CounterClockwiseClockIcon />
            Restore
          </Button>
        )}
        {enrichError && enrichingItemId === item.id && (
          <p className="w-full text-sm text-red-600">{enrichError}</p>
        )}
        {showUpgradeCta("enrich") && item.description?.trim() && (
          <UpgradeProCta action="enrich" className="w-full" />
        )}
      </div>
    );
  };

  // AI Enrichment handler
  const handleEnrichDescription = async (
    sectionType: EnrichSectionType,
    itemId: string,
    description: string,
  ) => {
    setEnrichRestore({ sectionType, itemId, description });

    setEnrichingItemId(itemId);
    setEnrichError(null);

    try {
      const response = await fetch("/api/enrich-description", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionType,
          description,
          keywords: selectedKeywords,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as {
          error?: string;
          code?: string;
        };
        const creditsMessage = parseCreditsErrorFromResponse(
          response.status,
          errorData,
        );
        throw new Error(
          creditsMessage ?? errorData.error ?? "Failed to enrich description",
        );
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split("\n")) {
            if (!line.trim().startsWith("0:")) continue;

            try {
              const parsed = JSON.parse(line.slice(2));
              if (parsed.text) {
                accumulatedText += parsed.text;

                if (sectionType === "experience") {
                  updateExperience(itemId, "description", accumulatedText);
                } else if (sectionType === "project") {
                  updateProject(itemId, "description", accumulatedText);
                } else if (sectionType === "leadership") {
                  updateLeadership(itemId, "description", accumulatedText);
                }
              }
            } catch {
              // Failed to parse chunk
            }
          }
        }
      }

      if (!accumulatedText.trim()) {
        throw new Error("AI returned an empty response. Please try again.");
      }

      await queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
    } catch (error) {
      console.error("Error enriching description:", error);
      setEnrichError(
        error instanceof Error ? error.message : "Failed to enrich description",
      );
    } finally {
      setEnrichingItemId(null);
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

  // Sync LaTeX with form data whenever resumeData changes
  // Skip validation here - validation is handled in compileLaTeX
  useEffect(() => {
    if (mode === "form") {
      const generatedLatex = generateLatexFromData(resumeData, true);
      setLatex(generatedLatex);
    }
  }, [resumeData, mode, setLatex]);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      void compileLaTeX();
    }, getCompileDelayMs());
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
          <div className="border-b p-4">
            <div className="flex items-center justify-between gap-2">
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
              <VersionHistoryDropdown
                onManualSave={onManualSave}
                isManualSaving={isManualSaving}
              />
            </div>
          </div>

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
                <p
                  className="rounded-md border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs text-indigo-900"
                  role="note"
                >
                  {ENGLISH_RESUME_FORM_HINT}
                </p>
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
                                  key="universityName"
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
                                  placeholder="State University"
                                />
                                <FormField
                                  key="degree"
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
                                  placeholder="Bachelor of Science in Computer Science"
                                />
                                <FormField
                                  key="location"
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
                                  placeholder="City, State"
                                />
                                <FormField
                                  key="datesAttended"
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
                                  placeholder="Sep. 2017 – May 2021"
                                />
                                <FormField
                                  key="coursework"
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
                                  placeholder="Data Structures, Software Methodology, Algorithms Analysis, Database Management"
                                />
                              </>
                            )}
                          />
                        ))}
                        <Button
                          variant="ghost"
                          className="mt-3 flex w-full justify-start"
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
                                  placeholder="Software Engineer Intern"
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
                                  placeholder="Company Name"
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
                                  placeholder="City, State"
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
                                  placeholder="May 2020 – August 2020"
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
                                  placeholder="- Developed a service to automatically perform unit tests daily."
                                />
                                {renderEnrichActions("experience", {
                                  id: (item as Experience).id,
                                  description: (item as Experience).description,
                                })}
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
                                  placeholder="Gym Reservation Bot"
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
                                  placeholder="Python, Selenium, Google Cloud Console"
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
                                  placeholder="January 2021"
                                />
                                <FormField
                                  label="Description"
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
                                  placeholder="- Developed an automatic bot using Python."
                                />
                                {renderEnrichActions("project", {
                                  id: (item as Project).id,
                                  description: (item as Project).description,
                                })}
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
                      placeholder="Python, Java, C, HTML/CSS, JavaScript, SQL"
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
                      placeholder="VS Code, Eclipse, Google Cloud Platform, Android Studio"
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
                      placeholder="Linux, Jenkins, GitHub, JUnit, WordPress"
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
                                  placeholder="President"
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
                                  placeholder="Organization Name"
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
                                  placeholder="Spring 2020 – Present"
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
                                  placeholder="- Managed executive board of 5 members."
                                />
                                {renderEnrichActions("leadership", {
                                  id: (item as Leadership).id,
                                  description: (item as Leadership).description,
                                })}
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
                <div className="mb-3 flex items-center justify-between md:mb-4">
                  <h2 className="text-sm font-bold text-gray-900 md:text-base">
                    LaTeX Editor
                  </h2>
                  <Button
                    variant="primary"
                    className="text-sm"
                    onClick={handleApplyLatexToForm}
                  >
                    Apply to Form
                  </Button>
                </div>
                <div className="flex-1">
                  <textarea
                    className="h-full w-full rounded-md border border-gray-300 bg-white p-4 font-mono text-sm"
                    value={latex}
                    onChange={(e) => setLatex(e.target.value)}
                    placeholder="Edit your LaTeX code here..."
                    spellCheck={false}
                  />
                </div>
                {compileError && (() => {
                  const styles = ERROR_KIND_STYLES[compileErrorKind ?? "other"];
                  return (
                    <div className={`mt-3 rounded-md border p-3 ${styles.card}`}>
                      <p className={`text-sm ${styles.text}`}>{compileError}</p>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Preview (hidden on mobile) */}
        <div className="hidden h-full w-1/2 flex-col overflow-auto bg-white lg:flex">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-gray-50 px-5 py-4">
            <h3 className="text-md font-bold text-gray-800">Live Preview</h3>
          </div>

          <div className="flex flex-1 flex-col p-4">
            {compileError && compileErrorKind === "busy" && (
              <div className="mb-3 shrink-0 rounded-md border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm font-medium text-amber-900">
                  PDF preview temporarily unavailable
                </p>
                <p className="text-sm text-amber-900">{compileError}</p>
                <p className="mt-2 text-xs text-amber-800/80">
                  Showing previous preview. It will update automatically when
                  you edit your resume.
                </p>
              </div>
            )}
            {pdfPreviewURL ? (
              <iframe
                src={pdfPreviewURL}
                className="min-h-0 w-full flex-1 border bg-white"
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
            ) : compileError ? (
              <div className="flex h-full items-center justify-center p-4">
                {(() => {
                  const kind = compileErrorKind ?? "other";
                  const styles = ERROR_KIND_STYLES[kind];
                  return (
                    <div
                      className={`max-w-md rounded-md border p-5 text-center ${styles.card}`}
                    >
                      <p className="mb-2 font-medium">{styles.title}</p>
                      <p className="text-sm">{compileError}</p>
                      {kind === "busy" && (
                        <p className="mt-3 text-xs opacity-80">
                          Preview will update automatically when you edit your
                          resume.
                        </p>
                      )}
                      {kind === "unavailable" && (
                        <p className="mt-3 text-xs opacity-80">
                          Please contact support to activate PDF preview.
                        </p>
                      )}
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-500">
                <div className="max-w-5xl text-center">
                  <div className="mb-2">
                    Edit the form or LaTeX to generate a PDF preview.
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
