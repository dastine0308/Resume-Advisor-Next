"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { UserDropdown } from "@/components/ui/UserDropdown";
import { IconButton } from "@/components/ui/IconButton";
import { useProfile } from "@/hooks/useProfile";
import { useAuthStore } from "@/stores/useAuthStore";

export const UserMenu: React.FC = () => {
  const router = useRouter();
  const { data: user, isLoading } = useProfile();
  const { logout } = useAuthStore();

  const handleNavigateToAccountSettingsPage = React.useCallback(() => {
    router.push("/settings");
  }, [router]);

  const handleSignOut = React.useCallback(() => {
    logout();
    router.push("/login");
  }, [logout, router]);

  if (isLoading) return <div className="h-9 w-9 rounded-full bg-gray-200 animate-pulse" />;
  if (!user?.email) return null;

  return (
    <UserDropdown
      email={user.email || ""}
      onSignOut={handleSignOut}
      onNavigateToAccountSettingsPage={handleNavigateToAccountSettingsPage}
      trigger={
        <IconButton variant="primary" aria-label="User menu">
          {user.first_name ? user.first_name.charAt(0) : ""}
        </IconButton>
      }
    />
  );
};

export default UserMenu;
