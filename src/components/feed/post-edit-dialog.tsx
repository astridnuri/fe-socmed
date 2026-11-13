"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ApiError, fileUrl } from "@/lib/api";
import { postSchema } from "@/lib/schemas";
import { primaryTone, textareaClass } from "@/lib/ui";
import { cn } from "@/lib/utils";
import * as postService from "@/services/posts";
import type { Post } from "@/types";

const MAX_LENGTH = 500;

interface PostEditDialogProps {
  post: Post;
  onClose: () => void;
  onUpdated: (post: Post) => void;
}

export function PostEditDialog({ post, onClose, onUpdated }: PostEditDialogProps) {
  const [content, setContent] = useState(post.content ?? "");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const cannotBeEmpty = !content.trim() && !post.image;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const parsed = postSchema.safeParse({ content });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    if (!parsed.data.content && !post.image) {
      setError("Post without image cannot be empty");
      return;
    }
    if (parsed.data.content === (post.content ?? "")) {
      onClose(); // tidak ada perubahan
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      const res = await postService.updatePost(post.id, parsed.data.content);
      onUpdated(res.post);
      toast.success("Post updated");
      onClose();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? (err.errors?.content ?? err.message)
          : "Error occured, please try again"
      );
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next && !submitting) onClose();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit post</DialogTitle>
          <DialogDescription className="sr-only">
            Edit your post text
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={textareaClass}
            aria-invalid={content.length > MAX_LENGTH}
            autoFocus
          />

          {post.image && (
            <div className="space-y-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={fileUrl(post.image)}
                alt="Post attachment"
                className="max-h-40 w-auto max-w-full rounded-lg border border-slate-200"
              />
              <p className="text-xs text-slate-500">
                Only text can be edited. Image remains.
              </p>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <span
              className={cn(
                "mr-auto text-xs tabular-nums text-slate-400",
                content.length > MAX_LENGTH && "text-red-600"
              )}
            >
              {content.length}/{MAX_LENGTH}
            </span>
            <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              className={primaryTone}
              disabled={submitting || cannotBeEmpty}
            >
              {submitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}