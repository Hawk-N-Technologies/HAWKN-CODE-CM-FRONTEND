import { Check, AlertCircle, Info, XCircle, Minus } from "lucide-react";

const TONES = {
  success: {
    styles: "border-cm-success-600/15 bg-cm-success-100 text-cm-success-600",
    icon: Check,
  },
  warning: {
    styles: "border-cm-warning-600/15 bg-cm-warning-100 text-cm-warning-600",
    icon: AlertCircle,
  },
  danger: {
    styles: "border-cm-danger-600/15 bg-cm-danger-100 text-cm-danger-600",
    icon: XCircle,
  },
  info: {
    styles: "border-cm-blue-700/15 bg-cm-blue-100 text-cm-blue-700",
    icon: Info,
  },
  neutral: {
    styles: "border-cm-border bg-cm-bg text-cm-text-muted",
    icon: Minus,
  },
};

function Badge({
  children,
  tone = "neutral",
  variant,
  showIcon = false,
  size = "default",
  className = "",
}) {
  const resolvedTone = variant === "secondary" ? "neutral" : variant || tone;

  const config = TONES[resolvedTone] || TONES.neutral;
  const Icon = config.icon;

  const sizeStyles = {
    sm: "gap-1 px-2 py-1 text-[10px]",
    default: "gap-1.5 px-2.5 py-1 text-xs",
    lg: "gap-1.5 px-3 py-1.5 text-[13px]",
  };

  return (
    <span
      className={[
        "inline-flex max-w-full items-center justify-center",
        "whitespace-nowrap rounded-full border",
        "font-semibold leading-none tracking-[0.01em]",
        "transition-colors duration-150",
        config.styles,
        sizeStyles[size] || sizeStyles.default,
        className,
      ].join(" ")}
    >
      {showIcon && (
        <Icon
          size={size === "sm" ? 11 : 13}
          strokeWidth={2.2}
          aria-hidden="true"
          className="shrink-0"
        />
      )}
      <span>{children}</span>
    </span>
  );
}

export default Badge;
