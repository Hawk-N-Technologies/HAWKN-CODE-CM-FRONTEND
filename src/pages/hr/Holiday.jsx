import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CalendarCheck,
  CalendarClock,
  Plus,
  Search,
  Trash2,
  X,
  CheckCircle2,
  CircleDollarSign,
  CalendarX2,
  RefreshCw,
} from "lucide-react";

import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import DataTable from "../../components/tables/DataTable";
import Input from "../../components/common/Input";
import Loader from "../../components/common/Loader";
import { showToast } from "../../components/common/Toast";
import { showAlert } from "../../components/common/Alert";
import axios from "axios";

function formatDate(value) {
  if (!value) return "—";
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getDateKey(value) {
  if (!value) {
    return "";
  }

  return String(value).slice(0, 10);
}

function isUpcomingHoliday(value) {
  const dateKey = getDateKey(value);

  if (!dateKey) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [year, month, day] = dateKey.split("-").map(Number);
  const holidayDate = new Date(year, month - 1, day);

  return holidayDate >= today;
}

function getDateDetails(value) {
  if (!value) {
    return { day: "--", month: "---", weekday: "Date not set" };
  }

  const [year, month, day] = getDateKey(value).split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return {
    day: date.toLocaleDateString("en-IN", { day: "2-digit" }),
    month: date.toLocaleDateString("en-IN", { month: "short" }),
    weekday: date.toLocaleDateString("en-IN", { weekday: "long" }),
  };
}

function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
  iconClass,
}) {
  return (
    <div className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-cm-text-muted">{title}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-cm-text">
            {value}
          </p>
          <p className="mt-2 text-xs text-cm-text-muted">{description}</p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

function HolidayModal({
  title,
  subtitle,
  onClose,
  dismissDisabled = false,
  children,
}) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !dismissDisabled) onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [dismissDisabled, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !dismissDisabled) {
          onClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="holiday-modal-title"
        className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-2xl sm:rounded-3xl"
      >
        <header className="relative isolate shrink-0 overflow-hidden border-b border-white/10 bg-gradient-to-br from-[#0b1833] via-[#122b4d] to-[#1c4168] px-5 py-5 text-white sm:px-7">
          <div className="pointer-events-none absolute -right-8 -top-16 h-48 w-48 rounded-full border border-white/[0.07]" />
          <div className="pointer-events-none absolute -right-1 -top-10 h-36 w-36 rounded-full border border-white/[0.07]" />

          <div className="relative flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white shadow-sm">
                <Plus size={19} />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2
                    id="holiday-modal-title"
                    className="text-lg font-semibold tracking-tight text-white sm:text-xl"
                  >
                    {title}
                  </h2>
                  <span className="rounded-full border border-white/15 bg-white/[0.08] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-200">
                    COMPANY HOLIDAYS
                  </span>
                </div>
                {subtitle && (
                  <p className="mt-1 max-w-2xl text-sm leading-5 text-slate-300">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              aria-label="Close dialog"
              onClick={onClose}
              disabled={dismissDisabled}
              className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-slate-200 transition hover:bg-white/20 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X size={17} />
            </button>
          </div>

          <div className="relative mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-300">
            <span className="h-2 w-2 rounded-full bg-sky-300" />
            <span>Company calendar operations</span>
            <span className="text-slate-500">/</span>
            <span>Shared holiday date and payment details</span>
          </div>
        </header>
        <div className="overflow-y-auto bg-white">{children}</div>
      </section>
    </div>
  );
}

function Holiday() {
  const [holidays, setHolidays] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingUuid, setDeletingUuid] = useState(null);
  const [form, setForm] = useState({ date: "", name: "", paid: true });

  // GET ALL HOLIDAYS
  const getAllHolidays = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/company/holidays", {
        withCredentials: true,
      });
      if (res.status === 200) setHolidays(res.data.data || []);
    } catch (error) {
      console.error("Failed to fetch holidays:", error);
      showToast.error(
        error.response?.data?.message || "Failed to load holidays."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAllHolidays();
  }, []);

  // FORM CHANGE
  function handleChange(field, value) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  function resetForm() {
    setForm({ date: "", name: "", paid: true });
  }

  function closeForm() {
    if (submitting) {
      return;
    }

    resetForm();
    setShowForm(false);
  }

  // CREATE HOLIDAY
  async function addHoliday(event) {
    event.preventDefault();
    if (!form.date || !form.name.trim()) {
      showToast.error("Holiday date and name are required.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await axios.post(
        "/api/company/holidays",
        {
          holidayDate: form.date,
          name: form.name.trim(),
          isPaid: form.paid,
        },
        {
          withCredentials: true,
        }
      );
      if (res.status === 201 || res.status === 200) {
        showToast.success("Holiday added successfully.");
        resetForm();
        setShowForm(false);
        await getAllHolidays();
      }
    } catch (error) {
      console.error("Failed to create holiday:", error);
      showToast.error(
        error.response?.data?.message || "Failed to add holiday."
      );
    } finally {
      setSubmitting(false);
    }
  }

  // DELETE HOLIDAY
  async function deleteHoliday(uuid, holidayName) {
    const result = await showAlert.confirm({
      title: "Delete holiday?",
      text: `Are you sure you want to delete "${holidayName}"? This action cannot be undone.`,
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
    });
    if (!result.isConfirmed) return;

    try {
      setDeletingUuid(uuid);
      const res = await axios.delete(`/api/company/holidays/${uuid}`, {
        withCredentials: true,
      });
      if (res.status === 200) {
        setHolidays((previous) =>
          previous.filter((holiday) => holiday.uuid !== uuid)
        );
        showToast.success("Holiday removed successfully.");
      }
    } catch (error) {
      console.error("Failed to delete holiday:", error);
      showToast.error(
        error.response?.data?.message || "Failed to remove holiday."
      );
    } finally {
      setDeletingUuid(null);
    }
  }

  // SEARCH
  const filteredHolidays = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return holidays;
    return holidays.filter(
      (holiday) =>
        holiday.name?.toLowerCase().includes(query) ||
        holiday.holidayDate?.includes(query) ||
        formatDate(holiday.holidayDate).toLowerCase().includes(query) ||
        (holiday.isPaid ? "paid holiday" : "unpaid holiday").includes(query)
      );
    });
  }, [holidays, search]);

  // SUMMARY
  const summary = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentYear = today.getFullYear();

    const yearHolidays = holidays.filter((holiday) => {
      const dateKey = getDateKey(holiday.holidayDate);
      return dateKey.startsWith(String(currentYear));
    });

    const upcoming = holidays.filter((holiday) =>
      isUpcomingHoliday(holiday.holidayDate)
    );

    const paid = holidays.filter((holiday) => holiday.isPaid).length;

    const unpaid = holidays.length - paid;

    const nextHoliday = upcoming
      .slice()
      .sort((a, b) =>
        getDateKey(a.holidayDate).localeCompare(getDateKey(b.holidayDate))
      )[0];

    return {
      total: holidays.length,
      thisYear: yearHolidays.length,
      upcoming: upcoming.length,
      paid,
      unpaid,
      nextHoliday,
    };
  }, [holidays]);

  // TABLE
  const columns = [
    {
      key: "holidayDate",
      header: "DATE",
      render: (row) => {
        const date = getDateDetails(row.holidayDate);

        return (
          <div className="flex min-w-[150px] items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl border border-cm-border bg-cm-bg">
              <span className="text-lg font-bold leading-5 text-cm-text">
                {date.day}
              </span>
              <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-cm-text-muted">
                {date.month}
              </span>
            </div>

            <div>
              <p className="font-medium text-cm-text">{date.weekday}</p>
              <p className="mt-1 text-xs text-cm-text-muted">
                {getDateKey(row.holidayDate).slice(0, 4)}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      key: "name",
      header: "HOLIDAY",
      render: (row) => (
        <div className="flex min-w-[160px] items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
            <CalendarDays size={18} />
          </div>

          <div className="min-w-0">
            <p className="font-semibold text-cm-text">{row.name}</p>
            <p className="mt-1 text-xs text-cm-text-muted">
              {formatDate(row.holidayDate)}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "isPaid",
      header: "PAYMENT TYPE",
      render: (row) => (
        <Badge tone={row.isPaid ? "success" : "warning"}>
          {row.isPaid ? "Paid Holiday" : "Unpaid Holiday"}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "STATUS",
      render: (row) => (
        <Badge tone={isUpcomingHoliday(row.holidayDate) ? "info" : "neutral"}>
          {isUpcomingHoliday(row.holidayDate) ? "Upcoming" : "Past"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "ACTIONS",
      render: (row) => {
        const isDeleting = deletingUuid === row.uuid;
        return (
          <Button
            size="sm"
            variant="danger"
            disabled={Boolean(deletingUuid)}
            onClick={() => deleteHoliday(row.uuid, row.name)}
          >
            {isDeleting ? (
              <span className="inline-flex items-center gap-2">
                <RefreshCw size={14} className="animate-spin" />
                Deleting
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <Trash2 size={14} />
                Delete
              </span>
            )}
          </Button>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-6 pb-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-cm-border bg-cm-card text-cm-text shadow-sm">
            <CalendarDays size={23} />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-cm-text">
                Company Holidays
              </h1>

              <Badge tone="neutral">HR Management</Badge>
            </div>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-cm-text-muted">
              Manage company-wide holidays, paid days off, and upcoming
              non-working dates.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            disabled={loading}
            onClick={getAllHolidays}
          >
            <span className="inline-flex items-center gap-2">
              <RefreshCw
                size={15}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </span>
          </Button>

          <Button
            onClick={() => {
              if (showForm) {
                closeForm();
              } else {
                setShowForm(true);
              }
            }}
          >
            <span className="inline-flex items-center gap-2">
              {showForm ? <X size={16} /> : <Plus size={16} />}
              {showForm ? "Close Form" : "Add Holiday"}
            </span>
          </Button>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Holidays"
          value={summary.total}
          description="All holidays in the company calendar"
          icon={CalendarDays}
          iconClass="bg-blue-500/10 text-blue-600"
        />

        <SummaryCard
          title="This Year"
          value={summary.thisYear}
          description={`Holidays scheduled for ${new Date().getFullYear()}`}
          icon={CalendarCheck}
          iconClass="bg-violet-500/10 text-violet-600"
        />

        <SummaryCard
          title="Upcoming Holidays"
          value={summary.upcoming}
          description="Today and future scheduled holidays"
          icon={CalendarClock}
          iconClass="bg-emerald-500/10 text-emerald-600"
        />

        <SummaryCard
          title="Paid Holidays"
          value={summary.paid}
          description={`${summary.unpaid} unpaid ${
            summary.unpaid === 1 ? "holiday" : "holidays"
          }`}
          icon={CircleDollarSign}
          iconClass="bg-amber-500/10 text-amber-600"
        />
      </div>

      {/* NEXT HOLIDAY */}
      {!loading && summary.nextHoliday && (
        <div className="flex flex-col justify-between gap-4 rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm sm:flex-row sm:items-center">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
              <CalendarClock size={23} />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-cm-text-muted">
                Next Scheduled Holiday
              </p>

              <h2 className="mt-1 text-lg font-bold text-cm-text">
                {summary.nextHoliday.name}
              </h2>

              <p className="mt-1 text-sm text-cm-text-muted">
                {formatDate(summary.nextHoliday.holidayDate)}
                {" · "}
                {getDateDetails(summary.nextHoliday.holidayDate).weekday}
              </p>
            </div>
          </div>

          <Badge tone={summary.nextHoliday.isPaid ? "success" : "warning"}>
            {summary.nextHoliday.isPaid ? "Paid Day Off" : "Unpaid Day Off"}
          </Badge>
        </div>
      )}

      {/* ADD HOLIDAY FORM */}
      {showForm && (
        <HolidayModal
          title="Add Company Holiday"
          subtitle="Add a date to the shared company holiday calendar."
          onClose={closeForm}
          dismissDisabled={submitting}
        >
          <form onSubmit={addHoliday} className="space-y-5 p-5 sm:p-7">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <Input
                label="Holiday Date"
                type="date"
                required
                value={form.date}
                onChange={(event) =>
                  handleChange("date", event.target.value)
                }
              />

              <Input
                label="Holiday Name"
                required
                placeholder="e.g. Diwali, Republic Day"
                value={form.name}
                onChange={(event) =>
                  handleChange("name", event.target.value)
                }
              />
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-cm-border bg-cm-bg p-4">
              <input
                type="checkbox"
                checked={form.paid}
                onChange={(event) =>
                  handleChange("paid", event.target.checked)
                }
                className="mt-1 h-4 w-4 accent-[#000052]"
              />

              <span className="min-w-0">
                <span className="block text-sm font-semibold text-cm-text">
                  Paid Holiday
                </span>
                <span className="mt-1 block text-xs leading-5 text-cm-text-muted">
                  Employees receive their regular holiday pay for this date.
                </span>
              </span>

              <span className="ml-auto shrink-0 text-emerald-600">
                <CheckCircle2 size={19} />
              </span>
            </label>

            <div className="flex flex-col-reverse gap-3 rounded-xl border-t border-cm-border bg-slate-50 p-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                onClick={closeForm}
              >
                Cancel
              </Button>

              <Button type="submit" disabled={submitting}>
                <span className="inline-flex items-center gap-2">
                  {submitting ? (
                    <RefreshCw size={15} className="animate-spin" />
                  ) : (
                    <Plus size={16} />
                  )}
                  {submitting ? "Adding Holiday..." : "Save Holiday"}
                </span>
              </Button>
            </div>
          </form>
        </HolidayModal>
      )}

      {/* HOLIDAY CALENDAR TABLE */}
      <section className="overflow-hidden rounded-cm-lg border border-cm-border bg-cm-card shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-cm-border p-5 sm:flex-row sm:items-center sm:px-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-cm-text">
                Holiday Calendar
              </h2>

              <Badge tone={holidays.length > 0 ? "success" : "neutral"}>
                {holidays.length}{" "}
                {holidays.length === 1 ? "Holiday" : "Holidays"}
              </Badge>
            </div>

            <p className="mt-1 text-sm text-cm-text-muted">
              Review, search, and manage scheduled company holidays.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="success">
              {summary.paid} Paid
            </Badge>

            <Badge tone="warning">
              {summary.unpaid} Unpaid
            </Badge>
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="flex flex-col gap-3 border-b border-cm-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="relative w-full sm:max-w-md">
            <Search
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-cm-text-muted"
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by holiday, date, or payment type..."
              aria-label="Search company holidays"
              className="h-10 w-full rounded-lg border border-cm-border bg-cm-bg pl-10 pr-10 text-sm text-cm-text outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear holiday search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-cm-text-muted transition hover:text-cm-text"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <p className="text-xs text-cm-text-muted">
            Showing{" "}
            <span className="font-semibold text-cm-text">
              {filteredHolidays.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-cm-text">
              {holidays.length}
            </span>{" "}
            holidays
          </p>
        </div>

        <div className="p-4 sm:p-6">
          {loading ? (
            <div className="flex min-h-[240px] flex-col items-center justify-center gap-3">
              <Loader />
              <p className="text-sm text-cm-text-muted">
                Loading company holidays...
              </p>
            </div>
          ) : filteredHolidays.length === 0 ? (
            <div className="flex min-h-[240px] flex-col items-center justify-center px-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cm-bg text-cm-text-muted">
                {search ? (
                  <Search size={25} />
                ) : (
                  <CalendarX2 size={25} />
                )}
              </div>

              <h3 className="mt-4 font-semibold text-cm-text">
                {search ? "No matching holidays" : "No holidays added yet"}
              </h3>

              <p className="mt-1 max-w-sm text-sm leading-6 text-cm-text-muted">
                {search
                  ? "Try another holiday name, date, or payment type."
                  : "Your company holiday calendar is empty. Add a holiday to get started."}
              </p>

              {search ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearch("")}
                >
                  Clear Search
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setShowForm(true)}
                >
                  <span className="inline-flex items-center gap-2">
                    <Plus size={15} />
                    Add First Holiday
                  </span>
                </Button>
              )}
            </div>
          ) : (
            <DataTable
              columns={columns}
              rows={filteredHolidays}
              emptyMessage="No holidays found."
            />
          )}
        </div>

        {/* FOOTER */}
        {!loading && holidays.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-cm-border bg-cm-bg/50 px-5 py-3 text-xs text-cm-text-muted sm:flex-row sm:items-center sm:justify-between">
            <span>
              {filteredHolidays.length} matching{" "}
              {filteredHolidays.length === 1 ? "record" : "records"}
            </span>

            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 size={14} />
              Holiday data synced from the company API
            </span>
          </div>
        )}
      </section>
    </div>
  );
}

export default Holiday;
