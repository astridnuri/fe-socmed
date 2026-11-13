"use client";

import { Heart } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import * as commentService from "@/services/comments";

interface CommentLikeButtonProps {
  postId: number;
  commentId: number;
  initialLiked: boolean;
  initialCount: number;
}

export function CommentLikeButton({
  postId,
  commentId,
  initialLiked,
  initialCount,
}: CommentLikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const pending = useRef(false);

  const onClick = async () => {
    if (pending.current) return;
    pending.current = true;

    const previous = { liked, count };
    setLiked(!previous.liked);
    setCount(Math.max(0, previous.count + (previous.liked ? -1 : 1)));

    try {
      const result = await commentService.toggleCommentLike(postId, commentId);
      setLiked(result.liked);
      setCount(result.likes_count);
    } catch (err) {
      setLiked(previous.liked);
      setCount(previous.count);
      toast.error(
        err instanceof ApiError ? err.message : "Failed processing comment like"
      );
    } finally {
      pending.current = false;
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={liked}
      aria-label={liked ? "Unlike comment" : "Like comment"}
      className={cn(
        "flex items-center gap-1 text-xs transition-colors",
        liked ? "text-rose-600" : "text-slate-500 hover:text-slate-800"
      )}
    >
      <Heart
        className={cn("size-3.5 transition-transform active:scale-90", liked && "fill-rose-600")}
      />
      <span className="tabular-nums">{count}</span>
    </button>
  );
}
