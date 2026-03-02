import { NavLink } from "react-router";
import { cn } from "@/lib/utils";
import { navItems } from "@/lib/nav-items";
import { usePendingRegistrations } from "@/hooks/useRegistration";

interface SidebarProps {
  collapsed?: boolean;
}

export function Sidebar({ collapsed = false }: SidebarProps) {
  const { data: pendingRequests } = usePendingRegistrations();
  const pendingCount = pendingRequests?.length ?? 0;

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
            {!collapsed && (
              <span className="flex flex-1 items-center justify-between">
                {item.menuLabel}
                {item.to === "/usuarios" && pendingCount > 0 && (
                  <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-xs font-bold text-white">
                    {pendingCount}
                  </span>
                )}
              </span>
            )}
            {collapsed && item.to === "/usuarios" && pendingCount > 0 && (
              <span className="absolute right-1 top-0 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
                {pendingCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
