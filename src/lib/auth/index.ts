import NextAuth, { type AuthOptions } from "next-auth";
import type { Account, Profile, Session, User } from "next-auth";
import { AdapterUser } from "next-auth/adapters";
import type { JWT } from "next-auth/jwt";

export * from "./types";

interface ExtendedJWT extends JWT {
  id?: string;
}

interface ExtendedSession extends Session {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
  };
}

export const authOptions: Partial<AuthOptions> & { trustHost?: boolean } = {
  callbacks: {
    jwt: jwtCallback,
    session: sessionCallback,
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  trustHost: true,
};

async function jwtCallback({
  token,
  user,
  account,
}: {
  token: ExtendedJWT;
  user?: User | AdapterUser;
  account?: Account | null;
  profile?: Profile;
}): Promise<ExtendedJWT> {
  try {
    if (user) {
      // Use the database user ID
      token.id = user.id;
    }
    if (account) {
      token.workosId = account.id;
    }
    return token;
  } catch (error) {
    console.error("JWT callback error:", error);
    return token;
  }
}

async function sessionCallback({
  session,
  token,
}: {
  session: Session;
  token: ExtendedJWT;
  user: User;
}): Promise<ExtendedSession> {
  try {
    if (!token.id) {
      throw new Error("Missing user ID in token");
    }

    return {
      ...session,
      user: {
        ...session.user,
        id: token.id,
      },
    } as ExtendedSession;
  } catch (error) {
    console.error("Session callback error:", error);
    throw error;
  }
}

// NextAuth expects full AuthOptions (including providers). In this repo the
// providers are configured elsewhere at runtime; cast to `AuthOptions` to
// satisfy the type system while keeping the runtime behavior unchanged.
export const { handlers, signIn, signOut, auth } = NextAuth(
  authOptions as AuthOptions,
);
