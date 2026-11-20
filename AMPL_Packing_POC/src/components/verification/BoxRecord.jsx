/** The box's database record: what was scanned in when it was packed. */
const VERIFICATION_BADGE = {
  NOT_VERIFIED: { text: "Not verified", className: "bg-cm-blue-50 text-cm-blue-700" },
  VERIFIED: { text: "Verified", className: "bg-cm-success-100 text-cm-success-600" },
  MISMATCH: { text: "Mismatch reported", className: "bg-cm-danger-100 text-cm-danger-600" },
};

const PACKING_LABEL = {
  COMPLETED: "Completed",
  VERIFIED: "Completed",
  OPEN: "Open",
  CANCELLED: "Cancelled",
};

const when = (value) => (value ? new Date(value).toLocaleString() : "—");

export default function BoxRecord({ record }) {
  const badge = VERIFICATION_BADGE[record.verification_status] || VERIFICATION_BADGE.NOT_VERIFIED;
  const { progress } = record;
  const allMatch = progress.lines.every((line) => line.scanned === line.expected);

  return (
    <section className="space-y-4">
      <div className="rounded-cm-xl border border-cm-border bg-cm-card p-5 shadow-cm-md">
        <p className="text-sm font-medium uppercase tracking-wide text-cm-text-muted">Box</p>
        <p className="font-mono text-3xl font-bold text-cm-navy-950">{record.box_uid}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-sm font-semibold">
          <span className="rounded-full bg-cm-success-100 px-3 py-1 text-cm-success-600">
            Packing: {PACKING_LABEL[record.status] || record.status}
          </span>
          <span className={`rounded-full px-3 py-1 ${badge.className}`}>Verification: {badge.text}</span>
        </div>

        <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <div><dt className="text-cm-text-muted">Configuration</dt><dd className="font-semibold">{record.config?.label}</dd></div>
          <div><dt className="text-cm-text-muted">Packing section</dt><dd className="font-semibold">{record.section.code} — {record.section.name}</dd></div>
          <div><dt className="text-cm-text-muted">Packed at</dt><dd className="font-semibold">{when(record.completed_at)}</dd></div>
          <div><dt className="text-cm-text-muted">Packed by</dt><dd className="font-semibold">{record.completed_by || "—"}</dd></div>
          <div><dt className="text-cm-text-muted">Total quantity</dt><dd className="font-semibold">{progress.total_scanned} of {progress.total_expected}</dd></div>
        </dl>
      </div>

      <div className="overflow-hidden rounded-cm-xl border border-cm-border bg-cm-card">
        <table className="w-full text-sm">
          <thead className="bg-cm-bg text-left text-cm-text-muted">
            <tr>
              <th className="px-4 py-2 font-medium">SKU</th>
              <th className="px-4 py-2 text-right font-medium">Expected</th>
              <th className="px-4 py-2 text-right font-medium">Actual</th>
              <th className="px-4 py-2 text-center font-medium">OK</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cm-border">
            {progress.lines.map((line) => {
              const ok = line.scanned === line.expected;
              return (
                <tr key={line.sku_id}>
                  <td className="px-4 py-2"><span className="font-semibold">{line.sku_code}</span> <span className="text-cm-text-muted">{line.sku_name}</span></td>
                  <td className="px-4 py-2 text-right tabular-nums">{line.expected}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{line.scanned}</td>
                  <td className={`px-4 py-2 text-center font-bold ${ok ? "text-cm-success-600" : "text-cm-danger-600"}`}>
                    {ok ? "✓" : "✗"}
                    <span className="sr-only">{ok ? "matches" : "does not match"}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-cm-bg font-semibold">
            <tr>
              <td className="px-4 py-2">Total</td>
              <td className="px-4 py-2 text-right tabular-nums">{progress.total_expected}</td>
              <td className="px-4 py-2 text-right tabular-nums">{progress.total_scanned}</td>
              <td className={`px-4 py-2 text-center ${allMatch ? "text-cm-success-600" : "text-cm-danger-600"}`}>{allMatch ? "✓" : "✗"}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <details className="rounded-cm-xl border border-cm-border bg-cm-card p-4">
        <summary className="cursor-pointer font-semibold">Product UIDs in this box ({record.items.length})</summary>
        <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-sm sm:grid-cols-4">
          {record.items.map((item) => (
            <li key={item.uid}>{item.uid} <span className="font-sans text-xs text-cm-text-muted">{item.sku_code}</span></li>
          ))}
        </ul>
      </details>

      <p className="rounded-cm-lg bg-cm-blue-50 px-4 py-3 text-sm text-cm-blue-700">
        <strong>Record check:</strong> this shows what the system recorded when the box was packed. It does not
        prove what is physically inside. Choose <strong>Physical inspection</strong> only if you opened the box and counted.
      </p>

      {record.verifications.length > 0 && (
        <div className="rounded-cm-xl border border-cm-border bg-cm-card p-4">
          <h3 className="font-semibold">Verification history</h3>
          <ul className="mt-2 space-y-2 text-sm">
            {record.verifications.map((item, index) => (
              <li key={`${item.verified_at}-${index}`}>
                <span className={`font-semibold ${item.result === "MATCH" ? "text-cm-success-600" : "text-cm-danger-600"}`}>
                  {item.result === "MATCH" ? "Match" : "Mismatch"}
                </span>{" "}
                · {item.method_label} · {item.verified_by} · {when(item.verified_at)}
                {item.notes && <p className="text-cm-text-muted">“{item.notes}”</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
