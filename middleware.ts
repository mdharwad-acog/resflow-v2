import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Public routes that don't require authentication
const publicRoutes = ["/login"];

// Role-based route access
const roleRoutes: Record<string, string[]> = {
  "/audit": ["hr_executive"],
  "/approvals": ["project_manager", "hr_executive"],
  "/demands": ["project_manager", "hr_executive"],
  "/employees/new": ["hr_executive"],
  "/projects/new": ["hr_executive"],
  "/allocations/new": ["hr_executive"],
  "/skills/new": ["hr_executive"],
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // For client-side routing, we'll handle auth in components
  // This middleware is mainly for logging and future server-side checks
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
