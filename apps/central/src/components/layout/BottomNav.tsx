import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router";
import { Drawer } from "vaul";
import { Menu, Pencil, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { navItems, menuGroups } from "@/lib/nav-items";
import { useShortcuts } from "@/hooks/useShortcuts";

export function BottomNav() {
  const { shortcuts, shortcutRoutes, saveShortcuts } = useShortcuts();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string[]>([]);
  const location = useLocation();
  const navigate = useNavigate();

  function openDrawer() {
    setOpen(true);
    setEditing(false);
  }

  function startEditing() {
    setDraft([...shortcutRoutes]);
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
  }

  function saveEditing() {
    saveShortcuts(draft);
    setEditing(false);
  }

  function toggleDraft(route: string) {
    setDraft((prev) =>
      prev.includes(route)
        ? prev.filter((r) => r !== route)
        : prev.length < 4
          ? [...prev, route]
          : prev
    );
  }

  function handleNavigate(to: string) {
    navigate(to);
    setOpen(false);
  }

  return (
    <>
      {/* Fixed bottom bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-[1000] flex h-16 items-center justify-around border-t border-border bg-background md:hidden">
        {shortcuts.map((item) => (
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

        <button
          type="button"
          onClick={openDrawer}
          className="flex flex-col items-center gap-1 px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-primary"
        >
          <Menu className="h-5 w-5" />
          <span>Menu</span>
        </button>
      </nav>

      {/* Bottom sheet drawer */}
      <Drawer.Root open={open} onOpenChange={setOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-[9998] bg-black/40" />
          <Drawer.Content className="fixed inset-x-0 bottom-0 z-[9999] flex max-h-[85vh] flex-col rounded-t-2xl bg-background">
            <Drawer.Handle className="mx-auto mb-2 mt-3 h-1.5 w-12 rounded-full bg-muted-foreground/30" />
            <Drawer.Title className="sr-only">Menu de navegação</Drawer.Title>
            <Drawer.Description className="sr-only">Acesse todas as seções do sistema</Drawer.Description>

            <div className="overflow-y-auto px-4 pb-8">
              {editing ? (
                /* ── Edit mode ── */
                <>
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-base font-semibold">
                      Selecione 4 atalhos
                    </h2>
                    <span className="text-sm text-muted-foreground">
                      {draft.length}/4
                    </span>
                  </div>

                  <div className="flex flex-col gap-1">
                    {navItems.map((item) => {
                      const selected = draft.includes(item.to);
                      return (
                        <button
                          key={item.to}
                          type="button"
                          onClick={() => toggleDraft(item.to)}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors",
                            selected
                              ? "bg-primary/10 text-primary"
                              : "text-foreground hover:bg-muted"
                          )}
                        >
                          <item.icon className="h-5 w-5 shrink-0" />
                          <span className="flex-1 text-left">{item.label}</span>
                          {selected && <Check className="h-4 w-4 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={cancelEditing}
                      className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={saveEditing}
                      disabled={draft.length !== 4}
                      className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                    >
                      Salvar
                    </button>
                  </div>
                </>
              ) : (
                /* ── Navigation mode ── */
                <>
                  <div className="mb-3 flex justify-end">
                    <button
                      type="button"
                      onClick={startEditing}
                      className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <Pencil className="h-4 w-4" />
                      Editar atalhos
                    </button>
                  </div>

                  <div className="flex flex-col gap-4">
                    {menuGroups.map((group) => {
                      const items = navItems.filter((i) => i.group === group);
                      if (items.length === 0) return null;
                      return (
                        <div key={group}>
                          <h3 className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            {group}
                          </h3>
                          <div className="rounded-xl border border-border bg-card">
                            {items.map((item, idx) => {
                              const isActive =
                                item.to === "/"
                                  ? location.pathname === "/"
                                  : location.pathname.startsWith(item.to);
                              return (
                                <button
                                  key={item.to}
                                  type="button"
                                  onClick={() => handleNavigate(item.to)}
                                  className={cn(
                                    "flex w-full items-center gap-3 px-3 py-3 text-left transition-colors",
                                    idx < items.length - 1 && "border-b border-border",
                                    isActive
                                      ? "bg-primary/10 text-primary"
                                      : "text-foreground hover:bg-muted/50"
                                  )}
                                >
                                  <item.icon className="h-5 w-5 shrink-0" />
                                  <div className="min-w-0 flex-1">
                                    <div className={cn("text-sm", isActive && "font-medium")}>
                                      {item.menuLabel}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {item.description}
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
}
