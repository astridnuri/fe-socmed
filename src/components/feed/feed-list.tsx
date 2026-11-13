"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PostCard } from "@/components/feed/post-card";
import { PostComposer } from "@/components/feed/post-composer";
import { ApiError } from "@/lib/api";
import * as postService from "@/services/posts";
import type { Post } from "@/types";

const panel = "overflow-hidden rounded-xl border border-slate-200 bg-white";

function PostSkeleton() {
  return (
    <div className="flex gap-3 px-4 py-4 sm:px-5">
      <Skeleton className="size-10 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}

export function FeedList({ userId }: { userId?: number }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  // Muat halaman pertama. reloadKey dipakai oleh tombol "Coba lagi".
  useEffect(() => {
    let cancelled = false;

    postService
      .getPosts(null, 10, userId)
      .then((res) => {
        if (cancelled) return;
        setPosts(res.posts);
        setNextCursor(res.nextCursor);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Error fetching posts");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey, userId]);

  const retry = () => {
    setLoading(true);
    setError("");
    setReloadKey((k) => k + 1);
  };

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await postService.getPosts(nextCursor, 10, userId);
      setPosts((prev) => [...prev, ...res.posts]);
      setNextCursor(res.nextCursor);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Error fetching posts");
    } finally {
      setLoadingMore(false);
    }
  };

  // Postingan baru ditaruh di urutan teratas
  const handleCreated = (post: Post) => setPosts((prev) => [post, ...prev]);

  const handleDeleted = (postId: number) =>
    setPosts((prev) => prev.filter((p) => p.id !== postId));

  // Hanya content dan updated_at yang digabungkan, supaya jumlah like
  // dan komentar yang sedang tampil tidak tertimpa
  const handleUpdated = (updated: Post) =>
    setPosts((prev) =>
      prev.map((p) =>
        p.id === updated.id
          ? { ...p, content: updated.content, updated_at: updated.updated_at }
          : p
      )
    );

  if (loading) {
    return (
      <div className={`${panel} divide-y divide-slate-200`}>
        <PostSkeleton />
        <PostSkeleton />
        <PostSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${panel} space-y-3 p-8 text-center`}>
        <p className="text-sm text-slate-600">{error}</p>
        <Button variant="outline" onClick={retry}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!userId && <PostComposer onCreated={handleCreated} />}

      {posts.length === 0 ? (
        <div className={`${panel} p-10 text-center`}>
          <p className="text-sm text-slate-500">
            {userId ? "This user hasn't posted yet." : "No posts yet. Be the first to share."}
          </p>
        </div>
      ) : (
        <>
          <div className={`${panel} divide-y divide-slate-200`}>
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onDeleted={handleDeleted}
                onUpdated={handleUpdated}
              />
            ))}
          </div>

          {nextCursor ? (
            <div className="flex justify-center">
              <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? "Loading..." : "Load more"}
              </Button>
            </div>
          ) : (
            <p className="text-center text-xs text-slate-400">
              You have reached the oldest post
            </p>
          )}
        </>
      )}
    </div>
  );
}