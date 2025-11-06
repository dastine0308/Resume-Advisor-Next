import React from "react";

interface KeywordChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}

export const KeywordChip: React.FC<KeywordChipProps> = ({
  label,
  selected,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3.5 py-2 text-[13px] font-normal transition-all ${
        selected
          ? "border-indigo-500 bg-indigo-500 text-white hover:border-indigo-600 hover:bg-indigo-600"
          : "border-gray-300 bg-gray-100 text-gray-800 hover:border-gray-400 hover:bg-gray-200"
      } `}
    >
      {label}
    </button>
  );
};
