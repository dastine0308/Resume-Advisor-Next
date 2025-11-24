import { type AuthOptions } from "next-auth";
import type { Session, User } from "next-auth";
import { AdapterUser } from "next-auth/adapters";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";

export * from "../../types/user";

interface ExtendedJWT extends JWT {
  id?: string;
  accessToken?: string;
}

interface CustomUser {
  id: string;
  accessToken: string;
}

export interface ExtendedSession extends Session {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
  };
  accessToken: string;
}

export const authOptions: Partial<AuthOptions> & { trustHost?: boolean } = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          console.log("🔐 Attempting login with:", credentials?.email);

          // Import dynamically to avoid circular dependency
          const { login } = await import("@/lib/api-services");

          const data = await login({
            email: credentials?.email || "",
            password: credentials?.password || "",
          });

          console.log(
            "✅ Login successful, full response:",
            JSON.stringify(data, null, 2),
          );

          if (data.success && data.token) {
            return {
              id: data.user_id,
              accessToken: data.token,
            };
          }

          return null;
        } catch (error) {
          console.error("💥 Login error:", error);
          return null;
        }
      },
    }),
  ],
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
}: {
  token: ExtendedJWT;
  user?: User | AdapterUser | CustomUser;
}): Promise<ExtendedJWT> {
  try {
    if (user) {
      token.id = user.id;
      if ("accessToken" in user) {
        token.accessToken = user.accessToken;
      }
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
      accessToken: token.accessToken,
    } as ExtendedSession;
  } catch (error) {
    console.error("Session callback error:", error);
    throw error;
  }
}

// Export the auth options for NextAuth v4
export default authOptions as AuthOptions;
