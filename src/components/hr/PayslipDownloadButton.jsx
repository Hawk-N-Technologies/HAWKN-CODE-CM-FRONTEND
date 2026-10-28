import { Download } from "lucide-react";

import Button from "../common/Button";
import { showToast } from "../common/Toast";
import logo from "../../assets/hawkn-logo-2.png";
import { buildPayslipHtml } from "./payslipTemplate";

/**
 * Opens a processed payroll's salary slip in a new window.
 *
 * The document is intentionally rendered outside React (see
 * `payslipTemplate.js`) so it can be printed or saved as a PDF without
 * pulling application styles into the print output.
 */
export default function PayslipDownloadButton({ payroll }) {
  const isProcessed = payroll?.status === "Processed";

  const openPayslip = () => {
    if (!isProcessed) return;

    // Must be called synchronously from the click handler so browsers treat
    // it as a user-initiated pop-up.
    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      showToast.error(
        "Please allow pop-ups for this site so the payslip can be opened.",
      );
      return;
    }

    try {
      // The slip is written by this app, so it never needs a handle back to
      // the opener window.
      printWindow.opener = null;

      const logoUrl = new URL(logo, window.location.origin).href;
      const html = buildPayslipHtml(payroll, { logoUrl });

      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();

      const printButton = printWindow.document.getElementById("payslip-print");
      const closeButton = printWindow.document.getElementById("payslip-close");

      printButton?.addEventListener("click", () => printWindow.print());
      closeButton?.addEventListener("click", () => printWindow.close());

      printWindow.focus();
      printButton?.focus();
    } catch {
      printWindow.close();
      showToast.error("Couldn't open the payslip. Please try again.");
    }
  };

  if (!isProcessed) return null;

  const employeeName = payroll.employee?.fullName ?? "employee";

  return (
    <Button
      type="button"
      size="sm"
      variant="secondary"
      className="whitespace-nowrap"
      leftIcon={<Download size={15} aria-hidden="true" />}
      onClick={openPayslip}
      title={`Download salary slip for ${employeeName}`}
      aria-label={`Download salary slip for ${employeeName}`}
    >
      Download Slip
    </Button>
  );
}
