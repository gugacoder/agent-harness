import type { ReactNode } from "react";
import { Link } from "react-router";
import { LogOut, HelpCircle } from "lucide-react";
import { StatusBadge, type CourierStatus } from "@/components/ui/StatusBadge";
import { AvatarDisplay } from "../avatar/AvatarDisplay";

interface HeaderProps {
  userName?: string;
  avatarUrl?: string | null;
  status?: CourierStatus;
  children?: ReactNode;
  onLogout?: () => void;
}

export function Header({ userName = "Motoboy", avatarUrl, status = "offline", children, onLogout }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background px-4">
      <div className="flex items-center gap-2">
        <img src="/logo-brand.svg" alt="Chega.la" className="h-6" />
        <span className="text-sm text-muted-foreground">/</span>
        <span className="text-sm">Área do <strong>Motoboy</strong></span>
      </div>

      <div className="flex items-center gap-3">
        {children}
        <Link to="/docs" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Ajuda">
          <HelpCircle className="h-5 w-5" />
        </Link>
        <AvatarDisplay src={avatarUrl} name={userName} size="sm" />
        <span className="text-sm text-muted-foreground">{userName}</span>
        <StatusBadge status={status} />
        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title="Sair"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
