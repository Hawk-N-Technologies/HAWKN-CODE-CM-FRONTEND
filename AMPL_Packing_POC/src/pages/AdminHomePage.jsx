import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { batchCsvUrl, getUidBatches, getUidCapacity } from "../api/catalog";
import { useAuth } from "../auth/useAuth";

const number = (value) => Number(value).toLocaleString("en-IN");

/**
 * Admin landing page. The full admin screens (SKUs, UID generation,
 * configurations, sections) arrive in M7; until then the admin console
 * (Django admin) and the API are used.
 */
export default function AdminHomePage() {
  const { user } = useAuth();
  const [capacity, setCapacity] = useState({ state: "loading", data: null, error: null });
  const [batches, setBatches] = useState({ state: "loading", rows: [], error: null });

  useEffect(() => {
    const controller = new AbortController();
    getUidCapacity({ signal: controller.signal })
      .then((data) => setCapacity({ state: "ok", data, error: null }))
      .catch((error) => {
        if (error.name !== "AbortError") setCapacity({ state: "error", data: null, error });
      });
    getUidBatches({ signal: controller.signal })
      .then((rows) => setBatches({ state: "ok", rows, error: null }))
      .catch((error) => {
        if (error.name !== "AbortError") setBatches({ state: "error", rows: [], error });
      });
    return () => controller.abort();
  }, []);

  const usedPercent =
    capacity.data && capacity.data.total ? (capacity.data.used / capacity.data.total) * 100 : 0;

  return (
    <main className="w-full p-4 sm:p-6">
      <h1 className="text-2xl font-bold text-cm-navy-950 sm:text-3xl">Welcome, {user.display_name}</h1>
      <p className="mt-1 text-cm-text-muted">Administration</p>

      <section className="mt-6 rounded-cm-xl border border-cm-border bg-cm-card p-5 shadow-cm-md">
        <h2 className="font-semibold">Product UID capacity (6-digit range)</h2>
        {capacity.state === "loading" && <p className="mt-2 text-cm-text-muted">Loading…</p>}
        {capacity.state === "error" && (
          <p role="alert" className="mt-2 text-cm-danger-600">{capacity.error.message}</p>
        )}
        {capacity.state === "ok" && (
          <>
            <p className="mt-2 text-3xl font-bold text-cm-navy-950">
              {number(capacity.data.remaining)}
              <span className="ml-2 text-base font-medium text-cm-text-muted">
                of {number(capacity.data.total)} left
              </span>
            </p>
            <div className="mt-3 h-2 rounded-full bg-cm-blue-50" aria-hidden="true">
              <div
                className={`h-2 rounded-full ${usedPercent >= 80 ? "bg-cm-warning-600" : "bg-cm-blue-600"}`}
                style={{ width: `${Math.max(usedPercent, 0.5)}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-cm-text-muted">{number(capacity.data.used)} generated so far.</p>
          </>
        )}
      </section>

      <section className="mt-6 rounded-cm-xl border border-cm-border bg-cm-card p-5 shadow-cm-sm">
        <h2 className="font-semibold">Recent UID batches</h2>
        {batches.state === "loading" && <p className="mt-2 text-cm-text-muted">Loading…</p>}
        {batches.state === "error" && (
          <p role="alert" className="mt-2 text-cm-danger-600">{batches.error.message}</p>
        )}
        {batches.state === "ok" && batches.rows.length === 0 && (
          <p className="mt-2 text-sm text-cm-text-muted">No UIDs generated yet.</p>
        )}
        {batches.rows.length > 0 && (
          <ul className="mt-3 divide-y divide-cm-border">
            {batches.rows.map((batch) => (
              <li key={batch.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <span>
                  <span className="font-semibold">#{batch.id}</span> · {batch.sku.code} × {batch.quantity}
                  <span className="ml-2 text-sm text-cm-text-muted">
                    {new Date(batch.created_at).toLocaleString()}
                  </span>
                </span>
                <span className="flex gap-2">
                  <Link
                    to={`/print/batch/${batch.id}`}
                    className="rounded-cm-md bg-cm-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-cm-blue-700"
                  >
                    Print labels
                  </Link>
                  <a
                    href={batchCsvUrl(batch.id)}
                    className="rounded-cm-md border border-cm-border px-3 py-1.5 text-sm font-semibold hover:bg-cm-blue-50"
                  >
                    CSV
                  </a>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        <a
          href="/admin/"
          target="_blank"
          rel="noreferrer"
          className="rounded-cm-xl border border-cm-border bg-cm-card p-5 shadow-cm-sm hover:border-cm-blue-500"
        >
          <h2 className="font-semibold text-cm-blue-700">Advanced: Django admin console ↗</h2>
          <p className="mt-1 text-sm text-cm-text-muted">
            Raw records and audit logs. Everyday setup uses the menu on the left.
          </p>
        </a>
        <Link
          to="/verify"
          className="rounded-cm-xl border border-cm-border bg-cm-card p-5 shadow-cm-sm hover:border-cm-blue-500"
        >
          <h2 className="font-semibold text-cm-blue-700">Verify a box</h2>
          <p className="mt-1 text-sm text-cm-text-muted">Scan a box label and record the check.</p>
        </Link>
        <Link
          to="/op"
          className="rounded-cm-xl border border-cm-border bg-cm-card p-5 shadow-cm-sm hover:border-cm-blue-500"
        >
          <h2 className="font-semibold text-cm-blue-700">Packing sections</h2>
          <p className="mt-1 text-sm text-cm-text-muted">Open the packing screen for any section.</p>
        </Link>
        <Link
          to="/status"
          className="rounded-cm-xl border border-cm-border bg-cm-card p-5 shadow-cm-sm hover:border-cm-blue-500"
        >
          <h2 className="font-semibold text-cm-blue-700">System status</h2>
          <p className="mt-1 text-sm text-cm-text-muted">Backend and database health.</p>
        </Link>
      </section>
    </main>
  );
}
