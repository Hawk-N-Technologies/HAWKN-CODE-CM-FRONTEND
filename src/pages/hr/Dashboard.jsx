
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Badge from "../../components/common/Badge";
import Loader from "../../components/common/Loader";
import { getHrDashboard } from "../../services/hrDashboardService";
import AttendanceButton from "../../components/common/AttendanceButton";

const formatDate = (value) => {
  if (!value) return "—";

  const [year, month, day] = String(value)
    .slice(0, 10)
    .split("-")
    .map(Number);

  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatMoney = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

const Panel = ({ title, link, linkLabel = "View all", children }) => (
  <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-sm font-semibold text-slate-900 sm:text-base">
        {title}
      </h2>

      {link && (
        <Link
          to={link}
          className="inline-flex min-h-9 items-center justify-center rounded-lg bg-[#0b1932] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:text-sm"
        >
          {linkLabel}
        </Link>
      )}
    </div>

    <div className="mt-4 min-w-0">{children}</div>
  </section>
);

const Empty = ({ children = "Nothing to show." }) => (
  <div className="flex min-h-20 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center">
    <p className="text-sm text-slate-500">{children}</p>
  </div>
);

const Row = ({ title, subtitle, trailing }) => (
  <div className="flex min-w-0 flex-col gap-2 border-b border-slate-100 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
    <div className="min-w-0 flex-1">
      <p className="break-words text-sm font-semibold text-slate-800">
        {title}
      </p>

      {subtitle && (
        <p className="mt-1 break-words text-xs leading-5 text-slate-500">
          {subtitle}
        </p>
      )}
    </div>

    {trailing && (
      <div className="shrink-0 self-start text-left text-xs text-slate-500 sm:self-center sm:text-right">
        {trailing}
      </div>
    )}
  </div>
);

const MetricCard = ({ label, value, detail, link, accent = "blue" }) => {
  const accentStyles = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    violet: "bg-violet-50 text-violet-700",
  };

  const content = (
    <div className="group flex h-full min-w-0 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium leading-5 text-slate-500">
          {label}
        </p>

        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${accentStyles[accent] || accentStyles.blue}`}
          aria-hidden="true"
        >
          {label === "Active Employees"
            ? "EMP"
            : label === "Present Today"
              ? "IN"
              : label === "On Leave Today"
                ? "LV"
                : "REQ"}
        </span>
      </div>

      <div className="mt-3">
        <p className="text-3xl font-bold tracking-tight text-slate-900">
          {value ?? 0}
        </p>

        {detail && (
          <p className="mt-2 break-words text-xs leading-5 text-slate-500">
            {detail}
          </p>
        )}
      </div>

      {link && (
        <p className="mt-3 text-xs font-semibold text-blue-700 group-hover:text-blue-900">
          View requests →
        </p>
      )}
    </div>
  );

  return link ? (
    <Link to={link} className="block h-full rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
      {content}
    </Link>
  ) : (
    content
  );
};

const SummaryTile = ({ label, value, tone = "default" }) => {
  const valueStyles = {
    default: "text-slate-900",
    warning: "text-amber-600",
    success: "text-emerald-700",
  };

  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
      <p className="break-words text-xs leading-5 text-slate-500">{label}</p>
      <p
        className={`mt-1 break-words text-xl font-bold ${valueStyles[tone] || valueStyles.default}`}
      >
        {value}
      </p>
    </div>
  );
};

function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    getHrDashboard()
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setError("");
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(
            requestError.response?.data?.message ||
              "Unable to load the HR dashboard.",
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="mx-auto w-full max-w-screen-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#0b1932] text-sm font-bold text-white">
            HR
          </div>

          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
              HR Management
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              HR Dashboard
            </h1>
            <p className="mt-3 text-sm text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return <Loader context="page" label="Loading HR dashboard..." />;
  }

  const {
    cards,
    attendance,
    pendingLeaves,
    internshipProbationAlerts,
    payroll,
    upcomingHolidays,
    onboarding,
  } = data;

  const kpis = [
    {
      label: "Active Employees",
      value: cards.activeEmployees,
      detail: `Full time: ${cards.fullTime} · Interns: ${cards.interns} · Probation: ${cards.probation}`,
      accent: "blue",
    },
    {
      label: "Present Today",
      value: cards.presentToday,
      detail: "Employees marked present",
      accent: "green",
    },
    {
      label: "On Leave Today",
      value: cards.onLeaveToday,
      detail: "Approved leave for today",
      accent: "violet",
    },
    {
      label: "Pending Leave Requests",
      value: cards.pendingLeaveRequests,
      detail: "Requests awaiting HR review",
      link: "/hr/leave-lop",
      accent: "amber",
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-screen-2xl min-w-0 flex-col gap-5 sm:gap-6">
      {/* Dashboard header */}
      <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-white to-slate-100 p-5 shadow-sm sm:p-7 lg:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full border border-blue-100 sm:h-80 sm:w-80"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-8 -top-16 h-48 w-48 rounded-full border border-blue-100 sm:h-64 sm:w-64"
        />

        <div className="relative flex min-w-0 flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#0b1932] text-sm font-bold tracking-wide text-white shadow-sm sm:h-14 sm:w-14">
              HR
            </div>

            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
                People Operations
              </p>

              <div className="mt-1 flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  HR Dashboard
                </h1>

                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Overview
                </span>
              </div>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                People overview and HR actions for {formatDate(data.date)}.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Live dashboard data
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5">
                  HR workspace
                </span>
              </div>
            </div>
          </div>

          <div className="relative flex shrink-0 flex-col items-stretch gap-3 sm:flex-row sm:items-center lg:flex-col lg:items-end">
            <AttendanceButton />
          </div>
        </div>
      </section>

      {/* KPI cards */}
      <section aria-label="HR key metrics">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
              People overview
            </h2>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              Key workforce and attendance metrics
            </p>
          </div>

          <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500">
            Current totals
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 sm:gap-4">
          {kpis.map((kpi) => (
            <MetricCard key={kpi.label} {...kpi} />
          ))}
        </div>
      </section>

      {/* Attendance and leave */}
      <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2 xl:gap-5">
        <Panel title="Today's Attendance" link="/hr/attendance">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryTile
              label="Present"
              value={attendance.present}
              tone="success"
            />
            <SummaryTile
              label="Half Day"
              value={attendance.halfDay}
              tone="warning"
            />
            <SummaryTile
              label="On Leave"
              value={attendance.onLeave}
            />
            <SummaryTile
              label="Not Marked Yet"
              value={attendance.notMarked}
              tone="warning"
            />
          </div>

          <p className="mt-4 text-xs leading-5 text-slate-500">
            Based on attendance sessions and approved leave records.
          </p>
        </Panel>

        <Panel title="Pending Leave Requests" link="/hr/leave-lop">
          {pendingLeaves.length ? (
            <div className="divide-y divide-slate-100">
              {pendingLeaves.map((leave) => (
                <Row
                  key={leave.uuid}
                  title={leave.employeeName}
                  subtitle={`${leave.leaveType} · ${leave.leaveSession.replaceAll("_", " ")}`}
                  trailing={formatDate(leave.leaveDate)}
                />
              ))}
            </div>
          ) : (
            <Empty>No pending leave requests.</Empty>
          )}
        </Panel>

        {/* Internship and probation */}
        <Panel
          title="Internship / Probation Alerts"
          link="/hr/internship-probation"
        >
          {internshipProbationAlerts.length ? (
            <div className="divide-y divide-slate-100">
              {internshipProbationAlerts.map((period) => (
                <Row
                  key={period.uuid}
                  title={period.employeeName}
                  subtitle={`${period.periodType} · Ends ${formatDate(period.endDate)}`}
                  trailing={
                    period.isOverdue ? (
                      <Badge tone="danger">
                        {Math.abs(period.daysLeft)} days overdue
                      </Badge>
                    ) : (
                      <Badge tone="warning">
                        {period.daysLeft === 0
                          ? "Ends today"
                          : `${period.daysLeft} days left`}
                      </Badge>
                    )
                  }
                />
              ))}
            </div>
          ) : (
            <Empty>
              No overdue or upcoming endings within 14 days.
            </Empty>
          )}

          <p className="mt-3 text-xs leading-5 text-slate-500">
            Overdue periods need a decision to confirm or extend.
          </p>
        </Panel>

        {/* Payroll */}
        <Panel title="This Month's Payroll" link="/hr/payroll">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <SummaryTile
              label="Processed"
              value={payroll.processed}
              tone="success"
            />
            <SummaryTile
              label="Pending"
              value={payroll.pending}
              tone="warning"
            />
          </div>

          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-medium text-slate-500">
              Total net payroll
            </p>

            <p className="mt-1 break-words text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {formatMoney(payroll.totalNet)}
            </p>

            <p className="mt-2 text-xs text-slate-500">
              {new Date(
                Number(payroll.month.slice(0, 4)),
                Number(payroll.month.slice(5, 7)) - 1,
                1,
              ).toLocaleDateString("en-IN", {
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </Panel>

        {/* Holidays */}
        <Panel title="Upcoming Holidays" link="/hr/holiday">
          {upcomingHolidays.length ? (
            <div className="divide-y divide-slate-100">
              {upcomingHolidays.map((holiday) => (
                <Row
                  key={holiday.uuid}
                  title={holiday.name}
                  subtitle={holiday.isPaid ? "Paid holiday" : "Unpaid holiday"}
                  trailing={formatDate(holiday.date)}
                />
              ))}
            </div>
          ) : (
            <Empty>No upcoming holidays have been added.</Empty>
          )}
        </Panel>

        {/* Onboarding */}
        <Panel title="New Joiners & Onboarding" link="/hr/onboarding">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <SummaryTile
              label="Joined This Month"
              value={onboarding.joinedThisMonth}
              tone="success"
            />
            <SummaryTile
              label="Onboarding in Progress"
              value={onboarding.inProgress}
            />
          </div>

          {onboarding.newJoiners.length ? (
            <div className="mt-3 divide-y divide-slate-100">
              {onboarding.newJoiners.map((employee) => (
                <Row
                  key={employee.uuid}
                  title={employee.fullName}
                  subtitle={employee.employmentType}
                  trailing={formatDate(employee.joiningDate)}
                />
              ))}
            </div>
          ) : (
            <div className="mt-3">
              <Empty>No new joiners recorded this month.</Empty>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

export default Dashboard;
