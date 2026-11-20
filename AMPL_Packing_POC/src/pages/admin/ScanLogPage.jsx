import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getScanLogs } from "../../api/reports";
import { btnSecondary, card, input, label } from "../../components/ui/ui";

const ACTIONS = [
  ["", "All actions"],
  ["PRODUCT_SCAN", "Product scanned"],
  ["ITEM_REMOVE", "Item removed"],
  ["BOX_START", "Box started"],
  ["BOX_COMPLETE", "Box completed"],
  ["BOX_CANCEL", "Box cancelled"],
  ["BOX_LOOKUP", "Box looked up"],
  ["BOX_VERIFY", "Box verified"],
];

/** Audit trail: every scan and box action, accepted or rejected. */
export default function ScanLogPage() {
  const [filters, setFilters] = useState({ accepted: "false", action: "", q: "", page: 1 });
  const [refreshKey, setRefreshKey] = useState(0);
  const [result, setResult] = useState({ status: "loading", rows: [], pagination: null, error: null });

  useEffect(() => {
    let active = true;
    getScanLogs(filters)
      .then((payload) => active && setResult({ status: "ok", rows: payload.data, pagination: payload.pagination, error: null }))
      .catch((error) => active && setResult({ status: "error", rows: [], pagination: null, error }));
    return () => {
      active = false;
    };
  }, [filters, refreshKey]);

  const update = (changes) => setFilters((prev) => ({ ...prev, page: 1, ...changes }));
  const pages = result.pagination?.total_pages || 1;

  return (
    <main className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-cm-navy-950">Scan log</h1>
          <p className="text-sm text-cm-text-muted">Every scan and box action is recorded here, including rejected ones.</p>
        </div>
        <button type="button" className={btnSecondary} onClick={() => setRefreshKey((key) => key + 1)}>Refresh</button>
      </div>

      <div className={`${card} grid gap-3 sm:grid-cols-3 sm:items-end`}>
        <div>
          <label htmlFor="l-result" className={label}>Result</label>
          <select id="l-result" className={input} value={filters.accepted} onChange={(event) => update({ accepted: event.target.value })}>
            <option value="false">Rejected only</option>
            <option value="true">Accepted only</option>
            <option value="">All</option>
          </select>
        </div>
        <div>
          <label htmlFor="l-action" className={label}>Action</label>
          <select id="l-action" className={input} value={filters.action} onChange={(event) => update({ action: event.target.value })}>
            {ACTIONS.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="l-q" className={label}>Search (UID, box ID, error code)</label>
          <input id="l-q" className={input} defaultValue={filters.q}
            onKeyDown={(event) => { if (event.key === "Enter") update({ q: event.currentTarget.value.trim() }); }}
            onBlur={(event) => { if (event.target.value.trim() !== filters.q) update({ q: event.target.value.trim() }); }} />
        </div>
      </div>

      <div className={card}>
        <p className="mb-3 text-sm text-cm-text-muted">{result.pagination ? `${result.pagination.total_items} entries` : ""}</p>
        {result.status === "loading" && <p className="text-cm-text-muted">Loading…</p>}
        {result.status === "error" && <p className="text-cm-danger-600">{result.error.message}</p>}
        {result.status === "ok" && result.rows.length === 0 && <p className="text-cm-text-muted">Nothing recorded for these filters.</p>}
        {result.rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[60rem] text-sm">
              <thead className="text-left text-cm-text-muted">
                <tr>
                  <th className="py-2 pr-3 font-medium">Time</th>
                  <th className="py-2 pr-3 font-medium">Action</th>
                  <th className="py-2 pr-3 font-medium">Result</th>
                  <th className="py-2 pr-3 font-medium">Scanned value</th>
                  <th className="py-2 pr-3 font-medium">Box</th>
                  <th className="py-2 pr-3 font-medium">Section</th>
                  <th className="py-2 font-medium">User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cm-border">
                {result.rows.map((row) => (
                  <tr key={row.id} className="align-top">
                    <td className="py-2 pr-3 whitespace-nowrap">{new Date(row.created_at).toLocaleString()}</td>
                    <td className="py-2 pr-3">{row.action_label}</td>
                    <td className="py-2 pr-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${row.accepted ? "bg-cm-success-100 text-cm-success-600" : "bg-cm-danger-100 text-cm-danger-600"}`}>
                        {row.result_code}
                      </span>
                      {row.message && <span className="mt-1 block text-xs text-cm-text-muted">{row.message}</span>}
                    </td>
                    <td className="py-2 pr-3 font-mono">{row.parsed_value || row.raw_value || "—"}</td>
                    <td className="py-2 pr-3">
                      {row.box_uid ? (
                        <Link to={`/verify?code=${row.box_uid}`} className="font-mono text-cm-blue-700 hover:underline">{row.box_uid}</Link>
                      ) : row.box_public_id ? (
                        <span className="text-cm-text-muted">(open box)</span>
                      ) : "—"}
                    </td>
                    <td className="py-2 pr-3">{row.section_code || "—"}</td>
                    <td className="py-2">{row.user || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <button type="button" className={btnSecondary} disabled={filters.page <= 1}
              onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}>‹ Newer</button>
            <span className="text-sm text-cm-text-muted">Page {filters.page} of {pages}</span>
            <button type="button" className={btnSecondary} disabled={filters.page >= pages}
              onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}>Older ›</button>
          </div>
        )}
      </div>
    </main>
  );
}
