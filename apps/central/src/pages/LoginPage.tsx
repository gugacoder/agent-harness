export function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="w-full max-w-sm space-y-6 rounded-lg border border-border bg-background p-8 shadow-sm">
        <div className="flex flex-col items-center gap-2">
          <img src="/logo.svg" alt="Chega.la" className="h-12 w-12" />
          <h1 className="text-xl font-bold text-primary">Chega.la Central</h1>
          <p className="text-sm text-muted-foreground">
            Entre com suas credenciais
          </p>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              placeholder="seu@email.com"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Senha
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
            />
          </div>
          <button className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Entrar
          </button>
        </div>
      </div>
    </div>
  );
}
