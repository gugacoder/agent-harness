import { useState } from "react";
import {
  Plus,
  Trash2,
  ChevronRight,
  CheckCircle2,
  Circle,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import type { PricingTable } from "@/types/api";

interface PricingTableListProps {
  tables: PricingTable[] | undefined;
  isLoading: boolean;
  onSelect: (tableId: string) => void;
  onInvalidate: () => void;
}

export function PricingTableList({
  tables,
  isLoading,
  onSelect,
  onInvalidate,
}: PricingTableListProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      await api
        .post("api/pricing-tables", { json: { name: newName.trim() } })
        .json();
      setNewName("");
      setShowCreate(false);
      onInvalidate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar tabela");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setError(null);
    try {
      await api.delete(`api/pricing-tables/${id}`).json();
      onInvalidate();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message.includes("used in deliveries")
            ? "Tabela em uso por entregas, não pode ser removida"
            : err.message
          : "Erro ao remover tabela",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (table: PricingTable) => {
    setTogglingId(table.id);
    setError(null);
    try {
      await api
        .patch(`api/pricing-tables/${table.id}`, {
          json: { active: !table.active },
        })
        .json();
      onInvalidate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar");
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Create button / form */}
      {showCreate ? (
        <form
          onSubmit={handleCreate}
          className="flex items-center gap-2 rounded-lg border bg-card p-3 shadow-sm"
        >
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nome da tabela"
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            autoFocus
          />
          <button
            type="submit"
            disabled={creating || !newName.trim()}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {creating && <Loader2 className="h-4 w-4 animate-spin" />}
            Criar
          </button>
          <button
            type="button"
            onClick={() => {
              setShowCreate(false);
              setNewName("");
            }}
            className="rounded-md border border-input px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            Cancelar
          </button>
        </form>
      ) : (
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Nova Tabela de Preço
        </button>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Table list */}
      <div className="rounded-lg border bg-card shadow-sm">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14" />
            ))}
          </div>
        ) : !tables || tables.length === 0 ? (
          <EmptyState
            icon={Circle}
            title="Nenhuma tabela de preço"
            description="Crie a primeira tabela para configurar preços"
          />
        ) : (
          <ul className="divide-y">
            {tables.map((table) => (
              <li
                key={table.id}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
              >
                {/* Active toggle */}
                <button
                  onClick={() => handleToggleActive(table)}
                  disabled={togglingId === table.id}
                  className="shrink-0"
                  title={table.active ? "Tabela ativa" : "Clique para ativar"}
                >
                  {togglingId === table.id ? (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  ) : table.active ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>

                {/* Table info - clickable to go to detail */}
                <button
                  onClick={() => onSelect(table.id)}
                  className="flex flex-1 items-center justify-between text-left"
                >
                  <div>
                    <span className="font-medium">{table.name}</span>
                    {table.active && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                        Ativa
                      </span>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>

                {/* Delete button */}
                <button
                  onClick={() => handleDelete(table.id)}
                  disabled={deletingId === table.id}
                  className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  title="Remover tabela"
                >
                  {deletingId === table.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
