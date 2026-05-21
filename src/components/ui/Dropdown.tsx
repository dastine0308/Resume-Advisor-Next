"use client";

import React, { useEffect, useRef, useState } from "react";

export interface DropdownItem {
  label: string;
  value: string;
  onClick: () => void;
  description?: string;
}

interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  disabled?: boolean;
  menuClassName?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  items,
  disabled,
  menuClassName = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <div onClick={() => !disabled && setIsOpen(!isOpen)}>{trigger}</div>

      {isOpen && (
        <div
          className={`absolute left-0 top-full z-10 mt-1 min-w-40 rounded-md border border-gray-200 bg-white py-1 shadow-lg ${menuClassName}`}
        >
          {items.map((item) => (
            <div
              key={item.value}
              className="cursor-pointer px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => {
                setIsOpen(false);
                item.onClick();
              }}
            >
              <div className="font-medium text-gray-900">{item.label}</div>
              {item.description && (
                <div className="mt-0.5 line-clamp-2 text-xs text-gray-500">
                  {item.description}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
