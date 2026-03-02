import { useState, useCallback, useRef, useEffect } from "react";
import { api } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { HTTPError } from "ky";

type OtpStep = "phone" | "code";
type OtpChannel = "whatsapp" | "email";

interface OtpLoginState {
  step: OtpStep;
  isLoading: boolean;
  error: string | null;
  canResend: boolean;
  resendCountdown: number;
}

interface OtpVerifyResponse {
  access_token: string;
  refresh_token: string;
  user: { id: string; email: string; role: string; companyId: string };
}

export function useOtpLogin() {
  const [state, setState] = useState<OtpLoginState>({
    step: "phone",
    isLoading: false,
    error: null,
    canResend: false,
    resendCountdown: 0,
  });

  const phoneOrEmailRef = useRef("");
  const channelRef = useRef<OtpChannel>("whatsapp");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startCountdown = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setState((prev) => ({ ...prev, canResend: false, resendCountdown: 60 }));
    timerRef.current = setInterval(() => {
      setState((prev) => {
        const next = prev.resendCountdown - 1;
        if (next <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          return { ...prev, canResend: true, resendCountdown: 0 };
        }
        return { ...prev, resendCountdown: next };
      });
    }, 1000);
  }, []);

  async function extractErrorMessage(err: unknown): Promise<string> {
    if (err instanceof HTTPError) {
      try {
        const body = await err.response.json() as { message?: string };
        if (body.message) return body.message;
      } catch {
        // ignore parse error
      }
      if (err.response.status === 429) return "Muitas tentativas. Aguarde antes de tentar novamente.";
    }
    if (err instanceof Error) return err.message;
    return "Erro inesperado. Tente novamente.";
  }

  const sendCode = useCallback(
    async (phoneOrEmail: string, channel: OtpChannel) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      phoneOrEmailRef.current = phoneOrEmail;
      channelRef.current = channel;

      try {
        await api.post("auth/otp/send", {
          json: { phone_or_email: phoneOrEmail, channel },
        });
        setState((prev) => ({ ...prev, step: "code", isLoading: false }));
        startCountdown();
      } catch (err) {
        const message = await extractErrorMessage(err);
        setState((prev) => ({ ...prev, isLoading: false, error: message }));
      }
    },
    [startCountdown],
  );

  const verifyCode = useCallback(async (code: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const data = await api
        .post("auth/otp/verify", {
          json: { phone_or_email: phoneOrEmailRef.current, code },
        })
        .json<OtpVerifyResponse>();

      await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });

      setState((prev) => ({ ...prev, isLoading: false }));
    } catch (err) {
      const message = await extractErrorMessage(err);
      setState((prev) => ({ ...prev, isLoading: false, error: message }));
    }
  }, []);

  const resendCode = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      await api.post("auth/otp/send", {
        json: {
          phone_or_email: phoneOrEmailRef.current,
          channel: channelRef.current,
        },
      });
      setState((prev) => ({ ...prev, isLoading: false }));
      startCountdown();
    } catch (err) {
      const message = await extractErrorMessage(err);
      setState((prev) => ({ ...prev, isLoading: false, error: message }));
    }
  }, [startCountdown]);

  const goBack = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setState({
      step: "phone",
      isLoading: false,
      error: null,
      canResend: false,
      resendCountdown: 0,
    });
  }, []);

  return {
    ...state,
    sendCode,
    verifyCode,
    resendCode,
    goBack,
  };
}
