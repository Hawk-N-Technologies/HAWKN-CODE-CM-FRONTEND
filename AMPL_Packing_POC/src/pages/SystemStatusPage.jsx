import { useCallback, useEffect, useState } from "react";
import { getHealth } from "../api/health";
import StatusPill from "../components/StatusPill";

/**
 * M0 landing page: proves frontend -> backend -> database works end to end.
 * Replaced by login and role-based home pages in M3.
 */
export default function SystemStatusPage() {
  const [result, setResult] = useState({ state: "pending", data: null, error: null });
  const [checking, setChecking] = useState(true);

  const runCheck = useCallback(async (signal) => {
    try {
      const data = await getHealth({ signal });
      setResult({ state: "ok", data, error: null });
    } catch (error) {
      if (error.name === "AbortError") return;
      setResult({ state: "error", data: error.data, error });
    } finally {
      if (!signal?.aborted) setChecking(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    runCheck(controller.signal);
    return () => controller.abort();
  }, [runCheck]);

  const handleRecheck = () => {
    setChecking(true);
    setResult((previous) => ({ ...previous, state: "pending" }));
    runCheck();
  };

  const apiState =
    result.state === "pending"
      ? "pending"
      : result.data?.api === "ok" || result.state === "ok"
        ? "ok"
        : "error";
  const dbState =
    result.state === "pending" ? "pending" : result.data?.database === "ok" ? "ok" : "error";

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:py-10">
      <h1 className="text-2xl font-bold text-cm-navy-950 sm:text-3xl">System status</h1>
      <p className="mt-1 text-cm-text-muted">
        AMPL Packing POC · Milestone 0. Confirms this app can reach its backend and database.
      </p>

      <section
        aria-live="polite"
        className="mt-6 rounded-cm-xl border border-cm-border bg-cm-card shadow-cm-md"
      >
        <dl className="divide-y divide-cm-border">
          <div className="flex items-center justify-between gap-4 px-5 py-4">
            <dt className="font-medium">Frontend</dt>
            <dd><StatusPill state="ok" /></dd>
          </div>
          <div className="flex items-center justify-between gap-4 px-5 py-4">
            <dt className="font-medium">Backend API</dt>
            <dd><StatusPill state={apiState} /></dd>
          </div>
          <div className="flex items-center justify-between gap-4 px-5 py-4">
            <dt className="font-medium">Database</dt>
            <dd><StatusPill state={dbState} /></dd>
          </div>
        </dl>

        {result.state === "ok" && (
          <p className="border-t border-cm-border px-5 py-3 text-sm text-cm-text-muted">
            {result.data.service} v{result.data.version} · database replied in{" "}
            {result.data.database_latency_ms} ms · server time{" "}
            {new Date(result.data.server_time).toLocaleString()}
          </p>
        )}

        {result.state === "error" && (
          <p role="alert" className="border-t border-cm-border bg-cm-danger-100 px-5 py-3 text-sm text-cm-danger-600">
            {result.error.message} <span className="opacity-70">({result.error.code})</span>
          </p>
        )}
      </section>

      <button
        type="button"
        onClick={handleRecheck}
        disabled={checking}
        className="mt-6 h-12 w-full rounded-cm-lg bg-cm-blue-600 px-6 font-semibold text-white shadow-cm-sm transition-colors hover:bg-cm-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {checking ? "Checking…" : "Check again"}
      </button>
    </main>
  );
}
