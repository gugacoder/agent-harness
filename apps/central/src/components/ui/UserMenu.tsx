import { useState, useRef, useEffect } from "react";
import { Link } from "react-router";
import { ArrowLeft, LogOut, User } from "lucide-react";
import { AvatarDisplay } from "../avatar/AvatarDisplay";
import { ThemeToggle } from "./ThemeToggle";

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  central: "Central",
  lojista: "Lojista",
  motoboy: "Motoboy",
};

interface UserMenuProps {
  userName: string;
  userRole?: string;
  avatarUrl?: string | null;
  onLogout?: () => void;
  impersonating?: { companyName: string; onStop: () => void } | null;
}

export function UserMenu({ userName, userRole, avatarUrl, onLogout, impersonating }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClose(e: MouseEvent | TouchEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClose);
    document.addEventListener("touchstart", handleClose);
    return () => {
      document.removeEventListener("mousedown", handleClose);
      document.removeEventListener("touchstart", handleClose);
    };
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Menu do usuário"
        aria-expanded={open}
      >
        <AvatarDisplay src={avatarUrl} name={userName} size="sm" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-border bg-popover p-2 shadow-lg z-30">
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium">{userName}</p>
            {userRole && (
              <p className="text-xs text-muted-foreground">
                {ROLE_LABELS[userRole] ?? userRole}
              </p>
            )}
          </div>

          <div className="my-1.5 h-px bg-border" />

          <Link
            to="/perfil"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-amber-700 transition-colors hover:bg-muted md:hidden"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para admin
            </button>
          )}

          <div className="my-1.5 h-px bg-border" />

          <div className="flex items-center justify-between px-2 py-1.5">
            <span className="text-sm text-muted-foreground">Tema</span>
            <ThemeToggle />
          </div>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onLogout?.();
            }}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      )}
    </div>
  );
}
