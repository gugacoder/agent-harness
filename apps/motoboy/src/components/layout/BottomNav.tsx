import { NavLink } from "react-router";
import { Package, Clock, Wallet, Circle, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Entregas", icon: Package },
  { to: "/historico", label: "Histórico", icon: Clock },
  { to: "/extrato", label: "Extrato", icon: Wallet },
  { to: "/status", label: "Status", icon: Circle },
  { to: "/perfil", label: "Perfil", icon: User },
] as const;

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 mx-auto max-w-[480px] border-t border-border bg-background">
      <div className="flex h-16 items-center justify-around">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "flex min-h-[48px] flex-col items-center justify-center gap-1 px-4 text-xs transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-primary",
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
