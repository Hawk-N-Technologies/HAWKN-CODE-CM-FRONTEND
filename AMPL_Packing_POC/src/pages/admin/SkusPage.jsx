import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createSku, generateUids, listSkus, updateSku } from "../../api/admin";
import { batchCsvUrl } from "../../api/catalog";
import Notice from "../../components/ui/Notice";
import { btnPrimary, btnSecondary, card, errorText, input, label } from "../../components/ui/ui";

const EMPTY_FORM = { code: "", name: "", description: "" };

export default function SkusPage() {
  const [skus, setSkus] = useState({ status: "loading", rows: [], error: null });
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null); // {id, name, description, is_active}
  const [generating, setGenerating] = useState(null); // {id, quantity}
  const [lastBatch, setLastBatch] = useState(null);
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setSkus({ status: "ok", rows: await listSkus(), error: null });
    } catch (error) {
      setSkus({ status: "error", rows: [], error });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (action, successText) => {
    setBusy(true);
    setNotice(null);
    try {
      const response = await action();
      setNotice({ ok: true, text: response?.message || successText });
      await load();
      return response;
    } catch (error) {
      setNotice({ ok: false, text: errorText(error) });
      return null;
    } finally {
      setBusy(false);
    }
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    const done = await act(() => createSku(form), "SKU created.");
    if (done) setForm(EMPTY_FORM);
  };

  const handleSaveEdit = async (event) => {
    event.preventDefault();
    const { id, ...body } = editing;
    const done = await act(() => updateSku(id, body), "SKU updated.");
    if (done) setEditing(null);
  };

  const handleGenerate = async (event) => {
    event.preventDefault();
    const done = await act(() => generateUids(generating.id, Number(generating.quantity)), "UIDs generated.");
    if (done) {
      setLastBatch(done.data);
      setGenerating(null);
    }
  };

  const q = search.trim().toLowerCase();
  const rows = skus.rows.filter((sku) => !q || sku.code.toLowerCase().includes(q) || sku.name.toLowerCase().includes(q));

  return (
    <main className="space-y-6 p-4 sm:p-6">
      <h1 className="text-2xl font-bold text-cm-navy-950">SKUs & product UIDs</h1>
      <Notice notice={notice} onClose={() => setNotice(null)} />

      {lastBatch && (
        <div className={`${card} flex flex-wrap items-center justify-between gap-3 border-cm-success-600`}>
          <p className="font-semibold">
            Batch #{lastBatch.id}: {lastBatch.quantity} UIDs for {lastBatch.sku.code} are ready.
          </p>
          <span className="flex gap-2">
            <Link to={`/print/batch/${lastBatch.id}`} className={btnPrimary}>Print labels</Link>
            <a href={batchCsvUrl(lastBatch.id)} className={btnSecondary}>Download CSV</a>
          </span>
        </div>
      )}

      <form onSubmit={handleCreate} className={`${card} grid gap-3 sm:grid-cols-[10rem_1fr_1fr_auto] sm:items-end`}>
        <div>
          <label htmlFor="sku-code" className={label}>New SKU code</label>
          <input id="sku-code" className={input} value={form.code} placeholder="SKU003"
            onChange={(event) => setForm({ ...form, code: event.target.value })} />
        </div>
        <div>
          <label htmlFor="sku-name" className={label}>Product name</label>
          <input id="sku-name" className={input} value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })} />
        </div>
        <div>
          <label htmlFor="sku-desc" className={label}>Description (optional)</label>
          <input id="sku-desc" className={input} value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })} />
        </div>
        <button type="submit" className={btnPrimary} disabled={busy || !form.code.trim() || !form.name.trim()}>
          Add SKU
        </button>
      </form>

      <div className={card}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold">All SKUs ({skus.rows.length})</h2>
          <input className={`${input} max-w-xs`} placeholder="Search code or name" value={search}
            onChange={(event) => setSearch(event.target.value)} aria-label="Search SKUs" />
        </div>
        {skus.status === "loading" && <p className="text-cm-text-muted">Loading…</p>}
        {skus.status === "error" && <p className="text-cm-danger-600">{skus.error.message}</p>}
        {skus.status === "ok" && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[56rem] text-sm">
              <thead className="text-left text-cm-text-muted">
                <tr>
                  <th className="py-2 pr-3 font-medium">Code</th>
                  <th className="py-2 pr-3 font-medium">Name</th>
                  <th className="py-2 pr-3 text-right font-medium">UIDs</th>
                  <th className="py-2 pr-3 text-right font-medium">Available</th>
                  <th className="py-2 pr-3 text-right font-medium">In box</th>
                  <th className="py-2 pr-3 text-right font-medium">Packed</th>
                  <th className="py-2 pr-3 text-right font-medium">Void</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-cm-border">
                {rows.map((sku) => (
                  <tr key={sku.id} className="align-top">
                    <td className="py-2 pr-3 font-mono font-semibold">{sku.code}</td>
                    <td className="py-2 pr-3">
                      {editing?.id === sku.id ? (
                        <form onSubmit={handleSaveEdit} className="space-y-2">
                          <input className={input} value={editing.name} aria-label="Name"
                            onChange={(event) => setEditing({ ...editing, name: event.target.value })} />
                          <input className={input} value={editing.description} aria-label="Description" placeholder="Description"
                            onChange={(event) => setEditing({ ...editing, description: event.target.value })} />
                          <label className="flex items-center gap-2">
                            <input type="checkbox" checked={editing.is_active}
                              onChange={(event) => setEditing({ ...editing, is_active: event.target.checked })} />
                            Active
                          </label>
                          <span className="flex gap-2">
                            <button type="submit" className={btnPrimary} disabled={busy}>Save</button>
                            <button type="button" className={btnSecondary} onClick={() => setEditing(null)}>Cancel</button>
                          </span>
                        </form>
                      ) : (
                        <>
                          {sku.name}
                          {sku.description && <p className="text-xs text-cm-text-muted">{sku.description}</p>}
                        </>
                      )}
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums">{sku.counts.total}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{sku.counts.available}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{sku.counts.in_box}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{sku.counts.packed}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{sku.counts.void}</td>
                    <td className="py-2 pr-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${sku.is_active ? "bg-cm-success-100 text-cm-success-600" : "bg-cm-bg text-cm-text-muted"}`}>
                        {sku.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-2">
                      {generating?.id === sku.id ? (
                        <form onSubmit={handleGenerate} className="flex items-center gap-2">
                          <input type="number" min="1" max="10000" className={`${input} w-24`} aria-label="Quantity"
                            value={generating.quantity}
                            onChange={(event) => setGenerating({ ...generating, quantity: event.target.value })} />
                          <button type="submit" className={btnPrimary} disabled={busy || !(Number(generating.quantity) >= 1)}>
                            {busy ? "…" : "Generate"}
                          </button>
                          <button type="button" className={btnSecondary} onClick={() => setGenerating(null)}>×</button>
                        </form>
                      ) : (
                        <span className="flex justify-end gap-2">
                          <button type="button" className={btnPrimary} disabled={!sku.is_active}
                            onClick={() => setGenerating({ id: sku.id, quantity: 25 })}>
                            Generate UIDs
                          </button>
                          <button type="button" className={btnSecondary}
                            onClick={() => setEditing({ id: sku.id, name: sku.name, description: sku.description, is_active: sku.is_active })}>
                            Edit
                          </button>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-xs text-cm-text-muted">
          SKU codes cannot be changed once created. Up to 10,000 UIDs per batch; 900,000 in total.
        </p>
      </div>
    </main>
  );
}
