import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { AlertTriangle, CheckCircle2, FolderKanban, PlayCircle } from "lucide-react";
import Button from "../../components/common/Button";
import Badge from "../../components/common/Badge";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import ErrorState from "../../components/common/ErrorState";
import StatCard from "../../components/cards/StatCard";
import DataTable from "../../components/tables/DataTable";
import TableSearch from "../../components/tables/TableSearch";
import { showToast } from "../../components/common/Toast";
import { getErrorMessage, getFieldErrors } from "../../services/payrollService";
import {
  createProject,
  deleteProject,
  getProjectOptions,
  getProjects,
  updateProject,
} from "../../services/projectService";

// ---------------------------------------------------------------------------
// Constants + helpers
// ---------------------------------------------------------------------------

// Must match the projects table CHECK constraints (database.sql)
const TIERS = ["Tier I", "Tier II", "Tier III"];
const STATUSES = ["Planning", "In Development", "Testing", "Completed", "On Hold", "Cancelled"];
const OPEN_STATUSES = ["Planning", "In Development", "Testing", "On Hold"];

// Badge only has: success / warning / danger / info / neutral
const STATUS_TONE = {
  Planning: "neutral",
  "In Development": "info",
  Testing: "warning",
  Completed: "success",
  "On Hold": "warning",
  Cancelled: "danger",
};

// Select's built-in placeholder ("") is disabled, so "no lead" needs its own value
const NO_LEAD = "none";

const EMPTY_FORM = {
  name: "",
  clientUuid: "",
  projectLeadUuid: NO_LEAD,
  tier: "Tier I",
  status: "Planning",
  startDate: "",
  deadline: "",
  internalDeadline: "",
  progress: 0,
  description: "",
};

// "2026-10-15" → "15 Oct 2026" (built from parts so timezone can't shift the day)
const formatDate = (yyyyMmDd) => {
  if (!yyyyMmDd) return "—";
  const [year, month, day] = String(yyyyMmDd).slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

// Short, readable ID from the UUID (the real ID stays the UUID)
const shortId = (uuid) => `PRJ-${uuid.slice(0, 6).toUpperCase()}`;

// Backend field errors → under the matching inputs
function applyServerErrors(error, setError) {
  const fieldErrors = getFieldErrors(error);
  if (!fieldErrors) return;
  Object.entries(fieldErrors).forEach(([field, message]) => {
    if (field) setError(field, { type: "server", message });
  });
}

function ProgressBar({ value }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-2 w-24 overflow-hidden rounded-full bg-cm-border"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`h-full rounded-full ${value === 100 ? "bg-green-600" : "bg-blue-600"}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs text-cm-text-muted">{value}%</span>
    </div>
  );
}

function DeadlineCell({ project }) {
  return (
    <div className="flex flex-col gap-1">
      <span>{formatDate(project.deadline)}</span>
      {project.isOverdue && <Badge tone="danger">Overdue by {Math.abs(project.daysLeft)}d</Badge>}
      {project.isDueSoon && <Badge tone="warning">{project.daysLeft === 0 ? "Due today" : `${project.daysLeft}d left`}</Badge>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Create / Edit form
// ---------------------------------------------------------------------------

/**
 * editing = null → create; editing = project → edit.
 * If the project's client / lead is no longer active, they're still shown
 * (marked) so editing other fields doesn't silently change them.
 */
function ProjectForm({ editing, options, onSaved, onCancel }) {
  const isEdit = Boolean(editing);
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: isEdit
      ? {
          name: editing.name,
          clientUuid: editing.client.uuid,
          projectLeadUuid: editing.projectLead?.uuid ?? NO_LEAD,
          tier: editing.tier,
          status: editing.status,
          startDate: editing.startDate ?? "",
          deadline: editing.deadline ?? "",
          internalDeadline: editing.internalDeadline ?? "",
          progress: editing.progress,
          description: editing.description ?? "",
        }
      : EMPTY_FORM,
  });

  const clientOptions = useMemo(() => {
    const list = options.clients.map((client) => ({ value: client.uuid, label: client.name }));
    if (isEdit && !list.some((option) => option.value === editing.client.uuid)) {
      list.push({ value: editing.client.uuid, label: `${editing.client.name} (inactive)` });
    }
    return list;
  }, [options.clients, isEdit, editing]);

  const leadOptions = useMemo(() => {
    const list = [
      { value: NO_LEAD, label: "Unassigned" },
      ...options.projectLeads.map((lead) => ({ value: lead.uuid, label: lead.fullName })),
    ];
    const current = editing?.projectLead;
    if (current && !list.some((option) => option.value === current.uuid)) {
      list.push({ value: current.uuid, label: `${current.fullName} (no longer a lead)` });
    }
    return list;
  }, [options.projectLeads, editing]);

  const noClients = clientOptions.length === 0;

  const onSubmit = async (values) => {
    const payload = {
      ...values,
      progress: Number(values.progress),
      projectLeadUuid: values.projectLeadUuid === NO_LEAD ? null : values.projectLeadUuid,
    };

    try {
      const res = isEdit ? await updateProject(editing.uuid, payload) : await createProject(payload);
      showToast.success(`${res.message}.`);
      onSaved();
    } catch (error) {
      applyServerErrors(error, setError);
      showToast.error(getErrorMessage(error, `Couldn't ${isEdit ? "update" : "create"} project.`));
    }
  };

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-4 rounded-cm-lg border border-cm-border bg-cm-card p-6 shadow-sm"
    >
      <h2 className="text-sm font-semibold text-cm-text">{isEdit ? `Edit Project — ${editing.name}` : "Create Project"}</h2>

      {noClients && (
        <div className="flex items-start gap-2 rounded-lg border border-cm-warning-600/30 bg-cm-warning-100 p-3 text-sm text-cm-warning-600">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          No active clients yet — add a client in Client Management first.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Input
          label="Project Name"
          required
          error={errors.name?.message}
          {...register("name", {
            required: "Project name is required",
            minLength: { value: 2, message: "Project name is too short" },
            maxLength: { value: 255, message: "Max 255 characters" },
          })}
        />
        <Select
          label="Client"
          required
          placeholder="Select client…"
          options={clientOptions}
          error={errors.clientUuid?.message}
          {...register("clientUuid", { required: "Select a client" })}
        />
        <Select
          label="Project Lead"
          options={leadOptions}
          error={errors.projectLeadUuid?.message}
          {...register("projectLeadUuid")}
        />
        <Select
          label="Project Tier"
          options={TIERS.map((tier) => ({ value: tier, label: tier }))}
          error={errors.tier?.message}
          {...register("tier")}
        />
        <Select
          label="Status"
          options={STATUSES.map((status) => ({ value: status, label: status }))}
          helperText="Completed sets progress to 100%."
          error={errors.status?.message}
          {...register("status", {
            onChange: (event) => {
              if (event.target.value === "Completed") setValue("progress", 100, { shouldValidate: true });
            },
          })}
        />
        <Input
          label="Progress (%)"
          type="number"
          min="0"
          max="100"
          step="1"
          error={errors.progress?.message}
          {...register("progress", {
            validate: (value) =>
              (Number.isInteger(Number(value)) && Number(value) >= 0 && Number(value) <= 100) ||
              "Enter a whole number from 0 to 100",
          })}
        />
        <Input label="Start Date" type="date" error={errors.startDate?.message} {...register("startDate")} />
        <Input
          label="Client Deadline"
          type="date"
          error={errors.deadline?.message}
          {...register("deadline", {
            validate: (value, all) =>
              !value || !all.startDate || value >= all.startDate || "Deadline can't be before the start date",
          })}
        />
        <Input
          label="Internal Deadline"
          type="date"
          helperText="Team target — on or before the client deadline."
          error={errors.internalDeadline?.message}
          {...register("internalDeadline", {
            validate: (value, all) => {
              if (!value) return true;
              if (all.startDate && value < all.startDate) return "Can't be before the start date";
              if (all.deadline && value > all.deadline) return "Should be on or before the client deadline";
              return true;
            },
          })}
        />
      </div>

      <Input
        label="Description (optional)"
        placeholder="Scope, goals, notes…"
        error={errors.description?.message}
        {...register("description", { maxLength: { value: 5000, message: "Max 5000 characters" } })}
      />

      <div className="flex justify-end gap-3 border-t border-cm-border pt-4">
        <Button type="button" variant="outline" disabled={isSubmitting} onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting} disabled={noClients}>
          {isEdit ? "Save Changes" : "Create Project"}
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Details panel (the 12 sections fill in as those modules get built)
// ---------------------------------------------------------------------------

const DETAIL_SECTIONS = [
  "Overview",
  "Client",
  "Team",
  "Technology",
  "Documents",
  "Deployment",
  "Phases",
  "Modules / Features",
  "Tasks",
  "Testing",
  "Bugs",
  "Delivery",
];

function ProjectDetails({ project, onClose }) {
  const filled = {
    Overview: project.description,
    Client: [project.client.name, project.client.contactPerson, project.client.email].filter(Boolean).join(" · "),
    Team: project.projectLead ? `Lead: ${project.projectLead.fullName}` : null,
  };

  return (
    <section className="rounded-cm-lg border border-cm-border bg-cm-card p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs text-cm-text-muted">{shortId(project.uuid)}</p>
          <h2 className="mt-1 text-lg font-semibold text-cm-text">{project.name}</h2>
          <p className="mt-1 text-sm text-cm-text-muted">
            {project.client.name} · {project.projectLead?.fullName || "Unassigned"} · {project.tier}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={STATUS_TONE[project.status]}>{project.status}</Badge>
          <Button size="sm" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["Timeline", `${formatDate(project.startDate)} → ${formatDate(project.deadline)}`],
          ["Internal Deadline", formatDate(project.internalDeadline)],
          ["Technology", "Not configured"],
          ["Progress", `${project.progress}%`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-cm-border p-4">
            <p className="text-xs text-cm-text-muted">{label}</p>
            <p className="mt-1 text-sm font-semibold text-cm-text">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        {DETAIL_SECTIONS.map((item) => (
          <div key={item} className="rounded-lg border border-cm-border p-4">
            <p className="text-sm font-medium text-cm-text">{item}</p>
            <p className="mt-1 text-xs text-cm-text-muted">{filled[item] || `Project ${item.toLowerCase()} will appear here.`}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function ProjectManagement() {
  const [projects, setProjects] = useState([]);
  const [options, setOptions] = useState({ clients: [], projectLeads: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selected, setSelected] = useState(null);
  // Form: null (closed) | { mode: "create" } | { mode: "edit", project }
  const [form, setForm] = useState(null);
  const [formKey, setFormKey] = useState(0);
  const [confirmDeleteUuid, setConfirmDeleteUuid] = useState(null);
  const [deletingUuid, setDeletingUuid] = useState(null);

  useEffect(() => {
    let ignore = false; // page closed before the answer arrived → drop it
    Promise.all([getProjects(), getProjectOptions()])
      .then(([projectList, optionData]) => {
        if (ignore) return;
        setProjects(projectList);
        setOptions(optionData);
        setLoadError(null);
      })
      .catch((error) => {
        if (!ignore) setLoadError(getErrorMessage(error, "Couldn't load projects."));
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
    setLoadError(null);
    setReloadKey((key) => key + 1);
  };

  const openForm = (next) => {
    setForm(next);
    setFormKey((key) => key + 1); // fresh form with the right defaults
    setConfirmDeleteUuid(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSaved = () => {
    setForm(null);
    setSelected(null);
    reload();
  };

  const handleDelete = async (project) => {
    if (confirmDeleteUuid !== project.uuid) {
      setConfirmDeleteUuid(project.uuid); // first click asks, second deletes
      return;
    }
    setDeletingUuid(project.uuid);
    try {
      await deleteProject(project.uuid);
      setProjects((prev) => prev.filter((item) => item.uuid !== project.uuid));
      if (selected?.uuid === project.uuid) setSelected(null);
      if (form?.project?.uuid === project.uuid) setForm(null);
      showToast.success(`Project "${project.name}" deleted.`);
    } catch (error) {
      showToast.error(getErrorMessage(error, "Couldn't delete project."));
    } finally {
      setDeletingUuid(null);
      setConfirmDeleteUuid(null);
    }
  };

  const summary = useMemo(
    () => ({
      total: projects.length,
      active: projects.filter((p) => OPEN_STATUSES.includes(p.status)).length,
      completed: projects.filter((p) => p.status === "Completed").length,
      overdue: projects.filter((p) => p.isOverdue).length,
    }),
    [projects],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return projects.filter((project) => {
      if (statusFilter !== "All" && project.status !== statusFilter) return false;
      if (!query) return true;
      return [project.name, project.client.name, project.projectLead?.fullName, project.status, project.tier]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query));
    });
  }, [projects, search, statusFilter]);

  const columns = [
    { key: "id", header: "Project ID", render: (row) => <span className="text-xs text-cm-text-muted">{shortId(row.uuid)}</span> },
    { key: "name", header: "Project", render: (row) => <span className="font-medium text-cm-text">{row.name}</span> },
    { key: "client", header: "Client", render: (row) => row.client.name },
    { key: "lead", header: "Project Lead", render: (row) => row.projectLead?.fullName ?? <span className="text-cm-text-muted">Unassigned</span> },
    { key: "tier", header: "Tier", render: (row) => row.tier },
    { key: "deadline", header: "Deadline", render: (row) => <DeadlineCell project={row} /> },
    { key: "status", header: "Status", render: (row) => <Badge tone={STATUS_TONE[row.status] ?? "neutral"}>{row.status}</Badge> },
    { key: "progress", header: "Progress", render: (row) => <ProgressBar value={row.progress} /> },
    {
      key: "actions",
      header: "",
      render: (row) => {
        const isConfirming = confirmDeleteUuid === row.uuid;
        return (
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setSelected(row)}>
              Details
            </Button>
            <Button size="sm" variant="outline" onClick={() => openForm({ mode: "edit", project: row })}>
              Edit
            </Button>
            {row.canDelete && (
              <>
                {isConfirming && deletingUuid !== row.uuid && (
                  <Button size="sm" variant="ghost" onClick={() => setConfirmDeleteUuid(null)}>
                    Keep
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="danger"
                  loading={deletingUuid === row.uuid}
                  disabled={deletingUuid !== null && deletingUuid !== row.uuid}
                  onClick={() => handleDelete(row)}
                >
                  {isConfirming ? "Confirm delete?" : "Delete"}
                </Button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-cm-text">Project Management</h1>
          <p className="mt-1 text-sm text-cm-text-muted">
            Manage projects, deadlines, planning, phases, tasks, testing and delivery status.
          </p>
        </div>
        <Button onClick={() => (form?.mode === "create" ? setForm(null) : openForm({ mode: "create" }))}>
          {form?.mode === "create" ? "Close" : "Create Project"}
        </Button>
      </div>

      {!loadError && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Projects" value={isLoading ? "…" : summary.total} icon={<FolderKanban className="h-5 w-5" />} />
          <StatCard label="Active" value={isLoading ? "…" : summary.active} icon={<PlayCircle className="h-5 w-5" />} accent="purple" />
          <StatCard label="Completed" value={isLoading ? "…" : summary.completed} icon={<CheckCircle2 className="h-5 w-5" />} accent="success" />
          <StatCard label="Overdue" value={isLoading ? "…" : summary.overdue} icon={<AlertTriangle className="h-5 w-5" />} accent="warning" />
        </div>
      )}

      {form && (
        <ProjectForm
          key={formKey}
          editing={form.mode === "edit" ? form.project : null}
          options={options}
          onSaved={handleSaved}
          onCancel={() => setForm(null)}
        />
      )}

      {selected && <ProjectDetails project={selected} onClose={() => setSelected(null)} />}

      {loadError ? (
        <div className="rounded-cm-lg border border-cm-border bg-cm-card">
          <ErrorState title="Couldn't load projects" description={loadError} onRetry={reload} />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <TableSearch value={search} onChange={setSearch} placeholder="Search project, client, lead or status…" />
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter by status">
              {["All", ...STATUSES].map((status) => (
                <button
                  key={status}
                  type="button"
                  role="tab"
                  aria-selected={statusFilter === status}
                  onClick={() => setStatusFilter(status)}
                  className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                    statusFilter === status
                      ? "border-[#000052] bg-[#000052] text-white"
                      : "border-cm-border bg-cm-card text-cm-text hover:border-[#000052]/30"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
          <DataTable
            columns={columns}
            rows={filtered.map((project) => ({ ...project, id: project.uuid }))}
            isLoading={isLoading}
            emptyMessage={search || statusFilter !== "All" ? "No projects match your filters." : "No projects yet — create the first one."}
          />
        </div>
      )}
    </div>
  );
}

export default ProjectManagement;