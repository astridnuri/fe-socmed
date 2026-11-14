import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Invalid email format"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password min. 6 characters"),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name min. 2 characters")
      .max(100, "Name max. 100 characters"),
    email: z
      .string()
      .trim()
      .min(1, "Email is required")
      .email("Invalid email format"),
    password: z
      .string()
      .min(6, "Password min. 6 characters")
      .max(72, "Password max. 72 characters"),
    confirmPassword: z.string().min(1, "Password confirmation is required"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Password confirmation doesn't match",
    path: ["confirmPassword"],
  });

  export const postSchema = z.object({
  content: z.string().trim().max(500, "Text max. 500 characters"),
  location: z.string().trim().max(255, "Location max. 255 characters").optional(),
});

export const profileSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name min. 2 characters")
      .max(100, "Name max. 100 characters"),
    bio: z.string().trim().max(300, "Bio max. 300 characters"),
    oldPassword: z.string(),
    newPassword: z.string(),
    confirmPassword: z.string(),
  })
  .superRefine((d, ctx) => {
    const wantsPassword = d.oldPassword || d.newPassword || d.confirmPassword;
    if (!wantsPassword) return; // semua kosong = tidak ganti password

    const required = "Required if you want to change password";
    const fail = (path: string, message: string) =>
      ctx.addIssue({ code: "custom", path: [path], message });

    if (!d.oldPassword) fail("oldPassword", required);

    if (!d.newPassword) fail("newPassword", required);
    else if (d.newPassword.length < 6) fail("newPassword", "New password min. 6 characters");
    else if (d.newPassword.length > 72) fail("newPassword", "New password max. 72 characters");
    else if (d.newPassword === d.oldPassword)
      fail("newPassword", "New and old password cannot be the same");

    if (!d.confirmPassword) fail("confirmPassword", required);
    else if (d.confirmPassword !== d.newPassword)
      fail("confirmPassword", "Password confirmation doesn't match");
  });

  export const commentSchema = z.object({
  comment: z.string().trim().max(300, "Comment max. 300 characters"),
});

export type CommentInput = z.infer<typeof commentSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type PostInput = z.infer<typeof postSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;