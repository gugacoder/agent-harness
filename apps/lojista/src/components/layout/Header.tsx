import { LogOut } from "lucide-react";
import { AvatarDisplay } from "../avatar/AvatarDisplay";

interface HeaderProps {
  userName?: string;
  avatarUrl?: string | null;
  onLogout?: () => void;
}

export function Header({ userName = "Lojista", avatarUrl, onLogout }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background px-4">
      <div className="flex items-center gap-2">
        <img src="/logo.svg" alt="Chega.la" className="h-7 w-7" />
        <span className="text-sm font-semibold text-primary">Chega.la</span>
      </div>

      <div className="flex items-center gap-3">
        <AvatarDisplay src={avatarUrl} name={userName} size="sm" />
        <span className="text-sm text-muted-foreground">{userName}</span>
        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title="Sair"
        >
          <LogOut className="h-4 w-4" />
          <span>Sair</span>
        </button>
      </div>
    </header>
  );
}
