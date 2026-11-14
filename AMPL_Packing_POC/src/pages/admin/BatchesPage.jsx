import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listBatches, listSkus } from "../../api/admin";
import { batchCsvUrl } from "../../api/catalog";
import { btnPrimary, btnSecondary, card, input } from "../../components/ui/ui";

export default function BatchesPage() {
  const [skus, setSkus] = useState([]);
  const [sku, setSku] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ status: "loading", rows: [], pagination: null, error: null });

  useEffect(() => {
    listSkus().then(setSkus).catch(() => setSkus([]));
  }, []);

  useEffect(() => {
    let active = true;
    listBatches({ page, sku })
      .then((payload) => active && setResult({ status: "ok", rows: payload.data, pagination: payload.pagination, error: null }))
      .catch((error) => active && setResult({ status: "error", rows: [], pagination: null, error }));
    return () => {
      active = false;
    };
  }, [page, sku]);

  const pages = result.pagination?.total_pages || 1;

  return (
    <main className="space-y-6 p-4 sm:p-6">
      <h1 className="text-2xl font-bold text-cm-navy-950">UID batches</h1>
      <div className={card}>
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <label htmlFor="batch-sku" className="text-sm font-medium">SKU</label>
          <select id="batch-sku" className={`${input} max-w-xs`} value={sku}
            onChange={(event) => { setSku(event.target.value); setPage(1); }}>
            <option value="">All SKUs</option>
            {skus.map((item) => <option key={item.id} value={item.id}>{item.code} — {item.name}</option>)}
          </select>
        </div>

        {result.status === "loading" && <p className="text-cm-text-muted">Loading…</p>}
        {result.status === "error" && <p className="text-cm-danger-600">{result.error.message}</p>}
        {result.status === "ok" && result.rows.length === 0 && <p className="text-cm-text-muted">No batches yet.</p>}
        {result.rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-sm">
              <thead className="text-left text-cm-text-muted">
                <tr>
                  <th className="py-2 pr-3 font-medium">Batch</th>
                  <th className="py-2 pr-3 font-medium">SKU</th>
                  <th className="py-2 pr-3 text-right font-medium">Quantity</th>
                  <th className="py-2 pr-3 font-medium">Created</th>
                  <th className="py-2 pr-3 font-medium">By</th>
                  <th className="py-2 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-cm-border">
                {result.rows.map((batch) => (
                  <tr key={batch.id}>
                    <td className="py-2 pr-3 font-semibold">#{batch.id}</td>
                    <td className="py-2 pr-3">{batch.sku.code} <span className="text-cm-text-muted">{batch.sku.name}</span></td>
                    <td className="py-2 pr-3 text-right tabular-nums">{batch.quantity}</td>
                    <td className="py-2 pr-3">{new Date(batch.created_at).toLocaleString()}</td>
                    <td className="py-2 pr-3">{batch.created_by}</td>
                    <td className="py-2">
                      <span className="flex justify-end gap-2">
                        <Link to={`/print/batch/${batch.id}`} className={btnPrimary}>Print labels</Link>
                        <a href={batchCsvUrl(batch.id)} className={btnSecondary}>CSV</a>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <button type="button" className={btnSecondary} disabled={page <= 1} onClick={() => setPage(page - 1)}>‹ Newer</button>
            <span className="text-sm text-cm-text-muted">Page {page} of {pages}</span>
            <button type="button" className={btnSecondary} disabled={page >= pages} onClick={() => setPage(page + 1)}>Older ›</button>
          </div>
        )}
      </div>
    </main>
  );
}
