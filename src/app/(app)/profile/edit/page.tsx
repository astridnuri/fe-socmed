import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProfileForm } from "@/components/profile/profile-form";

export const metadata: Metadata = { title: "Edit Profil" };

export default function EditProfilePage() {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-slate-500 transition-colors hover:text-slate-800"
        >
          <ArrowLeft className="size-4" />
          Back
        </Link>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">
          Edit Profile
        </h1>
      </div>
      <ProfileForm />
    </div>
  );
}