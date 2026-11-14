"use client";

import { ImagePlus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ApiError, fileUrl } from "@/lib/api";
import { validateImageFile } from "@/lib/file";
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
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);

  const hasImage = Boolean(file || (comment.image && !imageRemoved));
  const cannotBeEmpty = !text.trim() && !hasImage;

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

    const parsed = commentSchema.safeParse({ comment: text });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    if (!parsed.data.comment && !hasImage) {
      setError("Comment without image cannot be empty");
      return;
    }
    const imageChanged = Boolean(file || (comment.image && imageRemoved));
    if (parsed.data.comment === (comment.comment ?? "") && !imageChanged) {
      onClose(); // tidak ada perubahan
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("comment", parsed.data.comment);
      if (file) formData.append("image", file);
      if (imageRemoved) formData.append("removeImage", "true");

      const res = await commentService.updateComment(
        postId,
        comment.id,
        formData
      );
      onUpdated(res.comment);
      toast.success("Comment updated");
      onClose();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? (err.errors?.comment ?? err.errors?.image ?? err.message)
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

      {(preview || (comment.image && !imageRemoved)) && (
        <div className="relative w-fit">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview ?? fileUrl(comment.image)}
            alt="Comment attachment"
            className="max-h-40 w-auto max-w-full rounded-lg border border-slate-200"
          />
          <button
            type="button"
            onClick={() => {
              updateFile(null);
              if (comment.image) setImageRemoved(true);
            }}
            aria-label="Remove image"
            disabled={submitting}
            className="absolute right-1.5 top-1.5 rounded-full bg-slate-900/70 p-1 text-white transition-colors hover:bg-slate-900"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

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
          size="sm"
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