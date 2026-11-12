"use client";

import { Heart } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import * as postService from "@/services/posts";

interface LikeButtonProps {
  postId: number;
  initialLiked: boolean;
  initialCount: number;
}

export function LikeButton({ postId, initialLiked, initialCount }: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const pending = useRef(false); // mencegah klik beruntun sebelum server menjawab

  const onClick = async () => {
    if (pending.current) return;
    pending.current = true;

    const previous = { liked, count };

    // 1. Optimistic: ubah tampilan lebih dulu
    setLiked(!previous.liked);
    setCount(previous.count + (previous.liked ? -1 : 1));

    try {
      // 2. Konfirmasi ke server, lalu samakan dengan angka resmi
      const res = await postService.toggleLike(postId);
      setLiked(res.liked);
      setCount(res.likes_count);
    } catch (err) {
      // 3. Gagal: kembalikan ke keadaan semula
      setLiked(previous.liked);
      setCount(previous.count);
      toast.error(err instanceof ApiError ? err.message : "Failed processing like");
    } finally {
      pending.current = false;
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={liked}
      aria-label={liked ? "Cancel like" : "Like"}
      className={cn(
        "flex items-center gap-1.5 text-sm transition-colors",
        liked ? "text-rose-600" : "text-slate-500 hover:text-slate-800"
      )}
    >
      <Heart
        className={cn(
          "size-4.5 transition-transform active:scale-90",
          liked && "fill-rose-600"
        )}
      />
      <span className="tabular-nums">{count}</span>
    </button>
  );
}