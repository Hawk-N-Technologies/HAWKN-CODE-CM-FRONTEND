/** Products in the box, newest first, each removable while the box is open. */
export default function ScannedItems({ items, onRemove, disabled }) {
  if (!items.length) {
    return <p className="text-sm text-cm-text-muted">No products scanned yet.</p>;
  }
  return (
    <ul className="divide-y divide-cm-border rounded-cm-xl border border-cm-border bg-cm-card">
      {items.map((item) => (
        <li key={item.uid} className="flex items-center justify-between gap-3 px-4 py-2.5">
          <span className="min-w-0">
            <span className="font-mono text-base font-semibold tabular-nums">{item.uid}</span>
            <span className="ml-2 text-sm text-cm-text-muted">{item.sku_code}</span>
          </span>
          {onRemove && (
            <button
              type="button"
              onClick={() => onRemove(item.uid)}
              disabled={disabled}
              className="h-9 shrink-0 rounded-cm-md px-3 text-sm font-medium text-cm-danger-600 hover:bg-cm-danger-100 disabled:opacity-50"
            >
              Remove
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
