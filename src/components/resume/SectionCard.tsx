import React from "react";
import { IconButton } from "@/components/ui/IconButton";
import { ArrowUpIcon, ArrowDownIcon, Cross2Icon } from "@radix-ui/react-icons";

interface SectionCardProps {
  title: string;
  children: React.ReactNode;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  disableMoveUp?: boolean;
  disableMoveDown?: boolean;
  onDelete?: () => void;
  showControls?: boolean;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  children,
  onMoveUp,
  onMoveDown,
  disableMoveUp,
  disableMoveDown,
  onDelete,
  showControls = true,
}) => {
  return (
    <div className="w-full rounded border border-gray-200 bg-white p-4 shadow-sm">
      {/* Header with controls */}
      <div className="mb-3 flex items-center justify-between border-b border-gray-200 pb-3">
        <h3 className="text-xs font-bold text-gray-800 md:text-sm">{title}</h3>
        {showControls && (
          <div className="flex gap-2">
            <IconButton
              onClick={onMoveUp}
              disabled={disableMoveUp}
              aria-label="Move up"
              size="md"
            >
              <ArrowUpIcon />
            </IconButton>
            <IconButton
              onClick={onMoveDown}
              disabled={disableMoveDown}
              aria-label="Move down"
              size="md"
            >
              <ArrowDownIcon />
            </IconButton>
            <IconButton onClick={onDelete} aria-label="Delete" size="md">
              <Cross2Icon />
            </IconButton>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
};
