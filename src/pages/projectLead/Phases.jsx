import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  FolderKanban,
  Layers3,
  CalendarDays,
  ListOrdered,
  CheckCircle2,
  Clock3,
  Activity,
  Plus,
  Pencil,
  Trash2,
  X,
  AlertCircle,
  Flag,
  FileText,
  Target,
} from "lucide-react";

import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import { showToast } from "../../components/common/Toast";

const STATUS_OPTIONS = [
  { value: "Not Started", label: "Not Started" },
  { value: "In Progress", label: "In Progress" },
  { value: "Completed", label: "Completed" },
  { value: "On Hold", label: "On Hold" },
];

const EMPTY_FORM = {
  name: "",
  description: "",
  startDate: "",
  endDate: "",
  status: "Not Started",
  sortOrder: 0,
};

const getErrorMessage = (error, fallback) =>
  error.response?.data?.message || fallback;

const getStatusTone = (status) => {
  switch (status) {
    case "Completed":
      return "success";
    case "In Progress":
      return "info";
    case "On Hold":
      return "warning";
    default:
      return "neutral";
  }
};

const getStatusClasses = (status) => {
  const styles = {
    Completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
    "In Progress": "border-blue-200 bg-blue-50 text-blue-700",
    "On Hold": "border-amber-200 bg-amber-50 text-amber-700",
    "Not Started": "border-slate-200 bg-slate-100 text-slate-600",
  };

  return styles[status] || styles["Not Started"];
};

const getProgress = (status) => {
  switch (status) {
    case "Completed":
      return 100;
    case "In Progress":
      return 50;
    default:
      return 0;
  }
};

const formatDate = (value) => {
  if (!value) return "Not set";

  const date = String(value).slice(0, 10);
  const [year, month, day] = date.split("-").map(Number);

  if (!year || !month || !day) return "Not set";

  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    },
  );
};

const normalizePhase = (phase) => ({
  ...phase,
  startDate: phase.startDate
    ? String(phase.startDate).slice(0, 10)
    : "",
  endDate: phase.endDate
    ? String(phase.endDate).slice(0, 10)
    : "",
  sortOrder: phase.sortOrder ?? 0,
});

function SectionHeading({ icon: Icon, title, description, action }) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
          <Icon size={19} />
        </div>

        <div className="min-w-0">
          <h2 className="text-base font-bold text-slate-800">{title}</h2>
          {description && (
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          )}
        </div>
      </div>

      {action}
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, description }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

function ModalHeader({ mode, onClose, disabled }) {
  const config = {
    create: {
      icon: Plus,
      eyebrow: "PHASE MANAGEMENT",
      title: "Create Phase",
      description: "Add a new development phase to the selected module.",
    },
    edit: {
      icon: Pencil,
      eyebrow: "PHASE MANAGEMENT",
      title: "Edit Phase",
      description: "Update the development phase details and configuration.",
    },
    delete: {
      icon: Trash2,
      eyebrow: "PHASE MANAGEMENT",
      title: "Delete Phase",
      description: "Review the phase information before deleting it.",
    },
  };

  const current = config[mode];
  const Icon = current.icon;

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-[#080d25] via-[#0b1734] to-[#1b2052] px-6 py-5">
      <div className="pointer-events-none absolute -right-8 -top-16 h-40 w-40 rounded-full border border-white/10" />
      <div className="pointer-events-none absolute -right-1 -top-10 h-28 w-28 rounded-full border border-white/10" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-blue-100">
            <Icon size={19} />
          </div>

          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-200">
              {current.eyebrow}
            </p>

            <h2
              id="phase-modal-title"
              className="mt-1 text-lg font-bold text-white"
            >
              {current.title}
            </h2>

            <p className="mt-1 text-sm text-slate-300">
              {current.description}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          disabled={disabled}
          aria-label="Close modal"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}

function PhaseFormFields({ values, onChange, disabled }) {
  return (
    <div className="space-y-5">
      <div className="min-w-0">
        <Input
          label="Phase Name"
          value={values.name}
          onChange={(e) => onChange("name", e.target.value)}
          placeholder="e.g. API Integration"
          required
          disabled={disabled}
        />
      </div>

      <div className="min-w-0">
        <Input
          label="Description"
          value={values.description}
          onChange={(e) => onChange("description", e.target.value)}
          placeholder="Describe the phase"
          disabled={disabled}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="min-w-0">
          <Input
            label="Start Date"
            type="date"
            value={values.startDate}
            onChange={(e) => onChange("startDate", e.target.value)}
            max={values.endDate || undefined}
            disabled={disabled}
          />
        </div>

        <div className="min-w-0">
          <Input
            label="End Date"
            type="date"
            value={values.endDate}
            onChange={(e) => onChange("endDate", e.target.value)}
            min={values.startDate || undefined}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="min-w-0">
          <Select
            label="Status"
            value={values.status}
            options={STATUS_OPTIONS}
            onChange={(e) => onChange("status", e.target.value)}
            disabled={disabled}
          />
        </div>

        <div className="min-w-0">
          <Input
            label="Sort Order"
            type="number"
            value={values.sortOrder}
            onChange={(e) =>
              onChange(
                "sortOrder",
                e.target.value === "" ? "" : Number(e.target.value),
              )
            }
            disabled={disabled}
          />

          <p className="mt-1.5 text-xs text-slate-400">
            Controls the display order of phases.
          </p>
        </div>
      </div>
    </div>
  );
}

function Phases() {
  const [projects, setProjects] = useState([]);
  const [modules, setModules] = useState([]);
  const [phases, setPhases] = useState([]);

  const [selectedProject, setSelectedProject] = useState("");
  const [selectedModule, setSelectedModule] = useState("");

  const [form, setForm] = useState(EMPTY_FORM);
  const [editForm, setEditForm] = useState(EMPTY_FORM);

  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingModules, setLoadingModules] = useState(false);
  const [loadingPhases, setLoadingPhases] = useState(false);

  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [modal, setModal] = useState({
    open: false,
    mode: "",
    phase: null,
  });

  // =====================================================
  // LOAD PROJECTS
  // =====================================================

  useEffect(() => {
    let active = true;

    const fetchProjects = async () => {
      setLoadingProjects(true);

      try {
        const response = await axios.get(
          "/api/project-lead/planning/projects",
          { withCredentials: true },
        );

        const data = response.data?.data;

        if (!Array.isArray(data)) {
          throw new Error("Invalid projects response.");
        }

        if (!active) return;

        setProjects(data);

        setSelectedProject((current) =>
          current && data.some((project) => project.uuid === current)
            ? current
            : data[0]?.uuid || "",
        );
      } catch (error) {
        if (active) {
          showToast.error(
            getErrorMessage(error, "Failed to load projects."),
          );
        }
      } finally {
        if (active) setLoadingProjects(false);
      }
    };

    fetchProjects();

    return () => {
      active = false;
    };
  }, []);

  // =====================================================
  // LOAD MODULES WHEN PROJECT CHANGES
  // =====================================================

  useEffect(() => {
    if (!selectedProject) {
      setModules([]);
      setSelectedModule("");
      setPhases([]);
      setLoadingModules(false);
      setLoadingPhases(false);
      return;
    }

    let active = true;

    const fetchModules = async () => {
      setLoadingModules(true);
      setModules([]);
      setSelectedModule("");
      setPhases([]);

      try {
        const response = await axios.get(
          `/api/projects/${selectedProject}/modules`,
          { withCredentials: true },
        );

        const data = response.data?.data;

        if (!Array.isArray(data)) {
          throw new Error("Invalid modules response.");
        }

        if (!active) return;

        setModules(data);

        setSelectedModule((current) =>
          current && data.some((module) => module.uuid === current)
            ? current
            : data[0]?.uuid || "",
        );
      } catch (error) {
        if (active) {
          showToast.error(
            getErrorMessage(error, "Failed to load modules."),
          );
        }
      } finally {
        if (active) setLoadingModules(false);
      }
    };

    fetchModules();

    return () => {
      active = false;
    };
  }, [selectedProject]);

  // =====================================================
  // LOAD PHASES WHEN MODULE CHANGES
  // =====================================================

  useEffect(() => {
    if (!selectedProject || !selectedModule) {
      setPhases([]);
      setLoadingPhases(false);
      return;
    }

    let active = true;

    const fetchPhases = async () => {
      setLoadingPhases(true);
      setPhases([]);

      try {
        const response = await axios.get(
          `/api/projects/${selectedProject}/modules/${selectedModule}/phases`,
          { withCredentials: true },
        );

        const data = response.data?.data;

        if (!Array.isArray(data)) {
          throw new Error("Invalid phases response.");
        }

        if (active) {
          setPhases(data.map(normalizePhase));
        }
      } catch (error) {
        if (active) {
          showToast.error(
            getErrorMessage(error, "Failed to load phases."),
          );
        }
      } finally {
        if (active) setLoadingPhases(false);
      }
    };

    fetchPhases();

    return () => {
      active = false;
    };
  }, [selectedProject, selectedModule]);

  // =====================================================
  // DERIVED DATA
  // =====================================================

  const selectedProjectName =
    projects.find((project) => project.uuid === selectedProject)?.name || "";

  const selectedModuleName =
    modules.find((module) => module.uuid === selectedModule)?.name || "";

  const sortedPhases = useMemo(
    () =>
      [...phases].sort(
        (a, b) =>
          (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
          a.name.localeCompare(b.name),
      ),
    [phases],
  );

  const completedCount = phases.filter(
    (phase) => phase.status === "Completed",
  ).length;

  const activeCount = phases.filter(
    (phase) => phase.status === "In Progress",
  ).length;

  const averageProgress = phases.length
    ? Math.round(
        phases.reduce(
          (total, phase) => total + getProgress(phase.status),
          0,
        ) / phases.length,
      )
    : 0;

  // =====================================================
  // FORM HANDLERS
  // =====================================================

  const updateFormField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const updateEditField = (field, value) => {
    setEditForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const closeModal = () => {
    if (creating || saving || deleting) return;

    setModal({
      open: false,
      mode: "",
      phase: null,
    });

    setForm(EMPTY_FORM);
    setEditForm(EMPTY_FORM);
  };

  // =====================================================
  // VALIDATION
  // =====================================================

  const validateForm = (values) => {
    if (!values.name.trim()) {
      showToast.error("Phase name is required.");
      return false;
    }

    if (
      values.startDate &&
      values.endDate &&
      values.endDate < values.startDate
    ) {
      showToast.error("End date cannot be before start date.");
      return false;
    }

    if (
      !Number.isInteger(Number(values.sortOrder)) ||
      Number(values.sortOrder) < 0
    ) {
      showToast.error("Sort order must be a non-negative integer.");
      return false;
    }

    return true;
  };

  const isDuplicate = (name, excludedUuid = null) =>
    phases.some(
      (phase) =>
        phase.uuid !== excludedUuid &&
        phase.name.trim().toLowerCase() === name.trim().toLowerCase(),
    );

  // =====================================================
  // CREATE PHASE
  // =====================================================

  const openCreateModal = () => {
    if (!selectedProject || !selectedModule || loadingPhases) return;

    setForm(EMPTY_FORM);

    setModal({
      open: true,
      mode: "create",
      phase: null,
    });
  };

  const createPhase = async (e) => {
    e.preventDefault();

    if (!selectedProject || !selectedModule) {
      showToast.error("Please select a project and module.");
      return;
    }

    if (!validateForm(form)) return;

    if (isDuplicate(form.name)) {
      showToast.error("This phase already exists in this module.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      status: form.status,
      sortOrder: Number(form.sortOrder),
    };

    setCreating(true);

    try {
      const response = await axios.post(
        `/api/projects/${selectedProject}/modules/${selectedModule}/phases`,
        payload,
        { withCredentials: true },
      );

      const createdPhase = response.data?.data;

      if (!createdPhase?.uuid) {
        throw new Error("The server did not return the created phase.");
      }

      setPhases((previous) => [
        ...previous.filter((phase) => phase.uuid !== createdPhase.uuid),
        normalizePhase(createdPhase),
      ]);

      setForm(EMPTY_FORM);

      setModal({
        open: false,
        mode: "",
        phase: null,
      });

      showToast.success("Phase created successfully.");
    } catch (error) {
      showToast.error(
        getErrorMessage(error, "Failed to create phase."),
      );
    } finally {
      setCreating(false);
    }
  };

  // =====================================================
  // EDIT PHASE
  // =====================================================

  const openEditModal = (phase) => {
    setEditForm({
      name: phase.name || "",
      description: phase.description || "",
      startDate: phase.startDate || "",
      endDate: phase.endDate || "",
      status: phase.status || "Not Started",
      sortOrder: phase.sortOrder ?? 0,
    });

    setModal({
      open: true,
      mode: "edit",
      phase,
    });
  };

  const updatePhase = async (e) => {
    e.preventDefault();

    if (!modal.phase?.uuid || !validateForm(editForm)) return;

    if (isDuplicate(editForm.name, modal.phase.uuid)) {
      showToast.error("This phase already exists in this module.");
      return;
    }

    const payload = {
      name: editForm.name.trim(),
      description: editForm.description.trim() || null,
      startDate: editForm.startDate || null,
      endDate: editForm.endDate || null,
      status: editForm.status,
      sortOrder: Number(editForm.sortOrder),
    };

    setSaving(true);

    try {
      const response = await axios.put(
        `/api/phases/${modal.phase.uuid}`,
        payload,
        { withCredentials: true },
      );

      const updatedPhase = response.data?.data;

      if (!updatedPhase?.uuid) {
        throw new Error("The server did not return the updated phase.");
      }

      setPhases((previous) =>
        previous.map((phase) =>
          phase.uuid === updatedPhase.uuid
            ? normalizePhase(updatedPhase)
            : phase,
        ),
      );

      setModal({
        open: false,
        mode: "",
        phase: null,
      });

      setEditForm(EMPTY_FORM);

      showToast.success("Phase updated successfully.");
    } catch (error) {
      showToast.error(
        getErrorMessage(error, "Failed to update phase."),
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // DELETE PHASE
  // =====================================================

  const openDeleteModal = (phase) => {
    setModal({
      open: true,
      mode: "delete",
      phase,
    });
  };

  const deletePhase = async () => {
    if (!modal.phase?.uuid) return;

    setDeleting(true);

    try {
      await axios.delete(`/api/phases/${modal.phase.uuid}`, {
        withCredentials: true,
      });

      setPhases((previous) =>
        previous.filter((phase) => phase.uuid !== modal.phase.uuid),
      );

      setModal({
        open: false,
        mode: "",
        phase: null,
      });

      showToast.success("Phase deleted successfully.");
    } catch (error) {
      showToast.error(
        getErrorMessage(error, "Failed to delete phase."),
      );
    } finally {
      setDeleting(false);
    }
  };

  // =====================================================
  // MODAL KEYBOARD HANDLING
  // =====================================================

  useEffect(() => {
    if (!modal.open) return;

    const handleKeyDown = (event) => {
      if (
        event.key === "Escape" &&
        !creating &&
        !saving &&
        !deleting
      ) {
        setModal({
          open: false,
          mode: "",
          phase: null,
        });

        setForm(EMPTY_FORM);
        setEditForm(EMPTY_FORM);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [modal.open, creating, saving, deleting]);

  const modalBusy = creating || saving || deleting;

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="flex min-w-0 flex-col gap-6">

      {/* =====================================================
          PAGE HEADER
      ====================================================== */}
      <header className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#080d25] via-[#0b1734] to-[#1b2052] px-6 py-7 shadow-lg sm:px-8">
        <div className="pointer-events-none absolute -right-12 -top-24 h-64 w-64 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-2 -top-12 h-48 w-48 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -bottom-28 right-36 h-56 w-56 rounded-full border border-white/10" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-5">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">
              <FolderKanban size={15} />
              <span>Project Management Workspace</span>
            </div>

            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-slate-300">
              <span>Project Management</span>
              <span className="text-slate-500">/</span>
              <span className="text-blue-200">Phases</span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Phase Management
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Organize development phases, manage timelines, and track
              module-level progress.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-blue-100 shadow-inner backdrop-blur">
              <CalendarDays size={27} />
            </div>

            <Button
              type="button"
              disabled={
                !selectedProject ||
                !selectedModule ||
                loadingProjects ||
                loadingModules ||
                loadingPhases ||
                modalBusy
              }
              onClick={openCreateModal}
            >
              <span className="inline-flex items-center gap-2">
                <Plus size={16} />
                Create Phase
              </span>
            </Button>
          </div>
        </div>
      </header>

      {/* =====================================================
          PROJECT AND MODULE SELECTION
      ====================================================== */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <SectionHeading
          icon={FolderKanban}
          title="Project & Module Selection"
          description="Select a project first, then choose the module whose development phases you want to manage."
        />

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="min-w-0">
            <Select
              label="Project"
              value={selectedProject}
              options={[
                { value: "", label: "Select project" },
                ...projects.map((project) => ({
                  value: project.uuid,
                  label: project.name,
                })),
              ]}
              onChange={(e) => setSelectedProject(e.target.value)}
              disabled={loadingProjects || modalBusy}
            />
          </div>

          <div className="min-w-0">
            <Select
              label="Module"
              value={selectedModule}
              options={[
                { value: "", label: "Select module" },
                ...modules.map((module) => ({
                  value: module.uuid,
                  label: module.name,
                })),
              ]}
              onChange={(e) => setSelectedModule(e.target.value)}
              disabled={
                !selectedProject ||
                loadingProjects ||
                loadingModules ||
                modalBusy
              }
            />
          </div>
        </div>

        {(loadingProjects || loadingModules) && (
          <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
            Loading {loadingProjects ? "projects" : "modules"}...
          </div>
        )}

        {!loadingProjects && projects.length === 0 && (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <AlertCircle
              size={18}
              className="mt-0.5 shrink-0 text-amber-700"
            />

            <div>
              <p className="text-sm font-semibold text-amber-800">
                No projects available
              </p>
              <p className="mt-1 text-sm text-amber-700">
                No assigned projects are currently available for phase
                management.
              </p>
            </div>
          </div>
        )}

        {!loadingProjects && selectedProject && !loadingModules &&
          modules.length === 0 && (
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <AlertCircle
                size={18}
                className="mt-0.5 shrink-0 text-amber-700"
              />

              <div>
                <p className="text-sm font-semibold text-amber-800">
                  No modules available
                </p>
                <p className="mt-1 text-sm text-amber-700">
                  This project does not have any modules. Create a module
                  before adding development phases.
                </p>
              </div>
            </div>
          )}

        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 text-sm">
          <span className="font-medium text-slate-500">
            Currently viewing:
          </span>

          <Badge tone="info">
            {selectedProjectName || "No project"}
          </Badge>

          <span className="text-slate-300">/</span>

          <Badge tone="neutral">
            {selectedModuleName || "No module"}
          </Badge>
        </div>
      </section>

      {/* =====================================================
          PHASE OVERVIEW
      ====================================================== */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={Layers3}
          label="Total Phases"
          value={loadingPhases ? "..." : phases.length}
          description="In selected module"
        />

        <SummaryCard
          icon={CheckCircle2}
          label="Completed"
          value={loadingPhases ? "..." : completedCount}
          description="Phases finished"
        />

        <SummaryCard
          icon={Activity}
          label="In Progress"
          value={loadingPhases ? "..." : activeCount}
          description="Currently active"
        />

        <SummaryCard
          icon={Target}
          label="Overall Progress"
          value={loadingPhases ? "..." : `${averageProgress}%`}
          description="Estimated from phase status"
        />
      </section>

      {/* =====================================================
          DEVELOPMENT PHASES
      ====================================================== */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <SectionHeading
          icon={ListOrdered}
          title="Development Phases"
          description={
            loadingPhases
              ? "Loading development phases..."
              : `${phases.length} phases for ${selectedModuleName || "the selected module"}.`
          }
          action={
            <Badge tone="info">
              {loadingPhases ? "Loading..." : `${phases.length} phases`}
            </Badge>
          }
        />

        {loadingPhases ? (
          <div className="flex min-h-48 items-center justify-center gap-3 rounded-xl border border-slate-200 bg-slate-50">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
            <span className="text-sm font-medium text-slate-500">
              Loading phases...
            </span>
          </div>
        ) : !selectedProject || !selectedModule ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <FolderKanban size={25} />
            </div>

            <h3 className="mt-4 text-base font-semibold text-slate-800">
              Select a project and module
            </h3>

            <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">
              Choose a project and module above to view and manage their
              development phases.
            </p>
          </div>
        ) : sortedPhases.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <CalendarDays size={25} />
            </div>

            <h3 className="mt-4 text-base font-semibold text-slate-800">
              No phases created yet
            </h3>

            <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">
              No development phases have been created for{" "}
              <span className="font-semibold text-slate-700">
                {selectedModuleName}
              </span>
              .
            </p>

            <div className="mt-5 flex justify-center">
              <Button
                type="button"
                onClick={openCreateModal}
                disabled={modalBusy}
              >
                <span className="inline-flex items-center gap-2">
                  <Plus size={16} />
                  Create First Phase
                </span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedPhases.map((phase, index) => {
              const progress = getProgress(phase.status);

              return (
                <article
                  key={phase.uuid}
                  className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:shadow-sm sm:p-5"
                >
                  {/* PHASE CARD HEADER */}
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                        <span className="text-sm font-bold">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="break-words text-base font-bold text-slate-800">
                            {phase.name}
                          </h3>

                          <Badge tone="neutral">
                            {phase.uuid.slice(0, 8)}
                          </Badge>
                        </div>

                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          {phase.description ||
                            "No description provided."}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 lg:justify-end">
                      <span
                        className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold ${getStatusClasses(phase.status)}`}
                      >
                        {phase.status}
                      </span>
                    </div>
                  </div>

                  {/* PHASE PROGRESS */}
                  <div className="mt-5 rounded-xl bg-slate-50 p-4">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Activity size={15} />
                        <span>Estimated Progress</span>
                      </div>

                      <span className="text-sm font-bold tabular-nums text-slate-800">
                        {progress}%
                      </span>
                    </div>

                    <div
                      className="h-2 overflow-hidden rounded-full bg-slate-200"
                      role="progressbar"
                      aria-valuenow={progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${phase.name} progress`}
                    >
                      <div
                        className={`h-full rounded-full transition-all ${
                          phase.status === "Completed"
                            ? "bg-emerald-500"
                            : "bg-blue-600"
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* PHASE DATES AND ACTIONS */}
                  <div className="mt-5 flex flex-col gap-4 border-t border-slate-100 pt-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex flex-wrap gap-x-8 gap-y-3">
                      <div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <CalendarDays size={13} />
                          Start Date
                        </div>

                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          {formatDate(phase.startDate)}
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <Clock3 size={13} />
                          End Date
                        </div>

                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          {formatDate(phase.endDate)}
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <ListOrdered size={13} />
                          Sort Order
                        </div>

                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          {phase.sortOrder ?? 0}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 border-t border-slate-100 pt-3 sm:border-0 sm:pt-0">
                      <Button
                        type="button"
                        onClick={() => openEditModal(phase)}
                        disabled={modalBusy}
                      >
                        <span className="inline-flex items-center gap-2">
                          <Pencil size={14} />
                          Edit
                        </span>
                      </Button>

                      <button
                        type="button"
                        onClick={() => openDeleteModal(phase)}
                        disabled={modalBusy}
                        className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 transition hover:border-red-300 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* =====================================================
          CREATE / EDIT / DELETE MODALS
      ====================================================== */}
      {modal.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/65 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="phase-modal-title"
            className="my-auto max-h-[90vh] w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
          >
            <ModalHeader
              mode={modal.mode}
              onClose={closeModal}
              disabled={modalBusy}
            />

            {/* =================================================
                CREATE PHASE MODAL
            ================================================== */}
            {modal.mode === "create" && (
              <form
                onSubmit={createPhase}
                className="flex max-h-[calc(90vh-90px)] flex-col"
              >
                <div className="space-y-5 overflow-y-auto p-6">
                  <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                      Selected Project & Module
                    </p>

                    <p className="mt-1 break-words text-sm font-semibold text-slate-800">
                      {selectedProjectName}
                    </p>

                    <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                      <span>/</span>
                      <span className="break-words">
                        {selectedModuleName}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      Phase Information
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Enter the development phase details and timeline.
                    </p>
                  </div>

                  <PhaseFormFields
                    values={form}
                    onChange={updateFormField}
                    disabled={creating}
                  />
                </div>

                {/* CREATE MODAL FOOTER */}
                <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
                  <Button
                    type="button"
                    onClick={closeModal}
                    disabled={creating}
                  >
                    Cancel
                  </Button>

                  <Button
                    type="submit"
                    disabled={creating}
                    loading={creating}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Plus size={15} />
                      {creating ? "Creating..." : "Create Phase"}
                    </span>
                  </Button>
                </div>
              </form>
            )}

            {/* =================================================
                EDIT PHASE MODAL
            ================================================== */}
            {modal.mode === "edit" && (
              <form
                onSubmit={updatePhase}
                className="flex max-h-[calc(90vh-90px)] flex-col"
              >
                <div className="space-y-5 overflow-y-auto p-6">
                  <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                      Selected Project & Module
                    </p>

                    <p className="mt-1 break-words text-sm font-semibold text-slate-800">
                      {selectedProjectName}
                    </p>

                    <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                      <span>/</span>
                      <span className="break-words">
                        {selectedModuleName}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      Update Phase Information
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Modify the selected phase's details and timeline.
                    </p>
                  </div>

                  <PhaseFormFields
                    values={editForm}
                    onChange={updateEditField}
                    disabled={saving}
                  />
                </div>

                {/* EDIT MODAL FOOTER */}
                <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
                  <Button
                    type="button"
                    onClick={closeModal}
                    disabled={saving}
                  >
                    Cancel
                  </Button>

                  <Button
                    type="submit"
                    disabled={saving}
                    loading={saving}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            )}

            {/* =================================================
                DELETE PHASE MODAL
            ================================================== */}
            {modal.mode === "delete" && (
              <>
                <div className="space-y-4 overflow-y-auto p-6">
                  <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                      <AlertCircle size={20} />
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-red-800">
                        Confirm phase deletion
                      </h3>

                      <p className="mt-1 text-sm leading-6 text-red-700">
                        Are you sure you want to delete{" "}
                        <span className="font-bold">
                          {modal.phase?.name}
                        </span>
                        ? This action cannot be undone.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Phase Details
                    </p>

                    <p className="mt-2 break-words text-sm font-semibold text-slate-800">
                      {modal.phase?.name}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {modal.phase?.description ||
                        "No description provided."}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge tone={getStatusTone(modal.phase?.status)}>
                        {modal.phase?.status}
                      </Badge>

                      <Badge tone="neutral">
                        Sort order: {modal.phase?.sortOrder ?? 0}
                      </Badge>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-200 pt-3">
                      <div>
                        <p className="text-xs text-slate-400">
                          Start Date
                        </p>
                        <p className="mt-1 text-sm font-medium text-slate-700">
                          {formatDate(modal.phase?.startDate)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-400">
                          End Date
                        </p>
                        <p className="mt-1 text-sm font-medium text-slate-700">
                          {formatDate(modal.phase?.endDate)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* DELETE MODAL FOOTER */}
                <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
                  <Button
                    type="button"
                    onClick={closeModal}
                    disabled={deleting}
                  >
                    Cancel
                  </Button>

                  <button
                    type="button"
                    onClick={deletePhase}
                    disabled={deleting}
                    className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 size={15} />
                    {deleting ? "Deleting..." : "Delete Phase"}
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export default Phases;