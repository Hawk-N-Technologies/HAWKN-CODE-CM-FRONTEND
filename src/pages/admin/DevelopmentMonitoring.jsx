import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  AlarmClock,
  Bug,
  Code2,
  FolderKanban,
  RefreshCw,
  UsersRound,
} from "lucide-react";

import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import ErrorState from "../../components/common/ErrorState";
import StatCard from "../../components/cards/StatCard";
import PageHeader from "../../components/layout/PageHeader";
import DataTable from "../../components/tables/DataTable";
import TableSearch from "../../components/tables/TableSearch";
import { getErrorMessage } from "../../services/developerProjectService";

/**
 * Admin → Development Monitoring (READ-ONLY).
 * Project progress, overdue tasks, open bugs and developer workload across
 * the company's open projects. Nothing on this page changes data.
 */

const API = "/api/admin/development-monitoring";

const STATUS_TONE = {
  Planning: "neutral",
  "In Development": "info",
  Testing: "warning",
  "On Hold": "warning",
};

const PRIORITY_TONE = { Low: "neutral", Medium: "info", High: "warning", Critical: "danger" };

// "2026-10-15" → "15 Oct 2026" (built from parts so timezone can't shift the day)
const formatDate = (yyyyMmDd) => {
  if (!yyyyMmDd) return "Not set";
  const [year, month, day] = String(yyyyMmDd).slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

function Progress({ value }) {
  return (
    <div className="flex min-w-[120px] items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${value === 100 ? "bg-emerald-500" : "bg-blue-600"}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="w-9 text-right text-xs font-semibold tabular-nums text-slate-700">{value}%</span>
    </div>
  );
}

function Section({ icon: Icon, title, description, children, right }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            <p className="mt-0.5 text-sm text-slate-500">{description}</p>
          </div>
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

const includesQuery = (query, ...values) =>
  !query || values.filter(Boolean).join(" ").toLowerCase().includes(query);

export default function DevelopmentMonitoring() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [projectSearch, setProjectSearch] = useState("");
  const [taskSearch, setTaskSearch] = useState("");
  const [devSearch, setDevSearch] = useState("");

  useEffect(() => {
    let ignore = false;

    axios
      .get(API, { withCredentials: true })
      .then((response) => {
        if (ignore) return;
        setData(response.data.data);
        setLoadError("");
      })
      .catch((error) => {
        if (!ignore) setLoadError(getErrorMessage(error, "Couldn't load development monitoring."));
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [reloadKey]);

  const reload = () => {
    setIsLoading(true);
    setReloadKey((key) => key + 1);
  };

  const projects = useMemo(() => {
    const query = projectSearch.trim().toLowerCase();
    return (data?.projects ?? [])
      .filter((row) => includesQuery(query, row.name, row.clientName, row.leadName, row.status))
      .map((row) => ({ ...row, id: row.uuid }));
  }, [data, projectSearch]);

  const overdueTasks = useMemo(() => {
    const query = taskSearch.trim().toLowerCase();
    return (data?.overdueTasks ?? [])
      .filter((row) => includesQuery(query, row.title, row.projectName, row.assignees))
      .map((row) => ({ ...row, id: row.uuid }));
  }, [data, taskSearch]);

  const workload = useMemo(() => {
    const query = devSearch.trim().toLowerCase();
    return (data?.workload ?? [])
      .filter((row) => includesQuery(query, row.name, row.email))
      .map((row) => ({ ...row, id: row.uuid }));
  }, [data, devSearch]);

  const summary = data?.summary;
  const live = (value) => (isLoading ? "…" : loadError ? "—" : String(value ?? 0));

  const projectColumns = [
    {
      key: "project",
      header: "Project",
      render: (row) => (
        <div className="min-w-[160px]">
          <div className="font-semibold text-slate-800">{row.name}</div>
          <div className="mt-0.5 text-xs text-slate-500">
            {row.clientName} · Lead: {row.leadName}
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <Badge tone={STATUS_TONE[row.status] ?? "neutral"}>{row.status}</Badge>,
    },
    { key: "progress", header: "Progress", render: (row) => <Progress value={row.progress} /> },
    {
      key: "tasks",
      header: "Tasks done",
      render: (row) => (
        <span className="tabular-nums">
          {row.tasks.done} / {row.tasks.total}
          {row.tasks.overdue > 0 && (
            <span className="ml-2 text-xs font-semibold text-rose-600">{row.tasks.overdue} overdue</span>
          )}
        </span>
      ),
    },
    {
      key: "bugs",
      header: "Open bugs",
      render: (row) => (
        <span className="tabular-nums">
          {row.openBugs}
          {row.criticalBugs > 0 && (
            <span className="ml-2 text-xs font-semibold text-rose-600">{row.criticalBugs} critical</span>
          )}
        </span>
      ),
    },
    {
      key: "deadline",
      header: "Deadline",
      render: (row) => (
        <div className="whitespace-nowrap">
          {formatDate(row.deadline)}
          {row.isOverdue && (
            <div className="text-xs font-semibold text-rose-600">Overdue by {Math.abs(row.daysLeft)}d</div>
          )}
        </div>
      ),
    },
  ];

  const taskColumns = [
    {
      key: "task",
      header: "Task",
      render: (row) => (
        <div className="min-w-[160px]">
          <div className="font-semibold text-slate-800">{row.title}</div>
          <div className="mt-0.5 text-xs text-slate-500">{row.projectName}</div>
        </div>
      ),
    },
    { key: "assignees", header: "Assigned to" },
    {
      key: "priority",
      header: "Priority",
      render: (row) => <Badge tone={PRIORITY_TONE[row.priority] ?? "neutral"}>{row.priority}</Badge>,
    },
    { key: "status", header: "Status" },
    { key: "dueDate", header: "Due", render: (row) => <span className="whitespace-nowrap">{formatDate(row.dueDate)}</span> },
    {
      key: "late",
      header: "Overdue",
      render: (row) => (
        <span className="font-semibold tabular-nums text-rose-600">
          {row.daysOverdue} {row.daysOverdue === 1 ? "day" : "days"}
        </span>
      ),
    },
  ];

  const workloadColumns = [
    {
      key: "developer",
      header: "Developer",
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-800">{row.name}</div>
          <div className="text-xs text-slate-500">{row.email}</div>
        </div>
      ),
    },
    { key: "openTasks", header: "Open tasks", render: (row) => <span className="tabular-nums">{row.openTasks}</span> },
    {
      key: "overdueTasks",
      header: "Overdue tasks",
      render: (row) => (
        <span className={`tabular-nums ${row.overdueTasks ? "font-semibold text-rose-600" : ""}`}>
          {row.overdueTasks}
        </span>
      ),
    },
    { key: "openBugs", header: "Open bugs", render: (row) => <span className="tabular-nums">{row.openBugs}</span> },
    {
      key: "load",
      header: "Workload",
      render: (row) => {
        const total = row.openTasks + row.openBugs;
        if (total === 0) return <Badge tone="neutral">Free</Badge>;
        if (total >= 10 || row.overdueTasks >= 3) return <Badge tone="danger">Overloaded</Badge>;
        if (total >= 5) return <Badge tone="warning">Busy</Badge>;
        return <Badge tone="success">Normal</Badge>;
      },
    },
  ];

  return (
    <div className="flex flex-col gap-6 pb-8">
      <PageHeader
        eyebrow="ADMINISTRATION"
        title="Development Monitoring"
        description="Progress, overdue work, open bugs and developer workload across all open projects. View only."
        icon={Code2}
        actions={
          <Button
            type="button"
            variant="outline"
            leftIcon={<RefreshCw size={16} />}
            onClick={reload}
            className="!min-h-[44px] !whitespace-nowrap"
          >
            Refresh
          </Button>
        }
      />

      {loadError ? (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <ErrorState title="Couldn't load development monitoring" description={loadError} onRetry={reload} />
        </div>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Open projects" value={live(summary?.activeProjects)} icon={<FolderKanban size={18} />} />
            <StatCard label="Overdue tasks" value={live(summary?.overdueTasks)} icon={<AlarmClock size={18} />} accent="warning" />
            <StatCard label="Open bugs" value={live(summary?.openBugs)} icon={<Bug size={18} />} accent="warning" />
            <StatCard label="Developers" value={live(summary?.developers)} icon={<UsersRound size={18} />} accent="purple" />
          </section>

          <Section
            icon={FolderKanban}
            title="Project progress"
            description={
              summary?.overdueProjects
                ? `${summary.overdueProjects} project${summary.overdueProjects === 1 ? " is" : "s are"} past the deadline.`
                : "Every open project, earliest deadline first."
            }
          >
            <div className="mb-4">
              <TableSearch value={projectSearch} onChange={setProjectSearch} placeholder="Search project, client or lead…" />
            </div>
            <DataTable
              columns={projectColumns}
              rows={projects}
              isLoading={isLoading}
              emptyMessage={projectSearch ? "No projects match your search." : "No open projects."}
            />
          </Section>

          <Section icon={AlarmClock} title="Overdue tasks" description="Past the due date and not done yet — oldest first.">
            <div className="mb-4">
              <TableSearch value={taskSearch} onChange={setTaskSearch} placeholder="Search task, project or developer…" />
            </div>
            <DataTable
              columns={taskColumns}
              rows={overdueTasks}
              isLoading={isLoading}
              emptyMessage={taskSearch ? "No overdue tasks match your search." : "Nothing is overdue."}
            />
          </Section>

          <Section
            icon={UsersRound}
            title="Developer workload"
            description="Open tasks and bugs on each developer's plate right now."
          >
            <div className="mb-4">
              <TableSearch value={devSearch} onChange={setDevSearch} placeholder="Search developer…" />
            </div>
            <DataTable
              columns={workloadColumns}
              rows={workload}
              isLoading={isLoading}
              emptyMessage={devSearch ? "No developers match your search." : "No active developers."}
            />
          </Section>
        </>
      )}
    </div>
  );
}
