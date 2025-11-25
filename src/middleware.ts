import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const TOKEN_COOKIE_NAME = "auth-token";

// Public routes that don't require authentication
const publicPrefixes = ["/login", "/signup"];

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Check if the requested path is a public route
  const isPublicRoute = publicPrefixes.some((route) =>
    pathname.startsWith(route),
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Check for auth token in cookies
  const token = req.cookies.get(TOKEN_COOKIE_NAME)?.value;

  if (!token) {
    // Redirect to login if no token
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
