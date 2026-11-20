import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { lookupBox, recordVerification } from "../api/verification";
import ScanResultBanner from "../components/packing/ScanResultBanner";
import ManualEntry from "../components/scanner/ManualEntry";
import QrScannerView from "../components/scanner/QrScannerView";
import { feedbackError, feedbackSuccess, unlockAudio } from "../components/scanner/scanFeedback";
import BoxRecord from "../components/verification/BoxRecord";
import VerificationForm from "../components/verification/VerificationForm";
import { homeFor } from "../auth/roles";
import { useAuth } from "../auth/useAuth";

const ERROR_TITLES = {
  IS_PRODUCT_LABEL: "Product label scanned",
  INVALID_FORMAT: "Not a box QR",
  BOX_NOT_FOUND: "Box not found",
  NETWORK_ERROR: "No connection",
};

/**
 * Verify a box: scan its label -> see its record -> save the result.
 * /verify?code=BOX-000001 opens a box directly.
 */
export default function VerifyPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCode = searchParams.get("code") || "";
  const [lookup, setLookup] = useState(() =>
    initialCode ? { status: "loading", record: null } : { status: "idle", record: null },
  );
  const [banner, setBanner] = useState(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [saving, setSaving] = useState(false);
  const lastScanRef = useRef({ value: "", at: 0 });

  const fetchRecord = async (code) => {
    try {
      const record = await lookupBox(code);
      setLookup({ status: "ok", record });
      setBanner({ ok: true, title: "Box found", message: record.box_uid });
      return true;
    } catch (error) {
      setLookup({ status: "idle", record: null });
      setBanner({ ok: false, title: ERROR_TITLES[error.code] || "Lookup failed", message: error.message });
      return false;
    }
  };

  useEffect(() => {
    if (initialCode) fetchRecord(initialCode);
    // Only on first open of a /verify?code=... link.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCode = async (raw) => {
    const value = String(raw || "").trim();
    if (!value || lookup.status === "loading") return;
    const now = Date.now();
    if (value === lastScanRef.current.value && now - lastScanRef.current.at < 2500) return;
    lastScanRef.current = { value, at: now };

    setLookup({ status: "loading", record: null });
    const found = await fetchRecord(value);
    if (found) {
      feedbackSuccess();
      setCameraOn(false);
      setSearchParams({ code: value.toUpperCase() }, { replace: true });
    } else {
      feedbackError();
    }
  };

  const handleVerify = async (payload) => {
    setSaving(true);
    try {
      const record = await recordVerification(lookup.record.public_id, payload);
      setLookup({ status: "ok", record });
      setBanner({ ok: payload.result === "MATCH", title: "Verification saved", message: payload.result === "MATCH" ? "Box marked as verified." : "Mismatch recorded." });
      feedbackSuccess();
    } catch (error) {
      setBanner({ ok: false, title: "Could not save", message: error.message });
      feedbackError();
    } finally {
      setSaving(false);
    }
  };

  const scanAnother = () => {
    setLookup({ status: "idle", record: null });
    setBanner(null);
    setSearchParams({}, { replace: true });
    unlockAudio();
    setCameraOn(true);
  };

  const record = lookup.record;

  return (
    <main className="mx-auto w-full max-w-3xl space-y-4 px-4 py-4 pb-10">
      <div>
        <Link to={homeFor(user.role)} className="text-sm font-medium text-cm-blue-700">‹ Home</Link>
        <h1 className="text-2xl font-bold text-cm-navy-950">Verify a box</h1>
        <p className="text-sm text-cm-text-muted">Scan the QR label on the box, or type its ID.</p>
      </div>

      <ScanResultBanner result={banner} busy={lookup.status === "loading"} />

      {!record && (
        <section className="space-y-3">
          {cameraOn ? (
            <>
              <QrScannerView active={cameraOn} onScan={handleCode} />
              <button type="button" onClick={() => setCameraOn(false)}
                className="h-12 w-full rounded-cm-lg border border-cm-border bg-cm-card font-semibold">
                Stop camera
              </button>
            </>
          ) : (
            <button type="button" onClick={() => { unlockAudio(); setCameraOn(true); }}
              className="h-14 w-full rounded-cm-lg bg-cm-blue-600 text-lg font-semibold text-white hover:bg-cm-blue-700">
              Scan box label
            </button>
          )}
          <ManualEntry
            onSubmit={handleCode}
            disabled={lookup.status === "loading"}
            placeholder="Type or scan box ID, e.g. BOX-000001"
            inputMode="text"
            label="Type box ID"
          />
        </section>
      )}

      {record && (
        <>
          <BoxRecord record={record} />
          <VerificationForm key={record.verifications.length} onSubmit={handleVerify} busy={saving} />
          <button type="button" onClick={scanAnother}
            className="h-12 w-full rounded-cm-lg border border-cm-border bg-cm-card font-semibold hover:bg-cm-blue-50">
            Scan another box
          </button>
        </>
      )}
    </main>
  );
}
