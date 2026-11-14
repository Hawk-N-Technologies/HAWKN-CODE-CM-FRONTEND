import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getBoxLabel } from "../../api/labels";
import PageMessage from "../../components/PageMessage";
import QrSvg from "../../components/QrSvg";

/**
 * Box label, 50 mm wide x 35 mm high, printed from the browser.
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
      <style>{"@page { size: 50mm 35mm; margin: 0; }"}</style>

      <section className="space-y-3 print:hidden">
        <Link to="/" className="text-sm font-medium text-cm-blue-700">‹ Back</Link>
        <h1 className="text-2xl font-bold text-cm-navy-950">Box label · {label.box_uid}</h1>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-cm-text-muted">
          <li>Click <strong>Print label</strong> and choose the sticker printer.</li>
          <li>Paper size: <strong>50 × 35 mm</strong> (landscape label). Scale: <strong>100%</strong>. Margins: <strong>None</strong>.</li>
          <li>Stick it on the box, then scan it with Verify to check it reads.</li>
        </ol>
        <button
          type="button"
          onClick={() => window.print()}
          className="h-12 rounded-cm-lg bg-cm-blue-600 px-8 font-semibold text-white hover:bg-cm-blue-700"
        >
          Print label
        </button>
        <p className="text-sm text-cm-text-muted">Preview below is shown 2× larger than the real label.</p>
      </section>

      <div className="mt-6 flex justify-center print:mt-0 print:block">
        <div className="[zoom:2] print:[zoom:1]">
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
    </main>
  );
}
