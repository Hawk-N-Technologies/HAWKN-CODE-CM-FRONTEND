import { LoaderCircle } from "lucide-react";

function Loader({ context = "section", label = "Loading...", className = "" }) {
  const isInline = context === "inline";
  const isPage = context === "page";

  const wrapperStyles = isPage
    ? "flex min-h-[50vh] flex-col items-center justify-center gap-5"
    : isInline
      ? "inline-flex items-center gap-2.5"
      : "flex flex-col items-center justify-center gap-4 py-12";

  const iconSize = isInline ? 17 : isPage ? 30 : 25;

  return (
    <div
      className={[wrapperStyles, className].filter(Boolean).join(" ")}
      role="status"
      aria-live="polite"
    >
      <div
        className={[
          "relative flex shrink-0 items-center justify-center",
          "rounded-2xl border border-cm-border bg-cm-card",
          "shadow-sm",
          isInline ? "h-8 w-8 rounded-lg" : isPage ? "h-16 w-16" : "h-14 w-14",
        ].join(" ")}
      >
        {!isInline && (
          <span
            className="absolute inset-1 rounded-xl border border-cm-border/70"
            aria-hidden="true"
          />
        )}

        <LoaderCircle
          size={iconSize}
          strokeWidth={1.8}
          aria-hidden="true"
          className="relative animate-spin text-cm-blue-600 motion-reduce:animate-none"
        />
      </div>

      {!isInline && (
        <div className="space-y-1 text-center">
          <p className="text-sm font-semibold text-cm-text">{label}</p>
          {isPage && (
            <p className="text-xs text-cm-text-muted">
              Please wait while we prepare your workspace.
            </p>
          )}
        </div>
      )}

      {isInline && (
        <span className="text-xs font-medium text-cm-text-muted">{label}</span>
      )}
    </div>
  );
}

export default Loader;
