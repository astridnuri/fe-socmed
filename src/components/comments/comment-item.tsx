"use client";

import { Pencil } from "lucide-react";
import { useState, type ReactNode } from "react";
import { CommentDeleteButton } from "@/components/comments/comment-delete-button";
import { CommentEditForm } from "@/components/comments/comment-edit-form";
import { CommentForm } from "@/components/comments/comment-form";
import { CommentLikeButton } from "@/components/comments/comment-like-button";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { fileUrl } from "@/lib/api";
import { isEdited, timeAgo } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import type { PostComment } from "@/types";

interface CommentItemProps {
  comment: PostComment;
  replies?: PostComment[];
  children?: ReactNode;
  postId: number;
  onCreated: (comment: PostComment, commentsCount: number) => void;
  onDeleted: (commentId: number, commentsCount?: number) => void;
  onUpdated: (comment: PostComment) => void;
}

export function CommentItem({
  comment,
  replies = [],
  children,
  postId,
  onCreated,
  onDeleted,
  onUpdated,
}: CommentItemProps) {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [replying, setReplying] = useState(false);

  // Hanya penulis yang melihat tombol edit dan hapus.
  // Yang menegakkan aturan tetap backend (403).
  const isOwner = user?.id === comment.user.id;

  return (
    <div className="space-y-3">
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
                  hasReplies={replies.length > 0}
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

          <div className="mt-1 flex items-center gap-3">
            <CommentLikeButton
              postId={postId}
              commentId={comment.id}
              initialLiked={comment.liked_by_me}
              initialCount={comment.likes_count}
            />
            {!editing && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="-ml-2 h-7 text-xs text-slate-500"
                aria-expanded={replying}
                onClick={() => setReplying(true)}
              >
                Reply
              </Button>
            )}
          </div>
        </div>
      </div>

      {(replies.length > 0 || replying) && (
        <div className="ml-4 space-y-3 border-l border-slate-200 pl-4">
          {children}
          {replying && (
            <CommentForm
              postId={postId}
              parentCommentId={comment.id}
              replyToName={comment.user.name}
              onCreated={(created, count) => {
                onCreated(created, count);
                setReplying(false);
              }}
              onCancel={() => setReplying(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}
