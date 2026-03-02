interface HighlightTooltipProps {
  title: string;
  description: string;
  position: { top: number; left: number };
  arrowDirection: "top" | "bottom" | "left" | "right";
  onNext: () => void;
  onSkip: () => void;
  stepNumber: number;
  totalSteps: number;
}

const arrowClasses: Record<string, string> = {
  top: "-top-1.5 left-6",
  bottom: "-bottom-1.5 left-6",
  left: "top-4 -left-1.5",
  right: "top-4 -right-1.5",
};

export function HighlightTooltip({
  title,
  description,
  position,
  arrowDirection,
  onNext,
  onSkip,
  stepNumber,
  totalSteps,
}: HighlightTooltipProps) {
  return (
    <div
      className="fixed z-[60] max-w-xs rounded-lg bg-card p-4 shadow-lg"
      style={{ top: position.top, left: position.left }}
    >
      {/* Arrow indicator */}
      <div
        className={`absolute h-3 w-3 rotate-45 bg-card ${arrowClasses[arrowDirection]}`}
      />

      {/* Header with step counter */}
      <div className="flex items-start justify-between">
        <h3 className="text-sm font-medium">{title}</h3>
        <span className="ml-2 shrink-0 text-xs text-muted-foreground">
          {stepNumber}/{totalSteps}
        </span>
      </div>

      {/* Description */}
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>

      {/* Footer: Skip + Next */}
      <div className="mt-3 flex items-center justify-between">
        <button
          type="button"
          onClick={onSkip}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Pular tour
        </button>
        <button
          type="button"
          onClick={onNext}
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary/90"
        >
          Próximo
        </button>
      </div>
    </div>
  );
}
