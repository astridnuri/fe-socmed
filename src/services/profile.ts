import { api } from "@/lib/api";
import type { PublicProfile, User } from "@/types";

export const getPublicProfile = (userId: number) =>
  api<{ user: PublicProfile }>(`/users/${userId}`);

export const updateProfile = (formData: FormData) =>
  api<{ message: string; passwordChanged: boolean; user: User }>("/users/profile", {
    method: "PUT",
    body: formData,
  });