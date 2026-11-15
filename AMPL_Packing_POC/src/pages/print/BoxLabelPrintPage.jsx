import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { getBoxLabel } from "../../api/labels";
import PageMessage from "../../components/PageMessage";
import QrSvg from "../../components/QrSvg";

/**
 * Box label, 50 mm wide x 35 mm high, printed from the browser.
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
      <style>{"@page { size: 50mm 35mm; margin: 0; }"}</style>

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
        <div className="[zoom:1.6] sm:[zoom:2] print:[zoom:1]">
          <div className="box-border flex h-[35mm] w-[50mm] items-center gap-[1.5mm] overflow-hidden bg-white p-[2mm] text-black outline outline-1 outline-dashed outline-cm-border print:outline-none">
            <QrSvg svg={label.svg} className="h-[27mm] w-[27mm] shrink-0" />
            <div className="flex min-w-0 flex-1 flex-col gap-[1mm] leading-none">
              <p className="text-[5pt] uppercase tracking-wide">Box ID</p>
              <p className="font-mono text-[7.5pt] font-bold tracking-tight">{label.box_uid}</p>
              <p className="truncate text-[6pt]">{label.config_label}</p>
              <p className="text-[6pt] font-bold">{label.total_items} pcs</p>
              <p className="truncate text-[6pt]">Section {label.section_code}</p>
              {label.completed_at && (
                <p className="text-[5.5pt]">{new Date(label.completed_at).toLocaleDateString()}</p>
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
        <p className="text-sm text-cm-text-muted">
          Printer settings: paper <strong>50 × 35 mm</strong>, scale <strong>100%</strong>, margins <strong>None</strong>.
          Preview above is larger than the real label.
        </p>
      </section>
    </main>
  );
}
