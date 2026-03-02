import type { ReactNode } from "react";
import { StatusBadge, type CourierStatus } from "@/components/ui/StatusBadge";
import { UserMenu } from "@/components/ui/UserMenu";

interface HeaderProps {
  userName?: string;
  userRole?: string;
  avatarUrl?: string | null;
  status?: CourierStatus;
  children?: ReactNode;
  onLogout?: () => void;
}

export function Header({ userName = "Motoboy", userRole, avatarUrl, status = "offline", children, onLogout }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background px-4">
      <div className="flex items-center gap-2">
        <img src="/logo-brand.svg" alt="Chega.la" className="h-6" />
        <span className="text-sm text-muted-foreground">/</span>
        <span className="text-sm">Área do <strong>Motoboy</strong></span>
      </div>

      <div className="flex items-center gap-3">
        <StatusBadge status={status} />
        {children}
        <UserMenu userName={userName} userRole={userRole} avatarUrl={avatarUrl} onLogout={onLogout} />
      </div>
    </header>
  );
}
