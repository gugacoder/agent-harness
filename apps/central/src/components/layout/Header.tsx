import { useState, useRef, useEffect } from "react";
import { Link } from "react-router";
import { LogOut, User, ArrowLeft } from "lucide-react";
import { AvatarDisplay } from "../avatar/AvatarDisplay";

interface HeaderProps {
  userName?: string;
  avatarUrl?: string | null;
  onLogout?: () => void;
  impersonating?: { companyName: string; onStop: () => void } | null;
}

export function Header({ userName = "Operador", avatarUrl, onLogout, impersonating }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background px-4 md:px-6">
      <div className="flex items-center gap-2 md:hidden">
        <img src="/logo.svg" alt="Chega.la" className="h-7 w-7" />
        <span className="text-sm font-semibold text-primary">Chega.la</span>
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

      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-muted"
        >
          <AvatarDisplay src={avatarUrl} name={userName} size="sm" />
          <span className="text-sm text-muted-foreground">{userName}</span>
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-1 w-48 rounded-md border border-border bg-background py-1 shadow-lg">
            <Link
              to="/perfil"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
            >
              <User className="h-4 w-4" />
              Meu Perfil
            </Link>
            {impersonating && (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  impersonating.onStop();
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-amber-700 transition-colors hover:bg-muted md:hidden"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar para admin
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onLogout?.();
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
