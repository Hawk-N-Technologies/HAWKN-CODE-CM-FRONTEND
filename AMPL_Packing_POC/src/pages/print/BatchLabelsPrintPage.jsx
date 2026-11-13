import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getBatchLabels } from "../../api/labels";
import PageMessage from "../../components/PageMessage";
import QrSvg from "../../components/QrSvg";

/**
 * Product label sheets for the laser printer (A4 sticker sheets).
 * Sheet layout is adjustable and remembered on this computer, because
 * sticker sheets differ. Presets are starting values: print one test
 * sheet on plain paper, hold it over a sticker sheet, adjust if needed.
 */
const PRESETS = {
  a4_65: { name: "A4 · 65 labels (38.1 × 21.2 mm)", columns: 5, width: 38.1, height: 21.2, gapX: 2.5, gapY: 0, top: 10.7, left: 4.7 },
  a4_24: { name: "A4 · 24 labels (63.5 × 33.9 mm)", columns: 3, width: 63.5, height: 33.9, gapX: 2.5, gapY: 0, top: 12.9, left: 7.2 },
  a4_40: { name: "A4 · 40 squares (30 × 30 mm)", columns: 6, width: 30, height: 30, gapX: 2, gapY: 2, top: 10, left: 8 },
};
const FIELDS = [
  ["columns", "Columns", 1],
  ["width", "Label width (mm)", 0.1],
  ["height", "Label height (mm)", 0.1],
  ["gapX", "Gap across (mm)", 0.1],
  ["gapY", "Gap down (mm)", 0.1],
  ["top", "Top margin (mm)", 0.1],
  ["left", "Left margin (mm)", 0.1],
];
const STORAGE_KEY = "ampl.labelSheet";

function loadLayout() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null");
    if (saved && typeof saved.columns === "number") return saved;
  } catch {
    // storage unavailable: use the default
  }
  return { preset: "a4_65", ...PRESETS.a4_65 };
}

function saveLayout(layout) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  } catch {
    // not critical
  }
}

export default function BatchLabelsPrintPage() {
  const { batchId } = useParams();
  const [state, setState] = useState({ status: "loading", batch: null, labels: [], error: null, loaded: 0 });
  const [layout, setLayout] = useState(loadLayout);
  const [includeVoid, setIncludeVoid] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        let page = 1;
        let totalPages = 1;
        let batch = null;
        const all = [];
        do {
          const data = await getBatchLabels(batchId, page);
          batch = data.batch;
          totalPages = data.total_pages;
          all.push(...data.labels);
          if (active) setState((prev) => ({ ...prev, loaded: all.length }));
          page += 1;
        } while (page <= totalPages && active);
        if (active) setState({ status: "ok", batch, labels: all, error: null, loaded: all.length });
      } catch (error) {
        if (active) setState({ status: "error", batch: null, labels: [], error, loaded: 0 });
      }
    })();
    return () => {
      active = false;
    };
  }, [batchId]);

  const labels = useMemo(
    () => state.labels.filter((label) => includeVoid || label.status !== "VOID"),
    [state.labels, includeVoid],
  );

  const update = (changes) => {
    setLayout((prev) => {
      const next = { ...prev, ...changes };
      saveLayout(next);
      return next;
    });
  };

  if (state.status === "loading") {
    return <PageMessage title="Preparing labels…">{state.loaded > 0 && <p>{state.loaded} ready</p>}</PageMessage>;
  }
  if (state.status === "error") {
    return (
      <PageMessage title="Cannot load labels" tone="error">
        <p>{state.error.message}</p>
      </PageMessage>
    );
  }

  const { batch } = state;
  const voidCount = state.labels.length - state.labels.filter((label) => label.status !== "VOID").length;
  const qrSize = Math.max(Math.min(layout.height - 2, layout.width * 0.55), 8);
  const uidPt = Math.min(Math.max(layout.height / 2.2, 7), 14);
  const pageCss = `@page { size: A4; margin: ${layout.top}mm 0 ${layout.top}mm ${layout.left}mm; }`;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 print:m-0 print:max-w-none print:p-0">
      <style>{pageCss}</style>

      <section className="space-y-4 print:hidden">
        <Link to="/manage" className="text-sm font-medium text-cm-blue-700">‹ Admin home</Link>
        <h1 className="text-2xl font-bold text-cm-navy-950">
          Product labels · {batch.sku_code} · batch #{batch.id}
        </h1>
        <p className="text-cm-text-muted">
          {labels.length} labels to print
          {voidCount > 0 && !includeVoid && ` (${voidCount} voided UIDs left out)`}.
        </p>

        <div className="rounded-cm-xl border border-cm-border bg-cm-card p-4">
          <label className="block text-sm font-medium" htmlFor="preset">Sticker sheet</label>
          <select
            id="preset"
            value={layout.preset || "custom"}
            onChange={(event) =>
              PRESETS[event.target.value]
                ? update({ preset: event.target.value, ...PRESETS[event.target.value] })
                : update({ preset: "custom" })
            }
            className="mt-1 h-11 w-full rounded-cm-md border border-cm-border bg-white px-3"
          >
            {Object.entries(PRESETS).map(([key, preset]) => (
              <option key={key} value={key}>{preset.name}</option>
            ))}
            <option value="custom">Custom</option>
          </select>

          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {FIELDS.map(([key, text, step]) => (
              <label key={key} className="text-sm">
                <span className="block font-medium">{text}</span>
                <input
                  type="number"
                  min={key === "columns" ? 1 : 0}
                  step={step}
                  value={layout[key]}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    if (Number.isFinite(value) && value >= 0) update({ preset: "custom", [key]: value || (key === "columns" ? 1 : 0) });
                  }}
                  className="mt-1 h-10 w-full rounded-cm-md border border-cm-border px-2"
                />
              </label>
            ))}
          </div>

          {voidCount > 0 && (
            <label className="mt-3 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={includeVoid} onChange={(event) => setIncludeVoid(event.target.checked)} />
              Include voided UIDs
            </label>
          )}
        </div>

        <ol className="list-decimal space-y-1 pl-5 text-sm text-cm-text-muted">
          <li>Print one page on plain paper first and hold it over a sticker sheet to check alignment.</li>
          <li>In the print dialog: Paper <strong>A4</strong>, Scale <strong>100%</strong>, Margins <strong>Default</strong>, Headers and footers <strong>off</strong>.</li>
        </ol>
        <button
          type="button"
          onClick={() => window.print()}
          disabled={labels.length === 0}
          className="h-12 rounded-cm-lg bg-cm-blue-600 px-8 font-semibold text-white hover:bg-cm-blue-700 disabled:opacity-50"
        >
          Print {labels.length} labels
        </button>
      </section>

      <div className="mt-6 overflow-x-auto bg-white print:mt-0 print:overflow-visible">
        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${layout.columns}, ${layout.width}mm)`,
            gridAutoRows: `${layout.height}mm`,
            columnGap: `${layout.gapX}mm`,
            rowGap: `${layout.gapY}mm`,
          }}
        >
          {labels.map((label) => (
            <div
              key={label.uid}
              className="box-border flex break-inside-avoid items-center gap-[1.5mm] overflow-hidden bg-white px-[1mm] text-black outline outline-1 outline-dashed outline-cm-border print:outline-none"
            >
              <QrSvg svg={label.svg} className="shrink-0" style={{ width: `${qrSize}mm`, height: `${qrSize}mm` }} />
              <div className="min-w-0 leading-tight">
                <p className="font-mono font-bold" style={{ fontSize: `${uidPt}pt` }}>{label.uid}</p>
                <p className="truncate text-[6.5pt]">{batch.sku_code}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
