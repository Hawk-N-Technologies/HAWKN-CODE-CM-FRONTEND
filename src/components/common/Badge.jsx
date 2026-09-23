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

function Badge({ children, tone = "neutral" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}

export default Badge;