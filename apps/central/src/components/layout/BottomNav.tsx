import { NavLink } from "react-router";
import {
  LayoutDashboard,
  Package,
  Bike,
  Store,
  Map,
  DollarSign,
  Wallet,
  FileText,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/pedidos", label: "Pedidos", icon: Package },
  { to: "/motoboys", label: "Motoboys", icon: Bike },
  { to: "/lojistas", label: "Lojistas", icon: Store },
  { to: "/mapa", label: "Mapa", icon: Map },
  { to: "/precos", label: "Preços", icon: DollarSign },
  { to: "/financeiro", label: "Financeiro", icon: Wallet },
  { to: "/faturas", label: "Faturas", icon: FileText },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
] as const;

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex h-16 items-center justify-around border-t border-border bg-background md:hidden">
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
