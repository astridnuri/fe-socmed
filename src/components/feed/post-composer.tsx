"use client";

import { ImagePlus, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { cn, getInitials } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import * as postService from "@/services/posts";
import type { Post } from "@/types";

const MAX_LENGTH = 500;

export function PostComposer({ onCreated }: { onCreated: (post: Post) => void }) {
  const { user } = useAuth();

  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  // Satu pintu untuk mengganti/menghapus gambar, sekaligus melepas URL pratinjau lama
  const setPicked = (next: File | null) => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(next);
    setPreview(next ? URL.createObjectURL(next) : null);
  };

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    e.target.value = ""; // supaya memilih file yang sama dua kali tetap terdeteksi
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

    const parsed = postSchema.safeParse({ content });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    if (!parsed.data.content && !file) {
      setError("Write something or send image");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      const formData = new FormData();
      if (parsed.data.content) formData.append("content", parsed.data.content);
      if (file) formData.append("image", file);

      const res = await postService.createPost(formData);
      onCreated(res.post);
      toast.success("Post shared");

      // Berhasil: kosongkan draf dan tutup
      setContent("");
      setPicked(null);
      setOpen(false);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? (err.errors?.content ?? err.errors?.image ?? err.message)
          : "Error occured, please try again"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const avatar = (
    <Avatar className="size-10 shrink-0">
      <AvatarImage src={fileUrl(user.avatar)} alt={user.name} />
      <AvatarFallback className="bg-slate-200 text-sm font-medium text-slate-700">
        {getInitials(user.name)}
      </AvatarFallback>
    </Avatar>
  );

  const empty = !content.trim() && !file;

  return (
    <>
      {/* Bar pemicu di atas feed */}
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 sm:px-5">
        {avatar}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="min-w-0 flex-1 truncate rounded-full bg-slate-50 px-4 py-2.5 text-left text-sm text-slate-500 transition-colors hover:bg-slate-100"
        >
          Share information to fellow ConnectSpacers...
        </button>
        <Button type="button" className={primaryTone} onClick={() => setOpen(true)}>
          Post
        </Button>
      </div>

      {/* Draf tidak dihapus saat dialog ditutup, hanya setelah berhasil diposting */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New post</DialogTitle>
            <DialogDescription className="sr-only">
              Write text or share image to your fellows
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div className="flex gap-3">
              {avatar}
              <div className="min-w-0 flex-1 space-y-2">
                <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Share information or news to fellow ConnectSpacers..."
                  className={textareaClass}
                  aria-invalid={content.length > MAX_LENGTH}
                />
              </div>
            </div>

            {preview && (
              <div className="relative w-fit">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt="Image preview"
                  className="max-h-72 w-auto max-w-full rounded-lg border border-slate-200"
                />
                <button
                  type="button"
                  onClick={() => setPicked(null)}
                  aria-label="Delete image"
                  className="absolute right-2 top-2 rounded-full bg-slate-900/70 p-1 text-white transition-colors hover:bg-slate-900"
                >
                  <X className="size-4" />
                </button>
              </div>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={onPick}
                />
                <Button
                  type="button"
                  variant="ghost"
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
                    content.length > MAX_LENGTH && "text-red-600"
                  )}
                >
                  {content.length}/{MAX_LENGTH}
                </span>
                <Button
                  type="submit"
                  className={primaryTone}
                  disabled={submitting || empty}
                >
                  {submitting ? "Posting..." : "Post"}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}