import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { listSections } from "../../api/admin";
import { getPackingHistory } from "../../api/reports";
import { btnSecondary, card, input, label } from "../../components/ui/ui";

const STATUS_OPTIONS = [
  ["", "All boxes"],
  ["OPEN", "Open (pending)"],
  ["COMPLETED", "Completed, not verified as match"],
  ["VERIFIED", "Verified"],
  ["MISMATCH", "Mismatch reported"],
  ["CANCELLED", "Cancelled"],
];

const STATUS_BADGE = {
  OPEN: ["Open", "bg-cm-warning-100 text-cm-warning-600"],
  COMPLETED: ["Completed", "bg-cm-blue-50 text-cm-blue-700"],
  VERIFIED: ["Verified", "bg-cm-success-100 text-cm-success-600"],
  CANCELLED: ["Cancelled", "bg-cm-bg text-cm-text-muted"],
};

const when = (value) => (value ? new Date(value).toLocaleString() : "—");

/** Every box: filter by status, section and date; click a box to open its record. */
export default function HistoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = {
    status: searchParams.get("status") || "",
    section: searchParams.get("section") || "",
    date_from: searchParams.get("date_from") || "",
    date_to: searchParams.get("date_to") || "",
    q: searchParams.get("q") || "",
    page: Number(searchParams.get("page") || 1),
  };
  const [sections, setSections] = useState([]);
  const [result, setResult] = useState({ status: "loading", rows: [], pagination: null, error: null });
  const filterKey = searchParams.toString();

  useEffect(() => {
    listSections().then(setSections).catch(() => setSections([]));
  }, []);

  useEffect(() => {
    let active = true;
    const params = Object.fromEntries(new URLSearchParams(filterKey));
    getPackingHistory(params)
      .then((payload) => active && setResult({ status: "ok", rows: payload.data, pagination: payload.pagination, error: null }))
      .catch((error) => active && setResult({ status: "error", rows: [], pagination: null, error }));
    return () => {
      active = false;
    };
  }, [filterKey]);

  const setFilter = (changes) => {
    const next = { ...filters, page: 1, ...changes };
    const clean = Object.fromEntries(Object.entries(next).filter(([, value]) => value !== "" && value !== 1));
    setSearchParams(clean, { replace: true });
  };

  const pages = result.pagination?.total_pages || 1;

  return (
    <main className="space-y-6 p-4 sm:p-6">
      <h1 className="text-2xl font-bold text-cm-navy-950">Packing history</h1>

      <div className={`${card} grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end`}>
        <div>
          <label htmlFor="h-status" className={label}>Status</label>
          <select id="h-status" className={input} value={filters.status} onChange={(event) => setFilter({ status: event.target.value })}>
            {STATUS_OPTIONS.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="h-section" className={label}>Section</label>
          <select id="h-section" className={input} value={filters.section} onChange={(event) => setFilter({ section: event.target.value })}>
            <option value="">All sections</option>
            {sections.map((section) => <option key={section.id} value={section.id}>{section.code} — {section.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="h-from" className={label}>From</label>
          <input id="h-from" type="date" className={input} value={filters.date_from} onChange={(event) => setFilter({ date_from: event.target.value })} />
        </div>
        <div>
          <label htmlFor="h-to" className={label}>To</label>
          <input id="h-to" type="date" className={input} value={filters.date_to} onChange={(event) => setFilter({ date_to: event.target.value })} />
        </div>
        <div>
          <label htmlFor="h-q" className={label}>Box ID</label>
          <input id="h-q" key={filters.q} className={input} placeholder="e.g. 000002" defaultValue={filters.q}
            onKeyDown={(event) => { if (event.key === "Enter") setFilter({ q: event.currentTarget.value.trim() }); }}
            onBlur={(event) => { if (event.target.value.trim() !== filters.q) setFilter({ q: event.target.value.trim() }); }} />
        </div>
      </div>

      <div className={card}>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm text-cm-text-muted">
            {result.pagination ? `${result.pagination.total_items} boxes` : ""}
          </p>
          {searchParams.toString() && (
            <button type="button" className="text-sm font-semibold text-cm-blue-700" onClick={() => setSearchParams({}, { replace: true })}>
              Clear filters
            </button>
          )}
        </div>
        {result.status === "loading" && <p className="text-cm-text-muted">Loading…</p>}
        {result.status === "error" && <p className="text-cm-danger-600">{result.error.message}</p>}
        {result.status === "ok" && result.rows.length === 0 && <p className="text-cm-text-muted">No boxes match these filters.</p>}
        {result.rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[58rem] text-sm">
              <thead className="text-left text-cm-text-muted">
                <tr>
                  <th className="py-2 pr-3 font-medium">Box ID</th>
                  <th className="py-2 pr-3 font-medium">Configuration</th>
                  <th className="py-2 pr-3 font-medium">Section</th>
                  <th className="py-2 pr-3 font-medium">Operator</th>
                  <th className="py-2 pr-3 font-medium">Packed at</th>
                  <th className="py-2 pr-3 text-right font-medium">Quantity</th>
                  <th className="py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cm-border">
                {result.rows.map((row) => {
                  const [statusText, statusClass] = row.verification_status === "MISMATCH"
                    ? ["Mismatch", "bg-cm-danger-100 text-cm-danger-600"]
                    : STATUS_BADGE[row.status] || [row.status, ""];
                  return (
                    <tr key={row.public_id}>
                      <td className="py-2 pr-3">
                        {row.box_uid ? (
                          <Link to={`/verify?code=${row.box_uid}`} className="font-mono font-semibold text-cm-blue-700 hover:underline">
                            {row.box_uid}
                          </Link>
                        ) : (
                          <span className="text-cm-text-muted">{row.status === "OPEN" ? "(packing)" : "(no ID)"}</span>
                        )}
                      </td>
                      <td className="py-2 pr-3">{row.configuration}</td>
                      <td className="py-2 pr-3">{row.section_code}</td>
                      <td className="py-2 pr-3">{row.operator}</td>
                      <td className="py-2 pr-3">
                        {when(row.completed_at || row.cancelled_at || row.opened_at)}
                        {row.cancel_reason && <span className="block text-xs text-cm-text-muted">{row.cancel_reason}</span>}
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums">{row.quantity} / {row.expected}</td>
                      <td className="py-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusClass}`}>{statusText}</span>
                        {row.verification_status === "NOT_VERIFIED" && (
                          <span className="ml-1 text-xs text-cm-text-muted">not verified</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {pages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <button type="button" className={btnSecondary} disabled={filters.page <= 1} onClick={() => setFilter({ page: filters.page - 1 })}>‹ Newer</button>
            <span className="text-sm text-cm-text-muted">Page {filters.page} of {pages}</span>
            <button type="button" className={btnSecondary} disabled={filters.page >= pages} onClick={() => setFilter({ page: filters.page + 1 })}>Older ›</button>
          </div>
        )}
      </div>
    </main>
  );
}
