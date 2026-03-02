import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { setImpersonatedCompanyId } from "@/lib/impersonation-state";

interface ImpersonationState {
  companyId: string | null;
  companyName: string | null;
}

interface ImpersonationContextValue extends ImpersonationState {
  isImpersonating: boolean;
  startImpersonation: (companyId: string, companyName: string) => void;
  stopImpersonation: () => void;
}

const ImpersonationContext = createContext<ImpersonationContextValue | null>(
  null
);

export function ImpersonationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ImpersonationState>({
    companyId: null,
    companyName: null,
  });
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const startImpersonation = useCallback(
    (companyId: string, companyName: string) => {
      setImpersonatedCompanyId(companyId);
      setState({ companyId, companyName });
      queryClient.clear();
      navigate("/");
    },
    [queryClient, navigate]
  );

  const stopImpersonation = useCallback(() => {
    setImpersonatedCompanyId(null);
    setState({ companyId: null, companyName: null });
    queryClient.clear();
    navigate("/admin/empresas");
  }, [queryClient, navigate]);

  return (
    <ImpersonationContext.Provider
      value={{
        ...state,
        isImpersonating: state.companyId !== null,
        startImpersonation,
        stopImpersonation,
      }}
    >
      {children}
    </ImpersonationContext.Provider>
  );
}

export function useImpersonation() {
  const ctx = useContext(ImpersonationContext);
  if (!ctx) {
    throw new Error(
      "useImpersonation deve ser usado dentro de ImpersonationProvider"
    );
  }
  return ctx;
}
