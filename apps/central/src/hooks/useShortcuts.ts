import { useState, useCallback } from "react";
import { navItems, DEFAULT_SHORTCUT_ROUTES, type NavItem } from "@/lib/nav-items";

const STORAGE_KEY = "bottom-nav-shortcuts";
const SHORTCUT_COUNT = 4;

const knownRoutes = new Set(navItems.map((item) => item.to));

function loadShortcuts(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SHORTCUT_ROUTES;
    const parsed: unknown = JSON.parse(raw);
    if (
      Array.isArray(parsed) &&
      parsed.length === SHORTCUT_COUNT &&
      parsed.every((r) => typeof r === "string" && knownRoutes.has(r))
    ) {
      return parsed;
    }
  } catch {
    // corrupted data — fall back
  }
  return DEFAULT_SHORTCUT_ROUTES;
}

export function useShortcuts() {
  const [shortcutRoutes, setShortcutRoutes] = useState<string[]>(loadShortcuts);

  const shortcuts: NavItem[] = shortcutRoutes
    .map((route) => navItems.find((item) => item.to === route))
    .filter((item): item is NavItem => item != null);

  const saveShortcuts = useCallback((routes: string[]) => {
    setShortcutRoutes(routes);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(routes));
  }, []);

  return { shortcuts, shortcutRoutes, saveShortcuts };
}
