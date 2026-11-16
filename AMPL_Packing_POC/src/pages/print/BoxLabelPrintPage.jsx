import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { getBoxLabel } from "../../api/labels";
import PageMessage from "../../components/PageMessage";
import QrSvg from "../../components/QrSvg";

/**
 * Box label, 100 mm wide x 50 mm high, printed from the browser.
 * Page size is set to exactly one label, so each print = one sticker.
 * Printing starts only when Print is tapped.
 * ?next=<section id> (from packing): shows "Next box" to go straight back to packing.
 */
export default function BoxLabelPrintPage() {
  const { publicId } = useParams();
  const [searchParams] = useSearchParams();
  const nextSection = searchParams.get("next");
  const navigate = useNavigate();
  const [state, setState] = useState({ status: "loading", data: null, error: null });
  const [printed, setPrinted] = useState(false);

  useEffect(() => {
    let active = true;
    getBoxLabel(publicId)
      .then((data) => active && setState({ status: "ok", data, error: null }))
      .catch((error) => active && setState({ status: "error", data: null, error }));
    return () => {
      active = false;
    };
  }, [publicId]);

  const handlePrint = () => {
    window.print();
    setPrinted(true);
  };
  const handleNextBox = () => navigate(`/op/pack/${nextSection}?next=1`);
  const handleBack = () => (window.history.length > 1 ? navigate(-1) : navigate("/"));

  if (state.status === "loading") return <PageMessage title="Loading label…" />;
  if (state.status === "error") {
    return (
      <PageMessage title="Cannot print this label" tone="error">
        <p>{state.error.message}</p>
      </PageMessage>
    );
  }

  const label = state.data;
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 print:m-0 print:max-w-none print:p-0">
      <style>{"@page { size: 100mm 50mm; margin: 0; }"}</style>

      <section className="space-y-3 print:hidden">
        {nextSection ? (
          <p className="rounded-cm-xl bg-cm-success-600 px-4 py-3 text-center text-lg font-bold text-white" role="status">
            {label.box_uid} saved ✓ · {label.total_items} / {label.total_items}
          </p>
        ) : (
          <button type="button" onClick={handleBack} className="text-sm font-medium text-cm-blue-700">‹ Back</button>
        )}
        <h1 className="text-2xl font-bold text-cm-navy-950">Box label · {label.box_uid}</h1>
      </section>

      <div className="mt-4 flex justify-center print:mt-0 print:block">
        <div className="[zoom:0.85] sm:[zoom:1.4] print:[zoom:1]">
          {/* 100 x 50 mm: QR 46 mm (its white border included) at left 2 / top 2; text from 49 mm to 96 mm */}
          <div className="box-border flex h-[50mm] w-[100mm] items-center gap-[1mm] overflow-hidden bg-white py-[2mm] pr-[4mm] pl-[2mm] text-black outline outline-1 outline-dashed outline-cm-border print:outline-none">
            <QrSvg svg={label.svg} className="h-[46mm] w-[46mm] shrink-0" />
            <div className="flex min-w-0 flex-1 flex-col gap-[2mm] leading-none">
              <p className="text-[8pt] uppercase tracking-wide">Box ID</p>
              <p className="font-mono text-[16pt] font-bold">{label.box_uid}</p>
              <p className="truncate text-[11pt]">{label.config_label}</p>
              <p className="text-[13pt] font-bold">{label.total_items} pcs</p>
              <p className="truncate text-[11pt]">Section {label.section_code}</p>
              {label.completed_at && (
                <p className="text-[10pt]">{new Date(label.completed_at).toLocaleDateString()}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <section className="mt-6 space-y-3 print:hidden">
        <button
          type="button"
          onClick={handlePrint}
          className="h-14 w-full rounded-cm-lg bg-cm-blue-600 text-lg font-semibold text-white shadow-cm-sm hover:bg-cm-blue-700"
        >
          {printed ? "Print again" : "Print"}
        </button>
        {nextSection && (
          <button
            type="button"
            onClick={handleNextBox}
            className="h-14 w-full rounded-cm-lg bg-cm-success-600 text-lg font-semibold text-white shadow-cm-sm hover:opacity-90"
          >
            Next box
          </button>
        )}
        <a
          href={`/api/v1/boxes/${publicId}/label.pdf`}
          download={`${label.box_uid}.pdf`}
          className="flex h-12 w-full items-center justify-center rounded-cm-lg border-2 border-cm-blue-600 bg-cm-card font-semibold text-cm-blue-700 hover:bg-cm-blue-50"
        >
          Download label PDF (100 × 50 mm)
        </a>
        <p className="text-sm text-cm-text-muted">
          Printer settings: paper <strong>100 × 50 mm</strong>, scale <strong>100%</strong>, margins <strong>None</strong>.
          Using a label printer app? Use <strong>Download label PDF</strong>: its page is exactly 100 × 50 mm.
          The preview may look larger or smaller than the real label; the print is true size.
        </p>
      </section>
    </main>
  );
}
