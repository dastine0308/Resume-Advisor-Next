import React from "react";
import Link from "next/link";
import UserMenu from "@/components/user-menu";
import { getServerSession } from "next-auth";

export const Header = async () => {
  const session = await getServerSession();
  const signedIn = !!session;

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

        <div className="flex items-center gap-4">
          {signedIn ?? <UserMenu />}
        </div>
      </div>
    </header>
  );
};
