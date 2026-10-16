import { useEffect, useState } from "react";
import axios from "axios";
import Select from "../../components/common/Select";
import Input from "../../components/common/Input";
import Textarea from "../../components/common/TextArea";
import Button from "../../components/common/Button";
import { showToast } from "../../components/common/Toast";

export default function BugFixing() {
  const [projects, setProjects] = useState([]);
  const [modules, setModules] = useState([]);
  const [phases, setPhases] = useState([]);
  const [tasks, setTasks] = useState([]);

  const [projectId, setProjectId] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [phaseId, setPhaseId] = useState("");
  const [taskId, setTaskId] = useState("");

  const [bugs, setBugs] = useState({});
  const [form, setForm] = useState({
    title: "",
    severity: "Medium",
    notes: "",
  });

  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingModules, setLoadingModules] = useState(false);
  const [loadingPhases, setLoadingPhases] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);

  // Supports APIs returning either { data: [...] } or [...]
  const getList = (response) => {
    const payload = response.data?.data ?? response.data;

    if (Array.isArray(payload)) return payload;

    // Also supports { data: { tasks: [...] } }
    if (Array.isArray(payload?.tasks)) return payload.tasks;

    return [];
  };

  // Fetch projects
  useEffect(() => {
    let active = true;

    const fetchProjects = async () => {
      setLoadingProjects(true);

      try {
        const response = await axios.get(
          "/api/project-lead/planning/projects",
          { withCredentials: true },
        );

        if (active) setProjects(getList(response));
      } catch (error) {
        if (active) {
          showToast.error(
            error.response?.data?.message || "Failed to load projects.",
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

  // Fetch modules when project changes
  useEffect(() => {
    let active = true;

    setModules([]);
    setPhases([]);
    setTasks([]);
    setModuleId("");
    setPhaseId("");
    setTaskId("");

    if (!projectId) return;

    const fetchModules = async () => {
      setLoadingModules(true);

      try {
        const response = await axios.get(`/api/projects/${projectId}/modules`, {
          withCredentials: true,
        });

        if (active) setModules(getList(response));
      } catch (error) {
        if (active) {
          showToast.error(
            error.response?.data?.message || "Failed to load modules.",
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
  }, [projectId]);

  // Fetch phases when module changes
  useEffect(() => {
    let active = true;

    setPhases([]);
    setTasks([]);
    setPhaseId("");
    setTaskId("");

    if (!projectId || !moduleId) return;

    const fetchPhases = async () => {
      setLoadingPhases(true);

      try {
        const response = await axios.get(
          `/api/projects/${projectId}/modules/${moduleId}/phases`,
          { withCredentials: true },
        );

        if (active) setPhases(getList(response));
      } catch (error) {
        if (active) {
          showToast.error(
            error.response?.data?.message || "Failed to load phases.",
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
  }, [projectId, moduleId]);

  // Fetch tasks when phase changes
  useEffect(() => {
    let active = true;

    setTasks([]);
    setTaskId("");

    if (!phaseId) return;

    const fetchTasks = async () => {
      setLoadingTasks(true);

      try {
        const response = await axios.get(`/api/task-dropdown/${phaseId}`, {
          withCredentials: true,
        });

        if (active) setTasks(getList(response));
      } catch (error) {
        if (active) {
          showToast.error(
            error.response?.data?.message || "Failed to load tasks.",
          );
        }
      } finally {
        if (active) setLoadingTasks(false);
      }
    };

    fetchTasks();

    return () => {
      active = false;
    };
  }, [phaseId]);

  // Add a bug locally
  const handleCreateBug = (event) => {
    event.preventDefault();

    if (!taskId || !form.title.trim()) {
      showToast.error("Select a task and enter a bug title.");
      return;
    }

    const newBug = {
      id: Date.now(),
      title: form.title.trim(),
      severity: form.severity,
      status: "Open",
      notes: form.notes.trim(),
    };

    setBugs((previous) => ({
      ...previous,
      [taskId]: [...(previous[taskId] || []), newBug],
    }));

    setForm({
      title: "",
      severity: "Medium",
      notes: "",
    });

    showToast.success("Bug added successfully.");
  };

  const selectedBugs = bugs[taskId] || [];

  return (
    <div className="space-y-6">
      {/* Project, Module, Phase, Task */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Select
          label="Project"
          name="projectId"
          required
          value={projectId}
          options={projects.map((item) => ({
            value: String(item.uuid ?? item.id),
            label: item.name,
          }))}
          placeholder="Select project"
          disabled={loadingProjects}
          onChange={(event) => setProjectId(event.target.value)}
        />

        <Select
          label="Module"
          name="moduleId"
          required
          value={moduleId}
          options={modules.map((item) => ({
            value: String(item.uuid ?? item.id),
            label: item.name,
          }))}
          placeholder={loadingModules ? "Loading modules..." : "Select module"}
          disabled={!projectId || loadingModules}
          onChange={(event) => setModuleId(event.target.value)}
        />

        <Select
          label="Phase"
          name="phaseId"
          required
          value={phaseId}
          options={phases.map((item) => ({
            value: String(item.uuid ?? item.id),
            label: item.name,
          }))}
          placeholder={loadingPhases ? "Loading phases..." : "Select phase"}
          disabled={!moduleId || loadingPhases}
          onChange={(event) => setPhaseId(event.target.value)}
        />

        <Select
          label="Task"
          name="taskId"
          required
          value={taskId}
          options={tasks.map((item) => ({
            value: String(item.uuid ?? item.id),
            label: item.name ?? item.title ?? item.taskName,
          }))}
          placeholder={loadingTasks ? "Loading tasks..." : "Select task"}
          disabled={!phaseId || loadingTasks}
          onChange={(event) => setTaskId(event.target.value)}
        />
      </div>

      {/* Bug form and list */}
      {taskId && (
        <>
          <form
            onSubmit={handleCreateBug}
            className="grid grid-cols-1 gap-4 rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm md:grid-cols-3"
          >
            <Input
              label="Bug Title"
              name="title"
              required
              value={form.title}
              onChange={(event) =>
                setForm({ ...form, title: event.target.value })
              }
              placeholder="Enter bug title"
            />

            <Select
              label="Severity"
              name="severity"
              required
              value={form.severity}
              options={["High", "Medium", "Low"].map((value) => ({
                value,
                label: value,
              }))}
              onChange={(event) =>
                setForm({ ...form, severity: event.target.value })
              }
            />

            <Textarea
              label="Notes"
              name="notes"
              value={form.notes}
              onChange={(event) =>
                setForm({ ...form, notes: event.target.value })
              }
              placeholder="Describe the bug (optional)"
            />

            <div className="flex justify-end md:col-span-3">
              <Button type="submit">Add Bug</Button>
            </div>
          </form>

          <div className="space-y-3">
            <h2 className="font-semibold text-cm-text">
              Bugs ({selectedBugs.length})
            </h2>

            {selectedBugs.length === 0 ? (
              <p className="text-sm text-cm-text-muted">
                No bugs found for this task.
              </p>
            ) : (
              selectedBugs.map((bug) => (
                <article
                  key={bug.id}
                  className="rounded-cm-lg border border-cm-border bg-cm-card p-4"
                >
                  <h3 className="font-medium text-cm-text">{bug.title}</h3>

                  <p className="mt-2 text-sm text-cm-text-muted">
                    Severity: {bug.severity} · Status: {bug.status}
                  </p>

                  {bug.notes && (
                    <p className="mt-2 text-sm text-cm-text-muted">
                      {bug.notes}
                    </p>
                  )}
                </article>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
