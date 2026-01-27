"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

export function ProtectedRoute({
  children,
  requiredRoles = [],
}: ProtectedRouteProps) {
  const { isAuthenticated, user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        // Redirect to login if not authenticated
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      } else if (requiredRoles.length > 0 && user) {
        // Check if user has required role
        const hasRequiredRole = requiredRoles.includes(user.employee_role);
        if (!hasRequiredRole) {
          // Redirect to dashboard if user doesn't have required role
          router.push("/dashboard");
        }
      }
    }
  }, [isAuthenticated, loading, user, router, pathname, requiredRoles]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requiredRoles.length > 0 && user) {
    const hasRequiredRole = requiredRoles.includes(user.employee_role);
    if (!hasRequiredRole) {
      return null;
    }
  }

  return <>{children}</>;
}
