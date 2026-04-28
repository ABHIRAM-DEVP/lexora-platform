"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { apiFetch, clearTokens, setTokens } from "@/lib/api";
import { API_BASE } from "@/lib/config";
import { decodeJwtPayload, getRoleFromToken } from "@/lib/jwt";
import { useRouter } from "next/navigation";

const UKEY = "lexora_username";
const EKEY = "lexora_email";

export type AuthUser = {
  id: string;
  username: string;
  email: string | null;
  role: string | null;
};

type AuthCtx = {
  user: AuthUser | null;
  loading: boolean;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => void;
};

const AuthCtx = createContext<AuthCtx | null>(null);

function readStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("lexora_access_token");
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  if (!payload?.sub) return null;
  const role = getRoleFromToken(token);
  const username = localStorage.getItem(UKEY) ?? "User";
  const email = localStorage.getItem(EKEY);
  return {
    id: payload.sub,
    username,
    email,
    role,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const hydrate = useCallback(() => {
    setUser(readStoredUser());
  }, []);

  useEffect(() => {
    hydrate();
    setLoading(false);
  }, [hydrate]);

  const login = useCallback(async (username: string, password: string) => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = (await res.json()) as {
      accessToken?: string;
      refreshToken?: string;
      message?: string;
    };
    if (!res.ok || !data.accessToken) {
      throw new Error(data.message ?? "Sign-in failed");
    }
    setTokens(data.accessToken, data.refreshToken ?? null);
    localStorage.setItem(UKEY, username);
    hydrate();
  }, [hydrate]);

  const logout = useCallback(async () => {
    const email = localStorage.getItem(EKEY);
    if (email) {
      try {
        await apiFetch("/api/auth/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
      } catch {
        /* ignore */
      }
    }
    clearTokens();
    localStorage.removeItem(UKEY);
    localStorage.removeItem("lexora_last_workspace");
    setUser(null);
    router.push("/login");
  }, [router]);

  const isAdmin = useMemo(() => user?.role === "ADMIN", [user?.role]);

  return (
    <AuthCtx.Provider
      value={{
        user,
        loading,
        isAdmin,
        login,
        logout,
        refreshProfile: hydrate,
      }}
    >
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth needs AuthProvider");
  return ctx;
}

export function storeEmailAfterSignup(email: string) {
  localStorage.setItem(EKEY, email);
}
