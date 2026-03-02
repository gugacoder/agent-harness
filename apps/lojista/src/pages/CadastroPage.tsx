import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router";
import { ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { PhoneInput } from "@/components/auth/PhoneInput";
import { useRegister } from "@/hooks/useRegister";

export function CadastroPage() {
  const [searchParams] = useSearchParams();
  const companyId = searchParams.get("company") ?? "";

  const register = useRegister();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [tradeName, setTradeName] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!companyId || !fullName.trim() || phone.length < 11) return;

    register.mutate({
      company_id: companyId,
      full_name: fullName.trim(),
      phone: `+55${phone}`,
      email: email.trim() || undefined,
      requested_role: "shop",
      extra_data: tradeName.trim()
        ? { trade_name: tradeName.trim() }
        : undefined,
    });
  }

  // Success screen
  if (register.isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted px-4">
        <div className="w-full max-w-sm rounded-lg border border-border bg-background p-8 text-center shadow-sm">
          <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-green-500" />
          <h1 className="mb-2 text-xl font-bold">Cadastro enviado!</h1>
          <p className="mb-6 text-sm text-muted-foreground">
            Aguardando aprovacao do operador. Voce podera fazer login apos a
            aprovacao.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-background p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-2">
          <img src="/logo.svg" alt="Chega.la" className="h-12 w-12" />
          <h1 className="text-xl font-bold text-primary">Criar conta</h1>
          <p className="text-sm text-muted-foreground">
            Cadastre-se como lojista
          </p>
        </div>

        {!companyId && (
          <div className="mb-4 flex items-center gap-2 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Link de cadastro invalido. Solicite um novo link ao operador.
          </div>
        )}

        {register.isError && (
          <div className="mb-4 flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {register.error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="fullName" className="text-sm font-medium">
              Nome completo
            </label>
            <input
              id="fullName"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Seu nome completo"
              className="w-full rounded-md border border-input bg-background px-3 py-3 text-sm outline-none ring-ring focus:ring-2"
              disabled={register.isPending}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full rounded-md border border-input bg-background px-3 py-3 text-sm outline-none ring-ring focus:ring-2"
              disabled={register.isPending}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Telefone</label>
            <PhoneInput
              value={phone}
              onChange={setPhone}
              disabled={register.isPending}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="tradeName" className="text-sm font-medium">
              Nome da loja
            </label>
            <input
              id="tradeName"
              type="text"
              value={tradeName}
              onChange={(e) => setTradeName(e.target.value)}
              placeholder="Nome fantasia da loja"
              className="w-full rounded-md border border-input bg-background px-3 py-3 text-sm outline-none ring-ring focus:ring-2"
              disabled={register.isPending}
            />
          </div>

          <button
            type="submit"
            disabled={
              register.isPending ||
              !companyId ||
              !fullName.trim() ||
              phone.length < 11
            }
            className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {register.isPending && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            {register.isPending ? "Enviando..." : "Enviar cadastro"}
          </button>
        </form>

        <div className="mt-4 border-t border-border pt-4 text-center">
          <Link
            to="/login"
            className="text-sm text-muted-foreground hover:text-primary hover:underline"
          >
            Ja tem uma conta? Entrar
          </Link>
        </div>
      </div>
    </div>
  );
}
