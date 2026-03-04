"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { User, UserRole } from "@/lib/types";
import { mockUsers } from "@/lib/mock-data/users";

interface AuthContextValue {
  user: User | null;
  role: UserRole | null;
  login: (email: string) => User | null;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "ptba_auth_user";

function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as User;
      return mockUsers.find((u) => u.id === parsed.id) ?? null;
    }
  } catch {
    // ignore
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(getStoredUser);

  const login = useCallback((email: string): User | null => {
    const found = mockUsers.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
    if (found) {
      setUser(found);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(found));
      return found;
    }
    return null;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const switchRole = useCallback((role: UserRole) => {
    const found = mockUsers.find((u) => u.role === role);
    if (found) {
      setUser(found);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(found));
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role ?? null,
        login,
        logout,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
