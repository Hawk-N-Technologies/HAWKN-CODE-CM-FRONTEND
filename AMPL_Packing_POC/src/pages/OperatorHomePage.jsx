import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMySections } from "../api/packing";
import { useAuth } from "../auth/useAuth";

/** Operator home: pick a packing section (shows any box still open there). */
export default function OperatorHomePage() {
  const { user } = useAuth();
  const [data, setData] = useState({ state: "loading", sections: [], error: null });

  const load = useCallback(async () => {
    try {
      const sections = await getMySections();
      setData({ state: "ok", sections, error: null });
    } catch (error) {
      setData({ state: "error", sections: [], error });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-6">
      <h1 className="text-2xl font-bold text-cm-navy-950">Hello, {user.display_name}</h1>
      <p className="mt-1 text-cm-text-muted">Choose your packing section</p>

      {data.state === "loading" && <p className="mt-6 text-cm-text-muted">Loading…</p>}
      {data.state === "error" && (
        <p role="alert" className="mt-6 rounded-cm-lg bg-cm-danger-100 px-4 py-3 font-medium text-cm-danger-600">
          {data.error.message}{" "}
          <button type="button" onClick={load} className="underline">Try again</button>
        </p>
      )}
      {data.state === "ok" && data.sections.length === 0 && (
        <p className="mt-6 rounded-cm-lg bg-cm-warning-100 px-4 py-3 font-medium text-cm-warning-600">
          You are not assigned to any packing section yet. Ask an admin.
        </p>
      )}

      <ul className="mt-6 space-y-3">
        {data.sections.map((section) => (
          <li key={section.id}>
            <Link
              to={`/op/pack/${section.id}`}
              className="block rounded-cm-xl border border-cm-border bg-cm-card px-5 py-4 shadow-cm-sm hover:border-cm-blue-500"
            >
              <p className="text-lg font-semibold">
                {section.code} — {section.name}
              </p>
              <p className="text-sm text-cm-text-muted">
                {section.active_config ? `Box: ${section.active_config.label}` : "No box configuration assigned"}
              </p>
              {section.open_box && (
                <p className="mt-2 inline-block rounded-full bg-cm-warning-100 px-3 py-1 text-sm font-semibold text-cm-warning-600">
                  Open box: {section.open_box.total_scanned}/{section.open_box.total_expected} packed
                </p>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
