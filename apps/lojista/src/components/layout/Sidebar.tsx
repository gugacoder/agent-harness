import { NavLink } from "react-router";
import { Package, FileText, Plus, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Pedidos", icon: Package },
  { to: "/faturas", label: "Faturas", icon: FileText },
  { to: "/nova", label: "Nova Entrega", icon: Plus },
  { to: "/historico", label: "Histórico", icon: Clock },
] as const;

interface SidebarProps {
  collapsed?: boolean;
}

export function Sidebar({ collapsed = false }: SidebarProps) {
  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-30 flex h-screen flex-col border-r border-border bg-primary text-primary-foreground transition-[width] duration-200",
        collapsed ? "w-16" : "w-56"
      )}
    >
      <div className="flex h-14 items-center justify-center border-b border-primary-foreground/10 px-4">
        {collapsed ? (
          <img src="/logo.svg" alt="Chega.la" className="h-7 w-7" />
        ) : (
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="Chega.la" className="h-7 w-7" />
            <span className="text-sm font-semibold">Chega.la</span>
          </div>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary-foreground/15 text-primary-foreground"
                  : "text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground"
              )
            }
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
