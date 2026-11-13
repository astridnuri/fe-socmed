import { Header } from "@/components/layout/header";
import { AuthGuard } from "@/components/auth/auth-guard";

export default function AppLayout({ children }: { children: React.ReactNode }) {

  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen bg-slate-200">
        <Header />
        <main className="mx-auto w-full max-w-2xl px-4 py-6">{children}</main>
      </div>
    </AuthGuard>
  );
}