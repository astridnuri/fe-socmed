"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/shared/user-avatar";
import { FeedList } from "@/components/feed/feed-list";
import { ApiError } from "@/lib/api";
import * as profileService from "@/services/profile";
import type { PublicProfile } from "@/types";

export function UserProfile({ userId }: { userId: string }) {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const id = Number(userId);

    if (!Number.isSafeInteger(id) || id < 1) {
      return () => {
        cancelled = true;
      };
    }

    profileService
      .getPublicProfile(id)
      .then((res) => {
        if (!cancelled) setProfile(res.user);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError ? err.message : "Error fetching user profile"
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, reloadKey]);

  if (!Number.isSafeInteger(Number(userId)) || Number(userId) < 1) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-sm text-slate-600">Invalid user ID</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5">
          <Skeleton className="size-16 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-3 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-2/3" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-sm text-slate-600">{error || "User not found"}</p>
        <Button
          variant="outline"
          onClick={() => {
            setError("");
            setProfile(null);
            setLoading(true);
            setReloadKey((key) => key + 1);
          }}
        >
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5">
        <UserAvatar
          name={profile.name}
          avatar={profile.avatar}
          className="size-16 shrink-0"
        />
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold text-slate-900">
            {profile.name}
          </h1>
          <p className="mt-1 whitespace-pre-wrap wrap-break-word text-sm text-slate-600">
            {profile.bio || "No bio yet."}
          </p>
        </div>
      </section>

      <FeedList key={profile.id} userId={profile.id} />
    </div>
  );
}
