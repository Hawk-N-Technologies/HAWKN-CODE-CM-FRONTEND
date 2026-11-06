import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AttendanceButton from "../../components/common/AttendanceButton";
import Badge from "../../components/common/Badge";
import { getTesterOverview } from "../../services/testerDashboardService";

function PageHeader({ data }) {
  return (
    <section className="relative isolate overflow-hidden rounded-[28px] border border-slate-800 bg-gradient-to-br from-[#080d25] via-[#0b1734] to-[#1b2052] px-6 py-7 shadow-[0_18px_45px_rgba(15,23,42,0.16)] sm:px-8 sm:py-8">
      <div className="pointer-events-none absolute -right-16 -top-24 -z-10 h-72 w-72 rounded-full border border-blue-300/10" />
      <div className="pointer-events-none absolute -right-5 -top-12 -z-10 h-52 w-52 rounded-full border border-blue-300/10" />
      <div className="pointer-events-none absolute -bottom-28 right-1/4 -z-10 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative flex flex-col justify-between gap-6 xl:flex-row xl:items-center">
        <div className="min-w-0 max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-200">
              Tester Workspace
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-[34px]">
            Tester Dashboard
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300 sm:text-[15px]">
            Monitor your assigned projects, review your testing workload, and
            track current testing activity from one place.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-xs font-medium text-slate-200">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
              Tester Overview
            </span>

            {data && (
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-xs font-medium text-slate-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Live Data
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-3 sm:flex-row xl:flex-col xl:items-end">
          <AttendanceButton />
        </div>
      </div>
    </section>
  );
}

function MetricCard({
  label,
  value,
  detail,
  link,
  icon,
  iconClass,
  accentClass,
  unavailable = false,
}) {
  const content = (
    <article
      className={`group relative h-full overflow-hidden rounded-[20px] border border-cm-border bg-cm-card p-5 shadow-sm transition-all duration-200 ${
        link
          ? "hover:-translate-y-1 hover:border-blue-300 hover:shadow-[0_14px_35px_rgba(15,23,42,0.09)]"
          : ""
      }`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-1 ${accentClass || "bg-blue-500"}`}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-cm-text-muted">{label}</p>

          <p
            className={`mt-3 break-words text-3xl font-bold tracking-tight tabular-nums ${
              unavailable ? "text-cm-text-muted" : "text-cm-text"
            }`}
          >
            {value}
          </p>

          <p className="mt-2 text-[11px] leading-5 text-cm-text-muted">
            {detail}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>
      </div>

      {link && (
        <div className="mt-5 flex items-center justify-between border-t border-cm-border pt-3">
          <span className="text-[11px] font-semibold text-blue-600">
            View details
          </span>

          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-4 w-4 text-blue-600 transition-transform group-hover:translate-x-1"
            aria-hidden="true"
          >
            <path
              d="M5 12h14m-6-6 6 6-6 6"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}

      {unavailable && (
        <div className="mt-4 border-t border-dashed border-cm-border pt-3">
          <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700">
            Integration pending
          </span>
        </div>
      )}
    </article>
  );

  return link ? (
    <Link
      to={link}
      className="block h-full rounded-[20px] outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
      aria-label={`${label}: ${value}. View details`}
    >
      {content}
    </Link>
  ) : (
    content
  );
}

function SummaryItem({ label, value, tone = "neutral" }) {
  return (
    <div className="rounded-xl border border-cm-border bg-cm-bg/60 p-4 transition-colors hover:bg-cm-bg">
      <p className="text-xs font-medium text-cm-text-muted">{label}</p>

      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="text-2xl font-bold tabular-nums text-cm-text">
          {value}
        </p>

        <Badge tone={tone}>{label}</Badge>
      </div>
    </div>
  );
}

function SectionHeading({ title, description, badge }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-lg font-bold tracking-tight text-cm-text">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-xs leading-5 text-cm-text-muted">
            {description}
          </p>
        )}
      </div>

      {badge && <Badge tone="info">{badge}</Badge>}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-[22px] border border-cm-border bg-cm-card p-8 text-center shadow-sm">
      <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-blue-100 border-t-blue-600" />

      <p className="mt-4 text-sm font-semibold text-cm-text">
        Loading tester overview
      </p>

      <p className="mt-1 text-xs text-cm-text-muted">
        Retrieving your latest dashboard information...
      </p>
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div className="rounded-[22px] border border-rose-200 bg-rose-50/70 p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
            <path
              d="M12 8v5m0 3h.01M10.3 3.8 2.9 17a2 2 0 0 0 1.7 3h14.8a2 2 0 0 0 1.7-3l-7.4-13.2a2 2 0 0 0-3.4 0Z"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div>
          <p className="text-sm font-semibold text-rose-800">
            Unable to load tester dashboard
          </p>
          <p className="mt-1 text-sm leading-6 text-rose-700">{message}</p>
        </div>
      </div>
    </div>
  );
}

function DashboardMetrics({ data }) {
  const metrics = [
    {
      label: "Assigned Projects",
      value: data.assignedProjects,
      detail: "Projects currently assigned to you",
      link: "/tester/projects",
      accentClass: "bg-blue-500",
      iconClass: "bg-blue-50 text-blue-600",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
          <rect
            x="3.5"
            y="4"
            width="17"
            height="16"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.7"
          />
          <path
            d="M8 8h8M8 12h8M8 16h4"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    {
      label: "Testing Queue",
      value: data.testingQueue,
      detail: "Pending or in-progress test records",
      link: "/tester/testing-queue",
      accentClass: "bg-sky-500",
      iconClass: "bg-sky-50 text-sky-600",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
          <circle
            cx="12"
            cy="12"
            r="9"
            stroke="currentColor"
            strokeWidth="1.7"
          />
          <path
            d="M12 7v5l3 2"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    {
      label: "Open Bugs",
      value: "Not connected",
      detail: "Bug tracking will be integrated separately",
      link: "/tester/bugs",
      unavailable: true,
      accentClass: "bg-amber-500",
      iconClass: "bg-amber-50 text-amber-600",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
          <path
            d="M8 9h8v8a4 4 0 0 1-8 0V9Z"
            stroke="currentColor"
            strokeWidth="1.7"
          />
          <path
            d="M12 5a3 3 0 0 0-3 3v1h6V8a3 3 0 0 0-3-3ZM5 12h3m8 0h3M5 17h3m8 0h3"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    {
      label: "Retesting",
      value: "Not connected",
      detail: "Retesting workflow will be integrated separately",
      link: "/tester/retesting",
      unavailable: true,
      accentClass: "bg-violet-500",
      iconClass: "bg-violet-50 text-violet-600",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
          <path
            d="M20 11a8 8 0 0 0-14.9-3M4 4v4h4M4 13a8 8 0 0 0 14.9 3M20 20v-4h-4"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
  ];

  return (
    <section className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 2xl:grid-cols-4">
      {metrics.map((metric) => (
        <MetricCard key={metric.label} {...metric} />
      ))}
    </section>
  );
}

function TestingSummary({ summary }) {
  const summaryItems = [
    {
      label: "Pending",
      value: summary.pending,
      tone: "warning",
    },
    {
      label: "In Progress",
      value: summary.inProgress,
      tone: "info",
    },
    {
      label: "Passed",
      value: summary.passed,
      tone: "success",
    },
    {
      label: "Failed",
      value: summary.failed,
      tone: "danger",
    },
  ];

  return (
    <section className="rounded-[22px] border border-cm-border bg-cm-card p-5 shadow-sm sm:p-6">
      <SectionHeading
        title="Testing Summary"
        description="Current breakdown of your testing records."
        badge="Live data"
      />

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {summaryItems.map((item) => (
          <SummaryItem
            key={item.label}
            label={item.label}
            value={item.value}
            tone={item.tone}
          />
        ))}
      </div>
    </section>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    getTesterOverview()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(
            requestError.response?.data?.message ||
              "Unable to load the tester dashboard.",
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader data={data} />

      {error ? (
        <ErrorState message={error} />
      ) : !data ? (
        <LoadingState />
      ) : (
        <>
          <section className="space-y-4">
            <SectionHeading
              title="Workload Overview"
              description="Quick access to your assigned testing activities and workflows."
            />

            <DashboardMetrics data={data} />
          </section>

          <TestingSummary summary={data.testingSummary} />
        </>
      )}
    </div>
  );
}
