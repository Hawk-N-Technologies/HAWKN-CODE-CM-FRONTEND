import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FolderKanban,
  Layers3,
  Users,
  X,
} from "lucide-react";

import Badge from "../../components/common/Badge";
import DataTable from "../../components/tables/DataTable";
import TableSearch from "../../components/tables/TableSearch";

const PROJECTS = [
  {
    id: "PRJ-001",
    name: "Acme Retail ERP",
    client: "Acme Retail",
    deadline: "2026-10-15",
    team: 5,
    progress: 72,
    status: "In Progress",
  },
  {
    id: "PRJ-002",
    name: "Northstar Website",
    client: "Northstar Foods",
    deadline: "2026-11-02",
    team: 4,
    progress: 41,
    status: "Planning",
  },
  {
    id: "PRJ-003",
    name: "Internal HRMS",
    client: "Internal",
    deadline: "2026-09-25",
    team: 6,
    progress: 79,
    status: "In Progress",
  },
];

const getStatusTone = (status) => {
  switch (status) {
    case "In Progress":
      return "info";
    case "Planning":
      return "warning";
    default:
      return "neutral";
  }
};

const formatDate = (dateString) => {
  if (!dateString) return "Not specified";

  const date = new Date(`${dateString}T00:00:00`);

  if (Number.isNaN(date.getTime())) return dateString;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

function ProjectProgress({ progress }) {
  return (
    <div className="min-w-[110px]">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-700">
          {progress}%
        </span>
        <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
          Complete
        </span>
      </div>

      <div
        className="h-2 overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Project progress ${progress}%`}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function DetailMetric({ icon: Icon, label, value }) {
  return (
    <div className="flex min-h-[104px] flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <Icon size={16} />
        </div>
        <span className="text-xs font-medium text-slate-500">{label}</span>
      </div>

      <p className="mt-3 break-words text-base font-bold text-slate-800">
        {value}
      </p>
    </div>
  );
}

function ProjectDetailsModal({ project, onClose }) {
  useEffect(() => {
    if (!project) return undefined;

    const handleEscape = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [project, onClose]);

  if (!project) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-details-title"
        className="my-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        {/* Modal Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#080d25] via-[#0b1734] to-[#1b2052] px-6 py-5">
          <div className="pointer-events-none absolute -right-12 -top-20 h-48 w-48 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -right-5 -top-12 h-32 w-32 rounded-full border border-white/10" />

          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-2 flex items-center gap-2">
                <FolderKanban size={15} className="text-blue-200" />
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-200">
                  Project Details
                </p>
              </div>

              <h2
                id="project-details-title"
                className="break-words text-xl font-bold text-white sm:text-2xl"
              >
                {project.name}
              </h2>

              <p className="mt-1 text-sm text-slate-300">
                {project.id} <span className="mx-1 text-slate-500">•</span>{" "}
                {project.client}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close project details"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/70"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="max-h-[70vh] overflow-y-auto p-5 sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Project Overview
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Current project assignment and progress information.
              </p>
            </div>

            <Badge tone={getStatusTone(project.status)}>
              {project.status}
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DetailMetric
              icon={CalendarDays}
              label="Deadline"
              value={formatDate(project.deadline)}
            />

            <DetailMetric
              icon={Users}
              label="Assigned Team"
              value={`${project.team} Members`}
            />

            <DetailMetric
              icon={Layers3}
              label="Project ID"
              value={project.id}
            />

            <DetailMetric
              icon={Clock3}
              label="Project Status"
              value={project.status}
            />
          </div>

          {/* Progress Section */}
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Overall Progress
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Current project completion
                </p>
              </div>

              <span className="text-2xl font-bold tabular-nums text-blue-700">
                {project.progress}%
              </span>
            </div>

            <div
              className="h-2.5 overflow-hidden rounded-full bg-slate-200"
              role="progressbar"
              aria-valuenow={project.progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Project progress ${project.progress}%`}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-300"
                style={{ width: `${project.progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Close
          </button>
        </div>
      </section>
    </div>
  );
}

function AssignedProjects() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return PROJECTS;

    return PROJECTS.filter((project) =>
      [project.id, project.name, project.client, project.status].some(
        (value) => String(value).toLowerCase().includes(q),
      ),
    );
  }, [search]);

  const activeProjects = PROJECTS.filter(
    (project) => project.status === "In Progress",
  ).length;

  const totalTeamMembers = PROJECTS.reduce(
    (total, project) => total + project.team,
    0,
  );

  const columns = [
    {
      key: "id",
      header: "Project ID",
      render: (row) => (
        <span className="whitespace-nowrap text-xs font-semibold text-slate-500">
          {row.id}
        </span>
      ),
    },
    {
      key: "name",
      header: "Project",
      render: (row) => (
        <div className="min-w-[150px]">
          <p className="font-semibold text-slate-800">{row.name}</p>
          <p className="mt-1 text-xs text-slate-400">{row.id}</p>
        </div>
      ),
    },
    {
      key: "client",
      header: "Client",
      render: (row) => (
        <span className="text-sm font-medium text-slate-600">
          {row.client}
        </span>
      ),
    },
    {
      key: "deadline",
      header: "Deadline",
      render: (row) => (
        <span className="whitespace-nowrap text-sm text-slate-600">
          {formatDate(row.deadline)}
        </span>
      ),
    },
    {
      key: "team",
      header: "Team",
      render: (row) => (
        <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-600">
          <Users size={14} className="text-slate-400" />
          {row.team}
        </span>
      ),
    },
    {
      key: "progress",
      header: "Progress",
      render: (row) => <ProjectProgress progress={row.progress} />,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <Badge tone={getStatusTone(row.status)}>{row.status}</Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <button
          type="button"
          onClick={() => setSelected(row)}
          className="inline-flex min-h-[36px] items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Details
          <ArrowUpRight size={14} />
        </button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <section className="relative overflow-hidden rounded-[24px] bg-gradient-to-r from-[#080d25] via-[#0b1734] to-[#1b2052] px-6 py-7 shadow-lg sm:px-8">
        <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full border border-white/[0.08]" />
        <div className="pointer-events-none absolute -right-10 -top-20 h-52 w-52 rounded-full border border-white/[0.08]" />
        <div className="pointer-events-none absolute bottom-[-100px] right-[25%] h-48 w-48 rounded-full bg-blue-500/[0.08] blur-3xl" />

        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div className="min-w-0">
            <div className="mb-3 flex items-center gap-2">
              <FolderKanban size={16} className="text-blue-200" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-200">
                Project Management Workspace
              </p>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Assigned Projects
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
              Monitor your assigned projects, review progress, and keep track
              of project timelines and team allocation.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3 self-start rounded-xl border border-white/10 bg-white/[0.07] px-4 py-3 backdrop-blur-sm sm:self-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-400/15 text-blue-200">
              <FolderKanban size={20} />
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-blue-200">
                Total Projects
              </p>
              <p className="mt-0.5 text-2xl font-bold leading-7 tabular-nums text-white">
                {PROJECTS.length}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Project Summary */}
      <section className="flex flex-col gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers3 size={17} className="text-blue-600" />
            <h2 className="text-base font-bold text-slate-800">
              Project Overview
            </h2>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            A summary of your current project assignments.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <FolderKanban size={19} />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Portfolio
              </span>
            </div>

            <p className="mt-4 text-2xl font-bold tabular-nums text-slate-800">
              {PROJECTS.length}
            </p>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Assigned Projects
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={19} />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Execution
              </span>
            </div>

            <p className="mt-4 text-2xl font-bold tabular-nums text-slate-800">
              {activeProjects}
            </p>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Projects In Progress
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:col-span-2 xl:col-span-1">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Users size={19} />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Allocation
              </span>
            </div>

            <p className="mt-4 text-2xl font-bold tabular-nums text-slate-800">
              {totalTeamMembers}
            </p>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Total Team Allocations
            </p>
          </div>
        </div>
      </section>

      {/* Assigned Projects Table */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <FolderKanban size={17} className="text-blue-600" />
              <h2 className="text-base font-bold text-slate-800">
                Project Portfolio
              </h2>
            </div>

            <p className="mt-1 text-xs text-slate-500">
              View project assignments, deadlines, team size, and progress.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2 self-start rounded-lg bg-slate-100 px-3 py-2 sm:self-center">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            <span className="text-xs font-semibold tabular-nums text-slate-600">
              {filtered.length} of {PROJECTS.length} Projects
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-4 p-5 sm:p-6">
          <div className="w-full sm:max-w-sm">
            <TableSearch
              value={search}
              onChange={setSearch}
              placeholder="Search project, client or status..."
            />
          </div>

          <div className="min-w-0">
            <DataTable
              columns={columns}
              rows={filtered}
              emptyMessage="No assigned projects found."
            />
          </div>
        </div>
      </section>

      {/* Project Details Modal */}
      <ProjectDetailsModal
        project={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}

export default AssignedProjects;