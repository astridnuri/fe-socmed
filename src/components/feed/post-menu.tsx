"use client";

import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PostEditDialog } from "@/components/feed/post-edit-dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ApiError } from "@/lib/api";
import * as postService from "@/services/posts";
import type { Post } from "@/types";

interface PostMenuProps {
  post: Post;
  onDeleted: (postId: number) => void;
  onUpdated: (post: Post) => void;
}

export function PostMenu({ post, onDeleted, onUpdated }: PostMenuProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await postService.deletePost(post.id);
      toast.success("Post deleted");
      setConfirmOpen(false);
      onDeleted(post.id);
    } catch (err) {
      // Sudah terhapus di tempat lain: cukup buang dari tampilan
      if (err instanceof ApiError && err.status === 404) {
        toast.info("Post unavailable");
        setConfirmOpen(false);
        onDeleted(post.id);
        return;
      }
      toast.error(err instanceof ApiError ? err.message : "Failed delete post");
      setDeleting(false);
    }
  };

  return (
    <>
      {/* modal={false} mencegah halaman "membeku" saat dialog dibuka dari menu */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger
          aria-label="Post option"
          className="-mr-2 -mt-1 flex size-8 items-center justify-center rounded-full text-slate-500 outline-none transition-colors hover:bg-slate-100 hover:text-slate-800 focus-visible:ring-2 focus-visible:ring-slate-300"
        >
          <MoreHorizontal className="size-5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {/* <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" />
            Edit post
          </DropdownMenuItem> */}
          <DropdownMenuItem
            className="text-red-600 focus:text-red-600"
            onClick={() => setConfirmOpen(true)}
          >
            <Trash2 className="size-4" />
            Delete post
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialog dipasang hanya saat dibuka agar isinya selalu segar */}
      {editOpen && (
        <PostEditDialog
          post={post}
          onClose={() => setEditOpen(false)}
          onUpdated={onUpdated}
        />
      )}

      <AlertDialog
        open={confirmOpen}
        onOpenChange={(next) => {
          if (!deleting) setConfirmOpen(next);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>
              This post with its comments and likes will be permanently deleted.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}