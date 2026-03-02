interface DotsIndicatorProps {
  total: number;
  current: number;
}

export function DotsIndicator({ total, current }: DotsIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-2 w-2 rounded-full transition-colors duration-150 ${
            i === current ? "bg-primary" : "bg-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );
}
