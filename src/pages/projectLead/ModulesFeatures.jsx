import { useEffect, useState } from "react";
import axios from "axios";
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
          showToast.error(getErrorMessage(error, "Failed to load projects."));
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
          showToast.error(getErrorMessage(error, "Failed to load modules."));
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
    if (saving || deleting) return;

    setModal({
      open: false,
      mode: "",
      module: null,
    });

    setEditForm(EMPTY_FORM);
  };

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
      showToast.success("Module created successfully.");
    } catch (error) {
      showToast.error(getErrorMessage(error, "Failed to create module."));
    } finally {
      setCreating(false);
    }
  };

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

  const openDeleteModal = (module) => {
    setModal({
      open: true,
      mode: "delete",
      module,
    });
  };

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
      showToast.error("This module name already exists in the project.");
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
            (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.id - b.id,
          ),
      );

      setModal({ open: false, mode: "", module: null });
      setEditForm(EMPTY_FORM);
      showToast.success("Module updated successfully.");
    } catch (error) {
      showToast.error(getErrorMessage(error, "Failed to update module."));
    } finally {
      setSaving(false);
    }
  };

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

      setModal({ open: false, mode: "", module: null });
      showToast.success("Module deleted successfully.");
    } catch (error) {
      showToast.error(getErrorMessage(error, "Failed to delete module."));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-cm-text">Modules</h1>
        <p className="mt-1 text-sm text-cm-text-muted">
          Organize project modules and manage their status.
        </p>
      </div>

      <section className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm">
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
          disabled={loadingProjects || creating || saving || deleting}
        />

        {loadingProjects && (
          <p className="mt-3 text-sm text-cm-text-muted">Loading projects...</p>
        )}

        {!loadingProjects && projects.length === 0 && (
          <p className="mt-3 text-sm text-cm-text-muted">
            No projects available.
          </p>
        )}
      </section>

      {selectedProject && (
        <>
          <form
            onSubmit={addModule}
            className="grid grid-cols-1 gap-4 rounded-cm-lg border border-cm-border bg-cm-card p-6 shadow-sm md:grid-cols-2"
          >
            <div className="md:col-span-2">
              <h2 className="font-semibold text-cm-text">Create Module</h2>
              <p className="mt-1 text-sm text-cm-text-muted">
                Adding to {selectedProjectName}.
              </p>
            </div>

            <Input
              label="Module Name"
              value={form.name}
              onChange={(e) => updateFormField("name", e.target.value)}
              placeholder="e.g. Plot Map"
              required
              disabled={creating || loadingModules}
            />

            <Select
              label="Priority"
              value={form.priority}
              options={PRIORITIES}
              onChange={(e) => updateFormField("priority", e.target.value)}
              disabled={creating}
            />

            <Input
              label="Description"
              value={form.description}
              onChange={(e) => updateFormField("description", e.target.value)}
              placeholder="Describe this module"
              disabled={creating}
            />

            <Select
              label="Status"
              value={form.status}
              options={STATUSES}
              onChange={(e) => updateFormField("status", e.target.value)}
              disabled={creating}
            />

            <Input
              label="Sort Order"
              type="number"
              value={form.sortOrder}
              onChange={(e) =>
                updateFormField(
                  "sortOrder",
                  e.target.value === "" ? "" : Number(e.target.value),
                )
              }
              disabled={creating}
            />

            <div className="flex items-end justify-end">
              <Button
                type="submit"
                disabled={creating || loadingModules}
                loading={creating}
              >
                {creating ? "Creating..." : "Create Module"}
              </Button>
            </div>
          </form>

          <section>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-cm-text">Existing Modules</h2>
                <p className="mt-1 text-sm text-cm-text-muted">
                  {selectedProjectName}
                </p>
              </div>

              <Badge tone="info">
                {loadingModules ? "Loading..." : `${modules.length} modules`}
              </Badge>
            </div>

            {loadingModules ? (
              <div className="flex items-center justify-center gap-3 rounded-cm-lg border border-cm-border bg-cm-card p-12">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-cm-border border-t-blue-600" />
                <span className="text-sm text-cm-text-muted">
                  Loading modules...
                </span>
              </div>
            ) : modules.length === 0 ? (
              <div className="rounded-cm-lg border border-dashed border-cm-border bg-cm-card p-10 text-center">
                <h3 className="font-semibold text-cm-text">No modules yet</h3>
                <p className="mt-1 text-sm text-cm-text-muted">
                  Create the first module for this project.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {modules.map((module) => (
                  <article
                    key={module.uuid}
                    className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-cm-text">
                            {module.name}
                          </h3>
                          <Badge tone={getPriorityTone(module.priority)}>
                            {module.priority}
                          </Badge>
                          <Badge tone={getStatusTone(module.status)}>
                            {module.status}
                          </Badge>
                        </div>

                        <p className="mt-2 text-sm text-cm-text-muted">
                          {module.description || "No description provided."}
                        </p>

                        <p className="mt-3 text-xs text-cm-text-muted">
                          UUID: {module.uuid}
                        </p>

                        <p className="mt-1 text-xs text-cm-text-muted">
                          Sort order: {module.sortOrder ?? 0}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <Button
                          type="button"
                          onClick={() => openEditModal(module)}
                          disabled={saving || deleting}
                        >
                          Edit
                        </Button>

                        <button
                          type="button"
                          onClick={() => openDeleteModal(module)}
                          disabled={saving || deleting}
                          className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
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
            aria-labelledby="module-modal-title"
            className="my-auto max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl border border-cm-border bg-cm-card p-6 shadow-xl"
          >
            {modal.mode === "edit" ? (
              <>
                <div className="mb-5">
                  <h2
                    id="module-modal-title"
                    className="text-lg font-bold text-cm-text"
                  >
                    Edit Module
                  </h2>
                  <p className="mt-1 text-sm text-cm-text-muted">
                    Update module details for {selectedProjectName}.
                  </p>
                </div>

                <form onSubmit={updateModule} className="space-y-4">
                  <Input
                    label="Module Name"
                    value={editForm.name}
                    onChange={(e) => updateEditField("name", e.target.value)}
                    required
                    disabled={saving}
                  />

                  <Input
                    label="Description"
                    value={editForm.description}
                    onChange={(e) =>
                      updateEditField("description", e.target.value)
                    }
                    disabled={saving}
                  />

                  <Select
                    label="Priority"
                    value={editForm.priority}
                    options={PRIORITIES}
                    onChange={(e) =>
                      updateEditField("priority", e.target.value)
                    }
                    disabled={saving}
                  />

                  <Select
                    label="Status"
                    value={editForm.status}
                    options={STATUSES}
                    onChange={(e) => updateEditField("status", e.target.value)}
                    disabled={saving}
                  />

                  <Input
                    label="Sort Order"
                    type="number"
                    value={editForm.sortOrder}
                    onChange={(e) =>
                      updateEditField(
                        "sortOrder",
                        e.target.value === "" ? "" : Number(e.target.value),
                      )
                    }
                    disabled={saving}
                  />

                  <div className="flex justify-end gap-3 pt-2">
                    <Button
                      type="button"
                      onClick={closeModal}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={saving} loading={saving}>
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <h2
                  id="module-modal-title"
                  className="text-lg font-bold text-cm-text"
                >
                  Delete Module
                </h2>

                <p className="mt-3 text-sm leading-6 text-cm-text-muted">
                  Are you sure you want to delete{" "}
                  <span className="font-semibold text-cm-text">
                    {modal.module?.name}
                  </span>
                  ? This action cannot be undone.
                </p>

                <p className="mt-2 text-sm text-red-600">
                  Check whether this module contains phases or tasks before
                  deleting it. Related records may be removed by database
                  cascade rules.
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
                    onClick={deleteModule}
                    disabled={deleting}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
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
