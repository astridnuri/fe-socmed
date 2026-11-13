"use client";

import { Camera } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ApiError, fileUrl } from "@/lib/api";
import { validateImageFile } from "@/lib/file";
import { fieldErrors } from "@/lib/form";
import { profileSchema } from "@/lib/schemas";
import { inputClass, primaryTone, textareaClass } from "@/lib/ui";
import { cn, getInitials } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import * as profileService from "@/services/profile";

const panel = "space-y-5 rounded-xl border border-slate-200 bg-white p-5 sm:p-6";
const EMPTY_PASSWORDS = { oldPassword: "", newPassword: "", confirmPassword: "" };
const MAX_BIO = 300;
const MAX_AVATAR_MB = 2;

function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-slate-700">
        {label}
      </Label>
      {children}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

export function ProfileForm() {
  const router = useRouter();
  const { user, updateUser } = useAuth();

  const [name, setName] = useState(user?.name ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [passwords, setPasswords] = useState(EMPTY_PASSWORDS);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const setPicked = (next: File | null) => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(next);
    setPreview(next ? URL.createObjectURL(next) : null);
  };

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    e.target.value = "";
    if (!picked) return;

    const message = validateImageFile(picked, MAX_AVATAR_MB);
    if (message) {
      setErrors((prev) => ({ ...prev, avatar: message }));
      return;
    }
    setErrors((prev) => {
      const { avatar: _removed, ...rest } = prev;
      return rest;
    });
    setPicked(picked);
  };

  const setPassword =
    (key: keyof typeof EMPTY_PASSWORDS) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setPasswords((p) => ({ ...p, [key]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = profileSchema.safeParse({ name, bio, ...passwords });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }

    const wantsPassword = Boolean(
      passwords.oldPassword || passwords.newPassword || passwords.confirmPassword
    );
    const unchanged =
      parsed.data.name === user.name &&
      parsed.data.bio === (user.bio ?? "") &&
      !file &&
      !wantsPassword;
    if (unchanged) {
      toast.info("No changes to save");
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("name", parsed.data.name);
      formData.append("bio", parsed.data.bio);
      if (file) formData.append("avatar", file);
      if (wantsPassword) {
        formData.append("oldPassword", passwords.oldPassword);
        formData.append("newPassword", passwords.newPassword);
        formData.append("confirmPassword", passwords.confirmPassword);
      }

      const res = await profileService.updateProfile(formData);

      updateUser(res.user); // header ikut berubah seketika
      setName(res.user.name);
      setBio(res.user.bio ?? "");
      setPicked(null);
      setPasswords(EMPTY_PASSWORDS);
      toast.success(
        res.passwordChanged
          ? "Profile and password updated"
          : "Profile updated"
      ); router.push("/"); // kembali ke feed
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.errors ?? { form: err.message });
      } else {
        setErrors({ form: "Error occured, please try again" });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {/* Profil */}
      <section className={panel}>
        <h2 className="text-sm font-semibold text-slate-900">Profil</h2>

        <div className="flex items-center gap-4">
          <Avatar className="size-20">
            <AvatarImage src={preview ?? fileUrl(user.avatar)} alt={user.name} />
            <AvatarFallback className="bg-slate-200 text-xl font-medium text-slate-700">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={onPick}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileRef.current?.click()}
            >
              <Camera className="size-4" />
              {preview ? "Change option" : "Change image"}
            </Button>
            <p className="text-xs text-slate-500">
              JPEG, JPG, PNG, or WEBP, max {MAX_AVATAR_MB} MB
            </p>
            {errors.avatar && <p className="text-sm text-red-600">{errors.avatar}</p>}
          </div>
        </div>

        <Field id="name" label="Name" error={errors.name}>
          <Input
            id="name"
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={!!errors.name}
          />
        </Field>

        <Field id="email" label="Email" hint="Email is used to login and cannot be changed">
          <Input
            id="email"
            className={cn(inputClass, "bg-slate-50 text-slate-500")}
            value={user.email}
            disabled
            readOnly
          />
        </Field>

        <Field id="bio" label="Bio" error={errors.bio}>
          <Textarea
            id="bio"
            className={cn(textareaClass, "min-h-24")}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell a brief description about your role"
            aria-invalid={!!errors.bio}
          />
          <p
            className={cn(
              "text-right text-xs tabular-nums text-slate-400",
              bio.length > MAX_BIO && "text-red-600"
            )}
          >
            {bio.length}/{MAX_BIO}
          </p>
        </Field>
      </section>

      {/* Password */}
      <section className={panel}>
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-slate-900">Ganti password</h2>
          <p className="text-xs text-slate-500">
            Empty all 3 columns if you don't want to change password.
          </p>
        </div>

        {/* autoComplete="new-password" agar browser tidak mengisi otomatis
            password tersimpan, yang akan memicu validasi "semua atau kosong" */}
        <Field id="oldPassword" label="Old password" error={errors.oldPassword}>
          <Input
            id="oldPassword"
            type="password"
            autoComplete="new-password"
            className={inputClass}
            value={passwords.oldPassword}
            onChange={setPassword("oldPassword")}
            aria-invalid={!!errors.oldPassword}
          />
        </Field>

        <Field id="newPassword" label="New password" error={errors.newPassword}>
          <Input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            className={inputClass}
            value={passwords.newPassword}
            onChange={setPassword("newPassword")}
            aria-invalid={!!errors.newPassword}
          />
        </Field>

        <Field
          id="confirmPassword"
          label="Confirm new password"
          error={errors.confirmPassword}
        >
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            className={inputClass}
            value={passwords.confirmPassword}
            onChange={setPassword("confirmPassword")}
            aria-invalid={!!errors.confirmPassword}
          />
        </Field>
      </section>

      {errors.form && <p className="text-sm text-red-600">{errors.form}</p>}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={() => router.push("/")}>
          Cancel
        </Button>
        <Button type="submit" className={primaryTone} disabled={submitting}>
          {submitting ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </form>
  );
}