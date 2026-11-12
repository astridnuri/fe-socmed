"use client";

import { Pencil } from "lucide-react";
import { useState } from "react";
import { CommentEditForm } from "@/components/comments/comment-edit-form";
import { CommentDeleteButton } from "./comment-delete-button";
import { UserAvatar } from "@/components/shared/user-avatar";
import { fileUrl } from "@/lib/api";
import { isEdited, timeAgo } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import type { PostComment } from "@/types";

interface CommentItemProps {
  comment: PostComment;
  postId: number;
  onDeleted: (commentId: number, commentsCount?: number) => void;
  onUpdated: (comment: PostComment) => void;
}

export function CommentItem({
  comment,
  postId,
  onDeleted,
  onUpdated,
}: CommentItemProps) {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);

  // Hanya penulis yang melihat tombol edit dan hapus.
  // Yang menegakkan aturan tetap backend (403).
  const isOwner = user?.id === comment.user.id;

  return (
    <div className="flex gap-3">
      <UserAvatar
        name={comment.user.name}
        avatar={comment.user.avatar}
        className="size-8 shrink-0 text-xs"
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-baseline gap-2">
            <span className="truncate text-sm font-semibold text-slate-900">
              {comment.user.name}
            </span>
            <time
              dateTime={comment.created_at}
              className="shrink-0 text-xs text-slate-500"
            >
              {timeAgo(comment.created_at)}
            </time>
            {isEdited(comment.created_at, comment.updated_at) && (
              <span className="shrink-0 text-xs text-slate-400">· edited</span>
            )}
          </div>

          {isOwner && !editing && (
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => setEditing(true)}
                aria-label="Edit comment"
                className="flex size-7 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                <Pencil className="size-4" />
              </button>
              <CommentDeleteButton
                postId={postId}
                commentId={comment.id}
                onDeleted={onDeleted}
              />
            </div>
          )}
        </div>

        {editing ? (
          <CommentEditForm
            postId={postId}
            comment={comment}
            onClose={() => setEditing(false)}
            onUpdated={onUpdated}
          />
        ) : (
          comment.comment && (
            <p className="mt-0.5 whitespace-pre-wrap wrap-break-word text-sm leading-relaxed text-slate-800">
              {comment.comment}
            </p>
          )
        )}

        {comment.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={fileUrl(comment.image)}
            alt="Comment image"
            loading="lazy"
            className="mt-2 max-h-64 w-auto max-w-full rounded-lg border border-slate-200"
          />
        )}
      </div>
    </div>
  );
}