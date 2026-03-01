import { useState, type FormEvent } from "react";
import { Navigate } from "react-router";
import { useAuth } from "@/contexts/AuthContext";

export function LoginPage() {
  const { user, loading, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login(email, password);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Erro ao fazer login";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
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

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-6 rounded-lg border border-border bg-card p-6"
      >
        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
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
      </form>
    </div>
  );
}
