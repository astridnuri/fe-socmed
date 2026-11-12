"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { useAuth } from "@/providers/auth-provider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login?reason=unauthorized");
  }, [loading, user, router]);

  // Selama sesi dicek atau sedang dialihkan, jangan tampilkan konten apa pun
  if (loading || !user) return <div className="min-h-screen bg-slate-50" />;

  return (
    <div className="min-h-screen bg-slate-200">
      <Header />
      <main className="mx-auto w-full max-w-2xl px-4 py-6">{children}</main>
    </div>
  );
}