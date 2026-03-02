import { NavLink } from "react-router";
import { LayoutDashboard, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

const adminNavItems = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/empresas", label: "Empresas", icon: Building2 },
] as const;

interface AdminSidebarProps {
  collapsed?: boolean;
}

export function AdminSidebar({ collapsed = false }: AdminSidebarProps) {
  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-30 flex h-screen flex-col border-r border-border bg-primary text-primary-foreground transition-[width] duration-200",
        collapsed ? "w-16" : "w-56"
      )}
    >
      <div className="flex h-16 items-center justify-center border-b border-primary-foreground/10 px-4">
        {collapsed ? (
          <img src="/logo.svg" alt="Chega.la" className="h-8 w-8" />
        ) : (
          <img src="/logo-brand.svg" alt="Chega.la" className="h-8" />
        )}
      </div>

      {!collapsed && (
        <div className="mx-3 mt-3 rounded-md bg-primary-foreground/10 px-3 py-1.5 text-center text-xs font-semibold uppercase tracking-wider text-primary-foreground/70">
          Super Admin
        </div>
      )}

      <nav className="flex flex-1 flex-col gap-1 p-2 pt-3">
        {adminNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
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
