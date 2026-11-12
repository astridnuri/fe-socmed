import { api } from "@/lib/api";
import type { Post, PostsResponse } from "@/types";


export const getPosts = (cursor?: number | null, limit = 10) => {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set("cursor", String(cursor));
  return api<PostsResponse>(`/posts?${params.toString()}`);
};

export const createPost = (formData: FormData) =>
  api<{ message: string; post: Post }>("/posts", {
    method: "POST",
    body: formData,
  });

  export const updatePost = (postId: number, content: string) =>
  api<{ message: string; post: Post }>(`/posts/${postId}`, {
    method: "PUT",
    body: { content },
  });

  export const toggleLike = (postId: number) =>
  api<{ liked: boolean; likes_count: number }>(`/posts/${postId}/like`, {
    method: "POST",
  });

  export const deletePost = (postId: number) =>
  api<{ message: string }>(`/posts/${postId}`, { method: "DELETE" });