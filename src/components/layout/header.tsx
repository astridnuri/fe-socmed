import Link from "next/link";
import { UserMenu } from "@/components/layout/user-menu";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-2xl items-center justify-between px-4">
        <Link
          href="/"
          className="text-base font-semibold tracking-tight text-slate-900"
        >
          ConnectSpace
        </Link>
        <UserMenu />
      </div>
    </header>
  );
}