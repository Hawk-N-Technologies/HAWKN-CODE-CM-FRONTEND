/**
 * Reusable loading indicator.
 * context: "page" | "section" | "inline" — controls sizing/spacing only;
 * Button has its own built-in spinner for button-loading, so it doesn't
 * use this component.
 */
function Loader({ context = "section", label = "Loading…" }) {
  const wrapperClass =
    context === "page"
      ? "flex min-h-[50vh] flex-col items-center justify-center gap-3"
      : context === "inline"
        ? "inline-flex items-center gap-2"
        : "flex flex-col items-center justify-center gap-3 py-10";

  const dim = context === "inline" ? "h-4 w-4" : "h-6 w-6";

  return (
    <div className={wrapperClass} role="status" aria-live="polite">
      <svg
        className={`${dim} animate-spin text-cm-blue-600`}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z"
        />
      </svg>
      {context !== "inline" && (
        <span className="text-sm text-cm-text-muted">{label}</span>
      )}
    </div>
  );
}

export default Loader;
