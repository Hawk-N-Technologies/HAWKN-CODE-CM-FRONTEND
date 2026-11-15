import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { lookupCode } from "../api/lookup";
import ScanResultBanner from "../components/packing/ScanResultBanner";
import ManualEntry from "../components/scanner/ManualEntry";
import QrScannerView from "../components/scanner/QrScannerView";
import { feedbackError, feedbackSuccess, unlockAudio } from "../components/scanner/scanFeedback";
import { homeFor } from "../auth/roles";
import { useAuth } from "../auth/useAuth";

const ERROR_TITLES = {
  UID_NOT_FOUND: "Unknown item",
  BOX_NOT_FOUND: "Box not found",
  INVALID_FORMAT: "Not an AMPL QR",
  NETWORK_ERROR: "No connection",
  BACKEND_UNREACHABLE: "Server not responding",
};

// Big, simple status words for the floor.
const ITEM_STATUS = {
  PACKED: { text: "Packed ✓", className: "bg-cm-success-600 text-white" },
  IN_BOX: { text: "Being packed", className: "bg-cm-warning-600 text-white" },
  AVAILABLE: { text: "Not packed yet", className: "bg-cm-navy-900 text-white" },
  VOID: { text: "Cancelled label", className: "bg-cm-danger-600 text-white" },
};
const BOX_STATUS = {
  COMPLETED: { text: "Packed ✓", className: "bg-cm-success-600 text-white" },
  OPEN: { text: "Being packed", className: "bg-cm-warning-600 text-white" },
  CANCELLED: { text: "Cancelled", className: "bg-cm-danger-600 text-white" },
};

const when = (value) => (value ? new Date(value).toLocaleString() : "—");

function StatusBar({ status }) {
  return (
    <p className={`rounded-cm-xl px-4 py-4 text-center text-2xl font-bold ${status.className}`} role="status">
      {status.text}
    </p>
  );
}

function Row({ label, children }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="text-cm-text-muted">{label}</dt>
      <dd className="text-right font-semibold">{children}</dd>
    </div>
  );
}

function ItemDetails({ item, onOpenBox }) {
  const status = ITEM_STATUS[item.status] || { text: item.status, className: "bg-cm-bg" };
  return (
    <section className="space-y-3">
      <StatusBar status={status} />
      <div className="rounded-cm-xl border border-cm-border bg-cm-card p-5 shadow-cm-sm">
        <p className="text-sm font-medium uppercase tracking-wide text-cm-text-muted">Item</p>
        <p className="font-mono text-3xl font-bold text-cm-navy-950">{item.uid}</p>
        <dl className="mt-3 divide-y divide-cm-border text-base">
          <Row label="SKU">{item.sku_code} · {item.sku_name}</Row>
          {item.box?.box_uid && (
            <Row label="Box">
              <button type="button" onClick={() => onOpenBox(item.box.box_uid)} className="font-mono text-cm-blue-700 underline">
                {item.box.box_uid}
              </button>
            </Row>
          )}
          {item.box && !item.box.box_uid && <Row label="Box">Open box, section {item.box.section_code}</Row>}
          {item.packed && <Row label="Packed at">{when(item.packed_at)}</Row>}
        </dl>
      </div>
    </section>
  );
}

function BoxDetails({ box }) {
  const status = BOX_STATUS[box.status] || { text: box.status, className: "bg-cm-bg" };
  return (
    <section className="space-y-3">
      <StatusBar status={status} />
      <div className="rounded-cm-xl border border-cm-border bg-cm-card p-5 shadow-cm-sm">
        <p className="text-sm font-medium uppercase tracking-wide text-cm-text-muted">Box</p>
        <p className="font-mono text-3xl font-bold text-cm-navy-950">{box.box_uid}</p>
        <dl className="mt-3 divide-y divide-cm-border text-base">
          <Row label="Box type">{box.config?.label}</Row>
          <Row label="Quantity">{box.progress.total_scanned} pcs</Row>
          <Row label="Section">{box.section.code} · {box.section.name}</Row>
          <Row label="Packed at">{when(box.completed_at)}</Row>
          <Row label="Packed by">{box.completed_by || "—"}</Row>
        </dl>
      </div>

      {box.can_print && (
        <a
          href={`/print/box/${box.public_id}?auto=1`}
          target="_blank"
          rel="noreferrer"
          className="flex h-14 w-full items-center justify-center rounded-cm-lg border-2 border-cm-blue-600 bg-cm-card text-lg font-semibold text-cm-blue-700 hover:bg-cm-blue-50"
        >
          Reprint box label
        </a>
      )}

      <div className="rounded-cm-xl border border-cm-border bg-cm-card p-4">
        <h2 className="font-semibold">What is inside</h2>
        <ul className="mt-2 space-y-1">
          {box.progress.lines.map((line) => (
            <li key={line.sku_id} className="flex justify-between gap-3">
              <span className="min-w-0 truncate"><span className="font-semibold">{line.sku_code}</span> {line.sku_name}</span>
              <span className="shrink-0 font-semibold tabular-nums">× {line.scanned}</span>
            </li>
          ))}
        </ul>
        <h3 className="mt-4 text-sm font-semibold text-cm-text-muted">Items ({box.items.length})</h3>
        <ul className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-sm sm:grid-cols-3">
          {box.items.map((item) => (
            <li key={item.uid}>
              {item.uid} <span className="font-sans text-xs text-cm-text-muted">{item.sku_code}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/**
 * Scan box / item: scan or type any label and see its details.
 * /scan?code=BOX-000001 (or a product UID) opens it directly.
 */
export default function ScanLookupPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCode = searchParams.get("code") || "";
  const [result, setResult] = useState(null); // {kind, item | box}
  const [banner, setBanner] = useState(null);
  const [loading, setLoading] = useState(Boolean(initialCode));
  const [cameraOn, setCameraOn] = useState(false);
  const lastScanRef = useRef({ value: "", at: 0 });
  const loadingRef = useRef(false);

  const show = async (raw, { fromScan = false } = {}) => {
    const value = String(raw || "").trim();
    if (!value || loadingRef.current) return;
    const now = Date.now();
    if (fromScan && value === lastScanRef.current.value && now - lastScanRef.current.at < 2500) return;
    lastScanRef.current = { value, at: now };

    loadingRef.current = true;
    setLoading(true);
    try {
      const data = await lookupCode(value);
      setResult(data);
      setBanner(null);
      setCameraOn(false);
      setSearchParams({ code: value.toUpperCase() }, { replace: true });
      if (fromScan) feedbackSuccess();
    } catch (error) {
      setResult(null);
      setBanner({ ok: false, title: ERROR_TITLES[error.code] || "Not found", message: error.message });
      if (fromScan) feedbackError();
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialCode) show(initialCode);
    // Only on first open of a /scan?code=... link.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scanNext = () => {
    setResult(null);
    setBanner(null);
    setSearchParams({}, { replace: true });
    unlockAudio();
    setCameraOn(true);
  };

  return (
    <main className="mx-auto w-full max-w-xl space-y-4 px-4 py-4 pb-10">
      <div>
        <Link to={homeFor(user.role)} className="text-sm font-medium text-cm-blue-700">‹ Home</Link>
        <h1 className="text-2xl font-bold text-cm-navy-950">Scan box / item</h1>
        <p className="text-sm text-cm-text-muted">Scan any box or item QR to see its details.</p>
      </div>

      {!result && (
        <section className="space-y-3">
          <ScanResultBanner result={banner} busy={loading} />
          {cameraOn ? (
            <>
              <QrScannerView active={cameraOn} onScan={(value) => show(value, { fromScan: true })} />
              <button type="button" onClick={() => setCameraOn(false)}
                className="h-12 w-full rounded-cm-lg border border-cm-border bg-cm-card font-semibold">
                Stop camera
              </button>
            </>
          ) : (
            <button type="button" onClick={() => { unlockAudio(); setCameraOn(true); }}
              className="h-14 w-full rounded-cm-lg bg-cm-blue-600 text-lg font-semibold text-white hover:bg-cm-blue-700">
              Start camera
            </button>
          )}
          <ManualEntry
            onSubmit={(value) => show(value)}
            disabled={loading}
            placeholder="Box ID or item UID"
            inputMode="text"
            label="Type box ID or item UID"
            buttonLabel="Show"
          />
        </section>
      )}

      {result?.kind === "ITEM" && <ItemDetails item={result.item} onOpenBox={(code) => show(code)} />}
      {result?.kind === "BOX" && <BoxDetails box={result.box} />}

      {result && (
        <button type="button" onClick={scanNext}
          className="h-14 w-full rounded-cm-lg bg-cm-blue-600 text-lg font-semibold text-white hover:bg-cm-blue-700">
          Scan next
        </button>
      )}
    </main>
  );
}
