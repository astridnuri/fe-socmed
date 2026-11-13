"use client";

import { ImagePlus, X } from "lucide-react";
import { useRef, useState } from "react";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api";
import { validateImageFile } from "@/lib/file";
import { commentSchema } from "@/lib/schemas";
import { primaryTone, textareaClass } from "@/lib/ui";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import * as commentService from "@/services/comments";
import type { PostComment } from "@/types";

const MAX_LENGTH = 300;

interface CommentFormProps {
  postId: number;
  parentCommentId?: number;
  replyToName?: string;
  onCancel?: () => void;
  onCreated: (comment: PostComment, commentsCount: number) => void;
}

export function CommentForm({
  postId,
  parentCommentId,
  replyToName,
  onCancel,
  onCreated,
}: CommentFormProps) {
  const { user } = useAuth();

  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const setPicked = (next: File | null) => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(next);
    setPreview(next ? URL.createObjectURL(next) : null);
  };

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    e.target.value = "";
    if (!picked) return;

    const message = validateImageFile(picked);
    if (message) {
      setError(message);
      return;
    }
    setError("");
    setPicked(picked);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const parsed = commentSchema.safeParse({ comment: text });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    if (!parsed.data.comment && !file) {
      setError("Write comment or send image");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      const formData = new FormData();
      if (parsed.data.comment) formData.append("comment", parsed.data.comment);
      if (parentCommentId !== undefined) {
        formData.append("parent_comment_id", String(parentCommentId));
      }
      if (file) formData.append("image", file);

      const res = await commentService.createComment(postId, formData);
      onCreated(res.comment, res.comments_count);

      setText("");
      setPicked(null);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? (err.errors?.comment ?? err.errors?.image ?? err.message)
          : "Error occured, please try again"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const onCancelForm = () => {
    setText("");
    setError("");
    setPicked(null);
    onCancel?.();
  };

  // Ctrl+Enter / Cmd+Enter untuk mengirim
  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      e.currentTarget.form?.requestSubmit();
    }
  };

  const empty = !text.trim() && !file;

  return (
    <form onSubmit={onSubmit} className="flex gap-3" noValidate>
      <UserAvatar
        name={user.name}
        avatar={user.avatar}
        className="size-8 shrink-0 text-xs"
      />

      <div className="min-w-0 flex-1 space-y-2">
        {replyToName && (
          <p className="text-xs text-slate-500">Replying to {replyToName}</p>
        )}
        <Textarea
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={parentCommentId ? "Write a reply..." : "Write your comment..."}
          className={cn(textareaClass, "min-h-16 text-sm")}
          aria-invalid={text.length > MAX_LENGTH}
        />

        {preview && (
          <div className="relative w-fit">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Image preview"
              className="max-h-40 w-auto max-w-full rounded-lg border border-slate-200"
            />
            <button
              type="button"
              onClick={() => setPicked(null)}
              aria-label="Delete image"
              className="absolute right-1.5 top-1.5 rounded-full bg-slate-900/70 p-1 text-white transition-colors hover:bg-slate-900"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex items-center justify-between">
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg, image/jpg, image/png,image/webp"
              className="hidden"
              onChange={onPick}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-slate-600"
              onClick={() => fileRef.current?.click()}
            >
              <ImagePlus className="size-4" />
              Image
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={cn(
                "text-xs tabular-nums text-slate-400",
                text.length > MAX_LENGTH && "text-red-600"
              )}
            >
              {text.length}/{MAX_LENGTH}
            </span>
            {onCancel && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-slate-600"
                onClick={onCancelForm}
                disabled={submitting}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              size="sm"
              className={primaryTone}
              disabled={submitting || empty || text.length > MAX_LENGTH}
            >
              {submitting ? "Sending..." : "Send"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}