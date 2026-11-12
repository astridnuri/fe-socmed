"use client";

import { useEffect, useState } from "react";
import { CommentForm } from "@/components/comments/comment-form";
import { CommentItem } from "@/components/comments/comment-item";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api";
import * as commentService from "@/services/comments";
import type { PostComment } from "@/types";

interface CommentSectionProps {
  postId: number;
  onCountChange: (count: number) => void; // harus fungsi yang stabil (setState)
}

export function CommentSection({ postId, onCountChange }: CommentSectionProps) {
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    commentService
      .getComments(postId)
      .then((res) => {
        if (cancelled) return;
        setComments(res.comments);
        onCountChange(res.comments.length); // samakan angka di ikon dengan data terbaru
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Failed fetching comments");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [postId, reloadKey, onCountChange]);

  const retry = () => {
    setLoading(true);
    setError("");
    setReloadKey((k) => k + 1);
  };

  const handleCreated = (comment: PostComment, count: number) => {
    setComments((prev) => [...prev, comment]); // terbaru di bawah, urutan percakapan
    onCountChange(count);
  };

  const handleDeleted = (commentId: number, count?: number) => {
    const next = comments.filter((c) => c.id !== commentId);
    setComments(next);
    onCountChange(count ?? next.length); // pakai angka dari server bila ada
  };

  const handleUpdated = (updated: PostComment) =>
    setComments((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));

  return (
    <div className="mt-4 space-y-4 border-t border-slate-100 pt-4">
      {loading ? (
        <div className="space-y-4">
          {[0, 1].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="size-8 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-3.5 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="space-y-2">
          <p className="text-sm text-slate-600">{error}</p>
          <Button variant="outline" size="sm" onClick={retry}>
            Try again
          </Button>
        </div>
      ) : (
        <>
          {comments.length === 0 ? (
            <p className="text-sm text-slate-500">
              No comments yet. Be the first to respond.
            </p>
          ) : (
            <div className="space-y-4">
              {comments.map((c) => (
                <CommentItem
                  key={c.id}
                  comment={c}
                  postId={postId}
                  onDeleted={handleDeleted}
                  onUpdated={handleUpdated}
                />
              ))}
            </div>
          )}
          <CommentForm postId={postId} onCreated={handleCreated} />
        </>
      )}
    </div>
  );
}