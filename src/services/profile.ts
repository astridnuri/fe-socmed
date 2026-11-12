import { api } from "@/lib/api";
import type { User } from "@/types";

export const updateProfile = (formData: FormData) =>
  api<{ message: string; passwordChanged: boolean; user: User }>("/users/profile", {
    method: "PUT",
    body: formData,
  });