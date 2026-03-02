import type { ReactNode } from "react";
import { StatusBadge, type CourierStatus } from "@/components/ui/StatusBadge";
import { AvatarDisplay } from "../avatar/AvatarDisplay";

interface HeaderProps {
  userName?: string;
  avatarUrl?: string | null;
  status?: CourierStatus;
  children?: ReactNode;
}

export function Header({ userName = "Motoboy", avatarUrl, status = "offline", children }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background px-4">
      <div className="flex items-center gap-2">
        <img src="/logo.svg" alt="Chega.la" className="h-7 w-7" />
        <span className="text-sm font-semibold text-primary">Chega.la</span>
      </div>

      <div className="flex items-center gap-3">
        {children}
        <AvatarDisplay src={avatarUrl} name={userName} size="sm" />
        <span className="text-sm text-muted-foreground">{userName}</span>
        <StatusBadge status={status} />
      </div>
    </header>
  );
}
