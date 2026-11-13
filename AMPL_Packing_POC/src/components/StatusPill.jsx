const STYLES = {
  ok: "bg-cm-success-100 text-cm-success-600",
  error: "bg-cm-danger-100 text-cm-danger-600",
  pending: "bg-cm-blue-50 text-cm-blue-700",
};

const LABELS = { ok: "OK", error: "Down", pending: "Checking…" };

export default function StatusPill({ state }) {
  return (
    <span
      className={`inline-flex min-w-20 justify-center rounded-full px-3 py-1 text-sm font-semibold ${STYLES[state]}`}
    >
      {LABELS[state]}
    </span>
  );
}
