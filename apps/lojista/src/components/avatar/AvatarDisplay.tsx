import { Camera } from "lucide-react";
import { getAvatarColor, getInitials } from "../../lib/avatar-color";
import { cn } from "../../lib/utils";

interface AvatarDisplayProps {
  src?: string | null;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  editable?: boolean;
  onEdit?: () => void;
}

const sizeMap = {
  sm: 32,
  md: 40,
  lg: 64,
  xl: 128,
} as const;

const iconSizeMap = {
  sm: 12,
  md: 14,
  lg: 20,
  xl: 32,
} as const;

const textSizeMap = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-lg",
  xl: "text-3xl",
} as const;

export function AvatarDisplay({
  src,
  name,
  size = "md",
  editable = false,
  onEdit,
}: AvatarDisplayProps) {
  const px = sizeMap[size];
  const iconPx = iconSizeMap[size];
  const textClass = textSizeMap[size];
  const color = getAvatarColor(name);
  const initials = getInitials(name);

  return (
    <button
      type="button"
      className={cn(
        "relative inline-flex items-center justify-center rounded-full overflow-hidden shrink-0",
        editable ? "cursor-pointer group" : "cursor-default"
      )}
      style={{ width: px, height: px }}
      onClick={editable ? onEdit : undefined}
      disabled={!editable}
      aria-label={editable ? "Alterar foto de perfil" : name}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover"
          draggable={false}
        />
      ) : (
        <div
          className={cn(
            "w-full h-full flex items-center justify-center font-semibold text-white select-none",
            textClass
          )}
          style={{ backgroundColor: color }}
        >
          {initials}
        </div>
      )}

      {editable && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 group-focus-visible:bg-black/40 transition-colors rounded-full">
          <Camera
            size={iconPx}
            className="text-white opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity"
          />
        </div>
      )}
    </button>
  );
}
