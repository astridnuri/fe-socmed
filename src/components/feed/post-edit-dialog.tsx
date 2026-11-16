"use client";

import { ImagePlus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
import { validateImageFile } from "@/lib/file";
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
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);

  const hasImage = Boolean(file || (post.image && !imageRemoved));
  const cannotBeEmpty = !content.trim() && !hasImage;

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  const updateFile = (nextFile: File | null) => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = nextFile ? URL.createObjectURL(nextFile) : null;
    setPreview(previewUrlRef.current);
    setFile(nextFile);
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
    updateFile(picked);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const parsed = postSchema.safeParse({ content });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    if (!parsed.data.content && !hasImage) {
      setError("Post without image cannot be empty");
      return;
    }
    const imageChanged = Boolean(file || (post.image && imageRemoved));
    if (parsed.data.content === (post.content ?? "") && !imageChanged) {
      onClose(); // tdk ada perubahan
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("content", parsed.data.content);
      if (file) formData.append("image", file);
      if (imageRemoved) formData.append("removeImage", "true");

      const res = await postService.updatePost(post.id, formData);
      onUpdated(res.post);
      toast.success("Post updated");
      onClose();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? (err.errors?.content ?? err.errors?.image ?? err.message)
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

          {(preview || (post.image && !imageRemoved)) && (
            <div className="relative w-fit">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview ?? fileUrl(post.image)}
                alt="Post attachment"
                className="max-h-72 w-auto max-w-full rounded-lg border border-slate-200"
              />
              <button
                type="button"
                disabled={submitting}
                onClick={() => {
                  updateFile(null);
                  if (post.image) setImageRemoved(true);
                }}
                aria-label="Remove image"
                className="absolute right-2 top-2 rounded-full bg-slate-900/70 p-1 text-white transition-colors hover:bg-slate-900"
              >
                <X className="size-4" />
              </button>
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
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg, image/jpg, image/png,image/webp"
              className="hidden"
              onChange={onPick}
            />
            {/* <Button
              type="button"
              variant="ghost"
              className="text-slate-600"
              onClick={() => fileRef.current?.click()}
              disabled={submitting}
            >
              <ImagePlus className="size-4" />
              {hasImage ? "Change image" : "Image"}
            </Button> */}
            {!hasImage && (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-slate-600"
                  onClick={() => fileRef.current?.click()}
                  disabled={submitting}
                >
                  <ImagePlus className="size-4" />
                  Image
                </Button>
            )}
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