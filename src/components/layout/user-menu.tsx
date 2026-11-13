"use client";

import { ChevronDown, LogOut, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { fileUrl } from "@/lib/api";
import { getInitials } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";

export function UserMenu() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);

  if (!user) return null;

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-sm font-medium text-slate-800 outline-none transition-colors hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-slate-300">
          <Avatar className="size-8">
            <AvatarImage src={fileUrl(user.avatar)} alt={user.name} />
            <AvatarFallback className="bg-slate-200 text-xs font-medium text-slate-700">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <span className="max-w-28 truncate sm:max-w-40">{user.name}</span>
          <ChevronDown className="size-4 text-slate-500" />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5">
            <p className="truncate text-sm font-medium text-slate-900">{user.name}</p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push("/profile/edit")}>
            <UserRound className="size-4" />
            Edit Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setConfirmLogoutOpen(true)}>
            <LogOut className="size-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog
        open={confirmLogoutOpen}
        onOpenChange={setConfirmLogoutOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Log out?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to log out of your account?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              type="button"
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={logout}
            >
              Logout
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}