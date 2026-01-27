"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  employee_code: string;
  ldap_username: string;
  full_name: string;
  email: string;
  employee_type: string;
  employee_role: string;
  employee_design: string;
  working_location: string;
  department_id: string;
  project_manager_id: string | null;
  experience_years: number;
  resume_url: string | null;
  college: string | null;
  degree: string | null;
  status: string;
  joined_on: string;
  exited_on: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Load user from localStorage on mount (mock auth)
  useEffect(() => {
    const storedToken = localStorage.getItem("auth_token");
    const storedUser = localStorage.getItem("user_info");

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
      } catch (error) {
        console.error("Error parsing stored user:", error);
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user_info");
      }
    }
    setLoading(false);
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("auth_token", newToken);
    localStorage.setItem("user_info", JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_info");
    router.push("/login");
  };

  const hasRole = (roles: string[]): boolean => {
    if (!user) return false;
    return roles.includes(user.employee_role);
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated: !!token && !!user,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
