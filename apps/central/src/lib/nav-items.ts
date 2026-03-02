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
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  menuLabel: string;
  description: string;
  icon: LucideIcon;
  group: string;
}

export const navItems: NavItem[] = [
  { to: "/", label: "Dashboard", menuLabel: "Dashboard", description: "Visão geral e resumo", icon: LayoutDashboard, group: "Principal" },
  { to: "/pedidos", label: "Pedidos", menuLabel: "Pedidos", description: "Entregas ativas e histórico", icon: Package, group: "Principal" },
  { to: "/motoboys", label: "Motoboys", menuLabel: "Motoboys", description: "Gerenciar entregadores", icon: Bike, group: "Operação" },
  { to: "/lojistas", label: "Lojistas", menuLabel: "Lojistas", description: "Gerenciar lojas parceiras", icon: Store, group: "Operação" },
  { to: "/mapa", label: "Mapa", menuLabel: "Mapa", description: "Localização em tempo real", icon: Map, group: "Operação" },
  { to: "/precos", label: "Preços", menuLabel: "Preços", description: "Tabelas de precificação", icon: DollarSign, group: "Financeiro" },
  { to: "/financeiro", label: "Financeiro", menuLabel: "Financeiro", description: "Fechamentos e repasses", icon: Wallet, group: "Financeiro" },
  { to: "/faturas", label: "Faturas", menuLabel: "Faturas", description: "Cobranças dos lojistas", icon: FileText, group: "Financeiro" },
  { to: "/analytics", label: "Analytics", menuLabel: "Analytics", description: "Métricas e tendências", icon: BarChart3, group: "Financeiro" },
  { to: "/configuracao", label: "Config", menuLabel: "Configurações", description: "Parâmetros da empresa", icon: Settings, group: "Sistema" },
];

/** Group order for the drawer menu */
export const menuGroups = ["Principal", "Operação", "Financeiro", "Sistema"] as const;

export const DEFAULT_SHORTCUT_ROUTES = ["/", "/pedidos", "/motoboys", "/mapa"];
