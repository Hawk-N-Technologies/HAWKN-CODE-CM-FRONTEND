/**
 * Small status pill, reused anywhere a record has a state (employee
 * status, SOP status, project status, etc.) so every status badge in
 * the app looks the same.
 */
const TONES = {
  success: "bg-cm-success-100 text-cm-success-600",
  warning: "bg-cm-warning-100 text-cm-warning-600",
  danger: "bg-cm-danger-100 text-cm-danger-600",
  info: "bg-cm-blue-100 text-cm-blue-700",
  neutral: "bg-cm-bg text-cm-text-muted",
};

function Badge({ children, tone = "neutral", variant }) {
  const resolvedTone = variant ? (variant === "secondary" ? "neutral" : variant) : tone;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold leading-none ${TONES[resolvedTone] ?? TONES.neutral}`}
    >
      {children}
    </span>
  );
}

export default Badge;
