import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getBoxLabel } from "../../api/labels";
import PageMessage from "../../components/PageMessage";
import QrSvg from "../../components/QrSvg";

/**
 * 1 x 1 inch box label (25.4 mm square), printed from the browser.
 * Page size is set to exactly one label, so each print = one sticker.
 */
export default function BoxLabelPrintPage() {
  const { publicId } = useParams();
  const [state, setState] = useState({ status: "loading", data: null, error: null });

  useEffect(() => {
    let active = true;
    getBoxLabel(publicId)
      .then((data) => active && setState({ status: "ok", data, error: null }))
      .catch((error) => active && setState({ status: "error", data: null, error }));
    return () => {
      active = false;
    };
  }, [publicId]);

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
      <style>{"@page { size: 1in 1in; margin: 0; }"}</style>

      <section className="space-y-3 print:hidden">
        <Link to="/" className="text-sm font-medium text-cm-blue-700">‹ Back</Link>
        <h1 className="text-2xl font-bold text-cm-navy-950">Box label · {label.box_uid}</h1>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-cm-text-muted">
          <li>Click <strong>Print label</strong> and choose the sticker printer.</li>
          <li>Paper size: <strong>1 × 1 in (25 × 25 mm)</strong>. Scale: <strong>100%</strong>. Margins: <strong>None</strong>.</li>
          <li>Stick it on the box, then scan it with Verify to check it reads.</li>
        </ol>
        <button
          type="button"
          onClick={() => window.print()}
          className="h-12 rounded-cm-lg bg-cm-blue-600 px-8 font-semibold text-white hover:bg-cm-blue-700"
        >
          Print label
        </button>
        <p className="text-sm text-cm-text-muted">Preview below is shown 3× larger than the real label.</p>
      </section>

      <div className="mt-6 flex justify-center print:mt-0 print:block">
        <div className="[zoom:3] print:[zoom:1]">
          <div className="box-border flex h-[1in] w-[1in] flex-col items-center overflow-hidden bg-white p-[0.6mm] text-black outline outline-1 outline-dashed outline-cm-border print:outline-none">
            <QrSvg svg={label.svg} className="h-[18mm] w-[18mm] shrink-0" />
            <p className="mt-[0.4mm] font-mono text-[7.5pt] font-bold leading-none tracking-tight">{label.box_uid}</p>
            <p className="mt-[0.4mm] text-[5pt] leading-none">
              {label.config_label} · {label.total_items} pcs · Sec {label.section_code}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
