import { useState, useRef, useEffect } from "react";
import type { ReactNode } from "react";
import { LogOut } from "lucide-react";
import { StatusBadge, type CourierStatus } from "@/components/ui/StatusBadge";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

interface HeaderProps {
  userName?: string;
  userEmail?: string;
  status?: CourierStatus;
  children?: ReactNode;
  onLogout?: () => void;
}

function getInitials(name: string): string {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

export function Header({ userName = "Motoboy", userEmail, status = "offline", children, onLogout }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background px-4">
      <div className="flex items-center gap-2">
        <img src="/logo-brand.svg" alt="Chega.la" className="h-6" />
        <span className="text-sm text-muted-foreground">/</span>
        <span className="text-sm">Área do <strong>Motoboy</strong></span>
      </div>

      <div className="flex items-center gap-3">
        {children}
        <StatusBadge status={status} />
        <div ref={ref} className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground"
          >
            {getInitials(userName)}
          </button>
          {open && (
            <div className="absolute right-0 top-full mt-1 min-w-[200px] rounded-md border border-border bg-popover p-2 shadow-lg">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{userName}</p>
                {userEmail && (
                  <p className="text-xs text-muted-foreground">{userEmail}</p>
                )}
              </div>
              <div className="my-1 border-t border-border" />
              <div className="flex items-center justify-between px-2 py-1.5">
                <span className="text-sm text-muted-foreground">Tema</span>
                <ThemeToggle />
              </div>
              <div className="my-1 border-t border-border" />
              <button
                onClick={onLogout}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
