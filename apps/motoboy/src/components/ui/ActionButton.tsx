import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionButtonProps {
  label: string;
  onClick: () => void;
  loading?: boolean;
  variant?: "primary" | "destructive";
  className?: string;
}

export function ActionButton({
  label,
  onClick,
  loading = false,
  variant = "primary",
  className,
}: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={cn(
        "flex min-h-[48px] w-full items-center justify-center rounded-lg px-6 py-3 text-base font-semibold transition-colors disabled:opacity-50",
        variant === "primary" &&
          "bg-primary text-primary-foreground hover:bg-primary/90",
        variant === "destructive" &&
          "bg-destructive text-white hover:bg-destructive/90",
        className,
      )}
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        label
      )}
    </button>
  );
}
