/**
 * Shared page title header (same look as the Admin / Project Lead pages).
 *
 *   <PageHeader
 *     eyebrow="ADMINISTRATION"
 *     title="Delivery & Handover"
 *     description="…"
 *     icon={PackageCheck}
 *     actions={<Button>…</Button>}
 *   />
 */
export default function PageHeader({ eyebrow, title, description, icon: Icon, actions }) {
  return (
    <header className="relative overflow-hidden rounded-[28px] border border-slate-800 bg-gradient-to-br from-[#080d25] via-[#0b1734] to-[#1b2052] px-6 py-7 shadow-[0_18px_45px_rgba(15,23,42,0.16)] sm:px-8 sm:py-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full border border-white/10"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-8 -top-16 h-48 w-48 rounded-full border border-white/10"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-0 h-64 w-64 bg-blue-500/10 blur-3xl"
      />

      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          {Icon && (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-blue-100">
              <Icon className="h-6 w-6" aria-hidden="true" />
            </div>
          )}

          <div className="min-w-0">
            {eyebrow && (
              <span className="inline-flex items-center rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-200">
                {eyebrow}
              </span>
            )}

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-[34px]">
              {title}
            </h1>

            {description && (
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                {description}
              </p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}
