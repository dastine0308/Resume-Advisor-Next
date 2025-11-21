"use client";

import React from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { UserDropdown } from "@/components/ui/UserDropdown";
import { IconButton } from "@/components/ui/IconButton";

export const UserMenu: React.FC = () => {
  const { data: session } = useSession();
  const router = useRouter();

  const handleNavigateToAccountSettingsPage = React.useCallback(() => {
    router.push("/account/settings");
  }, [router]);

  if (!session?.user) return null;

  return (
    <UserDropdown
      email={session.user.email || ""}
      onSignOut={() => signOut({ callbackUrl: "/login" })}
      onNavigateToAccountSettingsPage={handleNavigateToAccountSettingsPage}
      trigger={
        <IconButton variant="primary" aria-label="User menu">
          {session.user.name ? session.user.name.charAt(0) : "A"}
        </IconButton>
      }
    />
  );
};

export default UserMenu;
