"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace("/");
  }, [loading, user, router]);

  // Jangan tampilkan form login sebelum status sesi jelas
  if (loading || user) return null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-200 px-4 py-10">
      {children}
    </main>
  );
}