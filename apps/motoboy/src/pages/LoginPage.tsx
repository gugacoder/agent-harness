import { useState, type FormEvent } from "react";
import { Navigate, Link } from "react-router";
import { useAuth } from "@/contexts/AuthContext";
import { useOtpLogin } from "@/hooks/useOtpLogin";
import { PhoneInput } from "@/components/auth/PhoneInput";
import { OtpInput } from "@/components/auth/OtpInput";
import { OtpResendTimer } from "@/components/auth/OtpResendTimer";

type LoginMode = "otp" | "password";

export function LoginPage() {
  const { user, loading, login } = useAuth();
  const otp = useOtpLogin();

  const [mode, setMode] = useState<LoginMode>("otp");
  const [phone, setPhone] = useState("");

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
    if (phone.length < 11) return;
    otp.sendCode(`+55${phone}`, "whatsapp");
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-[480px] flex-col items-center justify-center bg-background p-4">
      <img src="/logo.svg" alt="Chega.la" className="mb-6 h-16 w-16" />
      <h1 className="mb-2 text-2xl font-bold text-primary">
        Chega.la Motoboy
      </h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Faça login para gerenciar suas entregas
      </p>

      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6">
        {mode === "otp" ? (
          <div className="space-y-6">
            {otp.error && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {otp.error}
              </div>
            )}

            {otp.step === "phone" ? (
              <div className="space-y-4 transition-opacity duration-200">
                <PhoneInput
                  value={phone}
                  onChange={setPhone}
                  disabled={otp.isLoading}
                />
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={otp.isLoading || phone.length < 11}
                  className="h-12 w-full rounded-md bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {otp.isLoading ? "Enviando..." : "Enviar código"}
                </button>
              </div>
            ) : (
              <div className="space-y-4 transition-opacity duration-200">
                <p className="text-center text-sm text-muted-foreground">
                  Digite o código enviado para{" "}
                  <span className="font-medium text-foreground">
                    +55 {phone}
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
                  Alterar telefone
                </button>
              </div>
            )}

            <div className="border-t border-border pt-4 text-center">
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
          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            {pwError && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
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
                className="h-12 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
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
                className="h-12 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
                disabled={submitting}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="h-12 w-full rounded-md bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {submitting ? "Entrando..." : "Entrar"}
            </button>

            <div className="border-t border-border pt-4 text-center">
              <button
                type="button"
                onClick={() => setMode("otp")}
                className="text-sm text-muted-foreground hover:text-primary hover:underline"
              >
                Entrar com WhatsApp
              </button>
            </div>
          </form>
        )}
      </div>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Nao tem conta?{" "}
        <Link
          to="/cadastro"
          className="font-medium text-primary hover:underline"
        >
          Criar conta
        </Link>
      </p>
    </div>
  );
}
