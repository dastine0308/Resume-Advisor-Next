"use client";

import React from "react";
import { SessionProvider } from "next-auth/react";
import { useUserData } from "@/hooks/useUserData";

interface AuthProviderProps {
  children: React.ReactNode;
}

function AuthContent({ children }: { children: React.ReactNode }) {
  useUserData();

  return <>{children}</>;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SessionProvider
      refetchInterval={5 * 60}
      refetchOnWindowFocus={false}
    >
      <AuthContent>{children}</AuthContent>
    </SessionProvider>
  );
}
