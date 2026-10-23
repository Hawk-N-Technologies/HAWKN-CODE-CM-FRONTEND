import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  AlertTriangle,
  CheckCircle2,
  FolderKanban,
  PlayCircle,
  PencilLine,
  Plus,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
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
const STATUSES = [
  "Planning",
  "In Development",
  "Testing",
  "Completed",
  "On Hold",
  "Cancelled",
];
const OPEN_STATUSES = ["Planning", "In Development", "Testing", "On Hold"];
const PAGE_SIZES = [10, 25, 50, 100];
const SORT_OPTIONS = [
  { value: "createdAt:desc", label: "Newest first" },
  { value: "createdAt:asc", label: "Oldest first" },
  { value: "name:asc", label: "Project name A–Z" },
  { value: "name:desc", label: "Project name Z–A" },
  { value: "deadline:asc", label: "Deadline: earliest" },
  { value: "deadline:desc", label: "Deadline: latest" },
  { value: "status:asc", label: "Status A–Z" },
  { value: "progress:desc", label: "Progress: high to low" },
  { value: "progress:asc", label: "Progress: low to high" },
];

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
  const [year, month, day] = String(yyyyMmDd)
    .slice(0, 10)
    .split("-")
    .map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
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
      {project.isOverdue && (
        <Badge tone="danger">Overdue by {Math.abs(project.daysLeft)}d</Badge>
      )}
      {project.isDueSoon && (
        <Badge tone="warning">
          {project.daysLeft === 0 ? "Due today" : `${project.daysLeft}d left`}
        </Badge>
      )}
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
    const list = options.clients.map((client) => ({
      value: client.uuid,
      label: client.name,
    }));
    if (
      isEdit &&
      !list.some((option) => option.value === editing.client.uuid)
    ) {
      list.push({
        value: editing.client.uuid,
        label: `${editing.client.name} (inactive)`,
      });
    }
    return list;
  }, [options.clients, isEdit, editing]);

  const leadOptions = useMemo(() => {
    const list = [
      { value: NO_LEAD, label: "Unassigned" },
      ...options.projectLeads.map((lead) => ({
        value: lead.uuid,
        label: lead.fullName,
      })),
    ];
    const current = editing?.projectLead;
    if (current && !list.some((option) => option.value === current.uuid)) {
      list.push({
        value: current.uuid,
        label: `${current.fullName} (no longer a lead)`,
      });
    }
    return list;
  }, [options.projectLeads, editing]);

  const noClients = clientOptions.length === 0;

  const onSubmit = async (values) => {
    const payload = {
      ...values,
      progress: Number(values.progress),
      projectLeadUuid:
        values.projectLeadUuid === NO_LEAD ? null : values.projectLeadUuid,
    };
    try {
      const res = isEdit
        ? await updateProject(editing.uuid, payload)
        : await createProject(payload);
      showToast.success(
        `${res.message || (isEdit ? "Project updated successfully" : "Project created successfully")}.`,
      );
      onSaved();
    } catch (error) {
      applyServerErrors(error, setError);
      showToast.error(
        getErrorMessage(
          error,
          `Couldn't ${isEdit ? "update" : "create"} project.`,
        ),
      );
    }
  };

  return (
    <Modal
      open
      onClose={onCancel}
      title={isEdit ? "Edit project" : "Create a project"}
      description={
        isEdit
          ? "Update project details, ownership, timeline and delivery progress."
          : "Set up the project, assign its client and lead, and define delivery dates."
      }
      icon={isEdit ? PencilLine : Plus}
      size="xl"
      closeDisabled={isSubmitting}
    >
      <form
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        className="flex min-h-0 flex-col bg-slate-50/70"
      >
        <fieldset
          disabled={isSubmitting}
          className="flex flex-col gap-5 px-5 py-6 sm:px-8"
        >
          {noClients && (
            <div className="flex items-start gap-2 rounded-xl border border-cm-warning-600/30 bg-cm-warning-100 p-3 text-sm text-cm-warning-600">
              <AlertTriangle
                className="mt-0.5 h-4 w-4 shrink-0"
                aria-hidden="true"
              />
              <span>
                No active clients yet — add a client in Client Management first.
              </span>
            </div>
          )}

          <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-cm-navy-950">
                Project details
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Basic identity and project ownership.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                options={STATUSES.map((status) => ({
                  value: status,
                  label: status,
                }))}
                helperText="Completed sets progress to 100%."
                error={errors.status?.message}
                {...register("status", {
                  onChange: (event) => {
                    if (event.target.value === "Completed")
                      setValue("progress", 100, { shouldValidate: true });
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
                    (Number.isInteger(Number(value)) &&
                      Number(value) >= 0 &&
                      Number(value) <= 100) ||
                    "Enter a whole number from 0 to 100",
                })}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-cm-navy-950">Timeline</h3>
              <p className="mt-1 text-xs text-slate-500">
                Set the client deadline and your internal delivery target.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Input
                label="Start Date"
                type="date"
                error={errors.startDate?.message}
                {...register("startDate")}
              />
              <Input
                label="Client Deadline"
                type="date"
                error={errors.deadline?.message}
                {...register("deadline", {
                  validate: (value, all) =>
                    !value ||
                    !all.startDate ||
                    value >= all.startDate ||
                    "Deadline can't be before the start date",
                })}
              />
              <Input
                label="Internal Deadline"
                type="date"
                helperText="On or before the client deadline."
                error={errors.internalDeadline?.message}
                {...register("internalDeadline", {
                  validate: (value, all) => {
                    if (!value) return true;
                    if (all.startDate && value < all.startDate)
                      return "Can't be before the start date";
                    if (all.deadline && value > all.deadline)
                      return "Should be on or before the client deadline";
                    return true;
                  },
                })}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <h3 className="mb-4 text-sm font-bold text-cm-navy-950">
              Description
            </h3>
            <Input
              label="Project Description (optional)"
              placeholder="Scope, goals, notes…"
              error={errors.description?.message}
              {...register("description", {
                maxLength: { value: 5000, message: "Max 5000 characters" },
              })}
            />
          </section>
        </fieldset>
        <div className="flex shrink-0 justify-end gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:px-8">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting} disabled={noClients}>
            {isEdit ? "Save Changes" : "Create Project"}
          </Button>
        </div>
      </form>
    </Modal>
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

function ProjectDetails({ project, onClose, onEdit }) {
  const filled = {
    Overview: project.description,
    Client: [
      project.client.name,
      project.client.contactPerson,
      project.client.email,
    ]
      .filter(Boolean)
      .join(" · "),
    Team: project.projectLead ? `Lead: ${project.projectLead.fullName}` : null,
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Project details"
      description="Project overview, ownership and delivery timeline."
      icon={Eye}
      size="xl"
    >
      <div className="max-h-[min(62vh,620px)] overflow-y-auto overscroll-contain bg-slate-50/70">
        <div className="bg-cm-navy-950 px-6 py-6 text-white sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold tracking-wide text-white/55">
                {shortId(project.uuid)}
              </p>
              <h3 className="mt-1 text-2xl font-bold tracking-tight">
                {project.name}
              </h3>
              <p className="mt-2 text-sm text-white/65">
                {project.client.name} ·{" "}
                {project.projectLead?.fullName || "Unassigned"} · {project.tier}
              </p>
            </div>
            <Badge tone={STATUS_TONE[project.status] ?? "neutral"}>
              {project.status}
            </Badge>
          </div>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-white"
              style={{ width: `${project.progress}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-white/60">
            {project.progress}% complete
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4 sm:p-8">
          {[
            ["Start date", formatDate(project.startDate)],
            ["Client deadline", formatDate(project.deadline)],
            ["Internal deadline", formatDate(project.internalDeadline)],
            ["Technology", "Not configured"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                {label}
              </p>
              <p className="mt-2 text-sm font-semibold text-cm-navy-950">
                {value}
              </p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-3 px-5 pb-6 sm:grid-cols-2 sm:px-8">
          {DETAIL_SECTIONS.map((item) => (
            <div
              key={item}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <p className="text-sm font-bold text-cm-navy-950">{item}</p>
              <p className="mt-2 break-words text-sm leading-6 text-slate-500">
                {filled[item] ||
                  `Project ${item.toLowerCase()} will appear here.`}
              </p>
            </div>
          ))}
        </div>
        <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur sm:px-8">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={onEdit}>
            <PencilLine className="mr-2 h-4 w-4" />
            Edit project
          </Button>
        </div>
      </div>
    </Modal>
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
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sort, setSort] = useState("createdAt:desc");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [summaryData, setSummaryData] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(null);
  const [formKey, setFormKey] = useState(0);
  const [confirmDeleteUuid, setConfirmDeleteUuid] = useState(null);
  const [deletingUuid, setDeletingUuid] = useState(null);
  const [sortBy, sortOrder] = sort.split(":");

  // Debounce typing so each character does not trigger a separate API request.
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 350);
    return () => window.clearTimeout(timeoutId);
  }, [search]);

  useEffect(() => {
    let ignore = false;
    setIsLoading(true);
    setLoadError(null);

    Promise.all([
      getProjects({
        page,
        limit,
        search: debouncedSearch,
        status: statusFilter === "All" ? "" : statusFilter,
        sortBy,
        sortOrder,
      }),
      getProjectOptions(),
    ])
      .then(([projectResult, optionData]) => {
        if (ignore) return;
        // Supports the standard { data: [...], pagination, summary } response,
        // plus the older array response while the API is being migrated.
        const rows = Array.isArray(projectResult)
          ? projectResult
          : Array.isArray(projectResult?.projects)
            ? projectResult.projects
            : Array.isArray(projectResult?.data)
              ? projectResult.data
              : Array.isArray(projectResult?.data?.projects)
                ? projectResult.data.projects
                : [];
        const meta =
          projectResult?.pagination || projectResult?.data?.pagination;
        const summary = projectResult?.summary || projectResult?.data?.summary;
        setProjects(rows);
        setPagination(
          meta || {
            page,
            limit,
            total: rows.length,
            totalPages: rows.length ? 1 : 0,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        );
        if (meta?.page && Number(meta.page) !== page)
          setPage(Number(meta.page));
        setSummaryData(summary || null);
        setOptions(optionData || { clients: [], projectLeads: [] });
      })
      .catch((error) => {
        if (!ignore)
          setLoadError(getErrorMessage(error, "Couldn't load projects."));
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [
    reloadKey,
    page,
    limit,
    debouncedSearch,
    statusFilter,
    sortBy,
    sortOrder,
  ]);

  const reload = () => {
    setLoadError(null);
    setReloadKey((key) => key + 1);
  };

  const openForm = (next) => {
    setForm(next);
    setFormKey((key) => key + 1);
    setConfirmDeleteUuid(null);
  };

  const handleSaved = () => {
    setForm(null);
    setSelected(null);
    reload();
  };

  const handleDelete = async (project) => {
    if (confirmDeleteUuid !== project.uuid) {
      setConfirmDeleteUuid(project.uuid);
      return;
    }
    setDeletingUuid(project.uuid);
    try {
      await deleteProject(project.uuid);
      showToast.success(`Project "${project.name}" deleted.`);
      // Reload server-side totals and keep pagination valid after deletion.
      if (projects.length === 1 && page > 1) setPage((current) => current - 1);
      else reload();
      if (selected?.uuid === project.uuid) setSelected(null);
      if (form?.project?.uuid === project.uuid) setForm(null);
    } catch (error) {
      showToast.error(getErrorMessage(error, "Couldn't delete project."));
    } finally {
      setDeletingUuid(null);
      setConfirmDeleteUuid(null);
    }
  };

  const summary = useMemo(
    () => ({
      total: summaryData?.total ?? pagination.total,
      active:
        summaryData?.active ??
        projects.filter((p) => OPEN_STATUSES.includes(p.status)).length,
      completed:
        summaryData?.completed ??
        projects.filter((p) => p.status === "Completed").length,
      overdue:
        summaryData?.overdue ?? projects.filter((p) => p.isOverdue).length,
    }),
    [summaryData, pagination.total, projects],
  );

  const columns = [
    {
      key: "id",
      header: "Project ID",
      render: (row) => (
        <span className="text-xs text-cm-text-muted">{shortId(row.uuid)}</span>
      ),
    },
    {
      key: "name",
      header: "Project",
      render: (row) => (
        <span className="font-semibold text-cm-navy-950">{row.name}</span>
      ),
    },
    {
      key: "client",
      header: "Client",
      render: (row) => row.client?.name || "—",
    },
    {
      key: "lead",
      header: "Project Lead",
      render: (row) =>
        row.projectLead?.fullName ?? (
          <span className="text-cm-text-muted">Unassigned</span>
        ),
    },
    { key: "tier", header: "Tier", render: (row) => row.tier },
    {
      key: "deadline",
      header: "Deadline",
      render: (row) => <DeadlineCell project={row} />,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <Badge tone={STATUS_TONE[row.status] ?? "neutral"}>{row.status}</Badge>
      ),
    },
    {
      key: "progress",
      header: "Progress",
      render: (row) => <ProgressBar value={row.progress} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => {
        const isConfirming = confirmDeleteUuid === row.uuid;
        return (
          <div className="flex min-w-max items-center justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelected(row)}
              aria-label={`View ${row.name}`}
            >
              <Eye className="mr-1.5 h-3.5 w-3.5" />
              View
            </Button>
            <Button
              size="sm"
              onClick={() => openForm({ mode: "edit", project: row })}
              aria-label={`Edit ${row.name}`}
            >
              <PencilLine className="mr-1.5 h-3.5 w-3.5" />
              Edit
            </Button>
            {row.canDelete && (
              <>
                {isConfirming && deletingUuid !== row.uuid && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setConfirmDeleteUuid(null)}
                  >
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

  const firstRow = pagination.total === 0 ? 0 : (page - 1) * limit + 1;
  const lastRow = Math.min(page * limit, pagination.total);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 border-b border-cm-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cm-blue-700">
            Delivery workspace
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-cm-navy-950">
            Project Management
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-cm-text-muted">
            Manage projects, deadlines, planning, tasks, testing and delivery
            status.
          </p>
        </div>
        <Button
          onClick={() => openForm({ mode: "create" })}
          disabled={isLoading}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Project
        </Button>
      </header>

      {!loadError && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Projects"
            value={isLoading ? "…" : summary.total}
            icon={<FolderKanban className="h-5 w-5" />}
          />
          <StatCard
            label="Active"
            value={isLoading ? "…" : summary.active}
            icon={<PlayCircle className="h-5 w-5" />}
            accent="purple"
          />
          <StatCard
            label="Completed"
            value={isLoading ? "…" : summary.completed}
            icon={<CheckCircle2 className="h-5 w-5" />}
            accent="success"
          />
          <StatCard
            label="Overdue"
            value={isLoading ? "…" : summary.overdue}
            icon={<AlertTriangle className="h-5 w-5" />}
            accent="warning"
          />
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
      {selected && (
        <ProjectDetails
          project={selected}
          onClose={() => setSelected(null)}
          onEdit={() => {
            const project = selected;
            setSelected(null);
            openForm({ mode: "edit", project });
          }}
        />
      )}

      {loadError ? (
        <div className="rounded-cm-lg border border-cm-border bg-cm-card">
          <ErrorState
            title="Couldn't load projects"
            description={loadError}
            onRetry={reload}
          />
        </div>
      ) : (
        <section className="flex flex-col gap-4 rounded-2xl border border-cm-border bg-cm-card p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 border-b border-cm-border pb-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-cm-navy-950">
                Projects
              </h2>
              <p className="mt-1 text-sm text-cm-text-muted">
                {isLoading
                  ? "Updating project list…"
                  : `Showing ${firstRow}–${lastRow} of ${pagination.total} projects`}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:items-end">
              <div className="w-full xl:w-64">
                <TableSearch
                  value={search}
                  onChange={(value) => {
                    setSearch(value);
                    setPage(1);
                  }}
                  placeholder="Search projects, clients, leads…"
                />
              </div>
              <Select
                name="statusFilter"
                label="Status"
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value);
                  setPage(1);
                }}
                options={[
                  { value: "All", label: "All statuses" },
                  ...STATUSES.map((value) => ({ value, label: value })),
                ]}
                containerClassName="w-full"
              />
              <Select
                name="sort"
                label="Sort by"
                value={sort}
                onChange={(event) => {
                  setSort(event.target.value);
                  setPage(1);
                }}
                options={SORT_OPTIONS}
                containerClassName="w-full"
              />
              <Select
                name="limit"
                label="Rows per page"
                value={String(limit)}
                onChange={(event) => {
                  setLimit(Number(event.target.value));
                  setPage(1);
                }}
                options={PAGE_SIZES.map((value) => ({
                  value: String(value),
                  label: String(value),
                }))}
                containerClassName="w-full"
              />
            </div>
          </div>

          <div className="w-full min-w-0">
            {isLoading ? (
              <DataTable
                columns={columns}
                rows={[]}
                isLoading
                emptyMessage="Loading projects..."
              />
            ) : projects.length > 0 ? (
              <DataTable
                columns={columns}
                rows={projects.map((project) => ({
                  ...project,
                  id: project.uuid,
                }))}
                isLoading={false}
                emptyMessage="No projects found."
              />
            ) : (
              <div
                className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-cm-border bg-cm-card px-6 py-10 text-center"
                role="status"
                aria-live="polite"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cm-surface">
                  <FolderKanban
                    className="h-6 w-6 text-cm-text-muted"
                    aria-hidden="true"
                  />
                </div>

                <div className="space-y-1">
                  <h3 className="font-semibold text-cm-navy-950">
                    {search.trim() || statusFilter !== "All"
                      ? "No projects match your filters"
                      : "No projects yet"}
                  </h3>
                  <p className="max-w-md text-sm text-cm-text-muted">
                    {search.trim() || statusFilter !== "All"
                      ? "Try a different search term or change your filters."
                      : "Create a project to start managing delivery, deadlines, and progress."}
                  </p>
                </div>

                {(search.trim() || statusFilter !== "All") && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearch("");
                      setStatusFilter("All");
                      setPage(1);
                    }}
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 border-t border-cm-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-cm-text-muted">
              Page {pagination.totalPages ? page : 0} of{" "}
              {pagination.totalPages || 0}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={
                  isLoading ||
                  page <= 1 ||
                  (!pagination.hasPreviousPage && page <= 1)
                }
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from(
                  { length: Math.min(pagination.totalPages || 0, 5) },
                  (_, index) => {
                    const start = Math.max(
                      1,
                      Math.min(page - 2, (pagination.totalPages || 1) - 4),
                    );
                    const pageNumber = start + index;
                    return (
                      <button
                        key={pageNumber}
                        type="button"
                        onClick={() => setPage(pageNumber)}
                        aria-current={pageNumber === page ? "page" : undefined}
                        className={`h-9 min-w-9 rounded-lg border px-3 text-sm font-semibold transition ${pageNumber === page ? "border-cm-navy-950 bg-cm-navy-950 text-white" : "border-cm-border bg-white text-cm-text hover:bg-cm-surface"}`}
                      >
                        {pageNumber}
                      </button>
                    );
                  },
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={isLoading || page >= (pagination.totalPages || 1)}
                onClick={() =>
                  setPage((current) =>
                    Math.min(pagination.totalPages, current + 1),
                  )
                }
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default ProjectManagement;
