"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { User, UserRole } from "@/lib/types";
import { mockUsers } from "@/lib/mock-data/users";
import { authApi, ApiClientError } from "@/lib/api/client";

interface AuthContextValue {
  user: User | null;
  role: UserRole | null;
  accessToken: string | null;
  /** Mock login (for demo/role-switcher) */
  login: (email: string) => User | null;
  /** Real API login */
  loginApi: (email: string, password: string) => Promise<User>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  /** Set user directly (e.g. after activation) */
  setAuthUser: (user: User, accessToken: string, refreshToken: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "ptba_auth_user";
const TOKEN_KEY = "ptba_access_token";
const REFRESH_KEY = "ptba_refresh_token";

function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as User;
      // Accept both mock and API users
      return parsed.id ? parsed : null;
    }
  } catch {
    // ignore
  }
  return null;
}

function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(getStoredUser);
  const [accessToken, setAccessToken] = useState<string | null>(getStoredToken);

  // Keep React state in sync when api client auto-refreshes the token
  useEffect(() => {
    const interval = setInterval(() => {
      const stored = localStorage.getItem(TOKEN_KEY);
      if (stored && stored !== accessToken) {
        setAccessToken(stored);
      }
      // If tokens were cleared (force logout from api client), sync state
      if (!stored && accessToken) {
        setUser(null);
        setAccessToken(null);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [accessToken]);

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

  const loginApi = useCallback(async (email: string, password: string): Promise<User> => {
    const api = authApi();
    const res = await api.login(email, password);

    const u: User = {
      id: res.user.id,
      name: res.user.name,
      email: res.user.email,
      role: res.user.role as UserRole,
      department: res.user.department,
      partnerId: res.user.partnerId ?? undefined,
    };

    setUser(u);
    setAccessToken(res.accessToken);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    localStorage.setItem(TOKEN_KEY, res.accessToken);
    localStorage.setItem(REFRESH_KEY, res.refreshToken);

    return u;
  }, []);

  const setAuthUser = useCallback((u: User, token: string, refreshToken: string) => {
    setUser(u);
    setAccessToken(token);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(REFRESH_KEY, refreshToken);
  }, []);

  const logout = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    const refresh = localStorage.getItem(REFRESH_KEY);
    if (token && refresh) {
      try {
        const api = authApi();
        await api.logout(refresh, token);
      } catch {
        // ignore logout API errors
      }
    }
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
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
        accessToken,
        login,
        loginApi,
        logout,
        switchRole,
        setAuthUser,
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
