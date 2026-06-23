"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { AuthResponse, LoginInput, UserDTO } from "@clickviajes/shared";
import { apiFetch, tokenStore } from "./api";

interface AuthContextValue {
  user: UserDTO | null;
  loading: boolean;
  login: (input: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDTO | null>(null);
  const [loading, setLoading] = useState(true);

  // Al cargar, si hay token, recupera el usuario actual.
  useEffect(() => {
    let active = true;
    async function init() {
      if (!tokenStore.access && !tokenStore.refresh) {
        setLoading(false);
        return;
      }
      try {
        const me = await apiFetch<UserDTO>("/auth/me");
        if (active) setUser(me);
      } catch {
        tokenStore.clear();
      } finally {
        if (active) setLoading(false);
      }
    }
    void init();
    return () => {
      active = false;
    };
  }, []);

  async function login(input: LoginInput) {
    const res = await apiFetch<AuthResponse>("/auth/login", {
      method: "POST",
      body: input,
      auth: false,
    });
    tokenStore.set(res.accessToken, res.refreshToken);
    setUser(res.user);
  }

  async function logout() {
    try {
      await apiFetch("/auth/logout", {
        method: "POST",
        body: { refreshToken: tokenStore.refresh },
        auth: false,
      });
    } catch {
      // ignora errores de red al cerrar sesión
    }
    tokenStore.clear();
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
