import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, RefreshCw } from "lucide-react";
import StatCard from "../../components/cards/StatCard";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import EmptyState from "../../components/common/EmptyState";
import ErrorState from "../../components/common/ErrorState";
import DataTable from "../../components/tables/DataTable";
import TableSearch from "../../components/tables/TableSearch";
import { getErrorMessage } from "../../services/payrollService";
import {
  getHierarchyImages,
  getHrmsAttendance,
  getHrmsEmployees,
  getHrmsInternshipProbation,
  getHrmsLeaves,
  getHrmsPayroll,
  getHrmsSummary,
} from "../../services/adminHrmsService";

/**
 * Admin → HRMS: a LIVE, READ-ONLY view of everything HR manages.
 * Data refreshes every 60 seconds (and on "Refresh"). There are no
 * add / edit / delete actions here on purpose — HR owns this data.
 */

const REFRESH_MS = 60_000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const pad = (n) => String(n).padStart(2, "0");
const todayLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const thisMonthLocal = () => todayLocal().slice(0, 7);

const formatMoney = (value) =>
  value === null || value === undefined
    ? "—"
    : `₹${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

// "2026-10-06" → "6 Oct 2026" (built from parts so timezone can't shift the day)
const formatDate = (yyyyMmDd) => {
  if (!yyyyMmDd) return "—";
  const [year, month, day] = String(yyyyMmDd).slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

// "2026-10" → "October 2026"
const formatMonth = (yyyyMm) => {
  const [year, month] = yyyyMm.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
};

// "project_lead" / "FULL_DAY" → "Project Lead" / "Full Day"
const titleCase = (value = "") =>
  String(value)
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const Person = ({ name, email }) => (
  <div>
    <div className="font-medium text-cm-text">{name}</div>
    {email && <div className="text-xs text-cm-text-muted">{email}</div>}
  </div>
);

// `?? []` covers both null (still loading) and undefined
const withIds = (rows) => (rows ?? []).map((row) => ({ ...row, id: row.uuid }));

/**
 * Loads data and re-loads it whenever `fetcher` changes (e.g. a new date)
 * or `tick` changes (auto-refresh / Refresh button). Old data stays on
 * screen while new data loads, so the page never flashes.
 */
function useLiveData(fetcher, tick) {
  const [state, setState] = useState({ data: null, error: null, isLoading: true, updatedAt: null });

  useEffect(() => {
    let ignore = false; // tab closed / newer request started → drop this answer
    fetcher()
      .then((data) => {
        if (!ignore) setState({ data, error: null, isLoading: false, updatedAt: new Date() });
      })
      .catch((error) => {
        if (!ignore) {
          setState((prev) => ({ ...prev, error: getErrorMessage(error, "Couldn't load data."), isLoading: false }));
        }
      });
    return () => {
      ignore = true;
    };
  }, [fetcher, tick]);

  return state;
}

// Shared "loading / error / content" wrapper for each tab
function Section({ state, onRetry, children }) {
  if (state.error && !state.data) {
    return (
      <div className="rounded-cm-lg border border-cm-border bg-cm-card">
        <ErrorState title="Couldn't load data" description={state.error} onRetry={onRetry} />
      </div>
    );
  }
  return children;
}

function FilterChips({ options, value, onChange, label }) {
  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={value === option.value}
          onClick={() => onChange(option.value)}
          className={`rounded-full border px-3 py-1 text-sm transition-colors ${
            value === option.value
              ? "border-[#000052] bg-[#000052] text-white"
              : "border-cm-border bg-cm-card text-cm-text hover:border-[#000052]/30"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function MiniStat({ label, value, tone }) {
  const tones = { danger: "text-cm-danger-600", warning: "text-cm-warning-600" };
  return (
    <div className="rounded-lg border border-cm-border p-4">
      <p className="text-xs text-cm-text-muted">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${tones[tone] ?? "text-cm-text"}`}>{value}</p>
    </div>
  );
}

const inputClass =
  "h-10 rounded-cm-md border border-cm-border bg-white px-3 text-sm text-cm-text focus:border-cm-blue-500 focus:outline-none focus:ring-2 focus:ring-cm-blue-500";

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

function OverviewTab({ summary }) {
  const s = summary.data;
  if (!s) return null;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <section className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-cm-text">Attendance & Leave — {formatDate(s.date)}</h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <MiniStat label="Present today" value={s.today.presentToday} />
          <MiniStat label="On leave today" value={s.today.onLeaveToday} />
          <MiniStat label="Not marked yet" value={s.today.notMarked} tone={s.today.notMarked ? "warning" : undefined} />
          <MiniStat label="Leave requests pending" value={s.today.pendingLeaves} tone={s.today.pendingLeaves ? "warning" : undefined} />
        </div>
      </section>

      <section className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-cm-text">Payroll & People</h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <MiniStat label={`Payroll — ${formatMonth(s.payroll.month)}`} value={formatMoney(s.payroll.totalNet)} />
          <MiniStat
            label="Payroll processed / pending"
            value={`${s.payroll.processed} / ${s.payroll.pending}`}
            tone={s.payroll.pending ? "warning" : undefined}
          />
          <MiniStat label="Active employees" value={s.employees.total} />
          <MiniStat label="Full time / exited" value={`${s.employees.fullTime} / ${s.employees.exited}`} />
          <MiniStat
            label="Internship / probation ending in 14 days"
            value={s.internshipProbation.dueSoon}
            tone={s.internshipProbation.dueSoon ? "warning" : undefined}
          />
          <MiniStat
            label="Internship / probation overdue"
            value={s.internshipProbation.overdue}
            tone={s.internshipProbation.overdue ? "danger" : undefined}
          />
        </div>
      </section>
    </div>
  );
}

const EMPLOYEE_STATUS_TONE = { Active: "success", "On Leave": "warning", Exited: "neutral" };

function EmployeesTab({ tick, onRetry }) {
  const state = useLiveData(getHrmsEmployees, tick);
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    const list = state.data ?? [];
    if (!query) return list;
    return list.filter((employee) =>
      [employee.fullName, employee.email, employee.role, employee.employmentType]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query)),
    );
  }, [state.data, search]);

  const columns = [
    { key: "name", header: "Employee", render: (row) => <Person name={row.fullName} email={row.email} /> },
    { key: "role", header: "Role", render: (row) => titleCase(row.role) },
    { key: "type", header: "Type", render: (row) => row.employmentType },
    { key: "joined", header: "Joined", render: (row) => formatDate(row.joiningDate) },
    { key: "phone", header: "Phone", render: (row) => row.phone || "—" },
    { key: "salary", header: "Salary", render: (row) => formatMoney(row.salary) },
    {
      key: "status",
      header: "Status",
      render: (row) => <Badge tone={EMPLOYEE_STATUS_TONE[row.employmentStatus] ?? "neutral"}>{row.employmentStatus}</Badge>,
    },
  ];

  return (
    <Section state={state} onRetry={onRetry}>
      <section className="flex flex-col gap-4">
        <TableSearch value={search} onChange={setSearch} placeholder="Search name, email, role, type…" />
        <DataTable
          columns={columns}
          rows={withIds(rows)}
          isLoading={state.isLoading}
          emptyMessage={search ? "No employees match your search." : "No employees yet."}
        />
      </section>
    </Section>
  );
}

const DAY_STATUS_TONE = {
  Present: "success",
  "Half Day": "warning",
  "On Leave": "info",
  Absent: "danger",
  "Not Marked": "neutral",
};

const SessionBadge = ({ value }) =>
  value ? <Badge tone={value === "Present" ? "success" : "danger"}>{value}</Badge> : <span className="text-cm-text-muted">—</span>;

function AttendanceTab({ tick, onRetry }) {
  const [date, setDate] = useState(todayLocal());
  const fetcher = useCallback(() => getHrmsAttendance(date), [date]);
  const state = useLiveData(fetcher, tick);

  const counts = useMemo(() => {
    const result = {};
    (state.data?.records ?? []).forEach((record) => {
      result[record.dayStatus] = (result[record.dayStatus] ?? 0) + 1;
    });
    return result;
  }, [state.data]);

  const columns = [
    { key: "name", header: "Employee", render: (row) => <Person name={row.fullName} email={row.email} /> },
    { key: "role", header: "Role", render: (row) => titleCase(row.role) },
    { key: "first", header: "First Half", render: (row) => <SessionBadge value={row.firstHalf} /> },
    { key: "second", header: "Second Half", render: (row) => <SessionBadge value={row.secondHalf} /> },
    { key: "checkIn", header: "Check-in", render: (row) => row.checkIn ?? "—" },
    {
      key: "day",
      header: "Day",
      render: (row) => <Badge tone={DAY_STATUS_TONE[row.dayStatus]}>{row.dayStatus}</Badge>,
    },
    { key: "leave", header: "Leave", render: (row) => (row.leave ? titleCase(row.leave) : "—") },
  ];

  return (
    <Section state={state} onRetry={onRetry}>
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm text-cm-text">
            Date
            <input
              type="date"
              value={date}
              max={todayLocal()}
              onChange={(event) => event.target.value && setDate(event.target.value)}
              className={inputClass}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {Object.keys(DAY_STATUS_TONE).map((status) => (
              <Badge key={status} tone={DAY_STATUS_TONE[status]}>
                {status}: {counts[status] ?? 0}
              </Badge>
            ))}
          </div>
        </div>
        <DataTable
          columns={columns}
          rows={withIds(state.data?.records)}
          isLoading={state.isLoading}
          emptyMessage="No employees to show."
        />
      </section>
    </Section>
  );
}

const LEAVE_STATUS_TONE = { PENDING: "warning", APPROVED: "success", REJECTED: "danger" };
const LEAVE_FILTERS = [
  { value: "", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

function LeavesTab({ tick, onRetry }) {
  const [status, setStatus] = useState("");
  const fetcher = useCallback(() => getHrmsLeaves(status), [status]);
  const state = useLiveData(fetcher, tick);

  const columns = [
    { key: "name", header: "Employee", render: (row) => <Person name={row.employee.fullName} email={row.employee.email} /> },
    { key: "date", header: "Date", render: (row) => formatDate(row.leaveDate) },
    { key: "type", header: "Type", render: (row) => titleCase(row.leaveType) },
    { key: "session", header: "Session", render: (row) => titleCase(row.leaveSession) },
    {
      key: "status",
      header: "Status",
      render: (row) => <Badge tone={LEAVE_STATUS_TONE[row.leaveStatus]}>{titleCase(row.leaveStatus)}</Badge>,
    },
    {
      key: "pay",
      header: "Pay",
      render: (row) => {
        if (row.isLop) return <Badge tone="danger">LOP</Badge>;
        if (row.isPaid === true) return <Badge tone="success">Paid</Badge>;
        return <span className="text-cm-text-muted">—</span>;
      },
    },
    { key: "reviewer", header: "Reviewed By", render: (row) => row.reviewedBy ?? "—" },
    { key: "reason", header: "Reason", render: (row) => row.reason || "—" },
  ];

  return (
    <Section state={state} onRetry={onRetry}>
      <section className="flex flex-col gap-4">
        <FilterChips options={LEAVE_FILTERS} value={status} onChange={setStatus} label="Filter leaves by status" />
        <DataTable
          columns={columns}
          rows={withIds(state.data)}
          isLoading={state.isLoading}
          emptyMessage="No leave requests."
        />
      </section>
    </Section>
  );
}

function PayrollTab({ tick, onRetry }) {
  const [month, setMonth] = useState(thisMonthLocal());
  const fetcher = useCallback(() => getHrmsPayroll(month), [month]);
  const state = useLiveData(fetcher, tick);
  const data = state.data;

  const payrollColumns = [
    { key: "name", header: "Employee", render: (row) => <Person name={row.employee.fullName} email={row.employee.email} /> },
    { key: "base", header: "Base", render: (row) => formatMoney(row.baseSalary) },
    { key: "lop", header: "LOP", render: (row) => formatMoney(row.lopDeduction) },
    { key: "bonus", header: "Bonus", render: (row) => formatMoney(row.bonus) },
    { key: "net", header: "Net", render: (row) => <span className="font-semibold">{formatMoney(row.netSalary)}</span> },
    { key: "method", header: "Payment", render: (row) => row.paymentMethod },
    {
      key: "status",
      header: "Status",
      render: (row) => <Badge tone={row.status === "Processed" ? "success" : "warning"}>{row.status}</Badge>,
    },
  ];

  const bonusColumns = [
    { key: "name", header: "Employee", render: (row) => <Person name={row.employee.fullName} email={row.employee.email} /> },
    { key: "type", header: "Type", render: (row) => <Badge tone="neutral">{row.bonusType}</Badge> },
    { key: "amount", header: "Amount", render: (row) => <span className="font-semibold">{formatMoney(row.amount)}</span> },
    { key: "reason", header: "Reason", render: (row) => row.reason || "—" },
  ];

  const incrementColumns = [
    { key: "name", header: "Employee", render: (row) => <Person name={row.employee.fullName} email={row.employee.email} /> },
    { key: "previous", header: "Previous", render: (row) => formatMoney(row.previousSalary) },
    { key: "new", header: "New", render: (row) => <span className="font-semibold">{formatMoney(row.newSalary)}</span> },
    { key: "increase", header: "Increase", render: (row) => <Badge tone="success">+{row.increasePercent}%</Badge> },
    { key: "effective", header: "Effective", render: (row) => formatDate(row.effectiveDate) },
    { key: "reason", header: "Reason", render: (row) => row.reason || "—" },
  ];

  return (
    <Section state={state} onRetry={onRetry}>
      <section className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm text-cm-text">
            Month
            <input
              type="month"
              value={month}
              onChange={(event) => event.target.value && setMonth(event.target.value)}
              className={inputClass}
            />
          </label>
          {data && (
            <p className="text-sm text-cm-text-muted">
              {data.totals.count} payroll{data.totals.count === 1 ? "" : "s"} · Total net{" "}
              <strong className="text-cm-text">{formatMoney(data.totals.totalNet)}</strong>
              {data.totals.pending > 0 && ` · ${data.totals.pending} pending`}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-cm-text">Payroll — {formatMonth(month)}</h3>
          <DataTable
            columns={payrollColumns}
            rows={withIds(data?.payrolls)}
            isLoading={state.isLoading}
            emptyMessage="No payroll for this month."
          />
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-cm-text">Bonuses — {formatMonth(month)}</h3>
          <DataTable
            columns={bonusColumns}
            rows={withIds(data?.bonuses)}
            isLoading={state.isLoading}
            emptyMessage="No bonuses for this month."
          />
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-cm-text">Recent Increments</h3>
          <DataTable
            columns={incrementColumns}
            rows={withIds(data?.increments)}
            isLoading={state.isLoading}
            emptyMessage="No increments yet."
          />
        </div>
      </section>
    </Section>
  );
}

const PERIOD_STATUS_TONE = { Active: "info", Confirmed: "success", Converted: "success", Ended: "neutral", Terminated: "danger" };
const PERFORMANCE_TONE = { Pending: "neutral", "Needs Improvement": "warning", Good: "info", Excellent: "success" };
const PERIOD_FILTERS = [
  { value: "Active", label: "Active" },
  { value: "Closed", label: "Closed" },
  { value: "All", label: "All" },
];

function TimeLeft({ row }) {
  if (row.status !== "Active") {
    return <Badge tone={PERIOD_STATUS_TONE[row.status]}>{row.status === "Converted" ? "Moved to Probation" : row.status}</Badge>;
  }
  if (row.isOverdue) return <Badge tone="danger">Overdue by {Math.abs(row.daysLeft)}d</Badge>;
  if (row.daysLeft === 0) return <Badge tone="warning">Ends today</Badge>;
  return <Badge tone={row.isDueSoon ? "warning" : "neutral"}>{row.daysLeft}d left</Badge>;
}

function InternshipTab({ tick, onRetry }) {
  const state = useLiveData(getHrmsInternshipProbation, tick);
  const [filter, setFilter] = useState("Active");

  const rows = useMemo(
    () =>
      (state.data ?? []).filter((row) => {
        if (filter === "Active") return row.status === "Active";
        if (filter === "Closed") return row.status !== "Active";
        return true;
      }),
    [state.data, filter],
  );

  const columns = [
    { key: "name", header: "Employee", render: (row) => <Person name={row.employee.fullName} email={row.employee.email} /> },
    {
      key: "type",
      header: "Type",
      render: (row) => <Badge tone={row.periodType === "Internship" ? "info" : "warning"}>{row.periodType}</Badge>,
    },
    {
      key: "period",
      header: "Period",
      render: (row) => (
        <div>
          <div>
            {formatDate(row.startDate)} → {formatDate(row.endDate)}
          </div>
          {row.extensionCount > 0 && (
            <div className="text-xs text-cm-text-muted">
              Extended {row.extensionCount}× (was {formatDate(row.originalEndDate)})
            </div>
          )}
        </div>
      ),
    },
    { key: "time", header: "Status", render: (row) => <TimeLeft row={row} /> },
    { key: "stipend", header: "Stipend", render: (row) => (row.stipend === null ? "—" : `${formatMoney(row.stipend)}/mo`) },
    {
      key: "performance",
      header: "Performance",
      render: (row) => <Badge tone={PERFORMANCE_TONE[row.performance]}>{row.performance}</Badge>,
    },
  ];

  return (
    <Section state={state} onRetry={onRetry}>
      <section className="flex flex-col gap-4">
        <FilterChips options={PERIOD_FILTERS} value={filter} onChange={setFilter} label="Filter by status" />
        <DataTable
          columns={columns}
          rows={withIds(rows)}
          isLoading={state.isLoading}
          emptyMessage={filter === "Active" ? "No one is on internship or probation right now." : "No records."}
        />
      </section>
    </Section>
  );
}

function HierarchyTab({ tick, onRetry }) {
  const state = useLiveData(getHierarchyImages, tick);
  const images = state.data ?? [];

  if (state.isLoading) return <DataTable columns={[]} rows={[]} isLoading />;

  return (
    <Section state={state} onRetry={onRetry}>
      {images.length === 0 ? (
        <div className="rounded-cm-lg border border-cm-border bg-cm-card">
          <EmptyState title="No hierarchy images yet" description="They appear here once uploaded in Company → Employee Hierarchy." />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {images.map((image) => (
            <figure key={image.uuid} className="overflow-hidden rounded-cm-lg border border-cm-border bg-cm-card shadow-sm">
              <img src={image.fileUrl} alt={image.originalFileName} className="w-full object-contain" loading="lazy" />
              <figcaption className="border-t border-cm-border px-4 py-2 text-xs text-cm-text-muted">
                {image.originalFileName}
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </Section>
  );
}

function SopsTab() {
  return (
    <div className="rounded-cm-lg border border-cm-border bg-cm-card">
      <EmptyState title="SOPs coming soon" description="The SOP module isn't built yet — it will show here once it is." />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const TABS = [
  ["overview", "Overview"],
  ["employees", "Employees"],
  ["attendance", "Attendance"],
  ["leave", "Leave & LOP"],
  ["payroll", "Payroll"],
  ["internship", "Internship / Probation"],
  ["hierarchy", "Employee Hierarchy"],
  ["sops", "SOPs"],
];

function HRMS() {
  const [activeSection, setActiveSection] = useState("overview");
  // Bumping `tick` re-loads the summary + the open tab
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((value) => value + 1), []);

  // Auto-refresh while the page is open
  useEffect(() => {
    const timer = setInterval(refresh, REFRESH_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  const summary = useLiveData(getHrmsSummary, tick);
  const s = summary.data;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-cm-text">HRMS</h1>
          <p className="mt-1 text-sm text-cm-text-muted">
            Company-wide employee, attendance, leave, payroll and people administration.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 text-xs text-cm-text-muted">
            <Eye className="h-3.5 w-3.5" aria-hidden="true" /> View only
            {summary.updatedAt && ` · Updated ${summary.updatedAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`}
          </span>
          <Button size="sm" variant="outline" onClick={refresh} aria-label="Refresh HRMS data">
            <RefreshCw className="mr-1 h-4 w-4" aria-hidden="true" /> Refresh
          </Button>
        </div>
      </div>

      {summary.error && !s ? (
        <div className="rounded-cm-lg border border-cm-border bg-cm-card">
          <ErrorState title="Couldn't load HRMS" description={summary.error} onRetry={refresh} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Present Today" value={s ? s.today.presentToday : "…"} accent="success" />
          <StatCard label="On Leave" value={s ? s.today.onLeaveToday : "…"} accent="warning" />
          <StatCard label="Interns" value={s ? s.employees.interns : "…"} />
          <StatCard label="Probation" value={s ? s.employees.probation : "…"} accent="purple" />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {TABS.map(([value, label]) => (
          <Button
            key={value}
            size="sm"
            variant={activeSection === value ? "primary" : "outline"}
            onClick={() => setActiveSection(value)}
          >
            {label}
          </Button>
        ))}
      </div>

      {activeSection === "overview" && <OverviewTab summary={summary} />}
      {activeSection === "employees" && <EmployeesTab tick={tick} onRetry={refresh} />}
      {activeSection === "attendance" && <AttendanceTab tick={tick} onRetry={refresh} />}
      {activeSection === "leave" && <LeavesTab tick={tick} onRetry={refresh} />}
      {activeSection === "payroll" && <PayrollTab tick={tick} onRetry={refresh} />}
      {activeSection === "internship" && <InternshipTab tick={tick} onRetry={refresh} />}
      {activeSection === "hierarchy" && <HierarchyTab tick={tick} onRetry={refresh} />}
      {activeSection === "sops" && <SopsTab />}
    </div>
  );
}

export default HRMS;