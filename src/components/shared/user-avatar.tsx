import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { fileUrl } from "@/lib/api";
import { getInitials } from "@/lib/utils";

interface UserAvatarProps {
  name: string;
  avatar: string | null;
  className?: string;
}

export function UserAvatar({ name, avatar, className }: UserAvatarProps) {
  return (
    <Avatar className={className}>
      <AvatarImage src={fileUrl(avatar)} alt={name} />
      <AvatarFallback className="bg-slate-200 font-medium text-slate-700">
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}