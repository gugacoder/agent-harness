import { MapPinOff, ExternalLink } from "lucide-react";
import type { LocationState } from "@/hooks/useLocationSharing";

interface GpsBannerProps {
  state: LocationState;
}

export function GpsBanner({ state }: GpsBannerProps) {
  if (state !== "denied") return null;

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between gap-3 bg-destructive px-4 py-2.5 text-destructive-foreground">
      <div className="flex items-center gap-2">
        <MapPinOff className="h-4 w-4 shrink-0" />
        <span className="text-sm font-medium">
          Ative sua localização para receber entregas
        </span>
      </div>
      <a
        href="https://support.google.com/chrome/answer/142065"
        target="_blank"
        rel="noopener noreferrer"
        className="flex shrink-0 items-center gap-1 rounded-md bg-destructive-foreground/20 px-2.5 py-1 text-xs font-medium text-destructive-foreground transition-colors hover:bg-destructive-foreground/30"
      >
        Como ativar
        <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}
