import { api } from "@/lib/api";
import type { PostComment } from "@/types";

export const getComments = (postId: number) =>
  api<{ comments: PostComment[] }>(`/posts/${postId}/comments`);

export const createComment = (postId: number, formData: FormData) =>
  api<{ message: string; comment: PostComment; comments_count: number }>(
    `/posts/${postId}/comments`,
    { method: "POST", body: formData }
  );

export const updateComment = (
  postId: number,
  commentId: number,
  formData: FormData
) =>
  api<{ message: string; comment: PostComment }>(
    `/posts/${postId}/comments/${commentId}`,
    { method: "PUT", body: formData }
  );

export const deleteComment = (postId: number, commentId: number) =>
  api<{ message: string; comments_count: number }>(
    `/posts/${postId}/comments/${commentId}`,
    { method: "DELETE" }
  );

export const toggleCommentLike = (postId: number, commentId: number) =>
  api<{ liked: boolean; likes_count: number }>(
    `/posts/${postId}/comments/${commentId}/like`,
    { method: "POST" }
  );