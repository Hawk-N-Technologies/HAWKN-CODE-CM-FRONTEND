import { useEffect, useState } from "react";
import axios from "axios";
import {
  FolderKanban,
  Layers3,
  Plus,
  Pencil,
  Trash2,
  ListOrdered,
  CheckCircle2,
  AlertCircle,
  X,
  Settings2,
  FileText,
  PlusCircle,
} from "lucide-react";

import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import { showToast } from "../../components/common/Toast";

const PRIORITIES = ["Low", "Medium", "High", "Critical"].map((value) => ({
  value,
  label: value,
}));

const STATUSES = ["Not Started", "In Progress", "Completed", "On Hold"].map(
  (value) => ({ value, label: value }),
);

const EMPTY_FORM = {
  name: "",
  description: "",
  priority: "Medium",
  status: "Not Started",
  sortOrder: 0,
};

const getErrorMessage = (error, fallback) =>
  error.response?.data?.message || fallback;

const getPriorityTone = (priority) => {
  if (priority === "Critical" || priority === "High") return "danger";
  if (priority === "Medium") return "warning";
  return "neutral";
};

const getStatusTone = (status) => {
  if (status === "Completed") return "success";
  if (status === "In Progress") return "info";
  return "neutral";
};

const getStatusClasses = (status) => {
  const styles = {
    Completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    "In Progress": "bg-blue-50 text-blue-700 border-blue-200",
    "On Hold": "bg-amber-50 text-amber-700 border-amber-200",
    "Not Started": "bg-slate-100 text-slate-600 border-slate-200",
  };

  return styles[status] || styles["Not Started"];
};

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
      icon: PlusCircle,
      eyebrow: "MODULE MANAGEMENT",
      title: "Create Module",
      description: "Add a new module to the selected project.",
    },
    edit: {
      icon: Pencil,
      eyebrow: "MODULE MANAGEMENT",
      title: "Edit Module",
      description: "Update the module configuration and details.",
    },
    delete: {
      icon: Trash2,
      eyebrow: "MODULE MANAGEMENT",
      title: "Delete Module",
      description: "Review the module information before deleting it.",
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
              id="module-modal-title"
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

function ModuleFormFields({
  values,
  onChange,
  disabled,
}) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      <div className="min-w-0 sm:col-span-2">
        <Input
          label="Module Name"
          value={values.name}
          onChange={(e) => onChange("name", e.target.value)}
          placeholder="e.g. Plot Map"
          required
          disabled={disabled}
        />
      </div>

      <div className="min-w-0 sm:col-span-2">
        <Input
          label="Description"
          value={values.description}
          onChange={(e) => onChange("description", e.target.value)}
          placeholder="Describe this module"
          disabled={disabled}
        />
      </div>

      <div className="min-w-0">
        <Select
          label="Priority"
          value={values.priority}
          options={PRIORITIES}
          onChange={(e) => onChange("priority", e.target.value)}
          disabled={disabled}
        />
      </div>

      <div className="min-w-0">
        <Select
          label="Status"
          value={values.status}
          options={STATUSES}
          onChange={(e) => onChange("status", e.target.value)}
          disabled={disabled}
        />
      </div>

      <div className="min-w-0 sm:col-span-2">
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
          Controls the display order of modules.
        </p>
      </div>
    </div>
  );
}

function ModulesFeatures() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [modules, setModules] = useState([]);

  const [form, setForm] = useState(EMPTY_FORM);
  const [editForm, setEditForm] = useState(EMPTY_FORM);

  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingModules, setLoadingModules] = useState(false);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [modal, setModal] = useState({
    open: false,
    mode: "",
    module: null,
  });

  // Load assigned projects.
  useEffect(() => {
    let active = true;

    const getProjects = async () => {
      setLoadingProjects(true);

      try {
        const res = await axios.get("/api/project-lead/planning/projects", {
          withCredentials: true,
        });

        const projectList = res.data?.data;

        if (!Array.isArray(projectList)) {
          throw new Error("Invalid projects response.");
        }

        if (!active) return;

        setProjects(projectList);

        setSelectedProject((current) => {
          if (current && projectList.some((p) => p.uuid === current)) {
            return current;
          }

          return projectList[0]?.uuid || "";
        });
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

    getProjects();

    return () => {
      active = false;
    };
  }, []);

  // Load modules whenever the selected project changes.
  useEffect(() => {
    if (!selectedProject) {
      setModules([]);
      setLoadingModules(false);
      return;
    }

    let active = true;

    const getModules = async () => {
      setLoadingModules(true);
      setModules([]);

      try {
        const res = await axios.get(
          `/api/projects/${selectedProject}/modules`,
          { withCredentials: true },
        );

        if (!active) return;

        const moduleList = res.data?.data;

        if (!Array.isArray(moduleList)) {
          throw new Error("Invalid modules response.");
        }

        setModules(moduleList);
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

    getModules();

    return () => {
      active = false;
    };
  }, [selectedProject]);

  const selectedProjectName =
    projects.find((project) => project.uuid === selectedProject)?.name || "";

  const completedModules = modules.filter(
    (module) => module.status === "Completed",
  ).length;

  const inProgressModules = modules.filter(
    (module) => module.status === "In Progress",
  ).length;

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
      module: null,
    });

    setForm(EMPTY_FORM);
    setEditForm(EMPTY_FORM);
  };

  // Open Create Module modal.
  const openCreateModal = () => {
    setForm(EMPTY_FORM);

    setModal({
      open: true,
      mode: "create",
      module: null,
    });
  };

  // Create module.
  const addModule = async (e) => {
    e.preventDefault();

    if (!selectedProject) {
      showToast.error("Please select a project.");
      return;
    }

    const name = form.name.trim();

    if (!name) {
      showToast.error("Module name is required.");
      return;
    }

    const duplicate = modules.some(
      (module) => module.name.trim().toLowerCase() === name.toLowerCase(),
    );

    if (duplicate) {
      showToast.error("This module already exists in the project.");
      return;
    }

    const payload = {
      name,
      description: form.description.trim() || null,
      priority: form.priority,
      status: form.status,
      sortOrder: Number(form.sortOrder),
    };

    setCreating(true);

    try {
      const res = await axios.post(
        `/api/projects/${selectedProject}/modules`,
        payload,
        { withCredentials: true },
      );

      const createdModule = res.data?.data;

      if (!createdModule?.uuid) {
        throw new Error("The server did not return the created module.");
      }

      setModules((previous) => {
        if (previous.some((module) => module.uuid === createdModule.uuid)) {
          return previous;
        }

        return [...previous, createdModule].sort(
          (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.id - b.id,
        );
      });

      setForm(EMPTY_FORM);

      setModal({
        open: false,
        mode: "",
        module: null,
      });

      showToast.success("Module created successfully.");
    } catch (error) {
      showToast.error(
        getErrorMessage(error, "Failed to create module."),
      );
    } finally {
      setCreating(false);
    }
  };

  // Open Edit Module modal.
  const openEditModal = (module) => {
    setEditForm({
      name: module.name || "",
      description: module.description || "",
      priority: module.priority || "Medium",
      status: module.status || "Not Started",
      sortOrder: module.sortOrder ?? 0,
    });

    setModal({
      open: true,
      mode: "edit",
      module,
    });
  };

  // Open Delete Module confirmation modal.
  const openDeleteModal = (module) => {
    setModal({
      open: true,
      mode: "delete",
      module,
    });
  };

  // Update module.
  const updateModule = async (e) => {
    e.preventDefault();

    if (!modal.module?.uuid) return;

    const name = editForm.name.trim();

    if (!name) {
      showToast.error("Module name is required.");
      return;
    }

    const duplicate = modules.some(
      (module) =>
        module.uuid !== modal.module.uuid &&
        module.name.trim().toLowerCase() === name.toLowerCase(),
    );

    if (duplicate) {
      showToast.error(
        "This module name already exists in the project.",
      );
      return;
    }

    const payload = {
      name,
      description: editForm.description.trim() || null,
      priority: editForm.priority,
      status: editForm.status,
      sortOrder: Number(editForm.sortOrder),
    };

    setSaving(true);

    try {
      const res = await axios.put(
        `/api/modules/${modal.module.uuid}`,
        payload,
        { withCredentials: true },
      );

      const updatedModule = res.data?.data;

      if (!updatedModule?.uuid) {
        throw new Error("The server did not return the updated module.");
      }

      setModules((previous) =>
        previous
          .map((module) =>
            module.uuid === updatedModule.uuid ? updatedModule : module,
          )
          .sort(
            (a, b) =>
              (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.id - b.id,
          ),
      );

      setModal({
        open: false,
        mode: "",
        module: null,
      });

      setEditForm(EMPTY_FORM);

      showToast.success("Module updated successfully.");
    } catch (error) {
      showToast.error(
        getErrorMessage(error, "Failed to update module."),
      );
    } finally {
      setSaving(false);
    }
  };

  // Delete module.
  const deleteModule = async () => {
    if (!modal.module?.uuid) return;

    setDeleting(true);

    try {
      await axios.delete(`/api/modules/${modal.module.uuid}`, {
        withCredentials: true,
      });

      setModules((previous) =>
        previous.filter((module) => module.uuid !== modal.module.uuid),
      );

      setModal({
        open: false,
        mode: "",
        module: null,
      });

      showToast.success("Module deleted successfully.");
    } catch (error) {
      showToast.error(
        getErrorMessage(error, "Failed to delete module."),
      );
    } finally {
      setDeleting(false);
    }
  };

  // Close modal with Escape.
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
          module: null,
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
            <div className="mb-3 flex items-center gap-2">
              <Layers3 size={15} className="text-blue-300" />
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">
                Project Management Workspace
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Modules & Features
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Create, organize, and manage the modules that structure your
              assigned projects.
            </p>
          </div>

          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-blue-100 shadow-inner backdrop-blur">
            <FolderKanban size={27} />
          </div>
        </div>
      </header>

      {/* =====================================================
          PROJECT SELECTION
      ====================================================== */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <SectionHeading
          icon={FolderKanban}
          title="Project Selection"
          description="Choose an assigned project to manage its modules and features."
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:items-end">
          <div className="min-w-0">
            <Select
              label="Select Project"
              value={selectedProject}
              options={[
                { value: "", label: "Select a project" },
                ...projects.map((project) => ({
                  value: project.uuid,
                  label: project.name,
                })),
              ]}
              onChange={(e) => setSelectedProject(e.target.value)}
              disabled={
                loadingProjects ||
                creating ||
                saving ||
                deleting
              }
            />
          </div>

          <div className="flex min-h-[44px] items-center md:justify-end">
            {selectedProjectName ? (
              <div className="flex min-w-0 items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5">
                <CheckCircle2
                  size={16}
                  className="shrink-0 text-blue-700"
                />
                <span className="truncate text-sm font-medium text-blue-800">
                  {selectedProjectName}
                </span>
              </div>
            ) : (
              <p className="text-sm text-slate-400">
                No project selected
              </p>
            )}
          </div>
        </div>

        {loadingProjects && (
          <p className="mt-3 text-sm text-slate-500">
            Loading assigned projects...
          </p>
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
                There are currently no assigned projects available for module
                management.
              </p>
            </div>
          </div>
        )}
      </section>

      {selectedProject && (
        <>
          {/* =====================================================
              MODULE OVERVIEW
          ====================================================== */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <SummaryCard
              icon={Layers3}
              label="Total Modules"
              value={loadingModules ? "..." : modules.length}
              description="Modules in selected project"
            />

            <SummaryCard
              icon={Settings2}
              label="In Progress"
              value={loadingModules ? "..." : inProgressModules}
              description="Modules currently being worked on"
            />

            <SummaryCard
              icon={CheckCircle2}
              label="Completed"
              value={loadingModules ? "..." : completedModules}
              description="Modules marked as completed"
            />
          </section>

          {/* =====================================================
              EXISTING MODULES
          ====================================================== */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <SectionHeading
              icon={ListOrdered}
              title="Existing Modules"
              description={`View and manage modules for ${selectedProjectName}.`}
              action={
                <div className="flex items-center gap-3">
                  <Badge tone="info">
                    {loadingModules
                      ? "Loading..."
                      : `${modules.length} modules`}
                  </Badge>

                  <Button
                    type="button"
                    onClick={openCreateModal}
                    disabled={loadingModules || modalBusy}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Plus size={16} />
                      Add Module
                    </span>
                  </Button>
                </div>
              }
            />

            {loadingModules ? (
              <div className="flex min-h-48 items-center justify-center gap-3 rounded-xl border border-slate-200 bg-slate-50">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
                <span className="text-sm font-medium text-slate-500">
                  Loading modules...
                </span>
              </div>
            ) : modules.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-12 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <Layers3 size={25} />
                </div>

                <h3 className="mt-4 text-base font-semibold text-slate-800">
                  No modules yet
                </h3>

                <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">
                  This project does not have any modules yet. Create the first
                  one to start organizing its features.
                </p>

                <div className="mt-5 flex justify-center">
                  <Button
                    type="button"
                    onClick={openCreateModal}
                    disabled={modalBusy}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Plus size={16} />
                      Create First Module
                    </span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {modules.map((module, index) => (
                  <article
                    key={module.uuid}
                    className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:shadow-sm sm:p-5"
                  >
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
                              {module.name}
                            </h3>

                            <Badge tone={getPriorityTone(module.priority)}>
                              {module.priority}
                            </Badge>

                            <span
                              className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClasses(module.status)}`}
                            >
                              {module.status}
                            </span>
                          </div>

                          <p className="mt-2 text-sm leading-6 text-slate-500">
                            {module.description ||
                              "No description provided."}
                          </p>

                          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-400">
                            <span className="inline-flex items-center gap-1.5">
                              <FileText size={13} />
                              Sort order: {module.sortOrder ?? 0}
                            </span>

                            <span className="break-all">
                              UUID: {module.uuid}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2 border-t border-slate-100 pt-3 lg:border-0 lg:pt-0">
                        <Button
                          type="button"
                          onClick={() => openEditModal(module)}
                          disabled={modalBusy}
                        >
                          <span className="inline-flex items-center gap-2">
                            <Pencil size={14} />
                            Edit
                          </span>
                        </Button>

                        <button
                          type="button"
                          onClick={() => openDeleteModal(module)}
                          disabled={modalBusy}
                          className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 transition hover:border-red-300 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}

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
            aria-labelledby="module-modal-title"
            className="my-auto max-h-[90vh] w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
          >
            <ModalHeader
              mode={modal.mode}
              onClose={closeModal}
              disabled={modalBusy}
            />

            {/* =================================================
                CREATE MODULE MODAL
            ================================================== */}
            {modal.mode === "create" && (
              <form
                onSubmit={addModule}
                className="flex max-h-[calc(90vh-90px)] flex-col"
              >
                <div className="space-y-5 overflow-y-auto p-6">
                  <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                      Selected Project
                    </p>

                    <p className="mt-1 break-words text-sm font-semibold text-slate-800">
                      {selectedProjectName}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      Module Information
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Enter the details required to create this module.
                    </p>
                  </div>

                  <ModuleFormFields
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
                      {creating ? "Creating..." : "Create Module"}
                    </span>
                  </Button>
                </div>
              </form>
            )}

            {/* =================================================
                EDIT MODULE MODAL
            ================================================== */}
            {modal.mode === "edit" && (
              <form
                onSubmit={updateModule}
                className="flex max-h-[calc(90vh-90px)] flex-col"
              >
                <div className="space-y-5 overflow-y-auto p-6">
                  <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                      Selected Project
                    </p>

                    <p className="mt-1 break-words text-sm font-semibold text-slate-800">
                      {selectedProjectName}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      Update Module Information
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Modify the module details and configuration.
                    </p>
                  </div>

                  <ModuleFormFields
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
                DELETE MODULE MODAL
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
                        Confirm module deletion
                      </h3>

                      <p className="mt-1 text-sm leading-6 text-red-700">
                        Are you sure you want to delete{" "}
                        <span className="font-bold">
                          {modal.module?.name}
                        </span>
                        ? This action cannot be undone.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Module Details
                    </p>

                    <p className="mt-2 break-words text-sm font-semibold text-slate-800">
                      {modal.module?.name}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {modal.module?.description ||
                        "No description provided."}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge
                        tone={getPriorityTone(modal.module?.priority)}
                      >
                        {modal.module?.priority}
                      </Badge>

                      <Badge
                        tone={getStatusTone(modal.module?.status)}
                      >
                        {modal.module?.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm font-semibold text-amber-800">
                      Important
                    </p>

                    <p className="mt-1 text-sm leading-6 text-amber-700">
                      Check whether this module contains phases or tasks
                      before deleting it. Related records may be removed by
                      database cascade rules.
                    </p>
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
                    onClick={deleteModule}
                    disabled={deleting}
                    className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 size={15} />
                    {deleting ? "Deleting..." : "Delete Module"}
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

export default ModulesFeatures;