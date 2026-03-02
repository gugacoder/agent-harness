import { useState, useRef, useCallback, useEffect, type TouchEvent as ReactTouchEvent } from "react";
import {
  Bike,
  MapPin,
  Smartphone,
  Package,
  CheckCircle,
  ToggleRight,
} from "lucide-react";
import { DotsIndicator } from "./DotsIndicator";
import { TutorialSlide } from "./TutorialSlide";
import { useOnboarding } from "@/hooks/useOnboarding";

const SLIDE_KEYS = [
  "welcome",
  "gps_permission",
  "how_it_works",
  "status_explained",
  "completed",
] as const;

interface TutorialProps {
  onComplete: (wentOnline: boolean) => void;
  onSkip: () => void;
  reviewMode?: boolean;
}

export function Tutorial({ onComplete, onSkip, reviewMode = false }: TutorialProps) {
  const { completeStep } = useOnboarding("tutorial");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [gpsGranted, setGpsGranted] = useState<boolean | null>(null);
  const touchStartX = useRef(0);
  const completedStepsRef = useRef(new Set<string>());

  const markStep = useCallback(
    (key: string, metadata?: Record<string, unknown>) => {
      if (reviewMode) return;
      if (!metadata && completedStepsRef.current.has(key)) return;
      completedStepsRef.current.add(key);
      completeStep(key, metadata);
    },
    [reviewMode, completeStep],
  );

  const goToSlide = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(SLIDE_KEYS.length - 1, index));
      setCurrentSlide(clamped);
      // Mark non-special slides on visit
      const key = SLIDE_KEYS[clamped];
      if (key !== "completed" && key !== "gps_permission") {
        markStep(key);
      }
    },
    [markStep],
  );

  // Mark welcome slide on mount
  const didInit = useRef(false);
  useEffect(() => {
    if (!didInit.current) {
      didInit.current = true;
      markStep("welcome");
    }
  }, [markStep]);

  const handleSkip = () => {
    if (!reviewMode) {
      completeStep("completed");
    }
    onSkip();
  };

  // Touch handlers for swipe
  const handleTouchStart = (e: ReactTouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setSwipeOffset(0);
  };

  const handleTouchMove = (e: ReactTouchEvent) => {
    const delta = e.touches[0].clientX - touchStartX.current;
    setSwipeOffset(delta);
  };

  const handleTouchEnd = () => {
    if (Math.abs(swipeOffset) > 50) {
      if (swipeOffset < 0 && currentSlide < SLIDE_KEYS.length - 1) {
        goToSlide(currentSlide + 1);
      } else if (swipeOffset > 0 && currentSlide > 0) {
        goToSlide(currentSlide - 1);
      }
    }
    setSwipeOffset(0);
  };

  // GPS permission request
  const requestGps = () => {
    navigator.geolocation.getCurrentPosition(
      () => {
        setGpsGranted(true);
        markStep("gps_permission", { granted: true });
        goToSlide(currentSlide + 1);
      },
      () => {
        setGpsGranted(false);
        markStep("gps_permission", { granted: false });
      },
    );
  };

  const handleComplete = (wentOnline: boolean) => {
    if (!reviewMode) {
      completeStep("completed", { went_online: wentOnline });
    }
    onComplete(wentOnline);
  };

  const renderSlide = (index: number) => {
    switch (index) {
      case 0: // welcome
        return (
          <TutorialSlide
            icon={<Bike className="text-primary" size={48} />}
            title="Você é um entregador Chega.lá!"
            description="Vamos te preparar em 1 minuto"
          />
        );

      case 1: // gps_permission
        return (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <div className="mb-6">
              <MapPin className="text-primary" size={48} />
            </div>
            <h2 className="text-xl font-semibold mb-2">Ative sua localização</h2>
            <p className="text-sm text-muted-foreground">
              Para receber entregas, precisamos saber onde você está
            </p>
            {gpsGranted === false && (
              <p className="mt-4 text-xs text-muted-foreground">
                Você pode ativar depois em Configurações do celular &gt; Permissões
                &gt; Localização
              </p>
            )}
            {gpsGranted === null && (
              <button
                type="button"
                onClick={requestGps}
                className="mt-8 w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Ativar localização
              </button>
            )}
          </div>
        );

      case 2: // how_it_works
        return (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <h2 className="text-xl font-semibold mb-8">Como funciona</h2>
            <div className="flex flex-col gap-6 w-full">
              <div className="flex items-center gap-3 text-left">
                <Smartphone className="shrink-0 text-primary" size={24} />
                <span className="text-sm">Fique online para receber entregas</span>
              </div>
              <div className="flex items-center gap-3 text-left">
                <Package className="shrink-0 text-primary" size={24} />
                <span className="text-sm">
                  Aceite a entrega e vá até o local de coleta
                </span>
              </div>
              <div className="flex items-center gap-3 text-left">
                <CheckCircle className="shrink-0 text-primary" size={24} />
                <span className="text-sm">
                  Entregue e confirme com foto + assinatura
                </span>
              </div>
            </div>
          </div>
        );

      case 3: // status_explained
        return (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <div className="mb-6">
              <ToggleRight className="text-primary" size={48} />
            </div>
            <h2 className="text-xl font-semibold mb-6">Seu status</h2>
            <div className="flex flex-col gap-4 w-full">
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <div className="text-left">
                  <p className="text-sm font-medium">Online</p>
                  <p className="text-xs text-muted-foreground">
                    Você pode receber entregas
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <div className="text-left">
                  <p className="text-sm font-medium">Offline</p>
                  <p className="text-xs text-muted-foreground">
                    Você não receberá entregas
                  </p>
                </div>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Mude seu status a qualquer momento
            </p>
          </div>
        );

      case 4: // completed
        return (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <div className="mb-6 animate-[scale-in_300ms_ease-out]">
              <CheckCircle className="text-green-500" size={64} />
            </div>
            <h2 className="text-xl font-semibold mb-2">Tudo certo!</h2>
            <p className="text-sm text-muted-foreground">
              Fique online para receber sua primeira entrega
            </p>
            <button
              type="button"
              onClick={() => handleComplete(true)}
              className="mt-8 w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 animate-[pulse-subtle_2s_ease-in-out_infinite]"
            >
              Ficar online agora
            </button>
            <button
              type="button"
              onClick={() => handleComplete(false)}
              className="mt-3 text-sm text-muted-foreground underline"
            >
              Ver mais tarde
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background">
      <div className="relative mx-auto h-full max-w-[480px] flex flex-col">
        {/* Skip button */}
        <button
          type="button"
          onClick={handleSkip}
          className="absolute top-4 right-4 z-10 text-sm text-muted-foreground"
        >
          Pular
        </button>

        {/* Slides container */}
        <div
          className="flex-1 overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="flex h-full transition-transform duration-200 ease-out"
            style={{
              transform: `translateX(calc(-${currentSlide * 100}% + ${swipeOffset}px))`,
              ...(swipeOffset !== 0 ? { transitionDuration: "0ms" } : {}),
            }}
          >
            {SLIDE_KEYS.map((key, index) => (
              <div key={key} className="h-full w-full shrink-0">
                {renderSlide(index)}
              </div>
            ))}
          </div>
        </div>

        {/* Next button + Dots indicator */}
        <div className="pb-8 flex flex-col items-center gap-4">
          {currentSlide < SLIDE_KEYS.length - 1 && (
            <button
              type="button"
              onClick={() => goToSlide(currentSlide + 1)}
              className="rounded-md bg-primary px-8 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Avançar
            </button>
          )}
          <DotsIndicator total={SLIDE_KEYS.length} current={currentSlide} />
        </div>
      </div>
    </div>
  );
}
