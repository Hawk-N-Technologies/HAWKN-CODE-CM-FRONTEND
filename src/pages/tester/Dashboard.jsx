import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AttendanceButton from "../../components/common/AttendanceButton";
import Badge from "../../components/common/Badge";
import { getTesterOverview } from "../../services/testerDashboardService";

function MetricCard({ label, value, detail, link }) {
  const content = (
    <div className="h-full rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm">
      <p className="text-sm text-cm-text-muted">{label}</p>
      <p className="mt-2 text-2xl font-bold text-cm-text">{value}</p>
      {detail && (
        <p className="mt-2 text-xs text-cm-text-muted">{detail}</p>
      )}
    </div>
  );

  return link ? (
    <Link to={link} className="block">
      {content}
    </Link>
  ) : (
    content
  );
}

function SummaryItem({ label, value, tone = "neutral" }) {
  return (
    <div className="rounded-lg border border-cm-border p-4">
      <p className="text-xs text-cm-text-muted">{label}</p>
      <div className="mt-2">
        <Badge tone={tone}>{value}</Badge>
      </div>
    </div>
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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-cm-text">Tester Dashboard</h1>
          <p className="mt-1 text-sm text-cm-text-muted">
            Your assigned projects and current testing workload.
          </p>
        </div>

        <AttendanceButton />
      </div>

      {error ? (
        <div className="rounded-cm-lg border border-rose-200 bg-cm-card p-5">
          <p className="text-sm text-rose-700">{error}</p>
        </div>
      ) : !data ? (
        <div className="rounded-cm-lg border border-cm-border bg-cm-card p-5 text-sm text-cm-text-muted">
          Loading tester overview...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Assigned Projects"
              value={data.assignedProjects}
              detail="Projects assigned to you"
              link="/tester/projects"
            />
            <MetricCard
              label="Testing Queue"
              value={data.testingQueue}
              detail="Pending or in-progress test records"
              link="/tester/testing-queue"
            />
            <MetricCard
              label="Open Bugs"
              value="Not connected"
              detail="Bug tracking will be integrated separately"
              link="/tester/bugs"
            />
            <MetricCard
              label="Retesting"
              value="Not connected"
              detail="Retesting workflow will be integrated separately"
              link="/tester/retesting"
            />
          </div>

          <section className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-cm-text">
                Testing Summary
              </h2>
              <Badge tone="info">Live data</Badge>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryItem
                label="Pending"
                value={data.testingSummary.pending}
                tone="warning"
              />
              <SummaryItem
                label="In Progress"
                value={data.testingSummary.inProgress}
                tone="info"
              />
              <SummaryItem
                label="Passed"
                value={data.testingSummary.passed}
                tone="success"
              />
              <SummaryItem
                label="Failed"
                value={data.testingSummary.failed}
                tone="danger"
              />
            </div>
          </section>
        </>
      )}
    </div>
  );
}