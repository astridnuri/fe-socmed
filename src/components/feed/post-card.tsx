"use client";

import { MapPin, MessageCircle } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { CommentSection } from "@/components/comments/comment-section";
import { LikeButton } from "@/components/feed/like-button";
import { PostMenu } from "@/components/feed/post-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { fileUrl } from "@/lib/api";
import { cn, getInitials, isEdited, timeAgo } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import type { Post } from "@/types";

interface PostCardProps {
  post: Post;
  onDeleted: (postId: number) => void;
  onUpdated: (post: Post) => void;
}

export function PostCard({ post, onDeleted, onUpdated }: PostCardProps) {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [commentsCount, setCommentsCount] = useState(post.comments_count);

  // Hanya pemilik yang melihat menu edit dan hapus.
  // Yang menegakkan aturan tetap backend (403).
  const isOwner = user?.id === post.user.id;

  return (
    <article className="flex gap-3 px-4 py-4 sm:px-5">
      <Avatar className="size-10 shrink-0">
        <AvatarImage src={fileUrl(post.user.avatar)} alt={post.user.name} />
        <AvatarFallback className="bg-slate-200 text-sm font-medium text-slate-700">
          {getInitials(post.user.name)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-baseline gap-2">
            <Link
              href={`/users/${post.user.id}`}
              className="truncate text-sm font-semibold text-slate-900 hover:underline"
            >
              {post.user.name}
            </Link>
            <time
              dateTime={post.created_at}
              className="shrink-0 text-xs text-slate-500"
            >
              {timeAgo(post.created_at)}
            </time>
            {isEdited(post.created_at, post.updated_at) && (
              <span className="shrink-0 text-xs text-slate-400">· edited</span>
            )}
          </div>
          {isOwner && (
            <PostMenu post={post} onDeleted={onDeleted} onUpdated={onUpdated} />
          )}
        </div>

        {post.location && (
          <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
            <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="wrap-break-word">{post.location}</span>
          </p>
        )}

        {post.content && (
          <p className="mt-1 whitespace-pre-wrap wrap-break-word text-[15px] leading-relaxed text-slate-800">
            {post.content}
          </p>
        )}

        {post.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={fileUrl(post.image)}
            alt="Post image"
            loading="lazy"
            className="mt-3 max-h-112 w-auto max-w-full rounded-lg border border-slate-200"
          />
        )}

        <div className="mt-3 flex items-center gap-5 text-slate-500">
          <LikeButton
            postId={post.id}
            initialLiked={post.liked_by_me}
            initialCount={post.likes_count}
          />
          <button
            type="button"
            onClick={() => setShowComments((v) => !v)}
            aria-expanded={showComments}
            aria-label={showComments ? "Close comments" : "See comments"}
            className={cn(
              "flex items-center gap-1.5 text-sm transition-colors",
              showComments ? "text-slate-900" : "text-slate-500 hover:text-slate-800"
            )}
          >
            <MessageCircle
              className={cn("size-4.5", showComments && "fill-slate-200")}
            />
            <span className="tabular-nums">{commentsCount}</span>
          </button>
        </div>

        {showComments && (
          <CommentSection postId={post.id} onCountChange={setCommentsCount} />
        )}
      </div>
    </article>
  );
}