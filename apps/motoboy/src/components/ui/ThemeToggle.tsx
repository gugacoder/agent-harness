import { Sun, Monitor, Moon } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

const options = [
  { value: "light" as const, icon: Sun, label: "Claro" },
  { value: "auto" as const, icon: Monitor, label: "Auto" },
  { value: "dark" as const, icon: Moon, label: "Escuro" },
];

export function ThemeToggle() {
  const { mode, setMode } = useTheme();

  return (
    <div className="flex items-center gap-0.5 rounded-full bg-muted p-0.5">
      {options.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setMode(value)}
          className={`rounded-full p-1.5 transition-colors ${
            mode === value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
          title={label}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
}
