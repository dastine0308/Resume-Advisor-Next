"use client";

import React, { useMemo, useState } from "react";
import { CounterClockwiseClockIcon } from "@radix-ui/react-icons";
import { toast } from "sonner";
import { Dropdown } from "@/components/ui/Dropdown";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useResumeUIStore } from "@/stores";
import { useResumeDraftContext } from "@/contexts/ResumeDraftContext";
import {
  useResumeVersions,
  useRestoreResumeVersion,
  type ResumeVersionListItem,
} from "@/hooks/useResumeVersions";
import { generateLatexFromData } from "@/lib/latex-generator";
import type { ResumeDataSection } from "@/lib/api-services";
import { RESUMES_QUERY_KEY } from "@/hooks/useDocuments";
import { RESUME_VERSIONS_QUERY_KEY } from "@/hooks/useResumeVersions";
import { useQueryClient } from "@tanstack/react-query";

const SOURCE_LABELS: Record<ResumeVersionListItem["source"], string> = {
  autosave: "Auto-saved",
  manual: "Saved version",
  restore: "Restored",
};

type RestoreSnapshot = {
  title: string;
  sections: ResumeDataSection;
};

function formatVersionItem(version: ResumeVersionListItem): {
  label: string;
  description?: string;
} {
  const date = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(version.created_at));

  const heading = version.label || SOURCE_LABELS[version.source];

  return {
    label: `${date} · ${heading}`,
    description: version.change_summary ?? undefined,
  };
}

interface VersionHistoryDropdownProps {
  onManualSave?: (versionLabel?: string) => Promise<void>;
  isManualSaving?: boolean;
}

export function VersionHistoryDropdown({
  onManualSave,
  isManualSaving = false,
}: VersionHistoryDropdownProps) {
  const { draft, replaceDraft, markSaved } = useResumeDraftContext();
  const { resumeId, jobId, title, resumeData } = draft;
  const setLatex = useResumeUIStore((state) => state.setLatex);

  const { data: versions = [], isLoading } = useResumeVersions(resumeId);
  const restoreMutation = useRestoreResumeVersion();
  const queryClient = useQueryClient();
  const [undoSnapshot, setUndoSnapshot] = useState<RestoreSnapshot | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [versionLabelInput, setVersionLabelInput] = useState("");
  const [restoreTarget, setRestoreTarget] = useState<ResumeVersionListItem | null>(
    null,
  );

  const captureCurrentSnapshot = (): RestoreSnapshot => ({
    title,
    sections: {
      education: resumeData.education,
      projects: resumeData.projects,
      skills: resumeData.technicalSkills,
      work_experience: resumeData.experience,
      leadership: resumeData.leadership,
    },
  });

  const applySectionsToDraft = (
    sections: ResumeDataSection,
    nextTitle: string,
    markDirty = false,
  ) => {
    replaceDraft(
      {
        ...draft,
        title: nextTitle,
        resumeData: {
          ...resumeData,
          education: sections.education ?? [],
          experience: sections.work_experience ?? [],
          projects: sections.projects ?? [],
          leadership: sections.leadership ?? [],
          technicalSkills: sections.skills ?? resumeData.technicalSkills,
        },
      },
      markDirty,
    );
    setLatex(
      generateLatexFromData(
        {
          ...resumeData,
          education: sections.education ?? [],
          experience: sections.work_experience ?? [],
          projects: sections.projects ?? [],
          leadership: sections.leadership ?? [],
          technicalSkills: sections.skills ?? resumeData.technicalSkills,
        },
        true,
      ),
    );
    if (!markDirty) {
      markSaved();
    }
  };

  const items = useMemo(
    () =>
      versions.map((version) => {
        const formatted = formatVersionItem(version);
        return {
          label: formatted.label,
          description: formatted.description,
          value: version.id,
          onClick: () => setRestoreTarget(version),
        };
      }),
    [versions],
  );

  const handleConfirmRestore = () => {
    if (!resumeId || !restoreTarget) return;

    const versionId = restoreTarget.id;
    setUndoSnapshot(captureCurrentSnapshot());
    setRestoreTarget(null);

    const toastId = toast.loading("Restoring version...");
    restoreMutation.mutate(
      { resumeId, versionId },
      {
        onSuccess: (response) => {
          applySectionsToDraft(response.data.sections, response.data.title);
          queryClient.invalidateQueries({ queryKey: RESUMES_QUERY_KEY });
          queryClient.invalidateQueries({
            queryKey: RESUME_VERSIONS_QUERY_KEY(resumeId),
          });
          toast.success("Version restored", { id: toastId });
        },
        onError: () => {
          setUndoSnapshot(null);
          toast.error("Failed to restore version", { id: toastId });
        },
      },
    );
  };

  const handleUndoRestore = () => {
    if (!undoSnapshot) return;

    applySectionsToDraft(undoSnapshot.sections, undoSnapshot.title, true);
    setUndoSnapshot(null);
    toast.success("Restored previous content");
  };

  const handleConfirmSaveVersion = async () => {
    if (!onManualSave) return;

    const label = versionLabelInput.trim() || undefined;
    setSaveDialogOpen(false);
    setVersionLabelInput("");
    await onManualSave(label);
  };

  const restorePreview = restoreTarget ? formatVersionItem(restoreTarget) : null;

  if (!resumeId) return null;

  return (
    <>
      <div className="flex items-center gap-2">
        {undoSnapshot && (
          <Button
            variant="outline"
            className="text-sm"
            onClick={handleUndoRestore}
            disabled={restoreMutation.isPending}
          >
            <CounterClockwiseClockIcon className="mr-1.5 h-4 w-4" />
            Undo Restore
          </Button>
        )}

        <Dropdown
          disabled={isLoading || restoreMutation.isPending}
          menuClassName="min-w-72 max-w-sm"
          trigger={
            <Button
              variant="secondary"
              className="text-sm"
              disabled={isLoading || restoreMutation.isPending}
            >
              <CounterClockwiseClockIcon className="mr-1.5 h-4 w-4" />
              Version History
            </Button>
          }
          items={
            items.length > 0
              ? items
              : [
                  {
                    label: isLoading ? "Loading..." : "No saved versions yet",
                    value: "empty",
                    onClick: () => {},
                  },
                ]
          }
        />

        {onManualSave && (
          <Button
            variant="outline"
            className="text-sm"
            disabled={!jobId || isManualSaving}
            onClick={() => {
              setVersionLabelInput("");
              setSaveDialogOpen(true);
            }}
          >
            {isManualSaving ? "Saving..." : "Save version"}
          </Button>
        )}
      </div>

      <Modal
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        title="Save version"
        description="Create a checkpoint you can restore later. A change summary will be generated automatically."
        footer={
          <>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={isManualSaving}
              onClick={() => void handleConfirmSaveVersion()}
            >
              {isManualSaving ? "Saving..." : "Save version"}
            </Button>
          </>
        }
      >
        <Input
          label="Version name (optional)"
          value={versionLabelInput}
          onChange={(e) => setVersionLabelInput(e.target.value)}
          placeholder='e.g. "Before Google application"'
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void handleConfirmSaveVersion();
            }
          }}
        />
      </Modal>

      <Modal
        open={restoreTarget !== null}
        onClose={() => setRestoreTarget(null)}
        title="Restore this version?"
        description="Your current resume content will be replaced. A backup of the current content will be saved first."
        footer={
          <>
            <Button variant="outline" onClick={() => setRestoreTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={restoreMutation.isPending}
              onClick={handleConfirmRestore}
            >
              Restore
            </Button>
          </>
        }
      >
        {restorePreview && (
          <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm font-medium text-gray-900">
              {restorePreview.label}
            </p>
            {restorePreview.description && (
              <p className="mt-2 text-sm text-gray-600">
                {restorePreview.description}
              </p>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
