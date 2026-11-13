import { AuthGuard } from "@/components/auth/auth-guard";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requireAuth={false}>
      <main className="flex min-h-screen items-center justify-center bg-slate-200 px-4 py-10">
        {children}
      </main>
    </AuthGuard>
  );
}