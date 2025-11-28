"use client";

import React from "react";
import Link from "next/link";
import UserMenu from "@/components/user-menu";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/stores/useAuthStore";

export const Header = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <header className="sticky top-0 z-50 flex h-16 w-screen shrink-0 items-center justify-between border-b bg-gradient-to-b from-background/10 via-background/50 to-background/80 px-4 backdrop-blur-xl">
      <div className="flex items-center">
        <Link
          href="/"
          rel="nofollow"
          className="flex cursor-pointer items-center"
        >
          <span className="text-base font-bold text-indigo-500 md:text-lg">
            Resume Advisor
          </span>
        </Link>
      </div>
      {isAuthenticated ? (
        <UserMenu />
      ) : (
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Log In
            </Button>
          </Link>
          <Link href="/signup">
            <Button variant="primary" size="sm">
              Sign Up
            </Button>
          </Link>
        </div>
      )}
    </header>
  );
};
