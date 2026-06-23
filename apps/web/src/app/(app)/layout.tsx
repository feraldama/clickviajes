"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";

/** Layout protegido: exige sesión; si no hay, redirige a /login. */
export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="grid min-h-dvh place-items-center bg-background">
        <span
          className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
          aria-label="Cargando"
        />
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
