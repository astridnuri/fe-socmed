import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form"

export const metadata: Metadata = { title: "Masuk | ConnectSpace" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;

  return (
    <div className="w-full max-w-sm rounded-2xl border border-slate-300 bg-white p-8 shadow-[0_12px_40px_-8px_rgba(15,23,42,0.22)] sm:p-10">
      <div className="mb-8 space-y-2 text-center">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">ConnectSpace</h1>
        <p className="text-sm text-slate-500">
          Sign in to join conversation
        </p>
      </div>
      <LoginForm reason={reason} />
    </div>
  );
}