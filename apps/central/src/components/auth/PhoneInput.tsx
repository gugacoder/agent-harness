import { useCallback, type ChangeEvent } from "react";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

function formatPhone(digits: string): string {
  const d = digits.replace(/\D/g, "").slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function extractDigits(masked: string): string {
  return masked.replace(/\D/g, "").slice(0, 11);
}

export function PhoneInput({ value, onChange, error, disabled }: PhoneInputProps) {
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const digits = extractDigits(e.target.value);
      onChange(digits);
    },
    [onChange],
  );

  return (
    <div className="space-y-2">
      <label htmlFor="phone" className="text-sm font-medium">
        Telefone
      </label>
      <div className="flex">
        <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">
          +55
        </span>
        <input
          id="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={formatPhone(value)}
          onChange={handleChange}
          placeholder="(11) 99999-9999"
          disabled={disabled}
          className={`h-12 w-full rounded-r-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2 ${error ? "border-destructive" : ""}`}
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
