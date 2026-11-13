/** Total and per-SKU progress of the open box. */
export default function ProgressPanel({ progress }) {
  const { lines, total_expected: expected, total_scanned: scanned } = progress;
  const percent = expected ? Math.round((scanned / expected) * 100) : 0;

  return (
    <section className="rounded-cm-xl border border-cm-border bg-cm-card p-4 shadow-cm-sm" aria-live="polite">
      <div className="flex items-baseline justify-between">
        <h2 className="font-semibold">Packed</h2>
        <p className="text-3xl font-bold tabular-nums text-cm-navy-950">
          {scanned}
          <span className="text-lg font-medium text-cm-text-muted"> / {expected}</span>
        </p>
      </div>
      <div className="mt-2 h-3 rounded-full bg-cm-blue-50" aria-hidden="true">
        <div
          className={`h-3 rounded-full transition-all ${percent === 100 ? "bg-cm-success-600" : "bg-cm-blue-600"}`}
          style={{ width: `${percent}%` }}
        />
      </div>

      <ul className="mt-4 space-y-2">
        {lines.map((line) => {
          const full = line.scanned === line.expected;
          return (
            <li key={line.sku_id} className="flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 truncate">
                <span className="font-semibold">{line.sku_code}</span>{" "}
                <span className="text-cm-text-muted">{line.sku_name}</span>
              </span>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 font-semibold tabular-nums ${
                  full ? "bg-cm-success-100 text-cm-success-600" : "bg-cm-blue-50 text-cm-blue-700"
                }`}
              >
                {line.scanned}/{line.expected}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
