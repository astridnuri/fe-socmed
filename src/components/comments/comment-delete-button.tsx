"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
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
import { ApiError } from "@/lib/api";
import * as commentService from "@/services/comments";

interface CommentDeleteButtonProps {
  postId: number;
  commentId: number;
  hasReplies?: boolean;
  onDeleted: (commentId: number, commentsCount?: number) => void;
}

export function CommentDeleteButton({
  postId,
  commentId,
  hasReplies = false,
  onDeleted,
}: CommentDeleteButtonProps) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await commentService.deleteComment(postId, commentId);
      toast.success("Comment deleted");
      setOpen(false);
      onDeleted(commentId, res.comments_count);
    } catch (err) {
      // Sudah terhapus di tempat lain: cukup buang dari tampilan
      if (err instanceof ApiError && err.status === 404) {
        toast.info("Comment unavailable");
        setOpen(false);
        onDeleted(commentId);
        return;
      }
      toast.error(err instanceof ApiError ? err.message : "Failed delete comment");
      setDeleting(false); // dialog tetap terbuka agar bisa dicoba lagi
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Delete comment"
        className="-mr-1 flex size-7 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-red-600"
      >
        <Trash2 className="size-4" />
      </button>

      <AlertDialog
        open={open}
        onOpenChange={(next) => {
          if (!deleting) setOpen(next);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this comment?</AlertDialogTitle>
            <AlertDialogDescription>
              {hasReplies
                ? "This comment and its replies will be permanently deleted."
                : "Comment will be permanently deleted and cannot be retrieved."}
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