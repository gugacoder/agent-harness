import { useEffect, useState, useCallback } from "react";

interface OtpResendTimerProps {
  seconds?: number;
  onResend: () => void;
}

export function OtpResendTimer({ seconds = 60, onResend }: OtpResendTimerProps) {
  const [countdown, setCountdown] = useState(seconds);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleResend = useCallback(() => {
    onResend();
    setCountdown(seconds);
  }, [onResend, seconds]);

  const canResend = countdown <= 0;

  return (
    <div className="text-center">
      {canResend ? (
        <button
          type="button"
          onClick={handleResend}
          className="text-sm font-medium text-primary hover:underline"
        >
          Enviar novamente
        </button>
      ) : (
        <p className="text-sm text-muted-foreground">
          Enviar novamente em{" "}
          <span className="font-medium text-foreground">{countdown}s</span>
        </p>
      )}
    </div>
  );
}
