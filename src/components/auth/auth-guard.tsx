"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export function AuthGuard({ children, requireAuth = true }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (requireAuth && !user) {
      router.replace("/login?reason=unauthorized");
    } else if (!requireAuth && user) {
      router.replace("/");
    }
  }, [loading, user, requireAuth, router]);

  // Tampilkan loading spinner yang rapi saat mengecek token di localStorage
  if (loading || (requireAuth && !user) || (!requireAuth && user)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-200">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-800" />
        <p className="mt-3 text-sm font-medium text-slate-600">Loading session...</p>
      </div>
    );
  }

  return <>{children}</>;
}