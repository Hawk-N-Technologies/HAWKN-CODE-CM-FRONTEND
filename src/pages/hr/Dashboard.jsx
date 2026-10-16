import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Badge from "../../components/common/Badge";
import Loader from "../../components/common/Loader";
import { getHrDashboard } from "../../services/hrDashboardService";
import AttendanceButton from "../../components/common/AttendanceButton";

const formatDate = (value) => {
  if (!value) return "—";

  const [year, month, day] = String(value).slice(0, 10).split("-").map(Number);

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
  <section className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-sm font-semibold text-cm-text">{title}</h2>
      {link && (
        <Link
          to={link}
          className="text-sm font-medium text-cm-blue-600 hover:underline"
        >
          {linkLabel}
        </Link>
      )}
    </div>
    <div className="mt-4">{children}</div>
  </section>
);

const Empty = ({ children = "Nothing to show." }) => (
  <p className="py-4 text-sm text-cm-text-muted">{children}</p>
);

const Row = ({ title, subtitle, trailing }) => (
  <div className="flex items-start justify-between gap-3 border-b border-cm-border py-3 last:border-b-0">
    <div className="min-w-0">
      <p className="break-words text-sm font-medium text-cm-text">{title}</p>
      {subtitle && (
        <p className="mt-1 text-xs text-cm-text-muted">{subtitle}</p>
      )}
    </div>
    {trailing && (
      <div className="shrink-0 text-right text-xs text-cm-text-muted">
        {trailing}
      </div>
    )}
  </div>
);

function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    getHrDashboard()
      .then((result) => {
        if (!cancelled) setData(result);
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
      <div className="rounded-cm-lg border border-cm-border bg-cm-card p-6">
        <h1 className="text-xl font-bold text-cm-text">HR Dashboard</h1>
        <p className="mt-3 text-sm text-cm-danger-600">{error}</p>
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
    },
    {
      label: "Present Today",
      value: cards.presentToday,
      detail: "Employees marked present",
    },
    {
      label: "On Leave Today",
      value: cards.onLeaveToday,
      detail: "Approved leave for today",
    },
    {
      label: "Pending Leave Requests",
      value: cards.pendingLeaveRequests,
      detail: "Requests awaiting HR review",
      link: "/hr/leave-lop",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-cm-text">HR Dashboard</h1>
          <p className="mt-1 text-sm text-cm-text-muted">
            People overview and HR actions for {formatDate(data.date)}.
          </p>
        </div>

        <div className="shrink-0">
          <AttendanceButton />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => {
          const card = (
            <div className="h-full rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm">
              <p className="text-xs text-cm-text-muted">{kpi.label}</p>
              <p className="mt-2 text-2xl font-bold text-cm-text">
                {kpi.value}
              </p>
              <p className="mt-2 text-xs text-cm-text-muted">{kpi.detail}</p>
            </div>
          );

          return kpi.link ? (
            <Link key={kpi.label} to={kpi.link} className="block">
              {card}
            </Link>
          ) : (
            <div key={kpi.label}>{card}</div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Panel title="Today's Attendance" link="/hr/attendance">
          <div className="flex flex-wrap gap-2">
            <Badge tone="success">Present {attendance.present}</Badge>
            <Badge tone="warning">Half Day {attendance.halfDay}</Badge>
            <Badge tone="info">On Leave {attendance.onLeave}</Badge>
            <Badge tone="neutral">Not Marked yet {attendance.notMarked}</Badge>
          </div>
          <p className="mt-4 text-xs text-cm-text-muted">
            Based on attendance sessions and approved leave records.
          </p>
        </Panel>

        <Panel title="Pending Leave Requests" link="/hr/leave-lop">
          {pendingLeaves.length ? (
            pendingLeaves.map((leave) => (
              <Row
                key={leave.uuid}
                title={leave.employeeName}
                subtitle={`${leave.leaveType} · ${leave.leaveSession.replaceAll("_", " ")}`}
                trailing={formatDate(leave.leaveDate)}
              />
            ))
          ) : (
            <Empty>No pending leave requests.</Empty>
          )}
        </Panel>

        <Panel
          title="Internship / Probation Alerts"
          link="/hr/internship-probation"
        >
          {internshipProbationAlerts.length ? (
            internshipProbationAlerts.map((period) => (
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
            ))
          ) : (
            <Empty>No overdue or upcoming endings within 14 days.</Empty>
          )}
          <p className="mt-3 text-xs text-cm-text-muted">
            Overdue periods need a decision to confirm or extend.
          </p>
        </Panel>

        <Panel title="This Month's Payroll" link="/hr/payroll">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-cm-md bg-cm-bg p-4">
              <p className="text-xs text-cm-text-muted">Processed</p>
              <p className="mt-1 text-xl font-bold text-cm-text">
                {payroll.processed}
              </p>
            </div>
            <div className="rounded-cm-md bg-cm-bg p-4">
              <p className="text-xs text-cm-text-muted">Pending</p>
              <p className="mt-1 text-xl font-bold text-cm-text">
                {payroll.pending}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs text-cm-text-muted">Total net payroll</p>
            <p className="mt-1 text-2xl font-bold text-cm-text">
              {formatMoney(payroll.totalNet)}
            </p>
            <p className="mt-1 text-xs text-cm-text-muted">
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

        <Panel title="Upcoming Holidays" link="/hr/holiday">
          {upcomingHolidays.length ? (
            upcomingHolidays.map((holiday) => (
              <Row
                key={holiday.uuid}
                title={holiday.name}
                subtitle={holiday.isPaid ? "Paid holiday" : "Unpaid holiday"}
                trailing={formatDate(holiday.date)}
              />
            ))
          ) : (
            <Empty>No upcoming holidays have been added.</Empty>
          )}
        </Panel>

        <Panel title="New Joiners & Onboarding" link="/hr/onboarding">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-cm-md bg-cm-bg p-4">
              <p className="text-xs text-cm-text-muted">Joined this month</p>
              <p className="mt-1 text-xl font-bold text-cm-text">
                {onboarding.joinedThisMonth}
              </p>
            </div>
            <div className="rounded-cm-md bg-cm-bg p-4">
              <p className="text-xs text-cm-text-muted">
                Onboarding in progress
              </p>
              <p className="mt-1 text-xl font-bold text-cm-text">
                {onboarding.inProgress}
              </p>
            </div>
          </div>

          {onboarding.newJoiners.length ? (
            <div className="mt-3">
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
            <Empty>No new joiners recorded this month.</Empty>
          )}
        </Panel>
      </div>
    </div>
  );
}

export default Dashboard;
