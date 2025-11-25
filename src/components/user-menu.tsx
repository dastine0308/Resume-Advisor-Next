"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { UserDropdown } from "@/components/ui/UserDropdown";
import { IconButton } from "@/components/ui/IconButton";
import { useAccountStore } from "@/stores";
import { useAuthStore } from "@/stores/useAuthStore";

export const UserMenu: React.FC = () => {
  const router = useRouter();
  const user = useAccountStore((state) => state.user);
  const { logout } = useAuthStore();

  const handleNavigateToAccountSettingsPage = React.useCallback(() => {
    router.push("/settings");
  }, [router]);

  const handleSignOut = React.useCallback(() => {
    logout();
    useAccountStore.getState().resetUser();
    router.push("/login");
  }, [logout, router]);

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
