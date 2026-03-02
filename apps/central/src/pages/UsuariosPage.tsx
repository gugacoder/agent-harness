import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  Users,
  Search,
  Pencil,
  Power,
  KeyRound,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  MoreVertical,
  UserPlus,
} from "lucide-react";
import { Link } from "react-router";
import {
  useUsers,
  useUpdateUser,
  useToggleUserStatus,
  useResetPassword,
} from "@/hooks/useUsers";
import { AvatarDisplay } from "@/components/avatar/AvatarDisplay";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import type { User, UserRole } from "@/types/api";
import { cn } from "@/lib/utils";

// --- Constants ---

const INPUT_CLASS =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

const ROLE_LABELS: Record<UserRole, string> = {
  operator: "Operador",
  shop: "Lojista",
  courier: "Motoboy",
};

const ROLE_COLORS: Record<UserRole, string> = {
  operator: "bg-blue-100 text-blue-800",
  shop: "bg-purple-100 text-purple-800",
  courier: "bg-amber-100 text-amber-800",
};

// --- Role Badge ---

function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_COLORS[role]}`}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}

// --- Active Badge ---

function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
      }`}
    >
      {active ? "Ativo" : "Inativo"}
    </span>
  );
}

// --- Confirmation Dialog ---

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  confirmClass?: string;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDialog({
  title,
  message,
  confirmLabel,
  confirmClass,
  loading,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-md rounded-lg bg-card p-6 shadow-xl">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50",
              confirmClass ??
                "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Edit User Dialog ---

interface EditDialogProps {
  user: User;
  onClose: () => void;
}

function EditUserDialog({ user, onClose }: EditDialogProps) {
  const updateUser = useUpdateUser();
  const [form, setForm] = useState({
    full_name: user.full_name,
    phone: user.phone,
    email: user.email ?? "",
    role: user.role,
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validate = useCallback(() => {
    const errors: Record<string, string> = {};
    if (!form.full_name.trim()) errors.full_name = "Nome é obrigatório";
    if (!form.phone.trim()) errors.phone = "Telefone é obrigatório";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      errors.email = "E-mail inválido";
    return errors;
  }, [form]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    updateUser.mutate(
      {
        id: user.id,
        data: {
          full_name: form.full_name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || undefined,
          role: form.role,
        },
      },
      { onSuccess: onClose }
    );
  };

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-lg rounded-lg bg-card shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h3 className="text-lg font-semibold">Editar Usuário</h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-muted"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-4">
          {updateUser.isError && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              Erro ao atualizar usuário
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium">Nome</label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => updateField("full_name", e.target.value)}
              className={INPUT_CLASS}
            />
            {fieldErrors.full_name && (
              <p className="mt-1 text-xs text-destructive">
                {fieldErrors.full_name}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Telefone
              </label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                className={INPUT_CLASS}
              />
              {fieldErrors.phone && (
                <p className="mt-1 text-xs text-destructive">
                  {fieldErrors.phone}
                </p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">E-mail</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                className={INPUT_CLASS}
              />
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-destructive">
                  {fieldErrors.email}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Papel</label>
            <select
              value={form.role}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  role: e.target.value as UserRole,
                }))
              }
              className={INPUT_CLASS}
            >
              <option value="operator">Operador</option>
              <option value="shop">Lojista</option>
              <option value="courier">Motoboy</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={updateUser.isPending}
              className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {updateUser.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Action Menu ---

interface ActionMenuProps {
  user: User;
  onEdit: () => void;
  onToggleStatus: () => void;
  onResetPassword: () => void;
}

function ActionMenu({
  user,
  onEdit,
  onToggleStatus,
  onResetPassword,
}: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-10 mt-1 w-48 rounded-md border bg-card py-1 shadow-lg">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onEdit();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
          >
            <Pencil className="h-4 w-4" />
            Editar
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onToggleStatus();
            }}
            className={cn(
              "flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted",
              user.active && "text-destructive"
            )}
          >
            <Power className="h-4 w-4" />
            {user.active ? "Desativar" : "Reativar"}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onResetPassword();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
          >
            <KeyRound className="h-4 w-4" />
            Resetar senha
          </button>
        </div>
      )}
    </div>
  );
}

// --- User Card (Mobile) ---

interface UserCardProps {
  user: User;
  selected: boolean;
  onSelect: (checked: boolean) => void;
  onEdit: () => void;
  onToggleStatus: () => void;
  onResetPassword: () => void;
}

function UserCard({
  user,
  selected,
  onSelect,
  onEdit,
  onToggleStatus,
  onResetPassword,
}: UserCardProps) {
  return (
    <div className="flex items-start gap-3 border-b px-4 py-3 last:border-b-0">
      <input
        type="checkbox"
        checked={selected}
        onChange={(e) => onSelect(e.target.checked)}
        className="mt-1.5 h-4 w-4 shrink-0 rounded border-gray-300"
      />
      <AvatarDisplay src={user.avatar_url} name={user.full_name} size="md" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium">{user.full_name}</span>
          <RoleBadge role={user.role} />
          <ActiveBadge active={user.active} />
        </div>
        <p className="mt-0.5 truncate text-sm text-muted-foreground">
          {user.phone}
          {user.email && ` · ${user.email}`}
        </p>
      </div>
      <ActionMenu
        user={user}
        onEdit={onEdit}
        onToggleStatus={onToggleStatus}
        onResetPassword={onResetPassword}
      />
    </div>
  );
}

// --- Main Page ---

export function UsuariosPage() {
  // Filters
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Build query filters
  const queryFilters = useMemo(() => {
    const f: { role?: UserRole; active?: boolean; search?: string } = {};
    if (roleFilter !== "all") f.role = roleFilter;
    if (statusFilter === "active") f.active = true;
    if (statusFilter === "inactive") f.active = false;
    if (debouncedSearch) f.search = debouncedSearch;
    return f;
  }, [roleFilter, statusFilter, debouncedSearch]);

  const { data: users, isLoading } = useUsers(queryFilters);
  const toggleStatus = useToggleUserStatus();
  const resetPassword = useResetPassword();

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Reset selection when filters change
  useEffect(() => {
    setSelectedIds(new Set());
  }, [roleFilter, statusFilter, debouncedSearch]);

  const toggleSelect = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(
    (checked: boolean) => {
      if (checked && users) {
        setSelectedIds(new Set(users.map((u) => u.id)));
      } else {
        setSelectedIds(new Set());
      }
    },
    [users]
  );

  // Dialogs
  const [editUser, setEditUser] = useState<User | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: "toggle" | "reset" | "bulk-deactivate";
    user?: User;
  } | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Auto-dismiss feedback
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const handleToggleStatus = useCallback(
    (user: User) => {
      toggleStatus.mutate(
        { id: user.id, active: !user.active },
        {
          onSuccess: () => {
            setConfirmAction(null);
            setFeedback({
              type: "success",
              message: `${user.full_name} ${user.active ? "desativado" : "reativado"} com sucesso`,
            });
          },
          onError: () => {
            setConfirmAction(null);
            setFeedback({
              type: "error",
              message: "Erro ao alterar status do usuário",
            });
          },
        }
      );
    },
    [toggleStatus]
  );

  const handleResetPassword = useCallback(
    (user: User) => {
      resetPassword.mutate(user.id, {
        onSuccess: () => {
          setConfirmAction(null);
          setFeedback({
            type: "success",
            message: `E-mail de recuperação enviado para ${user.email ?? user.full_name}`,
          });
        },
        onError: () => {
          setConfirmAction(null);
          setFeedback({
            type: "error",
            message: "Erro ao enviar e-mail de recuperação",
          });
        },
      });
    },
    [resetPassword]
  );

  const handleBulkDeactivate = useCallback(async () => {
    if (!users) return;
    const targets = users.filter(
      (u) => selectedIds.has(u.id) && u.active
    );
    let successCount = 0;
    for (const u of targets) {
      try {
        await toggleStatus.mutateAsync({ id: u.id, active: false });
        successCount++;
      } catch {
        // continue with others
      }
    }
    setConfirmAction(null);
    setSelectedIds(new Set());
    setFeedback({
      type: successCount > 0 ? "success" : "error",
      message:
        successCount > 0
          ? `${successCount} usuário(s) desativado(s)`
          : "Erro ao desativar usuários",
    });
  }, [users, selectedIds, toggleStatus]);

  const allSelected =
    users && users.length > 0 && selectedIds.size === users.length;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Usuários</h1>
          </div>
          <p className="mt-1 text-muted-foreground">
            Gerenciamento de usuários da empresa
          </p>
        </div>
        <Link
          to="/motoboys"
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <UserPlus className="h-4 w-4" />
          Convidar
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as UserRole | "all")}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">Todos os papéis</option>
          <option value="operator">Operador</option>
          <option value="shop">Lojista</option>
          <option value="courier">Motoboy</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as "all" | "active" | "inactive")
          }
          className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">Todos os status</option>
          <option value="active">Ativo</option>
          <option value="inactive">Inativo</option>
        </select>
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar por nome ou e-mail..."
            className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          className={cn(
            "flex items-center gap-2 rounded-md p-3 text-sm",
            feedback.type === "success"
              ? "bg-green-50 text-green-800"
              : "bg-destructive/10 text-destructive"
          )}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          {feedback.message}
        </div>
      )}

      {/* Users List */}
      <div className="rounded-lg border bg-card shadow-sm">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : !users || users.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Nenhum usuário encontrado"
            description="Ajuste os filtros ou convide novos usuários"
          />
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block">
              <div className="grid grid-cols-12 items-center gap-4 border-b px-4 py-2 text-xs font-medium text-muted-foreground">
                <div className="col-span-1">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => toggleAll(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </div>
                <div className="col-span-3">Nome</div>
                <div className="col-span-2">E-mail</div>
                <div className="col-span-1">Papel</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-2">Telefone</div>
                <div className="col-span-1">Desde</div>
                <div className="col-span-1" />
              </div>
              <ul className="divide-y">
                {users.map((user) => (
                  <li
                    key={user.id}
                    className="grid grid-cols-12 items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="col-span-1">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(user.id)}
                        onChange={(e) =>
                          toggleSelect(user.id, e.target.checked)
                        }
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </div>
                    <div className="col-span-3 flex items-center gap-2">
                      <AvatarDisplay
                        src={user.avatar_url}
                        name={user.full_name}
                        size="sm"
                      />
                      <span className="truncate font-medium">
                        {user.full_name}
                      </span>
                    </div>
                    <div className="col-span-2 truncate text-sm text-muted-foreground">
                      {user.email ?? "—"}
                    </div>
                    <div className="col-span-1">
                      <RoleBadge role={user.role} />
                    </div>
                    <div className="col-span-1">
                      <ActiveBadge active={user.active} />
                    </div>
                    <div className="col-span-2 text-sm text-muted-foreground">
                      {user.phone}
                    </div>
                    <div className="col-span-1 text-sm text-muted-foreground">
                      {formatDate(user.created_at)}
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <ActionMenu
                        user={user}
                        onEdit={() => setEditUser(user)}
                        onToggleStatus={() =>
                          setConfirmAction({ type: "toggle", user })
                        }
                        onResetPassword={() =>
                          setConfirmAction({ type: "reset", user })
                        }
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden">
              {users.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  selected={selectedIds.has(user.id)}
                  onSelect={(checked) => toggleSelect(user.id, checked)}
                  onEdit={() => setEditUser(user)}
                  onToggleStatus={() =>
                    setConfirmAction({ type: "toggle", user })
                  }
                  onResetPassword={() =>
                    setConfirmAction({ type: "reset", user })
                  }
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Bulk Action Toolbar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2">
          <div className="flex items-center gap-4 rounded-lg border bg-card px-6 py-3 shadow-lg">
            <span className="text-sm font-medium">
              {selectedIds.size} selecionado(s)
            </span>
            <button
              onClick={() => setConfirmAction({ type: "bulk-deactivate" })}
              className="flex items-center gap-2 rounded-md border border-destructive px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10"
            >
              <Power className="h-4 w-4" />
              Desativar selecionados
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="rounded-md p-1 hover:bg-muted"
              aria-label="Limpar seleção"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      {editUser && (
        <EditUserDialog
          user={editUser}
          onClose={() => setEditUser(null)}
        />
      )}

      {/* Confirmation Dialogs */}
      {confirmAction?.type === "toggle" && confirmAction.user && (
        <ConfirmDialog
          title={
            confirmAction.user.active ? "Desativar Usuário" : "Reativar Usuário"
          }
          message={`Tem certeza que deseja ${confirmAction.user.active ? "desativar" : "reativar"} ${confirmAction.user.full_name}? ${
            confirmAction.user.active
              ? "O usuário não poderá mais fazer login."
              : "O usuário poderá fazer login novamente."
          }`}
          confirmLabel={
            confirmAction.user.active ? "Desativar" : "Reativar"
          }
          confirmClass={
            confirmAction.user.active
              ? "bg-destructive text-white hover:bg-destructive/90"
              : undefined
          }
          loading={toggleStatus.isPending}
          onConfirm={() => handleToggleStatus(confirmAction.user!)}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      {confirmAction?.type === "reset" && confirmAction.user && (
        <ConfirmDialog
          title="Resetar Senha"
          message={`Enviar e-mail de recuperação de senha para ${confirmAction.user.email ?? confirmAction.user.full_name}?`}
          confirmLabel="Enviar"
          loading={resetPassword.isPending}
          onConfirm={() => handleResetPassword(confirmAction.user!)}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      {confirmAction?.type === "bulk-deactivate" && (
        <ConfirmDialog
          title="Desativar Selecionados"
          message={`Tem certeza que deseja desativar ${selectedIds.size} usuário(s)? Eles não poderão mais fazer login.`}
          confirmLabel="Desativar"
          confirmClass="bg-destructive text-white hover:bg-destructive/90"
          loading={toggleStatus.isPending}
          onConfirm={handleBulkDeactivate}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}
