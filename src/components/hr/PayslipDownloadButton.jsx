import { Download } from "lucide-react";
import logo from "../../assets/hawkn-logo-2.png";

const COMPANY = {
  name: "Hawk'n Technologies",
  address: "Surat, Gujarat, India", // <- put your registered address here
};

const formatNumber = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatMoney = (value) => `₹${formatNumber(value)}`;

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const formatMonth = (value) => {
  if (!value) return "—";
  const match = String(value).match(/^(\d{4})-(\d{2})/);
  if (!match) return "—";
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return "—";
  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
};

// Handles "YYYY-MM-DD" without timezone shifts, and full ISO timestamps.
const formatDate = (value) => {
  if (!value) return null;
  const str = String(value);
  const plain = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (plain) {
    const year = Number(plain[1]);
    const month = Number(plain[2]);
    const day = Number(plain[3]);
    const check = new Date(year, month - 1, day);
    if (
      month < 1 ||
      month > 12 ||
      check.getFullYear() !== year ||
      check.getMonth() !== month - 1 ||
      check.getDate() !== day
    )
      return null;
    return `${plain[3]} ${MONTHS[month - 1]} ${plain[1]}`;
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
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

const hasValue = (v) => v !== null && v !== undefined && v !== "";

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
  const numeric = Number(value ?? 0);
  const safe = Number.isFinite(numeric) ? Math.max(0, numeric) : 0;
  // Round to paise first so a rounded 100 paise carries into the rupee value.
  const totalPaise = Math.round((safe + Number.EPSILON) * 100);
  const rupees = Math.floor(totalPaise / 100);
  const paise = totalPaise % 100;

  let words = `Rupees ${numberToWords(rupees)}`;
  if (paise) words += ` and ${twoDigits(paise)} Paise`;
  return `${words} Only`;
};

export default function PayslipDownloadButton({ payroll }) {
  const downloadSlip = () => {
    if (!payroll || payroll.status !== "Processed") return;

    const emp = payroll.employee || {};
    const employeeName =
      emp.fullName ||
      [emp.firstName, emp.lastName].filter(Boolean).join(" ") ||
      "Employee";

    const month = formatMonth(payroll.payPeriod);
    const baseSalary = Number(payroll.baseSalary || 0);
    const lopDeduction = Number(payroll.lopDeduction || 0);
    const bonus = Number(payroll.bonus || 0);
    const netSalary = Number(payroll.netSalary || 0);
    const grossEarnings = baseSalary + bonus;
    const totalDeductions = lopDeduction;

    const dailySalary = Number(payroll.dailySalary || 0);
    const lopDays = hasValue(payroll.lopDays) ? Number(payroll.lopDays) : null;

    const startLabel = formatDate(payroll.startDate);
    const endLabel = formatDate(payroll.endDate);
    const periodRange =
      startLabel && endLabel ? `${startLabel} – ${endLabel}` : month;

    const slipNo = `PS-${String(payroll.payPeriod).slice(0, 7).replace("-", "")}-${String(
      payroll.uuid || "",
    )
      .slice(0, 6)
      .toUpperCase()}`;

    const payMode = [payroll.paymentMethod, payroll.paymentBank]
      .filter(Boolean)
      .join(" · ");

    /* ---------- Employee detail rows (only those with data) ---------- */
    const detailItems = [
      ["Employee Name", employeeName],
      ["Employee ID", emp.employeeId],
      ["Designation", emp.designation],
      ["Department", emp.department],
      ["Email", emp.email],
      ["Pay Period", periodRange],
      ["Pay Date", formatDate(payroll.processedAt)],
      ["Payment Mode", payMode],
    ].filter(([, v]) => hasValue(v));

    const detailRows = detailItems
      .map(
        ([k, v]) => `
          <div class="d-row">
            <span class="d-key">${escapeHtml(k)}</span>
            <span class="d-sep">:</span>
            <span class="d-val">${escapeHtml(v)}</span>
          </div>`,
      )
      .join("");

    /* ---------- Net card stats (only those with data) ---------- */
    const statItems = [
      ["Working Days", payroll.workingDays],
      ["Paid Days", payroll.paidDays],
      ["LOP Days", payroll.lopDays],
    ].filter(([, v]) => hasValue(v));

    const stats = statItems.length
      ? `<div class="stats">${statItems
          .map(
            ([k, v]) => `
            <div class="stat">
              <span>${escapeHtml(k)}</span>
              <strong>${escapeHtml(v)}</strong>
            </div>`,
          )
          .join("")}</div>`
      : "";

    /* ---------- Earnings / deductions table ---------- */
    const earnings = [{ label: "Basic Salary", amount: baseSalary }];
    if (bonus > 0) earnings.push({ label: "Bonus", amount: bonus });

    const deductions = [
      {
        label: "Loss of Pay (LOP)",
        note:
          lopDays !== null && dailySalary > 0
            ? `${lopDays} day${lopDays === 1 ? "" : "s"} × ${formatMoney(dailySalary)}`
            : "",
        amount: lopDeduction,
      },
    ];

    const rowCount = Math.max(earnings.length, deductions.length, 3);
    const rows = Array.from({ length: rowCount }, (_, i) => {
      const e = earnings[i];
      const d = deductions[i];
      return `
        <tr>
          <td>${e ? escapeHtml(e.label) : "&nbsp;"}</td>
          <td class="num">${e ? formatNumber(e.amount) : ""}</td>
          <td>${
            d
              ? `${escapeHtml(d.label)}${
                  d.note ? `<small>${escapeHtml(d.note)}</small>` : ""
                }`
              : ""
          }</td>
          <td class="num">${d ? formatNumber(d.amount) : ""}</td>
        </tr>`;
    }).join("");

    const generatedOn = formatDate(new Date());

    // The new window needs an absolute URL for the bundled logo
    const logoUrl = new URL(logo, window.location.origin).href;

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Payslip - ${escapeHtml(employeeName)} - ${escapeHtml(month)}</title>

        <style>
          :root {
            --ink: #202522;
            --text: #3f4541;
            --muted: #707772;
            --line: #d9ddda;
            --soft: #f5f6f4;
            --accent: #56665b;
          }
          * { box-sizing: border-box; }
          html { background: #f0f1ef; }
          body {
            margin: 0; padding: 24px 12px;
            color: var(--text);
            background: #f0f1ef;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 11px; line-height: 1.45;
            -webkit-font-smoothing: antialiased;
          }
          .slip {
            width: 100%; max-width: 194mm; min-height: 0;
            margin: 0 auto; background: #fff;
            border: 1px solid #e0e3e0;
          }
          .header {
            display: flex; justify-content: space-between; align-items: center;
            gap: 20px; padding: 20px 24px 18px;
            color: #fff; background: #153b63;
            border-bottom: 3px solid #8eacc8;
          }
          .brand { display: flex; align-items: center; gap: 12px; min-width: 0; }
          .brand img { display: block; width: auto; height: 36px; max-width: 120px; object-fit: contain; }
          .brand-text { min-width: 0; line-height: 1.5; }
          .brand-name { color: #fff; font-size: 13px; font-weight: 700; }
          .brand-addr { color: #d5e0eb; font-size: 10px; overflow-wrap: anywhere; }
          .doc { text-align: right; flex: 0 0 auto; line-height: 1.4; }
          .doc .t { color: #fff; font-size: 17px; font-weight: 700; letter-spacing: 1.7px; }
          .doc .m { margin-top: 3px; color: #d5e0eb; font-size: 11px; }
          .accent { display: none; }
          .meta-bar {
            display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px 18px;
            padding: 8px 24px; color: var(--muted); font-size: 10px;
            border-bottom: 1px solid var(--line);
          }
          .meta-bar b { color: var(--text); font-weight: 600; }
          .body { padding: 20px 24px 8px; }
          .summary { display: grid; grid-template-columns: 1.2fr .8fr; gap: 24px; align-items: start; }
          .caption { margin: 0 0 8px; color: var(--muted); font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
          .d-row { display: grid; grid-template-columns: 104px 8px minmax(0, 1fr); gap: 0; padding: 5px 0; border-bottom: 1px solid #eceeec; font-size: 10.5px; }
          .d-key, .d-sep { color: var(--muted); }
          .d-val { color: var(--ink); font-weight: 600; min-width: 0; overflow-wrap: anywhere; }
          .net-card { padding: 13px 0 0 16px; border-left: 2px solid var(--accent); }
          .net-card .lbl { color: var(--muted); font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .9px; }
          .net-card .amt { margin-top: 5px; color: var(--ink); font-size: 24px; line-height: 1.25; font-weight: 700; letter-spacing: -.4px; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
          .net-card .paid { display: inline-block; margin-top: 7px; color: var(--muted); font-size: 10px; }
          .net-card .paid::before { content: ""; display: inline-block; width: 5px; height: 5px; margin: 0 6px 1px 0; border-radius: 50%; background: var(--accent); }
          .stats { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 13px; padding-top: 10px; border-top: 1px solid var(--line); }
          .stat { flex: 1 1 55px; display: flex; flex-direction: column; gap: 3px; }
          .stat span { color: var(--muted); font-size: 9px; }
          .stat strong { color: var(--ink); font-size: 12px; font-weight: 600; }
          .salary { margin-top: 23px; }
          .table-wrap { overflow: visible; }
          table { width: 100%; border-collapse: collapse; table-layout: fixed; }
          th, td { padding: 8px 9px; text-align: left; vertical-align: top; font-size: 10.5px; }
          thead th { padding-top: 7px; padding-bottom: 7px; color: var(--muted); background: var(--soft); border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .45px; }
          tbody td { min-height: 30px; color: var(--ink); border-bottom: 1px solid #eceeec; overflow-wrap: anywhere; }
          th:nth-child(3), td:nth-child(3) { border-left: 1px solid var(--line); padding-left: 12px; }
          .num { text-align: right !important; font-variant-numeric: tabular-nums; white-space: nowrap; }
          td small { display: block; margin-top: 2px; color: var(--muted); font-size: 9px; }
          tfoot td { padding-top: 9px; padding-bottom: 9px; color: var(--ink); background: #fafaf9; border-top: 1px solid #aeb5af; border-bottom: 1px solid var(--line); font-weight: 700; }
          .payable { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-top: 15px; padding: 12px 0; border-top: 1px solid var(--ink); border-bottom: 1px solid var(--ink); color: var(--ink); }
          .payable .l { font-size: 11px; font-weight: 700; }
          .payable .l small { display: block; margin-top: 3px; color: var(--muted); font-size: 9px; font-weight: 400; }
          .payable .a { font-size: 19px; font-weight: 700; white-space: nowrap; font-variant-numeric: tabular-nums; }
          .words { margin-top: 9px; padding: 0; color: var(--text); font-size: 10px; overflow-wrap: anywhere; }
          .words span { color: var(--muted); }
          .words b { color: var(--ink); font-weight: 600; }
          .footer { margin-top: 22px; padding: 11px 24px 14px; color: var(--muted); border-top: 1px solid var(--line); font-size: 9px; line-height: 1.6; }
          .footer b { color: var(--text); font-weight: 600; }
          .actions { max-width: 194mm; margin: 16px auto 0; text-align: center; }
          .print-button { padding: 10px 18px; font-family: inherit; font-size: 12px; font-weight: 600; color: #fff; background: #343b36; border: 1px solid #343b36; border-radius: 3px; cursor: pointer; }
          .print-button:hover { background: #202522; }
          @page { size: A4 portrait; margin: 8mm; }
          @media print {
            html, body { width: auto; margin: 0; padding: 0; background: #fff !important; }
            body { font-size: 10px; }
            .slip { width: 100%; max-width: none; min-height: 0; margin: 0; border: 0; }
            .actions { display: none !important; }
            .header { padding: 14px 18px 12px; }
            .meta-bar { padding: 6px 18px; }
            .body { padding: 15px 18px 5px; }
            .summary, .table-wrap, .payable, .words, .footer { break-inside: avoid; page-break-inside: avoid; }
            table { break-inside: avoid; page-break-inside: avoid; }
            tr { break-inside: avoid; page-break-inside: avoid; }
            * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
          @media screen and (max-width: 640px) {
            body { padding: 8px; }
            .header { align-items: flex-start; padding: 15px; gap: 12px; }
            .brand { gap: 8px; }
            .brand img { max-width: 78px; height: 30px; }
            .brand-name { font-size: 11px; }
            .brand-addr { font-size: 9px; }
            .doc .t { font-size: 15px; }
            .doc .m { font-size: 10px; }
            .meta-bar { padding: 8px 15px; }
            .body { padding: 16px 15px 6px; }
            .summary { grid-template-columns: 1fr; gap: 17px; }
            .net-card { padding-top: 2px; }
            th, td { padding: 7px 5px; font-size: 9px; }
            th:nth-child(3), td:nth-child(3) { padding-left: 7px; }
            .payable .a { font-size: 17px; }
            .footer { padding: 10px 15px 12px; }
          }
        </style>
      </head>

      <body>
        <main class="slip">
          <header class="header">
            <div class="brand">
              <img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(COMPANY.name)}" />
              <div class="brand-text">
                <div class="brand-name">${escapeHtml(COMPANY.name)}</div>
                <div class="brand-addr">${escapeHtml(COMPANY.address)}</div>
              </div>
            </div>

            <div class="doc">
              <div class="t">PAYSLIP</div>
              <div class="m">${escapeHtml(month)}</div>
            </div>
          </header>
          <div class="accent"></div>

          <div class="meta-bar">
            <span>Payslip No: <b>${escapeHtml(slipNo)}</b></span>
            <span>Issued on: <b>${escapeHtml(generatedOn || "—")}</b></span>
          </div>

          <div class="body">
            <section class="summary">
              <div>
                <p class="caption">Employee summary</p>
                ${detailRows}
              </div>

              <div class="net-card">
                <div class="lbl">Employee Net Pay</div>
                <div class="amt">${formatMoney(netSalary)}</div>
                <span class="paid">Payroll status: Processed</span>
                ${stats}
              </div>
            </section>

            <section class="salary">
              <p class="caption">Earnings &amp; deductions</p>

              <div class="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th style="width:30%">Earnings</th>
                      <th class="num" style="width:20%">Amount (₹)</th>
                      <th style="width:30%">Deductions</th>
                      <th class="num" style="width:20%">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>${rows}</tbody>
                  <tfoot>
                    <tr>
                      <td>Gross Earnings</td>
                      <td class="num">${formatNumber(grossEarnings)}</td>
                      <td>Total Deductions</td>
                      <td class="num">${formatNumber(totalDeductions)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div class="payable">
                <div class="l">
                  Total Net Payable
                  <small>Gross Earnings − Total Deductions</small>
                </div>
                <div class="a">${formatMoney(netSalary)}</div>
              </div>

              <div class="words">
                <span>Amount in words:</span> <b>${escapeHtml(amountInWords(netSalary))}</b>
              </div>
            </section>
          </div>

          <footer class="footer">
            <b>This is a system-generated payslip and does not require a signature.</b><br />
            For any queries, please contact the HR department.
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
      className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-400"
    >
      <Download size={15} />
      <span>Download Slip</span>
    </button>
  );
}
