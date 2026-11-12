import { useMemo, useState } from "react";
import {
  CalendarDays,
  Clock3,
  CheckCircle2,
  XCircle,
  Plus,
  Search,
  ArrowUpRight,
  Wallet,
  CalendarRange,
} from "lucide-react";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import DataTable from "../../components/tables/DataTable";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import { showToast } from "../../components/common/Toast";

const INITIAL = [
  {
    id: "LV-001",
    employee: "Neha Joshi",
    type: "Casual Leave",
    from: "2026-09-23",
    to: "2026-09-24",
    days: 2,
    lop: 0,
    status: "Pending",
  },
  {
    id: "LV-002",
    employee: "Aarav Shah",
    type: "Sick Leave",
    from: "2026-09-18",
    to: "2026-09-18",
    days: 1,
    lop: 0,
    status: "Approved",
  },
];

const TONE = {
  Pending: "warning",
  Approved: "success",
  Rejected: "danger",
};

const EMPTY_FORM = {
  employee: "",
  type: "Casual Leave",
  from: "",
  to: "",
  days: 1,
  lop: 0,
};

const formatDate = (value) => {
  if (!value) return "—";
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

function MetricCard({ label, value, detail, icon: Icon, tone }) {
  const styles = {
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    red: "bg-rose-50 text-rose-700 ring-rose-100",
  };

  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
            {value}
          </p>
        </div>
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-2xl ring-1 ${styles[tone]}`}
        >
          <Icon size={20} />
        </span>
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>
    </article>
  );
}

function LeaveLOP() {
  const [requests, setRequests] = useState(INITIAL);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return requests;

    return requests.filter(
      (row) =>
        row.employee.toLowerCase().includes(query) ||
        row.type.toLowerCase().includes(query) ||
        row.status.toLowerCase().includes(query),
    );
  }, [requests, search]);

  const summary = useMemo(
    () => ({
      total: requests.length,
      pending: requests.filter((row) => row.status === "Pending").length,
      approved: requests.filter((row) => row.status === "Approved").length,
      lop: requests.reduce((sum, row) => sum + Number(row.lop || 0), 0),
    }),
    [requests],
  );

  const add = (event) => {
    event.preventDefault();

    if (!form.employee.trim() || !form.from || !form.to) {
      showToast.error("Employee and leave dates are required.");
      return;
    }

    if (form.to < form.from) {
      showToast.error("End date cannot be before the start date.");
      return;
    }

    setRequests((prev) => [
      ...prev,
      {
        id: `LV-${String(prev.length + 1).padStart(3, "0")}`,
        ...form,
        status: "Pending",
      },
    ]);

    setForm(EMPTY_FORM);
    setShowForm(false);
    showToast.success("Leave request added.");
  };

  const updateStatus = (id, status) => {
    setRequests((prev) =>
      prev.map((row) => (row.id === id ? { ...row, status } : row)),
    );
    showToast.success(`Leave request ${status.toLowerCase()}.`);
  };

  const columns = [
    {
      key: "employee",
      header: "Employee",
      render: (row) => (
        <div className="flex min-w-[150px] items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-semibold text-blue-700 ring-1 ring-blue-100">
            {row.employee
              .split(" ")
              .map((part) => part[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-slate-800">{row.employee}</p>
            <p className="mt-0.5 text-xs text-slate-400">{row.id}</p>
          </div>
        </div>
      ),
    },
    { key: "type", header: "Leave Type" },
    {
      key: "from",
      header: "From",
      render: (row) => (
        <span className="whitespace-nowrap text-slate-600">
          {formatDate(row.from)}
        </span>
      ),
    },
    {
      key: "to",
      header: "To",
      render: (row) => (
        <span className="whitespace-nowrap text-slate-600">
          {formatDate(row.to)}
        </span>
      ),
    },
    {
      key: "days",
      header: "Days",
      render: (row) => (
        <span className="font-semibold text-slate-800">{row.days}</span>
      ),
    },
    {
      key: "lop",
      header: "LOP",
      render: (row) => (
        <span className={row.lop > 0 ? "font-semibold text-rose-600" : "text-slate-500"}>
          {row.lop}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <Badge tone={TONE[row.status]}>{row.status}</Badge>,
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) =>
        row.status === "Pending" ? (
          <div className="flex min-w-max items-center gap-2">
            <Button
              size="sm"
              onClick={() => updateStatus(row.id, "Approved")}
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => updateStatus(row.id, "Rejected")}
            >
              Reject
            </Button>
          </div>
        ) : (
          <span className="text-xs text-slate-400">No action required</span>
        ),
    },
  ];

  return (
    <div className="min-w-0 space-y-6 pb-6">
      {/* Page header */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-white to-blue-50/80 p-5 shadow-sm sm:p-7">
        <div className="pointer-events-none absolute -right-12 -top-20 h-56 w-56 rounded-full border border-blue-100" />
        <div className="pointer-events-none absolute -right-3 -top-12 h-40 w-40 rounded-full border border-blue-100/80" />

        <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0b1833] text-white shadow-md shadow-slate-900/10">
              <CalendarRange size={22} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-700">
                People operations
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                My Leave
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                Review leave requests, track approvals and keep leave
                records organized in one place.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-600">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Leave management
                </span>
                <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs text-slate-500">
                  {requests.length} total records
                </span>
              </div>
            </div>
          </div>

          <Button onClick={() => setShowForm(true)}>
            <span className="inline-flex items-center gap-2">
              <Plus size={16} />
              Add Leave
            </span>
          </Button>
        </div>
      </section>

      {/* Overview cards */}
      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Leave overview
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            A quick summary of the current leave register.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Total requests"
            value={summary.total}
            detail="All recorded leave requests"
            icon={CalendarDays}
            tone="blue"
          />
          <MetricCard
            label="Pending review"
            value={summary.pending}
            detail="Waiting for a decision"
            icon={Clock3}
            tone="amber"
          />
          <MetricCard
            label="Approved"
            value={summary.approved}
            detail="Approved leave requests"
            icon={CheckCircle2}
            tone="green"
          />
          <MetricCard
            label="LOP days"
            value={summary.lop}
            detail="Recorded loss-of-pay days"
            icon={Wallet}
            tone="red"
          />
        </div>
      </section>

      {/* Add request modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowForm(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="leave-form-title"
            className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-slate-200 bg-white shadow-2xl sm:rounded-3xl"
          >
            <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white/95 px-5 py-5 backdrop-blur sm:px-6">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-700">
                  Leave management
                </p>
                <h2
                  id="leave-form-title"
                  className="mt-1 text-xl font-semibold text-slate-900"
                >
                  Create leave request
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Enter the employee and requested leave period.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close leave form"
                onClick={() => setShowForm(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                <XCircle size={18} />
              </button>
            </header>

            <form onSubmit={add} className="space-y-5 p-5 sm:p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Employee"
                  required
                  value={form.employee}
                  onChange={(event) =>
                    setForm({ ...form, employee: event.target.value })
                  }
                />

                <Select
                  label="Leave Type"
                  value={form.type}
                  options={[
                    "Casual Leave",
                    "Sick Leave",
                    "Paid Leave",
                    "Unpaid Leave",
                  ].map((value) => ({ value, label: value }))}
                  onChange={(event) =>
                    setForm({ ...form, type: event.target.value })
                  }
                />

                <Input
                  label="From Date"
                  type="date"
                  required
                  value={form.from}
                  onChange={(event) =>
                    setForm({ ...form, from: event.target.value })
                  }
                />

                <Input
                  label="To Date"
                  type="date"
                  required
                  min={form.from || undefined}
                  value={form.to}
                  onChange={(event) =>
                    setForm({ ...form, to: event.target.value })
                  }
                />

                <Input
                  label="Leave Days"
                  type="number"
                  min="1"
                  value={form.days}
                  onChange={(event) =>
                    setForm({ ...form, days: Number(event.target.value) })
                  }
                />

                <Input
                  label="LOP Days"
                  type="number"
                  min="0"
                  value={form.lop}
                  onChange={(event) =>
                    setForm({ ...form, lop: Number(event.target.value) })
                  }
                />
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  <span className="inline-flex items-center gap-2">
                    <Plus size={16} />
                    Create Request
                  </span>
                </Button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* Request register */}
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Leave register
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Search requests and review their current status.
            </p>
          </div>

          <div className="relative w-full sm:max-w-xs">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search employee or status..."
              aria-label="Search leave requests"
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-9 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
          <p className="text-sm text-slate-500">
            Showing{" "}
            <span className="font-semibold text-slate-800">
              {filtered.length}
            </span>{" "}
            of {requests.length} requests
          </p>
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
            Updated register
          </span>
        </div>

        <div className="min-w-0 overflow-x-auto px-3 pb-3 sm:px-5">
          <DataTable
            columns={columns}
            rows={filtered}
            emptyMessage="No leave records match your search."
          />
        </div>
      </section>
    </div>
  );
}

export default LeaveLOP;
