import { Link } from "react-router";
import { ArrowLeft, HelpCircle } from "lucide-react";
import { UserMenu } from "@/components/ui/UserMenu";

interface HeaderProps {
  userName?: string;
  userRole?: string;
  avatarUrl?: string | null;
  onLogout?: () => void;
  impersonating?: { companyName: string; onStop: () => void } | null;
}

export function Header({ userName = "Operador", userRole, avatarUrl, onLogout, impersonating }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background px-4 md:px-6">
      <div className="flex items-center gap-2 md:hidden">
        <img src="/logo-brand.svg" alt="Chega.la" className="h-6" />
        <span className="text-sm text-muted-foreground">/</span>
        <span className="text-sm">Área <strong>Central</strong></span>
      </div>

      {impersonating ? (
        <div className="hidden items-center gap-2 md:flex">
          <span className="rounded-md bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
            Impersonando: {impersonating.companyName}
          </span>
          <button
            type="button"
            onClick={impersonating.onStop}
            className="flex items-center gap-1.5 rounded-md border border-input px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar para admin
          </button>
        </div>
      ) : (
        <div className="hidden md:block" />
      )}

      <div className="flex items-center gap-3">
        <Link
          to="/docs"
          className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title="Como funciona"
        >
          <HelpCircle className="h-4 w-4" />
          <span className="hidden sm:inline">Como funciona</span>
        </Link>
        <UserMenu
          userName={userName}
          userRole={userRole}
          avatarUrl={avatarUrl}
          onLogout={onLogout}
          impersonating={impersonating}
        />
      </div>
    </header>
  );
}
