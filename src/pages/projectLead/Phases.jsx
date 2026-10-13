import { useEffect, useMemo, useState } from "react";
import axios from "axios";
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

  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
};

const normalizePhase = (phase) => ({
  ...phase,
  startDate: phase.startDate ? String(phase.startDate).slice(0, 10) : "",
  endDate: phase.endDate ? String(phase.endDate).slice(0, 10) : "",
  sortOrder: phase.sortOrder ?? 0,
});

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
          showToast.error(getErrorMessage(error, "Failed to load projects."));
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

  useEffect(() => {
    if (!selectedProject) {
      setModules([]);
      setSelectedModule("");
      setPhases([]);
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
          showToast.error(getErrorMessage(error, "Failed to load modules."));
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

  useEffect(() => {
    if (!selectedProject || !selectedModule) {
      setPhases([]);
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
          showToast.error(getErrorMessage(error, "Failed to load phases."));
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
        phases.reduce((total, phase) => total + getProgress(phase.status), 0) /
          phases.length,
      )
    : 0;

  const updateFormField = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const updateEditField = (field, value) => {
    setEditForm((previous) => ({ ...previous, [field]: value }));
  };

  const closeModal = () => {
    if (saving || deleting) return;

    setModal({ open: false, mode: "", phase: null });
    setEditForm(EMPTY_FORM);
  };

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
      showToast.success("Phase created successfully.");
    } catch (error) {
      showToast.error(getErrorMessage(error, "Failed to create phase."));
    } finally {
      setCreating(false);
    }
  };

  const openEditModal = (phase) => {
    setEditForm({
      name: phase.name || "",
      description: phase.description || "",
      startDate: phase.startDate || "",
      endDate: phase.endDate || "",
      status: phase.status || "Not Started",
      sortOrder: phase.sortOrder ?? 0,
    });

    setModal({ open: true, mode: "edit", phase });
  };

  const openDeleteModal = (phase) => {
    setModal({ open: true, mode: "delete", phase });
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

      setModal({ open: false, mode: "", phase: null });
      setEditForm(EMPTY_FORM);
      showToast.success("Phase updated successfully.");
    } catch (error) {
      showToast.error(getErrorMessage(error, "Failed to update phase."));
    } finally {
      setSaving(false);
    }
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

      setModal({ open: false, mode: "", phase: null });
      showToast.success("Phase deleted successfully.");
    } catch (error) {
      showToast.error(getErrorMessage(error, "Failed to delete phase."));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-cm-text-muted">
            <span>Project Management</span>
            <span>/</span>
            <span className="text-cm-text">Phases</span>
          </div>

          <h1 className="mt-2 text-2xl font-bold text-cm-text">
            Phase Management
          </h1>

          <p className="mt-1 text-sm text-cm-text-muted">
            Organize development phases and track module progress.
          </p>
        </div>

        <Button
          type="button"
          disabled={!selectedProject || !selectedModule || loadingPhases}
          onClick={() => {
            setForm(EMPTY_FORM);
            setModal({ open: true, mode: "create", phase: null });
          }}
        >
          + Create Phase
        </Button>
      </div>

      <section className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="font-semibold text-cm-text">
            Select Project & Module
          </h2>
          <p className="mt-1 text-sm text-cm-text-muted">
            Choose a project first, then select one of its modules.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
            disabled={loadingProjects}
          />

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
            disabled={!selectedProject || loadingModules}
          />
        </div>

        {(loadingProjects || loadingModules) && (
          <p className="mt-3 text-sm text-cm-text-muted">
            Loading {loadingProjects ? "projects" : "modules"}...
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-cm-border pt-4 text-sm">
          <span className="text-cm-text-muted">Currently viewing:</span>
          <Badge tone="info">{selectedProjectName || "No project"}</Badge>
          <span className="text-cm-text-muted">/</span>
          <Badge tone="neutral">{selectedModuleName || "No module"}</Badge>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Total Phases",
            value: phases.length,
            detail: "In selected module",
          },
          {
            label: "Completed",
            value: completedCount,
            detail: "Phases finished",
          },
          {
            label: "In Progress",
            value: activeCount,
            detail: "Currently active",
          },
          {
            label: "Overall Progress",
            value: `${averageProgress}%`,
            detail: "Estimated from phase status",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm"
          >
            <p className="text-sm text-cm-text-muted">{stat.label}</p>
            <p className="mt-2 text-2xl font-bold text-cm-text">
              {loadingPhases ? "—" : stat.value}
            </p>
            <p className="mt-3 text-xs text-cm-text-muted">{stat.detail}</p>
          </div>
        ))}
      </div>

      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-cm-text">
            Development Phases
          </h2>
          <p className="mt-1 text-sm text-cm-text-muted">
            {loadingPhases
              ? "Loading phases..."
              : `${phases.length} phases for ${selectedModuleName || "this module"}`}
          </p>
        </div>

        {loadingPhases ? (
          <div className="flex items-center justify-center gap-3 rounded-cm-lg border border-cm-border bg-cm-card p-12">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-cm-border border-t-blue-600" />
            <span className="text-sm text-cm-text-muted">
              Loading phases...
            </span>
          </div>
        ) : !selectedProject || !selectedModule ? (
          <div className="rounded-cm-lg border border-dashed border-cm-border bg-cm-card p-10 text-center">
            <h3 className="font-semibold text-cm-text">
              Select a project and module
            </h3>
            <p className="mt-1 text-sm text-cm-text-muted">
              Choose a project and module to view their phases.
            </p>
          </div>
        ) : sortedPhases.length === 0 ? (
          <div className="rounded-cm-lg border border-dashed border-cm-border bg-cm-card px-5 py-12 text-center">
            <h3 className="font-semibold text-cm-text">
              No phases created yet
            </h3>
            <p className="mt-2 text-sm text-cm-text-muted">
              Create the first phase for {selectedModuleName}.
            </p>
            <div className="mt-5">
              <Button
                type="button"
                onClick={() => {
                  setForm(EMPTY_FORM);
                  setModal({ open: true, mode: "create", phase: null });
                }}
              >
                + Create First Phase
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
                  className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex min-w-0 flex-1 gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cm-border bg-cm-bg font-semibold text-cm-text">
                        {String(index + 1).padStart(2, "0")}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-cm-text">
                            {phase.name}
                          </h3>
                          <Badge tone="neutral">{phase.uuid.slice(0, 8)}</Badge>
                        </div>

                        <p className="mt-2 text-sm leading-6 text-cm-text-muted">
                          {phase.description || "No description provided."}
                        </p>
                      </div>
                    </div>

                    <Badge tone={getStatusTone(phase.status)}>
                      {phase.status}
                    </Badge>
                  </div>

                  <div className="mt-5">
                    <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                      <span className="text-cm-text-muted">
                        Estimated progress
                      </span>
                      <span className="font-semibold text-cm-text">
                        {progress}%
                      </span>
                    </div>

                    <div
                      className="h-2 overflow-hidden rounded-full bg-cm-border"
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

                  <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-t border-cm-border pt-4">
                    <div className="flex flex-wrap gap-x-6 gap-y-3">
                      <div>
                        <p className="text-xs text-cm-text-muted">Start Date</p>
                        <p className="mt-1 text-sm font-medium text-cm-text">
                          {formatDate(phase.startDate)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-cm-text-muted">End Date</p>
                        <p className="mt-1 text-sm font-medium text-cm-text">
                          {formatDate(phase.endDate)}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        onClick={() => openEditModal(phase)}
                        disabled={saving || deleting}
                      >
                        Edit
                      </Button>

                      <button
                        type="button"
                        onClick={() => openDeleteModal(phase)}
                        disabled={saving || deleting}
                        className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
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

      {modal.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="phase-modal-title"
            className="my-auto max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl border border-cm-border bg-cm-card p-6 shadow-xl"
          >
            {modal.mode === "delete" ? (
              <>
                <h2
                  id="phase-modal-title"
                  className="text-lg font-bold text-cm-text"
                >
                  Delete Phase
                </h2>

                <p className="mt-3 text-sm leading-6 text-cm-text-muted">
                  Are you sure you want to delete{" "}
                  <span className="font-semibold text-cm-text">
                    {modal.phase?.name}
                  </span>
                  ? This action cannot be undone.
                </p>

                <div className="mt-6 flex justify-end gap-3">
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
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deleting ? "Deleting..." : "Delete Phase"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-5">
                  <h2
                    id="phase-modal-title"
                    className="text-lg font-bold text-cm-text"
                  >
                    {modal.mode === "edit" ? "Edit Phase" : "Create Phase"}
                  </h2>

                  <p className="mt-1 text-sm text-cm-text-muted">
                    {selectedProjectName} / {selectedModuleName}
                  </p>
                </div>

                <form
                  onSubmit={modal.mode === "edit" ? updatePhase : createPhase}
                  className="space-y-4"
                >
                  <Input
                    label="Phase Name"
                    value={modal.mode === "edit" ? editForm.name : form.name}
                    onChange={(e) =>
                      modal.mode === "edit"
                        ? updateEditField("name", e.target.value)
                        : updateFormField("name", e.target.value)
                    }
                    placeholder="e.g. API Integration"
                    required
                    disabled={saving || creating}
                  />

                  <Input
                    label="Description"
                    value={
                      modal.mode === "edit"
                        ? editForm.description
                        : form.description
                    }
                    onChange={(e) =>
                      modal.mode === "edit"
                        ? updateEditField("description", e.target.value)
                        : updateFormField("description", e.target.value)
                    }
                    placeholder="Describe the phase"
                    disabled={saving || creating}
                  />

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input
                      label="Start Date"
                      type="date"
                      value={
                        modal.mode === "edit"
                          ? editForm.startDate
                          : form.startDate
                      }
                      onChange={(e) =>
                        modal.mode === "edit"
                          ? updateEditField("startDate", e.target.value)
                          : updateFormField("startDate", e.target.value)
                      }
                      max={
                        (modal.mode === "edit"
                          ? editForm.endDate
                          : form.endDate) || undefined
                      }
                      disabled={saving || creating}
                    />

                    <Input
                      label="End Date"
                      type="date"
                      value={
                        modal.mode === "edit" ? editForm.endDate : form.endDate
                      }
                      onChange={(e) =>
                        modal.mode === "edit"
                          ? updateEditField("endDate", e.target.value)
                          : updateFormField("endDate", e.target.value)
                      }
                      min={
                        (modal.mode === "edit"
                          ? editForm.startDate
                          : form.startDate) || undefined
                      }
                      disabled={saving || creating}
                    />
                  </div>

                  <Select
                    label="Status"
                    value={
                      modal.mode === "edit" ? editForm.status : form.status
                    }
                    options={STATUS_OPTIONS}
                    onChange={(e) =>
                      modal.mode === "edit"
                        ? updateEditField("status", e.target.value)
                        : updateFormField("status", e.target.value)
                    }
                    disabled={saving || creating}
                  />

                  <Input
                    label="Sort Order"
                    type="number"
                    value={
                      modal.mode === "edit"
                        ? editForm.sortOrder
                        : form.sortOrder
                    }
                    onChange={(e) => {
                      const value =
                        e.target.value === "" ? "" : Number(e.target.value);

                      modal.mode === "edit"
                        ? updateEditField("sortOrder", value)
                        : updateFormField("sortOrder", value);
                    }}
                    disabled={saving || creating}
                  />

                  <div className="flex justify-end gap-3 pt-2">
                    <Button
                      type="button"
                      onClick={closeModal}
                      disabled={saving || creating}
                    >
                      Cancel
                    </Button>

                    <Button
                      type="submit"
                      disabled={saving || creating}
                      loading={saving || creating}
                    >
                      {creating
                        ? "Creating..."
                        : saving
                          ? "Saving..."
                          : modal.mode === "edit"
                            ? "Save Changes"
                            : "Create Phase"}
                    </Button>
                  </div>
                </form>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export default Phases;
