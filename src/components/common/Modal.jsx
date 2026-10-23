import { useEffect, useRef } from "react";
import { X } from "lucide-react";

const SIZE_CLASSES = {
  sm: "max-w-md",
  md: "max-w-2xl",
  lg: "max-w-3xl",
  xl: "max-w-5xl",
  full: "max-w-7xl",
};

export default function Modal({
  open = true,
  onClose,
  title,
  description,
  icon: Icon,
  size = "lg",
  closeDisabled = false,
  children,
}) {
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const closeDisabledRef = useRef(closeDisabled);

  // Keep callbacks current without triggering the focus effect.
  useEffect(() => {
    onCloseRef.current = onClose;
    closeDisabledRef.current = closeDisabled;
  }, [onClose, closeDisabled]);

  // Run only when the modal opens or closes.
  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Focus the dialog once when it opens.
    dialogRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !closeDisabledRef.current) {
        onCloseRef.current?.();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/65 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !closeDisabled) {
          onClose?.();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "shared-modal-title" : undefined}
        tabIndex={-1}
        className={`my-auto w-full ${
          SIZE_CLASSES[size] ?? SIZE_CLASSES.lg
        } overflow-hidden rounded-2xl border border-white/20 bg-white shadow-[0_28px_100px_rgba(2,6,23,0.4)] outline-none animate-in fade-in zoom-in-95 duration-200`}
      >
        {(title || description || Icon) && (
          <header className="relative overflow-hidden bg-cm-navy-950 px-6 py-5 text-white sm:px-8 sm:py-6">
            <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full border border-white/10" />
            <div className="pointer-events-none absolute -right-2 -top-8 h-32 w-32 rounded-full border border-white/10" />

            <div className="relative flex items-start gap-4 pr-10">
              {Icon && (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white shadow-inner">
                  <Icon size={21} strokeWidth={1.8} aria-hidden="true" />
                </div>
              )}

              <div className="min-w-0 flex-1">
                {title && (
                  <h2
                    id="shared-modal-title"
                    className="text-lg font-bold tracking-tight sm:text-xl"
                  >
                    {title}
                  </h2>
                )}

                {description && (
                  <p className="mt-1.5 max-w-2xl text-sm leading-6 text-white/65">
                    {description}
                  </p>
                )}
              </div>
            </div>

            {onClose && (
              <button
                type="button"
                aria-label="Close dialog"
                disabled={closeDisabled}
                onClick={onClose}
                className="absolute right-5 top-5 z-10 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white/80 transition hover:border-white/30 hover:bg-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:cursor-not-allowed disabled:opacity-40 sm:right-7 sm:top-6"
              >
                <X size={18} strokeWidth={1.8} />
              </button>
            )}
          </header>
        )}

        {children}
      </div>
    </div>
  );
}
