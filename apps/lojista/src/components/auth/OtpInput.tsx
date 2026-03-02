import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";

interface OtpInputProps {
  length?: number;
  onComplete: (code: string) => void;
  error?: boolean;
  disabled?: boolean;
}

export function OtpInput({ length = 6, onComplete, error, disabled }: OtpInputProps) {
  return (
    <div
      className={cn(
        "flex justify-center",
        error && "animate-[shake_0.3s_ease-in-out]",
      )}
    >
      <InputOTP
        maxLength={length}
        autoComplete="one-time-code"
        disabled={disabled}
        onComplete={onComplete}
      >
        <InputOTPGroup>
          {Array.from({ length }, (_, i) => (
            <InputOTPSlot
              key={i}
              index={i}
              className={cn(error && "border-destructive")}
            />
          ))}
        </InputOTPGroup>
      </InputOTP>
    </div>
  );
}
