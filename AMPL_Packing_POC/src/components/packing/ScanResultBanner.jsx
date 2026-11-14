/** Large green/red result of the last action, readable at arm's length. */
export default function ScanResultBanner({ result, busy }) {
  if (busy) {
    return (
      <div className="rounded-cm-xl bg-cm-blue-50 px-4 py-4 text-center font-semibold text-cm-blue-700" role="status">
        Checking…
      </div>
    );
  }
  if (!result) {
    return (
      <div className="rounded-cm-xl bg-cm-card px-4 py-4 text-center text-cm-text-muted ring-1 ring-cm-border">
        Ready to scan
      </div>
    );
  }
  const tone = result.ok
    ? "bg-cm-success-600 text-white"
    : "bg-cm-danger-600 text-white";
  return (
    <div className={`rounded-cm-xl px-4 py-4 text-center ${tone}`} role={result.ok ? "status" : "alert"}>
      <p className="text-lg font-bold">{result.title}</p>
      {result.message && <p className="mt-0.5 text-sm opacity-95">{result.message}</p>}
    </div>
  );
}
