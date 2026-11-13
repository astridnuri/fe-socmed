"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api";
import { commentSchema } from "@/lib/schemas";
import { primaryTone, textareaClass } from "@/lib/ui";
import { cn } from "@/lib/utils";
import * as commentService from "@/services/comments";
import type { PostComment } from "@/types";

const MAX_LENGTH = 300;

interface CommentEditFormProps {
  postId: number;
  comment: PostComment;
  onClose: () => void;
  onUpdated: (comment: PostComment) => void;
}

export function CommentEditForm({
  postId,
  comment,
  onClose,
  onUpdated,
}: CommentEditFormProps) {
  const [text, setText] = useState(comment.comment ?? "");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const cannotBeEmpty = !text.trim() && !comment.image;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const parsed = commentSchema.safeParse({ comment: text });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    if (!parsed.data.comment && !comment.image) {
      setError("Comment without image cannot be empty");
      return;
    }
    if (parsed.data.comment === (comment.comment ?? "")) {
      onClose(); // tidak ada perubahan
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      const res = await commentService.updateComment(
        postId,
        comment.id,
        parsed.data.comment
      );
      onUpdated(res.comment);
      toast.success("Comment updated");
      onClose();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? (err.errors?.comment ?? err.message)
          : "Error occured, please try again"
      );
      setSubmitting(false);
    }
  };

  // Ctrl+Enter menyimpan, Escape membatalkan
  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      e.currentTarget.form?.requestSubmit();
    } else if (e.key === "Escape" && !submitting) {
      onClose();
    }
  };

  return (
    <form onSubmit={onSubmit} className="mt-1 space-y-2" noValidate>
      <Textarea
        autoFocus
        rows={2}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        // letakkan kursor di akhir teks saat dibuka
        onFocus={(e) =>
          e.currentTarget.setSelectionRange(text.length, text.length)
        }
        className={cn(textareaClass, "min-h-16 text-sm")}
        aria-invalid={text.length > MAX_LENGTH}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center justify-end gap-2">
        <span
          className={cn(
            "mr-auto text-xs tabular-nums text-slate-400",
            text.length > MAX_LENGTH && "text-red-600"
          )}
        >
          {text.length}/{MAX_LENGTH}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClose}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          className={primaryTone}
          disabled={submitting || cannotBeEmpty}
        >
          {submitting ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
}