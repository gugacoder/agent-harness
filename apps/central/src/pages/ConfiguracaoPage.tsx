import { useState } from "react";
import {
  Settings,
  Loader2,
  CheckCircle2,
  Circle,
  Camera,
  MessageSquare,
  Mail,
  Shield,
  AlertCircle,
} from "lucide-react";
import {
  useCompanyConfig,
  useUpdateCompanyConfig,
  useTestWhatsApp,
  useTestSmtp,
  useDetectTls,
} from "@/hooks/useCompanyConfig";
import { Skeleton } from "@/components/ui/Skeleton";
import type { CompanyConfig, UpdateCompanyConfigData } from "@/types/api";

// --- Status Badge ---

function ConfigStatusBadge({ configured }: { configured: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        configured
          ? "bg-green-100 text-green-800"
          : "bg-red-100 text-red-800"
      }`}
    >
      {configured ? (
        <>
          <CheckCircle2 className="h-3 w-3" />
          Configurado
        </>
      ) : (
        <>
          <AlertCircle className="h-3 w-3" />
          Nao configurado
        </>
      )}
    </span>
  );
}

// --- Feedback Message ---

function FeedbackMessage({ result }: { result: { ok?: boolean; error?: string } | null }) {
  if (!result) return null;
  if (result.ok) {
    return (
      <p className="mt-2 text-sm text-green-600 flex items-center gap-1">
        <CheckCircle2 className="h-4 w-4" />
        Teste realizado com sucesso
      </p>
    );
  }
  return (
    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
      <AlertCircle className="h-4 w-4" />
      {result.error || "Erro desconhecido"}
    </p>
  );
}

// --- WhatsApp Section ---

function WhatsAppSection({
  config,
  onSave,
  saving,
}: {
  config: CompanyConfig;
  onSave: (data: UpdateCompanyConfigData) => Promise<void>;
  saving: boolean;
}) {
  const [url, setUrl] = useState(config.otp_whatsapp_url || "");
  const [apiKey, setApiKey] = useState("");
  const [enabled, setEnabled] = useState(config.otp_whatsapp_enabled);
  const testWhatsApp = useTestWhatsApp();
  const [testResult, setTestResult] = useState<{ ok?: boolean; error?: string } | null>(null);

  const isConfigured = config.otp_whatsapp_enabled && config.otp_whatsapp_api_key_set;

  const handleSave = async () => {
    const data: UpdateCompanyConfigData = {
      otp_whatsapp_enabled: enabled,
      otp_whatsapp_url: url,
    };
    if (apiKey) {
      data.otp_whatsapp_api_key = apiKey;
    }
    await onSave(data);
    setApiKey("");
  };

  const handleTest = async () => {
    setTestResult(null);
    try {
      const result = await testWhatsApp.mutateAsync();
      setTestResult(result);
    } catch {
      setTestResult({ error: "Falha na requisicao" });
    }
  };

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">WhatsApp (Evolution API)</h2>
          </div>
          <ConfigStatusBadge configured={isConfigured} />
        </div>
      </div>

      <div className="px-6 py-5 space-y-4">
        {/* Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">Ativar canal WhatsApp</p>
            <p className="text-sm text-muted-foreground">
              Permite envio de codigos OTP via WhatsApp.
            </p>
          </div>
          <button
            onClick={() => setEnabled(!enabled)}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
            aria-label={enabled ? "Desativar WhatsApp" : "Ativar WhatsApp"}
          >
            {enabled ? (
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            ) : (
              <Circle className="h-6 w-6 text-muted-foreground" />
            )}
            <span className={enabled ? "text-green-600" : "text-muted-foreground"}>
              {enabled ? "Ativado" : "Desativado"}
            </span>
          </button>
        </div>

        {/* URL */}
        <div>
          <label htmlFor="wa-url" className="block text-sm font-medium mb-1">
            URL da instancia
          </label>
          <input
            id="wa-url"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://evolution.exemplo.com"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        {/* API Key */}
        <div>
          <label htmlFor="wa-key" className="block text-sm font-medium mb-1">
            API Key
          </label>
          <input
            id="wa-key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={config.otp_whatsapp_api_key_set ? "\u2022\u2022\u2022\u2022\u2022\u2022" : "Insira a API Key"}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Salvar
          </button>
          <button
            onClick={handleTest}
            disabled={testWhatsApp.isPending}
            className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
          >
            {testWhatsApp.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Testar conexao
          </button>
        </div>

        <FeedbackMessage result={testResult} />
      </div>
    </div>
  );
}

// --- SMTP Section ---

function SmtpSection({
  config,
  onSave,
  saving,
}: {
  config: CompanyConfig;
  onSave: (data: UpdateCompanyConfigData) => Promise<void>;
  saving: boolean;
}) {
  const [enabled, setEnabled] = useState(config.otp_smtp_enabled);
  const [host, setHost] = useState(config.otp_smtp_host || "");
  const [port, setPort] = useState(config.otp_smtp_port?.toString() || "587");
  const [user, setUser] = useState(config.otp_smtp_user || "");
  const [pass, setPass] = useState("");
  const [from, setFrom] = useState(config.otp_smtp_from || "");
  const [smtpTls, setSmtpTls] = useState(config.otp_smtp_tls);
  const testSmtp = useTestSmtp();
  const detectTls = useDetectTls();
  const [testResult, setTestResult] = useState<{ ok?: boolean; error?: string } | null>(null);

  const isConfigured = config.otp_smtp_enabled && config.otp_smtp_pass_set;

  const handleSave = async () => {
    const data: UpdateCompanyConfigData = {
      otp_smtp_enabled: enabled,
      otp_smtp_host: host,
      otp_smtp_port: parseInt(port, 10) || 587,
      otp_smtp_user: user,
      otp_smtp_from: from,
      otp_smtp_tls: smtpTls,
    };
    if (pass) {
      data.otp_smtp_pass = pass;
    }
    await onSave(data);
    setPass("");
  };

  const handleTestSmtp = async () => {
    setTestResult(null);
    try {
      const result = await testSmtp.mutateAsync();
      setTestResult(result);
    } catch {
      setTestResult({ error: "Falha na requisicao" });
    }
  };

  const handleDetectTls = async () => {
    if (!host || !port) return;
    try {
      const result = await detectTls.mutateAsync({ host, port: parseInt(port, 10) || 587 });
      if (result.success) {
        setSmtpTls(result.tls);
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Email (SMTP)</h2>
          </div>
          <ConfigStatusBadge configured={isConfigured} />
        </div>
      </div>

      <div className="px-6 py-5 space-y-4">
        {/* Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">Ativar canal Email</p>
            <p className="text-sm text-muted-foreground">
              Permite envio de codigos OTP via email.
            </p>
          </div>
          <button
            onClick={() => setEnabled(!enabled)}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
            aria-label={enabled ? "Desativar Email" : "Ativar Email"}
          >
            {enabled ? (
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            ) : (
              <Circle className="h-6 w-6 text-muted-foreground" />
            )}
            <span className={enabled ? "text-green-600" : "text-muted-foreground"}>
              {enabled ? "Ativado" : "Desativado"}
            </span>
          </button>
        </div>

        {/* Host + Port */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label htmlFor="smtp-host" className="block text-sm font-medium mb-1">
              Host
            </label>
            <input
              id="smtp-host"
              type="text"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              placeholder="smtp.exemplo.com"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div>
            <label htmlFor="smtp-port" className="block text-sm font-medium mb-1">
              Porta
            </label>
            <input
              id="smtp-port"
              type="number"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              placeholder="587"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>

        {/* User + Password */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="smtp-user" className="block text-sm font-medium mb-1">
              Usuario
            </label>
            <input
              id="smtp-user"
              type="text"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              placeholder="usuario@exemplo.com"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div>
            <label htmlFor="smtp-pass" className="block text-sm font-medium mb-1">
              Senha
            </label>
            <input
              id="smtp-pass"
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder={config.otp_smtp_pass_set ? "\u2022\u2022\u2022\u2022\u2022\u2022" : "Insira a senha"}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>

        {/* From */}
        <div>
          <label htmlFor="smtp-from" className="block text-sm font-medium mb-1">
            Email remetente
          </label>
          <input
            id="smtp-from"
            type="email"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            placeholder="noreply@exemplo.com"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        {/* TLS Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium">TLS</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDetectTls}
              disabled={detectTls.isPending || !host}
              className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent disabled:opacity-50"
            >
              {detectTls.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
              Detectar TLS
            </button>
            <button
              onClick={() => setSmtpTls(!smtpTls)}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
              aria-label={smtpTls ? "Desativar TLS" : "Ativar TLS"}
            >
              {smtpTls ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground" />
              )}
              <span className={smtpTls ? "text-green-600" : "text-muted-foreground"}>
                {smtpTls ? "Ativado" : "Desativado"}
              </span>
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Salvar
          </button>
          <button
            onClick={handleTestSmtp}
            disabled={testSmtp.isPending}
            className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
          >
            {testSmtp.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Enviar email de teste
          </button>
        </div>

        <FeedbackMessage result={testResult} />
      </div>
    </div>
  );
}

// --- Main Page ---

export function ConfiguracaoPage() {
  const { data: config, isLoading, error } = useCompanyConfig();
  const updateConfig = useUpdateCompanyConfig();
  const [toggling, setToggling] = useState(false);

  const handleTogglePodRequired = async () => {
    if (!config || toggling) return;
    setToggling(true);
    try {
      await updateConfig.mutateAsync({ pod_required: !config.pod_required });
    } finally {
      setToggling(false);
    }
  };

  const handleSaveConfig = async (data: UpdateCompanyConfigData) => {
    await updateConfig.mutateAsync(data);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <Settings className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        </div>
        <p className="mt-1 text-muted-foreground">
          Gerencie as configurações da sua empresa.
        </p>
      </div>

      {/* POD Section */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="border-b px-6 py-4">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Comprovante de Entrega (POD)</h2>
          </div>
        </div>

        <div className="px-6 py-5">
          {isLoading ? (
            <div className="flex items-center gap-4">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-5 w-64" />
            </div>
          ) : error ? (
            <p className="text-sm text-destructive">
              Erro ao carregar configurações: {error instanceof Error ? error.message : "Erro desconhecido"}
            </p>
          ) : (
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">POD obrigatório</p>
                <p className="text-sm text-muted-foreground">
                  Quando ativado, motoboys devem enviar foto e assinatura ao concluir cada entrega.
                </p>
              </div>

              <button
                onClick={handleTogglePodRequired}
                disabled={toggling}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
                aria-label={config?.pod_required ? "Desativar POD obrigatório" : "Ativar POD obrigatório"}
              >
                {toggling ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                ) : config?.pod_required ? (
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                ) : (
                  <Circle className="h-6 w-6 text-muted-foreground" />
                )}
                <span className={config?.pod_required ? "text-green-600" : "text-muted-foreground"}>
                  {config?.pod_required ? "Ativado" : "Desativado"}
                </span>
              </button>
            </div>
          )}

          {updateConfig.isError && (
            <p className="mt-3 text-sm text-destructive">
              Erro ao atualizar: {updateConfig.error instanceof Error ? updateConfig.error.message : "Erro desconhecido"}
            </p>
          )}
        </div>
      </div>

      {/* WhatsApp Section */}
      {config && (
        <WhatsAppSection
          config={config}
          onSave={handleSaveConfig}
          saving={updateConfig.isPending}
        />
      )}

      {/* SMTP Section */}
      {config && (
        <SmtpSection
          config={config}
          onSave={handleSaveConfig}
          saving={updateConfig.isPending}
        />
      )}
    </div>
  );
}
