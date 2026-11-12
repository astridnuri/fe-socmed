import { api } from "@/lib/api";
import type { LoginInput, RegisterInput } from "@/lib/schemas";
import type { AuthResponse, User } from "@/types";

export const login = (values: LoginInput) =>
  api<AuthResponse>("/auth/login", { method: "POST", body: values });

// confirmPassword ikut dikirim karena backend juga memvalidasinya
export const register = (values: RegisterInput) =>
  api<AuthResponse>("/auth/register", { method: "POST", body: values });

export const getMe = () => api<{ user: User }>("/auth/me")