import { useState, useEffect } from "react";
import { User, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { AvatarUpload } from "@/components/avatar/AvatarUpload";

const INPUT_CLASS =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

interface FormErrors {
  full_name?: string;
  phone?: string;
}

export function PerfilPage() {
  const { user } = useAuth();
  const { data, isLoading, error: fetchError } = useProfile();
  const updateProfile = useUpdateProfile();

  const profile = data?.profile;

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Pre-fill form when profile loads
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
    }
  }, [profile]);

  // Clear success message after 3s
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  function validate(): boolean {
    const newErrors: FormErrors = {};
    if (!fullName.trim() || fullName.trim().length < 2) {
      newErrors.full_name = "Nome deve ter pelo menos 2 caracteres";
    }
    if (!phone.trim() || phone.trim().length < 10) {
      newErrors.phone = "Telefone deve ter pelo menos 10 digitos";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleFullNameChange(value: string) {
    setFullName(value);
    if (errors.full_name) {
      setErrors((prev) => ({
        ...prev,
        full_name:
          value.trim().length >= 2
            ? undefined
            : "Nome deve ter pelo menos 2 caracteres",
      }));
    }
  }

  function handlePhoneChange(value: string) {
    setPhone(value);
    if (errors.phone) {
      setErrors((prev) => ({
        ...prev,
        phone:
          value.trim().length >= 10
            ? undefined
            : "Telefone deve ter pelo menos 10 digitos",
      }));
    }
  }

  async function handleSave() {
    if (!validate()) return;
    setSuccessMsg(null);
    try {
      await updateProfile.mutateAsync({
        full_name: fullName.trim(),
        phone: phone.trim(),
      });
      setSuccessMsg("Perfil atualizado com sucesso!");
    } catch {
      // Error handled by mutation state
    }
  }

  async function handleAvatarUpload(url: string) {
    await updateProfile.mutateAsync({ avatar_url: url });
    setSuccessMsg("Foto atualizada com sucesso!");
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
        <p className="mt-2 text-sm text-destructive">
          Erro ao carregar perfil:{" "}
          {fetchError instanceof Error ? fetchError.message : "Erro desconhecido"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <User className="h-7 w-7 text-primary" />
        <h1 className="text-xl font-bold tracking-tight">Meu Perfil</h1>
      </div>

      {/* Card */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="px-6 py-6 space-y-6">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-2">
            <AvatarUpload
              currentAvatarUrl={profile?.avatar_url}
              userName={profile?.full_name || "Operador"}
              userId={user?.id || ""}
              onUploadComplete={handleAvatarUpload}
              size="xl"
            />
            <p className="text-sm font-medium">{profile?.full_name}</p>
          </div>

          {/* Form */}
          <div className="space-y-4">
            {/* Nome completo */}
            <div>
              <label htmlFor="full-name" className="block text-sm font-medium mb-1">
                Nome completo
              </label>
              <input
                id="full-name"
                type="text"
                value={fullName}
                onChange={(e) => handleFullNameChange(e.target.value)}
                placeholder="Seu nome completo"
                className={INPUT_CLASS}
              />
              {errors.full_name && (
                <p className="mt-1 text-xs text-destructive">{errors.full_name}</p>
              )}
            </div>

            {/* Telefone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium mb-1">
                Telefone
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="(00) 00000-0000"
                className={INPUT_CLASS}
              />
              {errors.phone && (
                <p className="mt-1 text-xs text-destructive">{errors.phone}</p>
              )}
            </div>

            {/* Email (readonly) */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={user?.email || ""}
                readOnly
                className={`${INPUT_CLASS} bg-muted cursor-not-allowed`}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                O email nao pode ser alterado por aqui.
              </p>
            </div>
          </div>

          {/* Save button */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={updateProfile.isPending}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {updateProfile.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Salvar
            </button>
          </div>

          {/* Feedback */}
          {successMsg && (
            <p className="text-sm text-green-600 flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" />
              {successMsg}
            </p>
          )}
          {updateProfile.isError && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {updateProfile.error instanceof Error
                ? updateProfile.error.message
                : "Erro ao salvar perfil"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
