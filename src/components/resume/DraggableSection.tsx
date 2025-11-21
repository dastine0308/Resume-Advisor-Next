import React, { memo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { SectionCard } from "@/components/resume/SectionCard";
import type { DraggableAttributes } from "@dnd-kit/core";

// DraggableSection: a memoized, presentational wrapper that wires up
// @dnd-kit/sortable's `useSortable` and renders a `SectionCard`.
// - Keeps the DOM node ref and transform logic inside one small component.
// - Is memo()'d so it only re-renders when the item's props change.
// - Accepts a `renderFields` render-prop so callers control the inner form fields.

interface DraggableSectionProps<T extends { id: string }>
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onToggle"> {
  item: T;
  index: number;
  totalCount: number;
  title: string;
  onUpdate: (id: string, field: keyof T, value: string) => void;
  onDelete: (id: string) => void;
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
  renderFields: (
    item: T,
    update: (field: keyof T, value: string) => void,
  ) => React.ReactNode;
}

function DraggableSectionInner<T extends { id: string }>(
  props: DraggableSectionProps<T>,
) {
  const {
    item,
    index,
    totalCount,
    title,
    onUpdate,
    onDelete,
    renderFields,
    isOpen,
    onToggle,
  } = props;

  // useSortable gives us attributes/listeners and transform/transition for smooth motion
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  // Convert transform to a CSS string using dnd-kit utilities
  const style: React.CSSProperties = {
    transform: transform ? CSS.Transform.toString(transform) : undefined,
    transition: transition ?? undefined,
    // Slightly elevate dragged item for clarity
    zIndex: isDragging ? 50 : undefined,
    // reduce layout thrashing by enabling GPU acceleration
    willChange: isDragging ? "transform, opacity" : undefined,
  };

  // Small helper to call update with typed args
  const updateField = (field: keyof T, value: string) =>
    onUpdate(item.id, field, value);

  return (
    <div ref={setNodeRef as React.Ref<HTMLDivElement>} style={style}>
      <SectionCard
        title={title}
        showControls={totalCount > 1}
        onDelete={() => onDelete(item.id)}
        isOpen={isOpen}
        onToggle={onToggle}
        dragAttributes={attributes as unknown as DraggableAttributes}
        dragListeners={listeners as unknown as Record<string, unknown>}
        dragging={isDragging}
      >
        {renderFields(item, updateField)}
      </SectionCard>
    </div>
  );
}

export const DraggableSection = memo(
  DraggableSectionInner,
) as React.MemoExoticComponent<typeof DraggableSectionInner>;
(
  DraggableSection as React.MemoExoticComponent<typeof DraggableSectionInner>
).displayName = "DraggableSection";
