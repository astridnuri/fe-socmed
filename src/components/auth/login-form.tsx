"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RegisterDialog } from "@/components/auth/register-dialog"
import { ApiError } from "@/lib/api";
import { fieldErrors } from "@/lib/form";
import { loginSchema } from "@/lib/schemas";
import { useAuth } from "@/providers/auth-provider";
import * as authService from "@/services/auth";
import { inputClass, primaryButtonClass } from "@/lib/ui";

export function LoginForm({ reason }: { reason?: string }) {
  const router = useRouter();
  const { signIn } = useAuth();

  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Dilempar dari halaman terproteksi -> tampilkan peringatan
  useEffect(() => {
    if (reason === "unauthorized") {
      toast.warning("Please login first", { id: "unauthorized" });
      window.history.replaceState(null, "", "/login"); // bersihkan URL
    }
  }, [reason]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    const parsed = loginSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setSubmitting(true);

    try {
      const res = await authService.login(parsed.data);
      signIn(res);
      router.replace("/");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.errors) setErrors(err.errors);
        else setFormError(err.message); // error message
      } else {
        setFormError("Error occured, please try again");
      }
      setSubmitting(false);
    }
  };
  return (
  <div className="space-y-6">
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div className="space-y-2">
        <Label htmlFor="email" className="text-slate-700">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          // autoComplete="email"
          className={inputClass}
          value={values.email}
          onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
          aria-invalid={!!errors.email}
        />
        {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-slate-700">
          Password
        </Label>
        <Input
          id="password"
          type="password"
          // autoComplete="current-password"
          className={inputClass}
          value={values.password}
          onChange={(e) => setValues((v) => ({ ...v, password: e.target.value }))}
          aria-invalid={!!errors.password}
        />
        {errors.password && (
          <p className="text-sm text-red-600">{errors.password}</p>
        )}
      </div>

      {formError && <p className="text-sm text-red-600">{formError}</p>}

      <Button type="submit" className={primaryButtonClass} disabled={submitting}>
        {submitting ? "Processing..." : "Sign In"}
      </Button>
    </form>

    <p className="border-t border-slate-100 pt-6 text-center text-sm text-slate-500">
      Don't have account? <RegisterDialog />
    </p>
  </div>
);
}