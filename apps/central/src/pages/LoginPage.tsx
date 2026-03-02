import { useState, type FormEvent } from "react";
import { Navigate } from "react-router";
import { useAuth } from "@/contexts/AuthContext";
import { useOtpLogin } from "@/hooks/useOtpLogin";
import { OtpInput } from "@/components/auth/OtpInput";
import { OtpResendTimer } from "@/components/auth/OtpResendTimer";

type LoginMode = "otp" | "password";

export function LoginPage() {
  const { user, loading, login } = useAuth();
  const otp = useOtpLogin();

  const [mode, setMode] = useState<LoginMode>("otp");
  const [otpEmail, setOtpEmail] = useState("");

  // Legacy password form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    setPwError("");
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setPwError(err instanceof Error ? err.message : "Erro ao fazer login");
    } finally {
      setSubmitting(false);
    }
  }

  function handleSendCode() {
    if (!otpEmail) return;
    otp.sendCode(otpEmail, "email");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="w-full max-w-sm rounded-lg border border-border bg-background p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-2">
          <img src="/logo.svg" alt="Chega.la" className="h-12 w-12" />
          <h1 className="text-xl font-bold text-primary">Chega.la Central</h1>
          <p className="text-sm text-muted-foreground">
            Área <strong>Central</strong>
          </p>
        </div>

        {mode === "otp" ? (
          <div className="space-y-4">
            {otp.error && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {otp.error}
              </div>
            )}

            {otp.step === "phone" ? (
              <div className="space-y-4 transition-opacity duration-200">
                <div className="space-y-2">
                  <label htmlFor="otp-email" className="text-sm font-medium">
                    E-mail
                  </label>
                  <input
                    id="otp-email"
                    type="email"
                    value={otpEmail}
                    onChange={(e) => setOtpEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
                    disabled={otp.isLoading}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={otp.isLoading || !otpEmail}
                  className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {otp.isLoading ? "Enviando..." : "Enviar código"}
                </button>
              </div>
            ) : (
              <div className="space-y-4 transition-opacity duration-200">
                <p className="text-center text-sm text-muted-foreground">
                  Digite o código enviado para{" "}
                  <span className="font-medium text-foreground">
                    {otpEmail}
                  </span>
                </p>
                <OtpInput
                  onComplete={otp.verifyCode}
                  error={!!otp.error}
                  disabled={otp.isLoading}
                />
                <OtpResendTimer onResend={otp.resendCode} />
                <button
                  type="button"
                  onClick={otp.goBack}
                  className="w-full text-sm text-muted-foreground hover:text-foreground"
                >
                  Alterar email
                </button>
              </div>
            )}

            <div className="border-t border-border pt-3 text-center">
              <button
                type="button"
                onClick={() => setMode("password")}
                className="text-sm text-muted-foreground hover:text-primary hover:underline"
              >
                Entrar com email e senha
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            {pwError && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {pwError}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
                disabled={submitting}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Senha
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
                disabled={submitting}
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {submitting ? "Entrando..." : "Entrar"}
            </button>

            <div className="border-t border-border pt-3 text-center">
              <button
                type="button"
                onClick={() => setMode("otp")}
                className="text-sm text-muted-foreground hover:text-primary hover:underline"
              >
                Entrar com código por email
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
