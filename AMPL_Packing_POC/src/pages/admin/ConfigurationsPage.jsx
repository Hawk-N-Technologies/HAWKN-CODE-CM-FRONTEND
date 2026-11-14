import { useCallback, useEffect, useState } from "react";
import {
  createConfiguration,
  createConfigurationVersion,
  listConfigurations,
  listSkus,
  updateConfiguration,
} from "../../api/admin";
import ItemsEditor from "../../components/admin/ItemsEditor";
import { toApiItems } from "../../components/admin/items";
import Notice from "../../components/ui/Notice";
import { btnPrimary, btnSecondary, card, errorText, input, label } from "../../components/ui/ui";

const NEW_ROWS = [{ sku_id: "", quantity: "" }];

function VersionItems({ version }) {
  return (
    <ul className="space-y-1 text-sm">
      {version.items.map((item) => (
        <li key={item.sku_id} className="flex justify-between gap-3">
          <span><span className="font-semibold">{item.sku_code}</span> <span className="text-cm-text-muted">{item.sku_name}</span></span>
          <span className="font-semibold tabular-nums">× {item.quantity}</span>
        </li>
      ))}
    </ul>
  );
}

export default function ConfigurationsPage() {
  const [configs, setConfigs] = useState({ status: "loading", rows: [], error: null });
  const [skus, setSkus] = useState([]);
  const [form, setForm] = useState({ code: "", name: "", items: NEW_ROWS });
  const [editing, setEditing] = useState(null); // { id, items, notes, apply }
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [rows, skuRows] = await Promise.all([listConfigurations(), listSkus()]);
      setConfigs({ status: "ok", rows, error: null });
      setSkus(skuRows);
    } catch (error) {
      setConfigs({ status: "error", rows: [], error });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (action) => {
    setBusy(true);
    setNotice(null);
    try {
      const response = await action();
      setNotice({ ok: true, text: response.message });
      await load();
      return true;
    } catch (error) {
      setNotice({ ok: false, text: errorText(error) });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const createItems = toApiItems(form.items);
  const editItems = editing ? toApiItems(editing.items) : null;

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!createItems) return;
    const ok = await act(() => createConfiguration({ code: form.code, name: form.name, items: createItems }));
    if (ok) setForm({ code: "", name: "", items: NEW_ROWS });
  };

  const startEdit = (config) => {
    const latest = config.versions[0];
    setEditing({
      id: config.id,
      items: latest
        ? latest.items.map((item) => ({ sku_id: String(item.sku_id), quantity: String(item.quantity) }))
        : NEW_ROWS,
      notes: "",
      apply: true,
    });
  };

  const handleNewVersion = async (event) => {
    event.preventDefault();
    if (!editItems) return;
    const ok = await act(() =>
      createConfigurationVersion(editing.id, { items: editItems, notes: editing.notes, apply_to_sections: editing.apply }),
    );
    if (ok) setEditing(null);
  };

  return (
    <main className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold text-cm-navy-950">Box configurations</h1>
        <p className="text-sm text-cm-text-muted">
          A configuration says which SKUs, and how many of each, go in one box. Changing it creates a new version;
          boxes already packed keep the version they were packed with.
        </p>
      </div>
      <Notice notice={notice} onClose={() => setNotice(null)} />

      <form onSubmit={handleCreate} className={`${card} space-y-3`}>
        <h2 className="font-semibold">New configuration</h2>
        <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
          <div>
            <label htmlFor="cfg-code" className={label}>Code</label>
            <input id="cfg-code" className={input} placeholder="BC3" value={form.code}
              onChange={(event) => setForm({ ...form, code: event.target.value })} />
          </div>
          <div>
            <label htmlFor="cfg-name" className={label}>Name</label>
            <input id="cfg-name" className={input} placeholder="e.g. 10 × SKU001 + 30 × SKU002" value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </div>
        </div>
        <ItemsEditor items={form.items} skus={skus} onChange={(items) => setForm({ ...form, items })} />
        <button type="submit" className={btnPrimary} disabled={busy || !form.code.trim() || !form.name.trim() || !createItems}>
          Create configuration
        </button>
      </form>

      {configs.status === "loading" && <p className="text-cm-text-muted">Loading…</p>}
      {configs.status === "error" && <p className="text-cm-danger-600">{configs.error.message}</p>}

      <div className="grid gap-4 lg:grid-cols-2">
        {configs.rows.map((config) => {
          const latest = config.versions[0];
          const isEditing = editing?.id === config.id;
          return (
            <section key={config.id} className={`${card} space-y-3 ${config.is_active ? "" : "opacity-70"}`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold">{config.code} <span className="font-normal text-cm-text-muted">· {config.name}</span></h2>
                  <p className="text-sm text-cm-text-muted">
                    {latest ? `Latest: v${latest.version_no} · ${latest.total_quantity} per box` : "No SKUs yet"}
                    {config.used_by_sections.length > 0 && ` · used by section ${config.used_by_sections.join(", ")}`}
                  </p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${config.is_active ? "bg-cm-success-100 text-cm-success-600" : "bg-cm-bg text-cm-text-muted"}`}>
                  {config.is_active ? "Active" : "Inactive"}
                </span>
              </div>

              {isEditing ? (
                <form onSubmit={handleNewVersion} className="space-y-3 rounded-cm-lg bg-cm-bg p-3">
                  <p className="text-sm font-medium">New version v{(latest?.version_no || 0) + 1}</p>
                  <ItemsEditor items={editing.items} skus={skus} onChange={(items) => setEditing({ ...editing, items })} />
                  <input className={input} placeholder="What changed? (optional)" value={editing.notes} aria-label="Notes"
                    onChange={(event) => setEditing({ ...editing, notes: event.target.value })} />
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={editing.apply}
                      onChange={(event) => setEditing({ ...editing, apply: event.target.checked })} />
                    Use the new version in sections that use this configuration (open boxes are not affected)
                  </label>
                  <span className="flex gap-2">
                    <button type="submit" className={btnPrimary} disabled={busy || !editItems}>Save as new version</button>
                    <button type="button" className={btnSecondary} onClick={() => setEditing(null)}>Cancel</button>
                  </span>
                </form>
              ) : (
                latest && <VersionItems version={latest} />
              )}

              {!isEditing && (
                <div className="flex flex-wrap gap-2">
                  <button type="button" className={btnSecondary} disabled={!config.is_active} onClick={() => startEdit(config)}>
                    Change items
                  </button>
                  <button type="button" className={btnSecondary} disabled={busy}
                    onClick={() => act(() => updateConfiguration(config.id, { is_active: !config.is_active }))}>
                    {config.is_active ? "Deactivate" : "Activate"}
                  </button>
                </div>
              )}

              {config.versions.length > 1 && (
                <details className="text-sm">
                  <summary className="cursor-pointer text-cm-text-muted">Earlier versions ({config.versions.length - 1})</summary>
                  <ul className="mt-2 space-y-3">
                    {config.versions.slice(1).map((version) => (
                      <li key={version.id} className="rounded-cm-md border border-cm-border p-3">
                        <p className="mb-1 text-xs text-cm-text-muted">
                          v{version.version_no} · {new Date(version.created_at).toLocaleDateString()} · {version.box_count} boxes
                          {version.notes && ` · ${version.notes}`}
                        </p>
                        <VersionItems version={version} />
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </section>
          );
        })}
      </div>
    </main>
  );
}
