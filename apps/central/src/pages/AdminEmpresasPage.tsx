import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  Building2,
  Search,
  Plus,
  Power,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  MoreVertical,
} from "lucide-react";
import {
  useAdminCompanies,
  useCreateCompany,
  useUpdateCompany,
} from "@/hooks/useAdmin";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import type { AdminCompany, CompanyStatus } from "@/types/api";
import { cn } from "@/lib/utils";

const INPUT_CLASS =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

// --- Status Badge ---

function StatusBadge({ status }: { status: CompanyStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        status === "active"
          ? "bg-green-100 text-green-800"
          : "bg-red-100 text-red-800"
      )}
    >
      {status === "active" ? "Ativa" : "Suspensa"}
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

// --- Create Company Dialog ---

interface CreateDialogProps {
  onClose: () => void;
}

function CreateCompanyDialog({ onClose }: CreateDialogProps) {
  const createCompany = useCreateCompany();
  const [form, setForm] = useState({
    name: "",
    cnpj: "",
    phone: "",
    email: "",
    address: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validate = useCallback(() => {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = "Nome e obrigatorio";
    if (!form.cnpj.trim()) errors.cnpj = "CNPJ e obrigatorio";
    return errors;
  }, [form]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    createCompany.mutate(
      {
        name: form.name.trim(),
        cnpj: form.cnpj.trim(),
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        address: form.address.trim() || undefined,
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
          <h3 className="text-lg font-semibold">Nova Empresa</h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-muted"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-4">
          {createCompany.isError && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              Erro ao criar empresa. Verifique se o CNPJ ja existe.
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium">
              Nome da Empresa
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              className={INPUT_CLASS}
              placeholder="Ex: Delivery Express Ltda"
            />
            {fieldErrors.name && (
              <p className="mt-1 text-xs text-destructive">
                {fieldErrors.name}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">CNPJ</label>
            <input
              type="text"
              value={form.cnpj}
              onChange={(e) => updateField("cnpj", e.target.value)}
              className={INPUT_CLASS}
              placeholder="00.000.000/0000-00"
            />
            {fieldErrors.cnpj && (
              <p className="mt-1 text-xs text-destructive">
                {fieldErrors.cnpj}
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
                placeholder="(00) 00000-0000"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">E-mail</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                className={INPUT_CLASS}
                placeholder="contato@empresa.com"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Endereco</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => updateField("address", e.target.value)}
              className={INPUT_CLASS}
              placeholder="Rua, numero, bairro, cidade"
            />
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
              disabled={createCompany.isPending}
              className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {createCompany.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Criar Empresa
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Action Menu ---

interface ActionMenuProps {
  company: AdminCompany;
  onToggleStatus: () => void;
}

function ActionMenu({ company, onToggleStatus }: ActionMenuProps) {
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
              onToggleStatus();
            }}
            className={cn(
              "flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted",
              company.status === "active" && "text-destructive"
            )}
          >
            <Power className="h-4 w-4" />
            {company.status === "active" ? "Suspender" : "Reativar"}
          </button>
        </div>
      )}
    </div>
  );
}

// --- Company Card (Mobile) ---

function CompanyCard({
  company,
  onToggleStatus,
}: {
  company: AdminCompany;
  onToggleStatus: () => void;
}) {
  return (
    <div className="flex items-start gap-3 border-b px-4 py-3 last:border-b-0">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
        <Building2 className="h-5 w-5 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium">{company.name}</span>
          <StatusBadge status={company.status} />
        </div>
        <p className="mt-0.5 truncate text-sm text-muted-foreground">
          {company.cnpj ?? "Sem CNPJ"}
        </p>
        <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
          <span>{company.total_users} usuarios</span>
          <span>{company.total_deliveries} entregas</span>
          <span>{company.total_orders} pedidos</span>
        </div>
      </div>
      <ActionMenu company={company} onToggleStatus={onToggleStatus} />
    </div>
  );
}

// --- Main Page ---

export function AdminEmpresasPage() {
  // Filters
  const [statusFilter, setStatusFilter] = useState<
    "all" | CompanyStatus
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
    const f: { status?: CompanyStatus; search?: string } = {};
    if (statusFilter !== "all") f.status = statusFilter;
    if (debouncedSearch) f.search = debouncedSearch;
    return f;
  }, [statusFilter, debouncedSearch]);

  const { data: companies, isLoading } = useAdminCompanies(queryFilters);
  const updateCompany = useUpdateCompany();

  // Dialogs
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: "toggle";
    company: AdminCompany;
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
    (company: AdminCompany) => {
      const newStatus: CompanyStatus =
        company.status === "active" ? "suspended" : "active";
      updateCompany.mutate(
        { id: company.id, data: { status: newStatus } },
        {
          onSuccess: () => {
            setConfirmAction(null);
            setFeedback({
              type: "success",
              message: `${company.name} ${newStatus === "suspended" ? "suspensa" : "reativada"} com sucesso`,
            });
          },
          onError: () => {
            setConfirmAction(null);
            setFeedback({
              type: "error",
              message: "Erro ao alterar status da empresa",
            });
          },
        }
      );
    },
    [updateCompany]
  );

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
            <Building2 className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Empresas</h1>
          </div>
          <p className="mt-1 text-muted-foreground">
            Gerenciamento de empresas da plataforma
          </p>
        </div>
        <button
          onClick={() => setShowCreateDialog(true)}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Nova Empresa
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as "all" | CompanyStatus)
          }
          className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">Todos os status</option>
          <option value="active">Ativa</option>
          <option value="suspended">Suspensa</option>
        </select>
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar por nome ou CNPJ..."
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

      {/* Companies List */}
      <div className="rounded-lg border bg-card shadow-sm">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : !companies || companies.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="Nenhuma empresa encontrada"
            description="Ajuste os filtros ou crie uma nova empresa"
          />
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block">
              <div className="grid grid-cols-12 items-center gap-4 border-b px-4 py-2 text-xs font-medium text-muted-foreground">
                <div className="col-span-3">Empresa</div>
                <div className="col-span-2">CNPJ</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-1 text-right">Usuarios</div>
                <div className="col-span-1 text-right">Entregas</div>
                <div className="col-span-1 text-right">Pedidos</div>
                <div className="col-span-2">Criada em</div>
                <div className="col-span-1" />
              </div>
              <ul className="divide-y">
                {companies.map((company) => (
                  <li
                    key={company.id}
                    className="grid grid-cols-12 items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="col-span-3 flex items-center gap-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                        <Building2 className="h-4 w-4 text-primary" />
                      </div>
                      <span className="truncate font-medium">
                        {company.name}
                      </span>
                    </div>
                    <div className="col-span-2 truncate text-sm text-muted-foreground">
                      {company.cnpj ?? "—"}
                    </div>
                    <div className="col-span-1">
                      <StatusBadge status={company.status} />
                    </div>
                    <div className="col-span-1 text-right text-sm text-muted-foreground">
                      {company.total_users}
                    </div>
                    <div className="col-span-1 text-right text-sm text-muted-foreground">
                      {company.total_deliveries}
                    </div>
                    <div className="col-span-1 text-right text-sm text-muted-foreground">
                      {company.total_orders}
                    </div>
                    <div className="col-span-2 text-sm text-muted-foreground">
                      {formatDate(company.created_at)}
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <ActionMenu
                        company={company}
                        onToggleStatus={() =>
                          setConfirmAction({ type: "toggle", company })
                        }
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden">
              {companies.map((company) => (
                <CompanyCard
                  key={company.id}
                  company={company}
                  onToggleStatus={() =>
                    setConfirmAction({ type: "toggle", company })
                  }
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Create Company Dialog */}
      {showCreateDialog && (
        <CreateCompanyDialog onClose={() => setShowCreateDialog(false)} />
      )}

      {/* Confirmation Dialog */}
      {confirmAction?.type === "toggle" && (
        <ConfirmDialog
          title={
            confirmAction.company.status === "active"
              ? "Suspender Empresa"
              : "Reativar Empresa"
          }
          message={`Tem certeza que deseja ${
            confirmAction.company.status === "active"
              ? "suspender"
              : "reativar"
          } ${confirmAction.company.name}? ${
            confirmAction.company.status === "active"
              ? "Os usuarios desta empresa nao poderao operar."
              : "A empresa podera operar normalmente."
          }`}
          confirmLabel={
            confirmAction.company.status === "active"
              ? "Suspender"
              : "Reativar"
          }
          confirmClass={
            confirmAction.company.status === "active"
              ? "bg-destructive text-white hover:bg-destructive/90"
              : undefined
          }
          loading={updateCompany.isPending}
          onConfirm={() => handleToggleStatus(confirmAction.company)}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}
