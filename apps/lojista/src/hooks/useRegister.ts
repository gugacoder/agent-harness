import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { HTTPError } from "ky";

interface RegisterData {
  company_id: string;
  full_name: string;
  phone: string;
  email?: string;
  requested_role: "courier" | "shop";
  extra_data?: Record<string, string>;
}

interface RegisterResponse {
  ok: boolean;
  message: string;
}

async function extractError(err: unknown): Promise<string> {
  if (err instanceof HTTPError) {
    try {
      const body = (await err.response.json()) as { message?: string };
      if (body.message) return body.message;
    } catch {
      // ignore
    }
  }
  if (err instanceof Error) return err.message;
  return "Erro inesperado. Tente novamente.";
}

export function useRegister() {
  return useMutation<RegisterResponse, string, RegisterData>({
    mutationFn: async (data) => {
      try {
        return await api
          .post("api/registration/request", { json: data })
          .json<RegisterResponse>();
      } catch (err) {
        throw await extractError(err);
      }
    },
  });
}
