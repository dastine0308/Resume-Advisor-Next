"use client";

import React from "react";
import Link from "next/link";
import UserMenu from "@/components/user-menu";
import { CreditsBadge } from "@/components/ui/CreditsBadge";

export const Header = () => {
  return (
    <header className="sticky top-0 z-50 flex h-16 w-screen shrink-0 items-center justify-between border-b bg-gradient-to-b from-background/10 via-background/50 to-background/80 px-4 backdrop-blur-xl">
      <div className="flex items-center">
        <Link
          href="/dashboard"
          rel="nofollow"
          className="flex cursor-pointer items-center"
        >
          <img
            src="/logo.svg"
            alt="Resume Advisor"
            className="h-8 w-auto max-w-36 shrink-0 md:h-9 md:max-w-44"
          />
        </Link>
      </div>
      <div className="flex items-center gap-3">
        <CreditsBadge />
        <UserMenu />
      </div>
    </header>
  );
};
