"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api";
import { fieldErrors } from "@/lib/form";
import { registerSchema } from "@/lib/schemas";
import { useAuth } from "@/providers/auth-provider";
import * as authService from "@/services/auth";
import { inputClass, primaryButtonClass } from "@/lib/ui";

const EMPTY = { name: "", email: "", password: "", confirmPassword: "" };

export function RegisterDialog() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [open, setOpen] = useState(false);
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setValues(EMPTY);
      setErrors({});
    }
  };

  const set = (key: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = registerSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setSubmitting(true);

    try {
      const res = await authService.register(parsed.data);
      signIn(res); // backend sudah mengirim token -> langsung login (auto-login)
      toast.success("Account created");
      setOpen(false);
      router.replace("/");
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        setErrors(err.errors); // 409 -> { email: "Email already taken" }
      } else {
        setErrors({
          form: err instanceof ApiError ? err.message : "Error occured, please try again",
        });
      }
      setSubmitting(false);
    }
  };

  const fields: {
    key: keyof typeof EMPTY;
    label: string;
    type: string;
    autoComplete: string;
  }[] = [
    { key: "name", label: "Full name", type: "text", autoComplete: "name" },
    { key: "email", label: "Email", type: "email", autoComplete: "email" },
    { key: "password", label: "Password", type: "password", autoComplete: "new-password" },
    {
      key: "confirmPassword",
      label: "Confirm password",
      type: "password",
      autoComplete: "new-password",
    },
  ];

  return (
    <>
      <Button
        type="button"
        variant="link"
        className="h-auto p-0 align-baseline font-medium text-slate-900"
        onClick={() => setOpen(true)}
      >
        Register
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create account</DialogTitle>
            <DialogDescription>
              Enter your data to join. You will be logged in after registration.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            {fields.map((f) => (
              <div key={f.key} className="space-y-2">
                <Label htmlFor={`reg-${f.key}`} className="text-slate-700">{f.label}</Label>
                <Input
                  id={`reg-${f.key}`}
                  type={f.type}
                  autoComplete={f.autoComplete}
                  value={values[f.key]}
                  onChange={set(f.key)}
                  aria-invalid={!!errors[f.key]}
                  className={inputClass}
                />
                {errors[f.key] && (
                  <p className="text-sm text-destructive">{errors[f.key]}</p>
                )}
              </div>
            ))}

            {errors.form && <p className="text-sm text-red-600">{errors.form}</p>}

            <Button type="submit" className={primaryButtonClass} disabled={submitting}>
              {submitting ? "Processing..." : "Register"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}