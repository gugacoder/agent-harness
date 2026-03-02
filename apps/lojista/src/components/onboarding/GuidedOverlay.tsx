import { useState, useEffect, useCallback } from "react";
import { HighlightTooltip } from "./HighlightTooltip";

export interface OverlayStep {
  targetSelector: string;
  title: string;
  description: string;
  position?: "top" | "bottom" | "left" | "right";
}

interface GuidedOverlayProps {
  steps: OverlayStep[];
  onComplete: () => void;
  onSkip: () => void;
}

const CUTOUT_PADDING = 8;
const TOOLTIP_GAP = 12;

function getTargetRect(selector: string): DOMRect | null {
  const el = document.querySelector(selector);
  return el ? el.getBoundingClientRect() : null;
}

function autoPosition(
  rect: DOMRect,
  preferred?: "top" | "bottom" | "left" | "right",
): "top" | "bottom" | "left" | "right" {
  if (preferred) return preferred;
  // Default: place below if room, otherwise above
  const spaceBelow = window.innerHeight - rect.bottom;
  return spaceBelow > 160 ? "bottom" : "top";
}

function computeTooltipPosition(
  rect: DOMRect,
  preferredPosition?: "top" | "bottom" | "left" | "right",
): {
  top: number;
  left: number;
  arrowDirection: "top" | "bottom" | "left" | "right";
} {
  const pos = autoPosition(rect, preferredPosition);
  const tooltipWidth = 288; // max-w-xs = 20rem = 320px, but content is usually narrower
  let left = rect.left;

  // Clamp left so tooltip doesn't overflow right edge
  if (left + tooltipWidth > window.innerWidth - 16) {
    left = window.innerWidth - tooltipWidth - 16;
  }
  if (left < 16) left = 16;

  switch (pos) {
    case "top":
      return {
        top: rect.top - CUTOUT_PADDING - TOOLTIP_GAP - 120,
        left,
        arrowDirection: "bottom",
      };
    case "bottom":
      return {
        top: rect.bottom + CUTOUT_PADDING + TOOLTIP_GAP,
        left,
        arrowDirection: "top",
      };
    case "left":
      return {
        top: rect.top,
        left: rect.left - CUTOUT_PADDING - TOOLTIP_GAP - tooltipWidth,
        arrowDirection: "right",
      };
    case "right":
      return {
        top: rect.top,
        left: rect.right + CUTOUT_PADDING + TOOLTIP_GAP,
        arrowDirection: "left",
      };
  }
}

function buildClipPath(rect: DOMRect): string {
  const l = rect.left - CUTOUT_PADDING;
  const t = rect.top - CUTOUT_PADDING;
  const r = rect.right + CUTOUT_PADDING;
  const b = rect.bottom + CUTOUT_PADDING;

  // Polygon tracing the full viewport with a rectangular hole
  return `polygon(
    0% 0%, 0% 100%, ${l}px 100%, ${l}px ${t}px,
    ${r}px ${t}px, ${r}px ${b}px, ${l}px ${b}px,
    ${l}px 100%, 100% 100%, 100% 0%
  )`;
}

export function GuidedOverlay({
  steps,
  onComplete,
  onSkip,
}: GuidedOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const recalculate = useCallback(() => {
    if (currentStep < steps.length) {
      const rect = getTargetRect(steps[currentStep].targetSelector);
      setTargetRect(rect);
    }
  }, [currentStep, steps]);

  useEffect(() => {
    recalculate();
    window.addEventListener("resize", recalculate);
    window.addEventListener("scroll", recalculate, true);
    return () => {
      window.removeEventListener("resize", recalculate);
      window.removeEventListener("scroll", recalculate, true);
    };
  }, [recalculate]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      onComplete();
    }
  };

  const tooltipPos = targetRect
    ? computeTooltipPosition(targetRect, steps[currentStep].position)
    : null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Dark overlay with transparent cutout */}
      <div
        className="absolute inset-0 bg-black/60"
        style={
          targetRect ? { clipPath: buildClipPath(targetRect) } : undefined
        }
        onClick={onSkip}
      />

      {/* Tooltip near target */}
      {tooltipPos && (
        <HighlightTooltip
          title={steps[currentStep].title}
          description={steps[currentStep].description}
          position={{ top: tooltipPos.top, left: tooltipPos.left }}
          arrowDirection={tooltipPos.arrowDirection}
          onNext={handleNext}
          onSkip={onSkip}
          stepNumber={currentStep + 1}
          totalSteps={steps.length}
        />
      )}
    </div>
  );
}
