/**
 * Standalone payslip document builder.
 *
 * `buildPayslipHtml` returns a complete HTML document so the slip can be
 * opened in its own window and printed/saved as PDF without any application
 * styles leaking in. Every interpolated value is escaped.
 *
 * Kept separate from the React button so the document markup and the
 * interaction (opening/printing the window) can be reviewed independently.
 */

const COMPANY = {
  name: "Hawk'n Technologies",
  tagline: "Salary Statement",
};

const INDIAN_UNITS = ["", "Thousand", "Lakh", "Crore", "Arab", "Kharab"];

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

const HTML_ENTITIES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

const MONTH_FORMATTER = new Intl.DateTimeFormat("en-IN", {
  month: "long",
  year: "numeric",
});

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const escapeHtml = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (character) => HTML_ENTITIES[character],
  );

const toAmount = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
};

export const formatMoney = (value) => {
  const amount = toAmount(value);
  const digits = Math.abs(amount).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `${amount < 0 ? "−" : ""}₹${digits}`;
};

export const formatMonth = (value) => {
  if (!value) return "—";

  const match = /^(\d{4})-(\d{2})/.exec(String(value));
  if (!match) return "—";

  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return "—";

  return MONTH_FORMATTER.format(new Date(year, month - 1, 1));
};

const formatGeneratedOn = (date) => {
  const value = date instanceof Date ? date : new Date(date);
  return Number.isNaN(value.getTime()) ? "—" : DATE_TIME_FORMATTER.format(value);
};

const twoDigits = (value) => {
  if (value < 20) return ONES[value];

  const tens = TENS[Math.floor(value / 10)];
  const ones = value % 10 ? ` ${ONES[value % 10]}` : "";
  return `${tens}${ones}`;
};

const threeDigits = (value) => {
  const hundreds = Math.floor(value / 100);
  const rest = value % 100;

  return [
    hundreds ? `${ONES[hundreds]} Hundred` : "",
    rest ? twoDigits(rest) : "",
  ]
    .filter(Boolean)
    .join(" ");
};

/* Indian-system grouping: last group of 3, then groups of 2. */
const numberToWords = (value) => {
  const amount = Math.floor(toAmount(value));
  if (amount <= 0) return "Zero";

  const groups = [];
  let remaining = amount;

  groups.push(remaining % 1000);
  remaining = Math.floor(remaining / 1000);

  while (remaining > 0) {
    groups.push(remaining % 100);
    remaining = Math.floor(remaining / 100);
  }

  return groups
    .map((group, index) => {
      if (!group) return "";

      const words = index === 0 ? threeDigits(group) : twoDigits(group);
      const unit = INDIAN_UNITS[index];
      return unit ? `${words} ${unit}` : words;
    })
    .filter(Boolean)
    .reverse()
    .join(" ");
};

const amountInWords = (value) => {
  // Work in paise so values such as 0.999 round to ₹1.00 instead of
  // producing "99 Paise" followed by an invalid 100-paise remainder.
  const totalPaise = Math.round(Math.max(0, toAmount(value)) * 100);
  const rupees = Math.floor(totalPaise / 100);
  const paise = totalPaise % 100;

  const paiseWords = paise ? ` and ${twoDigits(paise)} Paise` : "";
  return `Rupees ${numberToWords(rupees)}${paiseWords} Only`;
};

const getEmployeeName = (employee) => {
  const fullName = String(employee?.fullName ?? "").trim();
  if (fullName) return fullName;

  const joined = [employee?.firstName, employee?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return joined || "Employee";
};

const getInitials = (name) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "E";

const getPayrollReference = (uuid) => {
  const cleaned = String(uuid ?? "")
    .replace(/[^a-z0-9]/gi, "")
    .toUpperCase();

  return cleaned ? `PR-${cleaned.slice(-8)}` : "—";
};

export function buildPayslipHtml(
  payroll,
  { logoUrl = "", generatedAt = new Date() } = {},
) {
  const employee = payroll?.employee ?? {};
  const employeeName = getEmployeeName(employee);
  const employeeEmail = String(employee.email || "—");
  const payPeriod = formatMonth(payroll?.payPeriod);
  const paymentMethod = String(payroll?.paymentMethod || "—");
  const reference = getPayrollReference(payroll?.uuid);
  const generatedOn = formatGeneratedOn(generatedAt);

  const baseSalary = toAmount(payroll?.baseSalary);
  const lopDeduction = toAmount(payroll?.lopDeduction);
  const bonus = toAmount(payroll?.bonus);
  const netSalary = toAmount(payroll?.netSalary);
  const grossEarnings = baseSalary + bonus;

  const bonusPrefix = bonus > 0 ? "+ " : "";
  const lopPrefix = lopDeduction > 0 ? "− " : "";
  const initials = getInitials(employeeName);

  const brandMark = logoUrl
    ? `<img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(COMPANY.name)}" />`
    : `<div class="brand-name">${escapeHtml(COMPANY.name)}</div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(`Salary Slip - ${employeeName} - ${payPeriod}`)}</title>

  <style>
    :root {
      color-scheme: light;
      --navy-900: #0a1730;
      --navy-800: #0f2347;
      --navy-700: #16315f;
      --blue-600: #2563eb;
      --blue-700: #1d4ed8;
      --blue-100: #dbeafe;
      --blue-50: #eff6ff;
      --ink: #0f172a;
      --text: #334155;
      --muted: #64748b;
      --line: #e2e8f0;
      --soft: #f8fafc;
      --green: #15803d;
      --green-soft: #dcfce7;
      --green-line: #bbf7d0;
      --red: #b91c1c;
    }

    * { box-sizing: border-box; }

    html { -webkit-text-size-adjust: 100%; }

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
      max-width: 820px;
      margin: 0 auto;
      overflow: hidden;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 24px 60px rgba(10, 23, 48, 0.16);
    }

    /* ---------- Header ---------- */
    .header {
      position: relative;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 24px;
      padding: 30px 40px;
      color: #fff;
      background:
        radial-gradient(circle at 92% -20%, rgba(59, 130, 246, 0.35), transparent 55%),
        linear-gradient(135deg, var(--navy-900), var(--navy-800) 60%, var(--navy-700));
    }

    .brand img {
      display: block;
      height: 52px;
      width: auto;
      max-width: 220px;
      object-fit: contain;
    }

    .brand-name {
      font-size: 22px;
      font-weight: 700;
      letter-spacing: 0.4px;
    }

    .brand-sub {
      margin-top: 8px;
      font-size: 12px;
      letter-spacing: 0.4px;
      color: #93b4e6;
    }

    .doc-title { text-align: right; }

    .doc-title h1 {
      margin: 0;
      font-size: 26px;
      font-weight: 700;
      letter-spacing: 3px;
    }

    .period-chip {
      display: inline-block;
      margin-top: 10px;
      padding: 6px 14px;
      font-size: 13px;
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
    .content { padding: 32px 40px 8px; }

    .section-title {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 0 0 14px;
      font-size: 14px;
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
      gap: 18px;
      padding: 20px;
      background: var(--soft);
      border: 1px solid var(--line);
      border-radius: 10px;
    }

    .avatar {
      flex: none;
      display: grid;
      place-items: center;
      width: 56px;
      height: 56px;
      font-size: 18px;
      font-weight: 700;
      color: var(--blue-600);
      background: var(--blue-100);
      border-radius: 50%;
    }

    .employee-name {
      margin: 0;
      font-size: 18px;
      font-weight: 700;
      color: var(--ink);
    }

    .employee-email {
      margin-top: 3px;
      font-size: 13px;
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
      background: var(--green-soft);
      border: 1px solid var(--green-line);
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
      grid-template-columns: repeat(auto-fit, minmax(165px, 1fr));
      gap: 12px;
      margin-top: 12px;
    }

    .meta {
      padding: 14px 16px;
      border: 1px solid var(--line);
      border-radius: 10px;
    }

    .meta-label {
      font-size: 12px;
      color: var(--muted);
    }

    .meta-value {
      margin-top: 4px;
      font-size: 14px;
      font-weight: 600;
      color: var(--ink);
      overflow-wrap: anywhere;
    }

    /* ---------- Salary table ---------- */
    .salary { margin-top: 30px; }

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
      padding: 13px 18px;
      text-align: left;
      font-size: 14px;
    }

    thead th {
      font-size: 12.5px;
      font-weight: 700;
      color: #fff;
      background: var(--navy-800);
    }

    th.amount, td.amount {
      text-align: right;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }

    tbody td { border-bottom: 1px solid var(--line); }

    .group-row th {
      padding: 8px 18px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--blue-700);
      background: var(--blue-50);
      border-bottom: 1px solid var(--blue-100);
    }

    .desc { font-weight: 600; color: var(--ink); }

    .earn { color: var(--green); font-weight: 600; }
    .deduct { color: var(--red); font-weight: 600; }

    tfoot td {
      font-size: 13.5px;
      font-weight: 600;
      color: var(--navy-800);
      background: var(--soft);
      border-top: 2px solid var(--line);
    }

    tfoot tr:first-child td { border-top: 2px solid var(--line); }
    tfoot tr + tr td { border-top: 1px solid var(--line); }

    tfoot .net-row td {
      font-size: 15px;
      font-weight: 700;
      color: var(--navy-900);
      background: var(--blue-50);
    }

    /* ---------- Net pay ---------- */
    .net {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 20px;
      margin-top: 28px;
      padding: 24px 28px;
      color: #fff;
      border-radius: 10px;
      background:
        radial-gradient(circle at 100% 0%, rgba(59, 130, 246, 0.4), transparent 55%),
        linear-gradient(135deg, var(--navy-900), var(--navy-700));
    }

    .net h3 {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
      color: #bfd4f6;
    }

    .net-words {
      margin: 8px 0 0;
      max-width: 420px;
      font-size: 12.5px;
      line-height: 1.5;
      color: #93b4e6;
    }

    .net-amount {
      font-size: 32px;
      font-weight: 700;
      letter-spacing: 0.3px;
      text-align: right;
      white-space: nowrap;
    }

    /* ---------- Footer ---------- */
    .footer {
      margin-top: 32px;
      padding: 18px 40px 26px;
      border-top: 1px solid var(--line);
      display: flex;
      justify-content: space-between;
      gap: 16px;
      font-size: 12px;
      line-height: 1.7;
      color: var(--muted);
    }

    .footer strong { color: var(--text); }
    .footer-right { text-align: right; }

    /* ---------- Screen-only actions ---------- */
    .actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 10px;
      max-width: 820px;
      margin: 0 auto 18px;
    }

    .actions button {
      padding: 11px 24px;
      font-family: inherit;
      font-size: 14px;
      font-weight: 600;
      border-radius: 8px;
      cursor: pointer;
      transition: background-color 120ms ease, border-color 120ms ease;
    }

    .actions button:focus-visible {
      outline: 2px solid #93c5fd;
      outline-offset: 2px;
    }

    .print-button {
      color: #fff;
      background: var(--blue-600);
      border: 1px solid var(--blue-600);
      box-shadow: 0 6px 16px rgba(37, 99, 235, 0.3);
    }

    .print-button:hover { background: var(--blue-700); border-color: var(--blue-700); }

    .close-button {
      color: var(--text);
      background: #fff;
      border: 1px solid #cbd5e1;
    }

    .close-button:hover { background: var(--soft); }

    @page { size: A4; margin: 10mm; }

    @media print {
      body { padding: 0; background: #fff; }
      .slip { max-width: none; border-radius: 0; box-shadow: none; }
      .actions { display: none; }
      .employee, .meta-grid, .salary, .net, .footer { break-inside: avoid; }
      thead { display: table-header-group; }
      tr { break-inside: avoid; }
      * {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }

    @media (max-width: 640px) {
      body { padding: 12px; }
      .header { flex-direction: column; align-items: flex-start; padding: 24px; }
      .doc-title { text-align: left; }
      .content { padding: 24px 20px 8px; }
      .employee { flex-wrap: wrap; padding: 16px; }
      .status { margin-left: 0; }
      .net { flex-direction: column; align-items: flex-start; padding: 20px; }
      .net-amount { text-align: left; font-size: 28px; }
      .footer { flex-direction: column; padding: 18px 20px 24px; }
      .footer-right { text-align: left; }
      th, td { padding: 12px 14px; }
    }
  </style>
</head>

<body>
  <div class="actions">
    <button type="button" class="print-button" id="payslip-print">
      Print / Save as PDF
    </button>
    <button type="button" class="close-button" id="payslip-close">Close</button>
  </div>

  <main class="slip">
    <header class="header">
      <div class="brand">
        ${brandMark}
        <div class="brand-sub">${escapeHtml(COMPANY.tagline)}</div>
      </div>

      <div class="doc-title">
        <h1>PAY SLIP</h1>
        <span class="period-chip">${escapeHtml(payPeriod)}</span>
      </div>
    </header>
    <div class="accent-bar"></div>

    <div class="content">
      <h2 class="section-title">Employee details</h2>

      <section class="employee">
        <div class="avatar" aria-hidden="true">${escapeHtml(initials)}</div>
        <div>
          <p class="employee-name">${escapeHtml(employeeName)}</p>
          <div class="employee-email">${escapeHtml(employeeEmail)}</div>
        </div>
        <span class="status">Processed</span>
      </section>

      <section class="meta-grid" aria-label="Payroll details">
        <div class="meta">
          <div class="meta-label">Pay period</div>
          <div class="meta-value">${escapeHtml(payPeriod)}</div>
        </div>
        <div class="meta">
          <div class="meta-label">Payment method</div>
          <div class="meta-value">${escapeHtml(paymentMethod)}</div>
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
        <h2 class="section-title">Salary breakdown</h2>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">Component</th>
                <th scope="col" class="amount">Amount (₹)</th>
              </tr>
            </thead>

            <tbody>
              <tr class="group-row">
                <th colspan="2" scope="colgroup">Earnings</th>
              </tr>
              <tr>
                <td class="desc">Base salary</td>
                <td class="amount">${escapeHtml(formatMoney(baseSalary))}</td>
              </tr>
              <tr>
                <td class="desc">Bonus</td>
                <td class="amount earn">${escapeHtml(`${bonusPrefix}${formatMoney(bonus)}`)}</td>
              </tr>

              <tr class="group-row">
                <th colspan="2" scope="colgroup">Deductions</th>
              </tr>
              <tr>
                <td class="desc">Loss of pay (LOP)</td>
                <td class="amount deduct">${escapeHtml(`${lopPrefix}${formatMoney(lopDeduction)}`)}</td>
              </tr>
            </tbody>

            <tfoot>
              <tr>
                <td>Gross earnings</td>
                <td class="amount">${escapeHtml(formatMoney(grossEarnings))}</td>
              </tr>
              <tr>
                <td>Total deductions</td>
                <td class="amount">${escapeHtml(formatMoney(lopDeduction))}</td>
              </tr>
              <tr class="net-row">
                <td>Net salary</td>
                <td class="amount">${escapeHtml(formatMoney(netSalary))}</td>
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

        <div class="net-amount">${escapeHtml(formatMoney(netSalary))}</div>
      </section>
    </div>

    <footer class="footer">
      <div>
        <strong>This is a system-generated salary slip.</strong><br />
        No signature is required.
      </div>

      <div class="footer-right">
        Payroll reference: ${escapeHtml(reference)}<br />
        For any queries, please contact the HR department.
      </div>
    </footer>
  </main>
</body>
</html>
`;
}
