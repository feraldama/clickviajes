"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

/** Raíz: redirige según haya sesión o no. */
export default function IndexPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(user ? "/dashboard" : "/login");
  }, [user, loading, router]);

  return (
    <div className="grid min-h-dvh place-items-center bg-background">
      <span
        className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
        aria-label="Cargando"
      />
    </div>
  );
}
