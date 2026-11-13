import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  cancelBox,
  completeBox,
  getBox,
  getMySections,
  removeFromBox,
  scanIntoBox,
  startBox,
} from "../api/packing";
import PageMessage from "../components/PageMessage";
import ProgressPanel from "../components/packing/ProgressPanel";
import ScanResultBanner from "../components/packing/ScanResultBanner";
import ScannedItems from "../components/packing/ScannedItems";
import ManualEntry from "../components/scanner/ManualEntry";
import QrScannerView from "../components/scanner/QrScannerView";
import {
  feedbackError,
  feedbackSuccess,
  newScanId,
  unlockAudio,
} from "../components/scanner/scanFeedback";

// Short headline per server error code; the server's message gives details.
const ERROR_TITLES = {
  INVALID_FORMAT: "Not a product QR",
  IS_BOX_LABEL: "Box label scanned",
  UID_NOT_FOUND: "Unknown UID",
  UID_VOID: "Voided label",
  ALREADY_IN_THIS_BOX: "Already scanned",
  IN_OTHER_BOX: "In another box",
  ALREADY_PACKED: "Already packed",
  SKU_NOT_IN_CONFIG: "Wrong SKU",
  SKU_QUANTITY_FULL: "SKU already full",
  BOX_NOT_OPEN: "Box is closed",
  SECTION_NOT_ASSIGNED: "Not your section",
  NETWORK_ERROR: "No connection",
  BACKEND_UNREACHABLE: "Server not responding",
};

const SAME_CODE_COOLDOWN_MS = 2500; // camera sees one label many times a second

const primaryButton =
  "h-14 w-full rounded-cm-lg bg-cm-blue-600 text-lg font-semibold text-white shadow-cm-sm hover:bg-cm-blue-700 disabled:cursor-not-allowed disabled:opacity-60";
const secondaryButton =
  "h-12 w-full rounded-cm-lg border border-cm-border bg-cm-card font-semibold text-cm-navy-950 hover:bg-cm-blue-50 disabled:opacity-60";

export default function PackingPage() {
  const { sectionId } = useParams();
  const [page, setPage] = useState({ state: "loading", error: null });
  const [section, setSection] = useState(null);
  const [box, setBox] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const busyRef = useRef(false);
  const lastScanRef = useRef({ value: "", at: 0 });

  const loadPage = useCallback(async () => {
    try {
      const sections = await getMySections();
      const found = sections.find((item) => String(item.id) === String(sectionId));
      if (!found) {
        setPage({ state: "missing", error: null });
        return;
      }
      const openBox = found.open_box ? await getBox(found.open_box.public_id) : null;
      setSection(found);
      setBox(openBox);
      setPage({ state: "ready", error: null });
    } catch (error) {
      setPage({ state: "error", error });
    }
  }, [sectionId]);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  const run = async (action) => {
    busyRef.current = true;
    setBusy(true);
    try {
      await action();
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const handleScan = useCallback(
    async (raw) => {
      const value = String(raw || "").trim();
      if (!value || !box || box.status !== "OPEN" || busyRef.current) return;
      const now = Date.now();
      if (value === lastScanRef.current.value && now - lastScanRef.current.at < SAME_CODE_COOLDOWN_MS) return;
      lastScanRef.current = { value, at: now };

      busyRef.current = true;
      setBusy(true);
      try {
        const data = await scanIntoBox(box.public_id, value, newScanId());
        feedbackSuccess();
        setResult({
          ok: true,
          title: data.duplicate_request ? "Already recorded" : "Added",
          message: `${data.product.sku_code} · ${data.product.uid}`,
        });
        setBox((prev) =>
          prev && {
            ...prev,
            progress: data.progress,
            items: data.duplicate_request
              ? prev.items
              : [{ uid: data.product.uid, sku_code: data.product.sku_code }, ...prev.items],
          },
        );
      } catch (error) {
        feedbackError();
        setResult({ ok: false, title: ERROR_TITLES[error.code] || "Scan rejected", message: error.message });
        if (error.code === "BOX_NOT_OPEN") loadPage();
      } finally {
        busyRef.current = false;
        setBusy(false);
      }
    },
    [box, loadPage],
  );

  const handleStart = () =>
    run(async () => {
      unlockAudio();
      try {
        const data = await startBox(section.id);
        setBox(data);
        setResult(null);
        setCameraOn(true);
      } catch (error) {
        setResult({ ok: false, title: "Cannot start box", message: error.message });
      }
    });

  const handleComplete = () =>
    run(async () => {
      try {
        const data = await completeBox(box.public_id);
        setBox(data);
        setCameraOn(false);
        setResult(null);
        feedbackSuccess();
      } catch (error) {
        feedbackError();
        setResult({ ok: false, title: "Cannot complete box", message: error.message });
        if (error.code === "BOX_NOT_OPEN") loadPage();
      }
    });

  const handleRemove = (uid) => {
    if (!window.confirm(`Remove ${uid} from this box?`)) return;
    run(async () => {
      try {
        const data = await removeFromBox(box.public_id, uid, "Removed by operator");
        setBox((prev) => ({
          ...prev,
          progress: data.progress,
          items: prev.items.filter((item) => item.uid !== uid),
        }));
        setResult({ ok: true, title: "Removed", message: uid });
      } catch (error) {
        setResult({ ok: false, title: "Cannot remove", message: error.message });
      }
    });
  };

  const handleCancel = (event) => {
    event.preventDefault();
    const reason = cancelReason.trim();
    if (!reason) return;
    run(async () => {
      try {
        await cancelBox(box.public_id, reason);
        setBox(null);
        setCameraOn(false);
        setCancelOpen(false);
        setCancelReason("");
        setResult({ ok: true, title: "Box cancelled", message: "All scanned products were released." });
      } catch (error) {
        setResult({ ok: false, title: "Cannot cancel box", message: error.message });
      }
    });
  };

  if (page.state === "loading") return <PageMessage title="Loading…" />;
  if (page.state === "missing") {
    return (
      <PageMessage title="Section not available" tone="error">
        <p>You are not assigned to this section, or it is inactive.</p>
        <Link to="/op" className="mt-4 inline-block font-semibold text-cm-blue-700">Back to my sections</Link>
      </PageMessage>
    );
  }
  if (page.state === "error") {
    return (
      <PageMessage title="Could not load" tone="error">
        <p>{page.error.message}</p>
        <button type="button" onClick={loadPage} className="mt-4 font-semibold text-cm-blue-700">Try again</button>
      </PageMessage>
    );
  }

  const isOpen = box?.status === "OPEN";
  const isDone = box && (box.status === "COMPLETED" || box.status === "VERIFIED");
  const ready = isOpen && box.progress.is_complete_ready;

  return (
    <main className="mx-auto w-full max-w-xl space-y-4 px-4 py-4 pb-10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link to="/op" className="text-sm font-medium text-cm-blue-700">‹ My sections</Link>
          <h1 className="text-xl font-bold text-cm-navy-950">
            Section {section.code} <span className="font-medium text-cm-text-muted">· {section.name}</span>
          </h1>
          <p className="text-sm text-cm-text-muted">
            {(box?.config || section.active_config)?.label || "No box configuration assigned"}
          </p>
        </div>
      </div>

      {/* No open box */}
      {!box && (
        <>
          {result && <ScanResultBanner result={result} busy={false} />}
          <section className="rounded-cm-xl border border-cm-border bg-cm-card p-4 shadow-cm-sm">
            <h2 className="font-semibold">Next box contains</h2>
            {section.active_config ? (
              <ul className="mt-2 space-y-1 text-sm">
                {section.active_config.items.map((item) => (
                  <li key={item.sku_code} className="flex justify-between">
                    <span><span className="font-semibold">{item.sku_code}</span> {item.sku_name}</span>
                    <span className="font-semibold tabular-nums">× {item.quantity}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-cm-danger-600">Ask an admin to assign a box configuration.</p>
            )}
          </section>
          <button type="button" onClick={handleStart} disabled={busy || !section.active_config} className={primaryButton}>
            {busy ? "Starting…" : "Start new box"}
          </button>
        </>
      )}

      {/* Completed box */}
      {isDone && (
        <>
          <section className="rounded-cm-xl bg-cm-success-600 p-5 text-center text-white shadow-cm-md" role="status">
            <p className="text-sm font-semibold uppercase tracking-wide opacity-90">Box completed</p>
            <p className="mt-1 font-mono text-4xl font-bold">{box.box_uid}</p>
            <p className="mt-1 text-sm opacity-90">
              {box.progress.total_scanned} products · {box.config?.label}
            </p>
          </section>
          <a
            href={`/print/box/${box.public_id}`}
            target="_blank"
            rel="noreferrer"
            className="flex h-12 w-full items-center justify-center rounded-cm-lg border-2 border-cm-blue-600 bg-cm-card font-semibold text-cm-blue-700 hover:bg-cm-blue-50"
          >
            Print box label (1 × 1 inch)
          </a>
          <ScannedItems items={box.items} />
          <button type="button" onClick={handleStart} disabled={busy} className={primaryButton}>
            {busy ? "Starting…" : "Start next box"}
          </button>
        </>
      )}

      {/* Open box */}
      {isOpen && (
        <>
          <ProgressPanel progress={box.progress} />
          <ScanResultBanner result={result} busy={busy} />

          {ready ? (
            <section className="rounded-cm-xl border-2 border-cm-success-600 bg-cm-success-100 p-4 text-center">
              <p className="text-lg font-bold text-cm-success-600">All quantities reached</p>
              <p className="mt-1 text-sm text-cm-navy-950">
                Check the box, then confirm to finish it and create its box ID.
              </p>
              <button type="button" onClick={handleComplete} disabled={busy} className={`${primaryButton} mt-4 bg-cm-success-600 hover:bg-cm-success-600`}>
                {busy ? "Completing…" : "Confirm and complete box"}
              </button>
            </section>
          ) : (
            <section className="space-y-3">
              {cameraOn ? (
                <>
                  <QrScannerView active={cameraOn} onScan={handleScan} />
                  <button type="button" onClick={() => setCameraOn(false)} className={secondaryButton}>
                    Stop camera
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    unlockAudio();
                    setCameraOn(true);
                  }}
                  className={primaryButton}
                >
                  Start camera
                </button>
              )}
              <ManualEntry onSubmit={handleScan} disabled={busy} />
            </section>
          )}

          <section>
            <h2 className="mb-2 font-semibold">In this box ({box.items.length})</h2>
            <ScannedItems items={box.items} onRemove={handleRemove} disabled={busy} />
          </section>

          {cancelOpen ? (
            <form onSubmit={handleCancel} className="space-y-2 rounded-cm-xl border border-cm-danger-600 bg-cm-danger-100 p-4">
              <label htmlFor="cancel-reason" className="block text-sm font-semibold text-cm-danger-600">
                Why cancel this box? All products go back to available.
              </label>
              <input
                id="cancel-reason"
                value={cancelReason}
                onChange={(event) => setCancelReason(event.target.value)}
                className="h-12 w-full rounded-cm-lg border border-cm-border bg-cm-card px-4 text-base"
                placeholder="e.g. Damaged carton"
              />
              <div className="flex gap-2">
                <button type="submit" disabled={busy || !cancelReason.trim()} className="h-12 flex-1 rounded-cm-lg bg-cm-danger-600 font-semibold text-white disabled:opacity-60">
                  Cancel box
                </button>
                <button type="button" onClick={() => setCancelOpen(false)} className="h-12 flex-1 rounded-cm-lg border border-cm-border bg-cm-card font-semibold">
                  Keep packing
                </button>
              </div>
            </form>
          ) : (
            <button type="button" onClick={() => setCancelOpen(true)} disabled={busy} className="w-full py-2 text-sm font-medium text-cm-danger-600">
              Cancel this box…
            </button>
          )}
        </>
      )}
    </main>
  );
}
