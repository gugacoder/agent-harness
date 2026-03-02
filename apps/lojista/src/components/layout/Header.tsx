import { HelpCircle } from "lucide-react";
import { UserMenu } from "@/components/ui/UserMenu";

interface HeaderProps {
  userName?: string;
  userRole?: string;
  avatarUrl?: string | null;
  onLogout?: () => void;
  onHelpClick?: () => void;
}

export function Header({ userName = "Lojista", userRole, avatarUrl, onLogout, onHelpClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background px-4">
      <div className="flex items-center gap-2">
        <img src="/logo-brand.svg" alt="Chega.la" className="h-6" />
        <span className="text-sm text-muted-foreground">/</span>
        <span className="text-sm">Área do <strong>Lojista</strong></span>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onHelpClick}
          className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title="Como funciona"
        >
          <HelpCircle className="h-4 w-4" />
          <span className="hidden sm:inline">Como funciona</span>
        </button>
        <UserMenu
          userName={userName}
          userRole={userRole}
          avatarUrl={avatarUrl}
          onLogout={onLogout}
        />
      </div>
    </header>
  );
}
