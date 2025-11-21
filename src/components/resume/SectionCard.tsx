import React, { useState, memo } from "react";
import {
  TrashIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  DragHandleDots2Icon,
} from "@radix-ui/react-icons";
import { DraggableAttributes } from "@dnd-kit/core";

import { Button } from "@/components/ui/Button";

interface SectionCardProps {
  title: string;
  children: React.ReactNode;
  onDelete?: () => void;
  showControls?: boolean;
  initialOpen?: boolean;
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
  // dnd-kit props (optional) to support touch-friendly drag
  dragAttributes?: DraggableAttributes;
  dragListeners?: Record<string, unknown>;
  setNodeRef?: ((el: HTMLElement | null) => void) | null;
  transform?: {
    x?: number;
    y?: number;
    scaleX?: number;
    scaleY?: number;
  } | null;
  transition?: string | undefined;
  dragging?: boolean;
}

const SectionCardComponent: React.FC<SectionCardProps> = ({
  title,
  children,
  onDelete,
  showControls = true,
  dragAttributes,
  dragListeners,
  setNodeRef,
  transform,
  transition,
  dragging,
  initialOpen = true,
  isOpen: isOpenProp,
  onToggle,
}) => {
  const [internalOpen, setInternalOpen] = useState<boolean>(initialOpen);
  const isControlled = typeof isOpenProp === "boolean";
  const isOpen = isControlled ? (isOpenProp as boolean) : internalOpen;

  const transformStyle = transform
    ? `translate3d(${transform.x ?? 0}px, ${transform.y ?? 0}px, 0) scale(${transform.scaleX ?? 1}, ${transform.scaleY ?? 1})`
    : undefined;

  // Render the card. We separate the drag handle from other buttons so
  // only the handle receives the dnd-kit listeners/attributes. This
  // reduces accidental drag starts when interacting with inputs/buttons.
  return (
    <div
      ref={setNodeRef ?? undefined}
      className={
        "w-full rounded border border-gray-200 bg-white p-4 shadow-sm" +
        (dragging ? " opacity-90" : "")
      }
      style={{ transform: transformStyle, transition }}
    >
      {/* Header with controls */}
      <div
        className={`flex items-center justify-between ${isOpen ? "mb-3 border-b border-gray-100 pb-3" : ""}`}
      >
        <div className="flex items-center gap-3">
          {showControls && (
            <div className="flex items-center gap-2">
              {/*
                Drag handle: attach dnd-kit attributes/listeners here only.
                Use a neutral element rather than the main buttons so that
                clicks inside the card don't accidentally start a drag.
              */}
              <div
                {...(dragAttributes ?? {})}
                {...(dragListeners ?? {})}
                // prevent touch scrolling capturing the drag handle
                style={{ touchAction: "none", WebkitUserSelect: "none" }}
                className="cursor-grab rounded p-1 hover:bg-gray-100"
                aria-hidden
                title="Drag to reorder"
              >
                <DragHandleDots2Icon className="h-4 w-4 text-gray-600" />
              </div>
            </div>
          )}
          <h3 className="text-sm font-semibold text-gray-900 md:text-base">
            {title}
          </h3>
        </div>
        <div className="flex">
          <Button
            aria-expanded={isOpen}
            variant="ghost"
            onClick={() => {
              // avoid toggling when the item is currently being dragged
              if (dragging) return;
              const next = !isOpen;
              if (isControlled) {
                onToggle?.(next);
              } else {
                setInternalOpen((s) => !s);
              }
            }}
            className="rounded p-1 hover:bg-gray-100"
            title={isOpen ? "Collapse" : "Expand"}
          >
            {isOpen ? (
              <ChevronUpIcon className="h-4 w-4 text-gray-600" />
            ) : (
              <ChevronDownIcon className="h-4 w-4 text-gray-600" />
            )}
          </Button>
          <Button
            onClick={onDelete}
            aria-label="Delete"
            variant="ghost"
            className="text-red-600 hover:bg-red-50 focus:ring-red-500"
          >
            <TrashIcon />
          </Button>
        </div>
      </div>

      {/* Content (collapsible) */}
      {isOpen && <div className="flex flex-col gap-3">{children}</div>}
    </div>
  );
};

// Memoize SectionCard to avoid re-renders unless props change
export const SectionCard = memo(SectionCardComponent);
