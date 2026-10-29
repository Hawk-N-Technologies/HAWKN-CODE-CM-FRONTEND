import { Download } from "lucide-react";
import logo from "../../assets/hawkn-logo-2.png";

const COMPANY = {
  name: "Hawk'n Technologies",
  tagline: "Salary Statement",
};

const formatMoney = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatMonth = (value) => {
  if (!value) return "—";

  const [year, month] = String(value).slice(0, 7).split("-").map(Number);

  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/* Indian-system amount in words, e.g. "Rupees Forty Two Thousand Only" */
const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];
const TENS = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

const twoDigits = (n) =>
  n < 20
    ? ONES[n]
    : `${TENS[Math.floor(n / 10)]}${n % 10 ? ` ${ONES[n % 10]}` : ""}`;

const threeDigits = (n) => {
  const h = Math.floor(n / 100);
  const r = n % 100;
  return [h ? `${ONES[h]} Hundred` : "", r ? twoDigits(r) : ""]
    .filter(Boolean)
    .join(" ");
};

const numberToWords = (num) => {
  if (num === 0) return "Zero";
  const parts = [];
  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const rest = num % 1000;

  if (crore) parts.push(`${threeDigits(crore)} Crore`);
  if (lakh) parts.push(`${twoDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${twoDigits(thousand)} Thousand`);
  if (rest) parts.push(threeDigits(rest));
  return parts.join(" ");
};

const amountInWords = (value) => {
  const safe = Math.max(0, Number(value || 0));
  const rupees = Math.floor(safe);
  const paise = Math.round((safe - rupees) * 100);

  let words = `Rupees ${numberToWords(rupees)}`;
  if (paise) words += ` and ${twoDigits(paise)} Paise`;
  return `${words} Only`;
};

export default function PayslipDownloadButton({ payroll }) {
  const downloadSlip = () => {
    if (!payroll || payroll.status !== "Processed") return;

    const employeeName =
      payroll.employee?.fullName ||
      [payroll.employee?.firstName, payroll.employee?.lastName]
        .filter(Boolean)
        .join(" ") ||
      "Employee";

    const employeeEmail = payroll.employee?.email || "—";
    const month = formatMonth(payroll.payPeriod);
    const baseSalary = Number(payroll.baseSalary || 0);
    const lopDeduction = Number(payroll.lopDeduction || 0);
    const bonus = Number(payroll.bonus || 0);
    const netSalary = Number(payroll.netSalary || 0);

    const initials =
      employeeName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase() || "E";

    const generatedOn = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    // The new window needs an absolute URL for the bundled logo
    const logoUrl = new URL(logo, window.location.origin).href;

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Salary Slip - ${escapeHtml(employeeName)} - ${escapeHtml(month)}</title>

        <style>
          :root {
            --navy-900: #0a1730;
            --navy-800: #0f2347;
            --navy-700: #16315f;
            --blue-600: #2563eb;
            --blue-100: #dbeafe;
            --blue-50: #eff6ff;
            --ink: #0f172a;
            --text: #334155;
            --muted: #64748b;
            --line: #e2e8f0;
            --soft: #f8fafc;
            --green: #15803d;
            --red: #b91c1c;
          }

          * { box-sizing: border-box; }

          body {
            margin: 0;
            padding: 32px 16px;
            font-family: "Segoe UI", Inter, Arial, Helvetica, sans-serif;
            color: var(--text);
            background: #e8edf5;
            -webkit-font-smoothing: antialiased;
          }

          .slip {
            position: relative;
            width: 100%;
            max-width: 148mm; /* A5 width */
            min-height: 210mm; /* A5 height */
            margin: 0 auto;
            overflow: hidden;
            background: #fff;
            border-radius: 12px;
            box-shadow: 0 20px 50px rgba(10, 23, 48, 0.15);
          }

          /* ---------- Header ---------- */
          .header {
            position: relative;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 14px;
            padding: 18px 22px;
            color: #fff;
            background:
              radial-gradient(circle at 92% -20%, rgba(59, 130, 246, 0.35), transparent 55%),
              linear-gradient(135deg, var(--navy-900), var(--navy-800) 60%, var(--navy-700));
          }

          .brand img {
            display: block;
            height: 38px;
            width: auto;
            max-width: 160px;
            object-fit: contain;
          }

          .brand-sub {
            margin-top: 5px;
            font-size: 10px;
            letter-spacing: 0.4px;
            color: #93b4e6;
          }

          .doc-title { text-align: right; }

          .doc-title h1 {
            margin: 0;
            font-size: 20px;
            font-weight: 700;
            letter-spacing: 2px;
          }

          .period-chip {
            display: inline-block;
            margin-top: 6px;
            padding: 4px 10px;
            font-size: 11px;
            font-weight: 600;
            color: #dbeafe;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(147, 180, 230, 0.35);
            border-radius: 999px;
          }

          .accent-bar {
            height: 4px;
            background: linear-gradient(90deg, var(--blue-600), #60a5fa, var(--blue-600));
          }

          /* ---------- Body ---------- */
          .content { padding: 18px 22px 4px; }

          .section-title {
            display: flex;
            align-items: center;
            gap: 10px;
            margin: 0 0 10px;
            font-size: 12px;
            font-weight: 700;
            color: var(--navy-800);
          }

          .section-title::before {
            content: "";
            width: 4px;
            height: 16px;
            border-radius: 2px;
            background: var(--blue-600);
          }

          .employee {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 14px;
            background: var(--soft);
            border: 1px solid var(--line);
            border-radius: 10px;
          }

          .avatar {
            flex: none;
            display: grid;
            place-items: center;
            width: 44px;
            height: 44px;
            font-size: 15px;
            font-weight: 700;
            color: var(--blue-600);
            background: var(--blue-100);
            border-radius: 50%;
          }

          .employee-name {
            margin: 0;
            font-size: 15px;
            font-weight: 700;
            color: var(--ink);
          }

          .employee-email {
            margin-top: 3px;
            font-size: 11px;
            color: var(--muted);
            overflow-wrap: anywhere;
          }

          .status {
            margin-left: auto;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            font-size: 12px;
            font-weight: 700;
            color: var(--green);
            background: #dcfce7;
            border: 1px solid #bbf7d0;
            border-radius: 999px;
            white-space: nowrap;
          }

          .status::before {
            content: "";
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: var(--green);
          }

          .meta-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            margin-top: 10px;
          }

          .meta {
            padding: 10px 12px;
            border: 1px solid var(--line);
            border-radius: 10px;
          }

          .meta-label {
            font-size: 10px;
            color: var(--muted);
          }

          .meta-value {
            margin-top: 4px;
            font-size: 12px;
            font-weight: 600;
            color: var(--ink);
            overflow-wrap: anywhere;
          }

          /* ---------- Salary table ---------- */
          .salary { margin-top: 18px; }

          .table-wrap {
            overflow: hidden;
            border: 1px solid var(--line);
            border-radius: 10px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
          }

          th, td {
            padding: 8px 12px;
            text-align: left;
            font-size: 12px;
          }

          thead th {
            font-size: 11px;
            font-weight: 700;
            color: #fff;
            background: var(--navy-800);
          }

          tbody td { border-bottom: 1px solid var(--line); }
          tbody tr:nth-child(even) td { background: var(--soft); }

          th:last-child, td:last-child {
            text-align: right;
            font-variant-numeric: tabular-nums;
          }

          .desc { font-weight: 600; color: var(--ink); }
          .desc small {
            display: block;
            margin-top: 2px;
            font-size: 12px;
            font-weight: 400;
            color: var(--muted);
          }

          .earn { color: var(--green); font-weight: 600; }
          .deduct { color: var(--red); font-weight: 600; }

          tfoot td {
            font-size: 13px;
            font-weight: 700;
            color: var(--navy-800);
            background: var(--blue-50);
            border-top: 2px solid var(--blue-600);
          }

          /* ---------- Net pay ---------- */
          .net {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 20px;
            margin-top: 18px;
            padding: 14px 18px;
            color: #fff;
            border-radius: 10px;
            background:
              radial-gradient(circle at 100% 0%, rgba(59, 130, 246, 0.4), transparent 55%),
              linear-gradient(135deg, var(--navy-900), var(--navy-700));
          }

          .net h3 {
            margin: 0;
            font-size: 13px;
            font-weight: 600;
            color: #bfd4f6;
          }

          .net-words {
            margin: 5px 0 0;
            max-width: 380px;
            font-size: 11px;
            line-height: 1.5;
            color: #93b4e6;
          }

          .net-amount {
            font-size: 24px;
            font-weight: 700;
            letter-spacing: 0.3px;
            text-align: right;
            white-space: nowrap;
          }

          /* ---------- Footer ---------- */
          .footer {
            margin-top: 20px;
            padding: 12px 22px 16px;
            border-top: 1px solid var(--line);
            display: flex;
            justify-content: space-between;
            gap: 16px;
            font-size: 10.5px;
            line-height: 1.7;
            color: var(--muted);
          }

          .footer strong { color: var(--text); }
          .footer-right { text-align: right; }

          .actions {
            max-width: 800px;
            margin: 20px auto 0;
            text-align: center;
          }

          .print-button {
            padding: 12px 26px;
            font-size: 14px;
            font-weight: 600;
            color: #fff;
            background: var(--blue-600);
            border: 0;
            border-radius: 8px;
            cursor: pointer;
            box-shadow: 0 6px 16px rgba(37, 99, 235, 0.3);
          }

          .print-button:hover { background: #1d4ed8; }

          @page { size: A5 portrait; margin: 8mm; }

          @media print {
            body { padding: 0; background: #fff; }
            .slip {
              width: auto;
              max-width: none;
              min-height: 0;
              border-radius: 0;
              box-shadow: none;
            }
            .actions { display: none; }
            .employee, .meta-grid, .table-wrap, .net, .footer { break-inside: avoid; }
            * {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }

          @media screen and (max-width: 600px) {
            body { padding: 10px; }
            .header { flex-direction: column; align-items: flex-start; padding: 16px; }
            .doc-title { text-align: left; }
            .content { padding: 14px 16px 4px; }
            .employee { flex-wrap: wrap; }
            .status { margin-left: 0; }
            .meta-grid { grid-template-columns: 1fr; }
            .net { flex-direction: column; align-items: flex-start; padding: 14px; }
            .net-amount { text-align: left; font-size: 24px; }
            .footer { flex-direction: column; padding: 12px 16px 16px; }
            .footer-right { text-align: left; }
          }
        </style>
      </head>

      <body>
        <main class="slip">
          <header class="header">
            <div class="brand">
              <img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(COMPANY.name)}" />
              <div class="brand-sub">${escapeHtml(COMPANY.tagline)}</div>
            </div>

            <div class="doc-title">
              <h1>PAY SLIP</h1>
              <span class="period-chip">${escapeHtml(month)}</span>
            </div>
          </header>
          <div class="accent-bar"></div>

          <div class="content">
            <h2 class="section-title">Employee details</h2>

            <section class="employee">
              <div class="avatar">${escapeHtml(initials)}</div>
              <div>
                <p class="employee-name">${escapeHtml(employeeName)}</p>
                <div class="employee-email">${escapeHtml(employeeEmail)}</div>
              </div>
              <span class="status">Processed</span>
            </section>

            <section class="meta-grid">
              <div class="meta">
                <div class="meta-label">Pay period</div>
                <div class="meta-value">${escapeHtml(month)}</div>
              </div>
              <div class="meta">
                <div class="meta-label">Payment status</div>
                <div class="meta-value">Processed</div>
              </div>
              <div class="meta">
                <div class="meta-label">Generated on</div>
                <div class="meta-value">${escapeHtml(generatedOn)}</div>
              </div>
            </section>

            <section class="salary">
              <h2 class="section-title">Salary summary</h2>

              <div class="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th>Amount (₹)</th>
                    </tr>
                  </thead>

                  <tbody>
                    <tr>
                      <td class="desc">Base Salary</td>
                      <td>${formatMoney(baseSalary)}</td>
                    </tr>

                    <tr>
                      <td class="desc">LOP Deduction</td>
                      <td class="deduct">− ${formatMoney(lopDeduction)}</td>
                    </tr>

                    <tr>
                      <td class="desc">Bonus</td>
                      <td class="earn">+ ${formatMoney(bonus)}</td>
                    </tr>
                  </tbody>

                  <tfoot>
                    <tr>
                      <td>Net Salary</td>
                      <td>${formatMoney(netSalary)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>

            <section class="net">
              <div>
                <h3>Net payable</h3>
                <p class="net-words">${escapeHtml(amountInWords(netSalary))}</p>
              </div>

              <div class="net-amount">${formatMoney(netSalary)}</div>
            </section>
          </div>

          <footer class="footer">
            <div>
              <strong>This is a system-generated salary slip.</strong><br />
              No signature is required.
            </div>

            <div class="footer-right">
              For any queries, please contact<br />
              the HR department.
            </div>
          </footer>
        </main>

        <div class="actions">
          <button class="print-button" onclick="window.print()">
            Print / Save as PDF
          </button>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      window.alert("Please allow pop-ups to download your payslip.");
      return;
    }

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
  };

  if (payroll?.status !== "Processed") return null;

  return (
    <button
      type="button"
      onClick={downloadSlip}
      title="Download processed salary slip"
      className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-300"
    >
      <Download size={15} />
      <span>Download Slip</span>
    </button>
  );
}
