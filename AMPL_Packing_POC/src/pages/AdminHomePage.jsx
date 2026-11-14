import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { batchCsvUrl, getUidBatches } from "../api/catalog";
import { getDashboard } from "../api/reports";
import { useAuth } from "../auth/useAuth";

const number = (value) => Number(value || 0).toLocaleString("en-IN");

function Stat({ label, value, tone = "neutral", to }) {
  const tones = {
    neutral: "text-cm-navy-950",
    good: "text-cm-success-600",
    warn: "text-cm-warning-600",
    bad: "text-cm-danger-600",
    muted: "text-cm-text-muted",
  };
  const body = (
    <>
      <p className="text-sm text-cm-text-muted">{label}</p>
      <p className={`mt-1 text-3xl font-bold tabular-nums ${tones[tone]}`}>{number(value)}</p>
    </>
  );
  const className = "block rounded-cm-xl border border-cm-border bg-cm-card p-4 shadow-cm-sm";
  return to ? (
    <Link to={to} className={`${className} hover:border-cm-blue-500`}>{body}</Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

/** Admin dashboard: counts only (no charts), plus recent UID batches. */
export default function AdminHomePage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState({ state: "loading", data: null, error: null });
  const [batches, setBatches] = useState({ state: "loading", rows: [], error: null });

  const load = useCallback(async (signal) => {
    try {
      const [data, rows] = await Promise.all([getDashboard({ signal }), getUidBatches({ signal })]);
      setSummary({ state: "ok", data, error: null });
      setBatches({ state: "ok", rows, error: null });
    } catch (error) {
      if (error.name !== "AbortError") setSummary({ state: "error", data: null, error });
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const data = summary.data;
  const capacity = data?.uid_capacity;
  const usedPercent = capacity?.total ? (capacity.used / capacity.total) * 100 : 0;

  return (
    <main className="w-full space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-cm-navy-950 sm:text-3xl">Dashboard</h1>
          <p className="text-cm-text-muted">Welcome, {user.display_name}</p>
        </div>
        <button type="button" onClick={() => load()} className="h-10 rounded-cm-md border border-cm-border bg-cm-card px-4 text-sm font-semibold hover:bg-cm-blue-50">
          Refresh
        </button>
      </div>

      {summary.state === "loading" && <p className="text-cm-text-muted">Loading…</p>}
      {summary.state === "error" && <p role="alert" className="text-cm-danger-600">{summary.error.message}</p>}

      {data && (
        <>
          <section>
            <h2 className="mb-2 font-semibold">Product UIDs</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <Stat label="Generated" value={data.product_uids.total} to="/manage/skus" />
              <Stat label="Available" value={data.product_uids.available} tone="good" />
              <Stat label="In an open box" value={data.product_uids.in_box} tone="warn" />
              <Stat label="Packed" value={data.product_uids.packed} />
              <Stat label="Void" value={data.product_uids.void} tone="muted" />
            </div>
          </section>

          <section>
            <h2 className="mb-2 font-semibold">Boxes</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <Stat label="Pending (open)" value={data.boxes.open} tone="warn" to="/manage/history?status=OPEN" />
              <Stat label="Completed (incl. verified)" value={data.boxes.completed} />
              <Stat label="Verified" value={data.boxes.verified} tone="good" to="/manage/history?status=VERIFIED" />
              <Stat label="Not yet verified" value={data.boxes.not_verified} tone="neutral" />
              <Stat label="Mismatch" value={data.boxes.mismatch} tone="bad" to="/manage/history?status=MISMATCH" />
              <Stat label="Cancelled" value={data.boxes.cancelled} tone="muted" to="/manage/history?status=CANCELLED" />
            </div>
            <p className="mt-2 text-sm text-cm-text-muted">
              Today: {number(data.today.boxes_completed)} boxes completed, {number(data.today.products_packed)} products packed.
            </p>
          </section>

          <section className="rounded-cm-xl border border-cm-border bg-cm-card p-5 shadow-cm-sm">
            <h2 className="font-semibold">Product UID capacity (6-digit range)</h2>
            <p className="mt-2 text-2xl font-bold text-cm-navy-950">
              {number(capacity.remaining)}
              <span className="ml-2 text-base font-medium text-cm-text-muted">of {number(capacity.total)} left</span>
            </p>
            <div className="mt-3 h-2 rounded-full bg-cm-blue-50" aria-hidden="true">
              <div className={`h-2 rounded-full ${usedPercent >= 80 ? "bg-cm-warning-600" : "bg-cm-blue-600"}`}
                style={{ width: `${Math.max(usedPercent, 0.5)}%` }} />
            </div>
          </section>
        </>
      )}

      <section className="rounded-cm-xl border border-cm-border bg-cm-card p-5 shadow-cm-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Recent UID batches</h2>
          <Link to="/manage/batches" className="text-sm font-semibold text-cm-blue-700">All batches ›</Link>
        </div>
        {batches.state === "ok" && batches.rows.length === 0 && (
          <p className="mt-2 text-sm text-cm-text-muted">No UIDs generated yet.</p>
        )}
        {batches.rows.length > 0 && (
          <ul className="mt-3 divide-y divide-cm-border">
            {batches.rows.slice(0, 5).map((batch) => (
              <li key={batch.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <span>
                  <span className="font-semibold">#{batch.id}</span> · {batch.sku.code} × {batch.quantity}
                  <span className="ml-2 text-sm text-cm-text-muted">{new Date(batch.created_at).toLocaleString()}</span>
                </span>
                <span className="flex gap-2">
                  <Link to={`/print/batch/${batch.id}`}
                    className="rounded-cm-md bg-cm-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-cm-blue-700">
                    Print labels
                  </Link>
                  <a href={batchCsvUrl(batch.id)} className="rounded-cm-md border border-cm-border px-3 py-1.5 text-sm font-semibold hover:bg-cm-blue-50">
                    CSV
                  </a>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Link to="/manage/scan-log" className="rounded-cm-xl border border-cm-border bg-cm-card p-5 shadow-cm-sm hover:border-cm-blue-500">
          <h2 className="font-semibold text-cm-blue-700">Scan log</h2>
          <p className="mt-1 text-sm text-cm-text-muted">Every scan, accepted or rejected.</p>
        </Link>
        <Link to="/status" className="rounded-cm-xl border border-cm-border bg-cm-card p-5 shadow-cm-sm hover:border-cm-blue-500">
          <h2 className="font-semibold text-cm-blue-700">System status</h2>
          <p className="mt-1 text-sm text-cm-text-muted">Backend and database health.</p>
        </Link>
        <a href="/admin/" target="_blank" rel="noreferrer" className="rounded-cm-xl border border-cm-border bg-cm-card p-5 shadow-cm-sm hover:border-cm-blue-500">
          <h2 className="font-semibold text-cm-blue-700">Advanced: Django admin ↗</h2>
          <p className="mt-1 text-sm text-cm-text-muted">Raw records. Everyday setup uses the menu.</p>
        </a>
      </section>
    </main>
  );
}
