import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface CompanyFormData {
  name: string;
  phone: string;
  address: string;
  logo_url: string;
}

interface CompanyDataStepProps {
  onComplete: (metadata?: Record<string, unknown>) => void;
}

interface CompanyResponse {
  id: string;
  name: string;
  phone: string;
  address: string;
  logo_url: string | null;
}

export function CompanyDataStep({ onComplete }: CompanyDataStepProps) {
  const { user } = useAuth();

  const { data: company } = useQuery<CompanyResponse>({
    queryKey: ["company", user?.companyId],
    queryFn: () =>
      api.get(`api/companies/${user!.companyId}`).json<CompanyResponse>(),
    enabled: !!user?.companyId,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CompanyFormData>({
    defaultValues: {
      name: "",
      phone: "",
      address: "",
      logo_url: "",
    },
  });

  useEffect(() => {
    if (company) {
      reset({
        name: company.name || "",
        phone: company.phone || "",
        address: company.address || "",
        logo_url: company.logo_url || "",
      });
    }
  }, [company, reset]);

  const onSubmit = async (data: CompanyFormData) => {
    if (user?.companyId) {
      try {
        await api
          .patch(`api/companies/${user.companyId}`, {
            json: {
              name: data.name,
              phone: data.phone,
              address: data.address,
              logo_url: data.logo_url || null,
            },
          })
          .json();
      } catch {
        // Continue even if update fails — step can still complete
      }
    }
    onComplete({ company_updated: true });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 px-6 py-4">
      <h3 className="text-lg font-semibold text-foreground">Dados da empresa</h3>
      <p className="text-sm text-muted-foreground">
        Confirme as informacoes da sua empresa.
      </p>

      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium text-foreground">
          Nome da empresa *
        </label>
        <input
          id="name"
          type="text"
          {...register("name", { required: "Nome e obrigatorio" })}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Ex: Minha Empresa Ltda"
        />
        {errors.name && (
          <span className="text-xs text-destructive">{errors.name.message}</span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="phone" className="text-sm font-medium text-foreground">
          Telefone *
        </label>
        <input
          id="phone"
          type="text"
          {...register("phone", { required: "Telefone e obrigatorio" })}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="(11) 99999-9999"
        />
        {errors.phone && (
          <span className="text-xs text-destructive">{errors.phone.message}</span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="address" className="text-sm font-medium text-foreground">
          Endereco *
        </label>
        <input
          id="address"
          type="text"
          {...register("address", { required: "Endereco e obrigatorio" })}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Rua, numero, bairro, cidade"
        />
        {errors.address && (
          <span className="text-xs text-destructive">{errors.address.message}</span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="logo_url" className="text-sm font-medium text-foreground">
          Logo (URL)
        </label>
        <input
          id="logo_url"
          type="text"
          {...register("logo_url")}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="https://exemplo.com/logo.png"
        />
        {errors.logo_url && (
          <span className="text-xs text-destructive">{errors.logo_url.message}</span>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 self-end rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {isSubmitting ? "Salvando..." : "Proximo"}
      </button>
    </form>
  );
}
