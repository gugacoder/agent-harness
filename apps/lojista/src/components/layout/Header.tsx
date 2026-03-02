import { LogOut, HelpCircle } from "lucide-react";

interface HeaderProps {
  userName?: string;
  onLogout?: () => void;
  onHelpClick?: () => void;
}

export function Header({ userName = "Lojista", onLogout, onHelpClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background px-4">
      <div className="flex items-center gap-2">
        <img src="/logo.svg" alt="Chega.la" className="h-7 w-7" />
        <span className="text-sm font-semibold text-primary">Chega.la</span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onHelpClick}
          className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title="Como funciona"
        >
          <HelpCircle className="h-4 w-4" />
          <span className="hidden sm:inline">Como funciona</span>
        </button>
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
