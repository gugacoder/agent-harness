import { NavLink } from "react-router";
import { Package, FileText, Plus, Clock, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Pedidos", icon: Package },
  { to: "/faturas", label: "Faturas", icon: FileText },
  { to: "/nova", label: "Nova Entrega", icon: Plus },
  { to: "/historico", label: "Histórico", icon: Clock },
  { to: "/enderecos", label: "Meus Endereços", icon: MapPin },
] as const;

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex h-16 items-center justify-around border-t border-border bg-background">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/"}
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center gap-1 px-2 py-1 text-xs transition-colors",
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-primary"
            )
          }
        >
          <item.icon className="h-5 w-5" />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
