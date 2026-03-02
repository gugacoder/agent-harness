import { HelpCircle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface HelpTooltipProps {
  content: string;
  learnMoreUrl?: string;
}

export function HelpTooltip({ content, learnMoreUrl }: HelpTooltipProps) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const tooltipId = useRef(
    `tooltip-${Math.random().toString(36).slice(2, 9)}`
  ).current;
  const [above, setAbove] = useState(true);

  const show = useCallback(() => {
    timeoutRef.current = setTimeout(() => setVisible(true), 200);
  }, []);

  const hide = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(false);
  }, []);

  const toggle = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible((v) => !v);
  }, []);

  useEffect(() => {
    if (visible && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setAbove(rect.top > 80);
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    function onClickOutside(e: MouseEvent) {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node) &&
        tooltipRef.current &&
        !tooltipRef.current.contains(e.target as Node)
      ) {
        setVisible(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [visible]);

  return (
    <span className="relative inline-flex items-center">
      <span
        ref={triggerRef}
        role="button"
        tabIndex={0}
        aria-describedby={visible ? tooltipId : undefined}
        className="inline-flex cursor-help text-muted-foreground hover:text-foreground transition-colors"
        onMouseEnter={show}
        onMouseLeave={hide}
        onClick={toggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") toggle();
        }}
      >
        <HelpCircle className="h-4 w-4" />
      </span>
      {visible && (
        <div
          ref={tooltipRef}
          id={tooltipId}
          role="tooltip"
          className={`absolute left-1/2 z-50 -translate-x-1/2 rounded-md bg-popover text-popover-foreground shadow-md px-3 py-2 text-xs max-w-[240px] ${
            above ? "bottom-full mb-1.5" : "top-full mt-1.5"
          }`}
        >
          <p>{content}</p>
          {learnMoreUrl && (
            <a
              href={learnMoreUrl}
              className="mt-1 inline-block text-primary underline"
            >
              Saiba mais
            </a>
          )}
        </div>
      )}
    </span>
  );
}
