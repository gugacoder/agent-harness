export function LoginPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-[480px] flex-col items-center justify-center bg-background p-4">
      <img src="/logo.svg" alt="Chega.la" className="mb-6 h-16 w-16" />
      <h1 className="mb-2 text-2xl font-bold text-primary">Chega.la Motoboy</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Faça login para gerenciar suas entregas
      </p>
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6">
        <p className="text-center text-sm text-muted-foreground">
          Login será implementado em F-003.
        </p>
      </div>
    </div>
  );
}
