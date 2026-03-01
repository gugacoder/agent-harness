import type { CourierStatus } from "@/components/ui/StatusBadge";

interface StatusToggleProps {
  status: CourierStatus;
  isToggling: boolean;
  onToggle: () => void;
}

export function StatusToggle({
  status,
  isToggling,
  onToggle,
}: StatusToggleProps) {
  const isAvailable = status === "available";
  const isBusy = status === "busy";

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={isToggling || isBusy}
      aria-label={
        isAvailable ? "Ficar offline" : "Ficar disponível"
      }
      className={`
        relative flex h-16 w-full items-center justify-center rounded-2xl text-lg font-semibold
        transition-colors duration-200
        ${
          isBusy
            ? "cursor-not-allowed bg-accent text-accent-foreground opacity-70"
            : isAvailable
              ? "bg-green-500 text-white active:bg-green-600"
              : "bg-muted text-muted-foreground active:bg-muted/80"
        }
        ${isToggling ? "animate-pulse" : ""}
      `}
    >
      {/* Toggle indicator */}
      <span
        className={`
          mr-3 inline-block h-5 w-10 rounded-full border-2 transition-colors duration-200
          ${
            isAvailable
              ? "border-white bg-white/30"
              : "border-muted-foreground/50 bg-transparent"
          }
        `}
      >
        <span
          className={`
            block h-full w-4 rounded-full transition-all duration-200
            ${
              isAvailable
                ? "translate-x-5 bg-white"
                : "translate-x-0.5 bg-muted-foreground/50"
            }
          `}
        />
      </span>

      {isToggling
        ? "Atualizando..."
        : isBusy
          ? "Ocupado (entrega em andamento)"
          : isAvailable
            ? "Disponível"
            : "Offline"}
    </button>
  );
}
