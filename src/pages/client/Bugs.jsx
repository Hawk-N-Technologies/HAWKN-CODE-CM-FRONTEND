import { useState } from "react";
import Badge from "../../components/common/Badge";
import Select from "../../components/common/Select";

const INITIAL_BUGS = [
  {
    id: "BUG-001",
    title: "CSV export failure",
    project: "Acme Retail ERP",
    severity: "High",
    status: "Open",
    reportedDate: "2026-10-05",
  },
  {
    id: "BUG-002",
    title: "Mobile layout issue",
    project: "Acme Retail ERP",
    severity: "Medium",
    status: "In Progress",
    reportedDate: "2026-10-04",
  },
  {
    id: "BUG-003",
    title: "Incorrect report total",
    project: "Internal HRMS",
    severity: "Low",
    status: "Fixed",
    reportedDate: "2026-10-02",
  },
];

const STATUSES = ["Open", "In Progress", "Fixed", "Retest", "Closed"];

export default function Bugs() {
  const [bugs, setBugs] = useState(INITIAL_BUGS);

  const updateStatus = (id, status) => {
    setBugs((items) =>
      items.map((bug) => (bug.id === id ? { ...bug, status } : bug)),
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-cm-text">Project Bugs</h1>
        <p className="mt-1 text-sm text-cm-text-muted">
          Review bugs reported during project development and testing.
        </p>
      </div>

      <div className="space-y-3">
        {bugs.map((bug) => (
          <article
            key={bug.id}
            className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs text-cm-text-muted">{bug.id}</p>
                <h2 className="mt-1 font-semibold text-cm-text">{bug.title}</h2>
                <p className="mt-1 text-xs text-cm-text-muted">
                  {bug.project} · Reported {bug.reportedDate}
                </p>
              </div>

              <div className="flex gap-2">
                <Badge
                  tone={
                    bug.severity === "High"
                      ? "danger"
                      : bug.severity === "Medium"
                        ? "warning"
                        : "neutral"
                  }
                >
                  {bug.severity}
                </Badge>
                <Badge tone={bug.status === "Closed" ? "success" : "info"}>
                  {bug.status}
                </Badge>
              </div>
            </div>

            <div className="mt-4 max-w-sm">
              <Select
                label="Status"
                value={bug.status}
                options={STATUSES.map((value) => ({ value, label: value }))}
                onChange={(event) => updateStatus(bug.id, event.target.value)}
              />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
