"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { IconButton } from "@/components/ui/IconButton";
import { UserDropdown } from "@/components/ui/UserDropdown";
import { MoonIcon, SunIcon } from "@radix-ui/react-icons";

export const Navigation: React.FC = () => {
  const router = useRouter();

  const handleNavigateToHomePage = () => {
    router.push("/");
  };

  const handleNavigateToAccountSettingsPage = () => {
    // TODO: Implement navigation to account settings page
    console.log("Navigate to account settings");
  };

  const handleSignOut = () => {
    // TODO: Implement sign out logic
    console.log("Sign out clicked");
  };

  return (
    <div className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-4 md:px-5">
      <div
        className="flex cursor-pointer items-center"
        onClick={handleNavigateToHomePage}
      >
        <span className="text-base font-bold text-indigo-500 md:text-lg">
          📋 Resume Advisor
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Theme Toggle and User Avatar */}
        <div className="flex items-center gap-3">
          <IconButton aria-label="Toggle theme">
            {/* TODO: Implement theme toggle functionality */}
            <MoonIcon className="mr-1 h-4 w-4" />
          </IconButton>
          <UserDropdown
            email="demo@gmail.com"
            onSignOut={handleSignOut}
            onNavigateToAccountSettingsPage={
              handleNavigateToAccountSettingsPage
            }
            trigger={
              <IconButton variant="primary" aria-label="User menu">
                {/* TODO: change to username */}A
              </IconButton>
            }
          />
        </div>
      </div>
    </div>
  );
};
