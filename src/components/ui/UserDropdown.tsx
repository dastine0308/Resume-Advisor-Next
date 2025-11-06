"use client";

import React, { useEffect, useRef, useState } from "react";

interface UserDropdownProps {
  email: string;
  onSignOut: () => void;
  onNavigateToAccountSettingsPage: () => void;
  trigger: React.ReactNode;
}

export const UserDropdown: React.FC<UserDropdownProps> = ({
  email,
  onSignOut,
  onNavigateToAccountSettingsPage,
  trigger,
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
    <div className="relative" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 rounded-md border border-gray-200 bg-white p-1 shadow-lg">
          <div
            className="flex min-w-32 cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 hover:bg-gray-100"
            onClick={() => {
              setIsOpen(false);
              onNavigateToAccountSettingsPage();
            }}
          >
            <p className="grow text-sm font-medium text-sky-600">{email}</p>
          </div>
          <div
            className="flex min-w-32 cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 hover:bg-gray-100"
            onClick={() => {
              setIsOpen(false);
              onSignOut();
            }}
          >
            <p className="grow text-sm font-medium text-gray-500">Sign Out</p>
          </div>
        </div>
      )}
    </div>
  );
};
