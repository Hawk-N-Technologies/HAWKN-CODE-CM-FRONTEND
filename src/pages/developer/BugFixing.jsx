import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { RefreshCw, Save, Bug, CalendarDays, AlertCircle } from "lucide-react";
import Select from "../../components/common/Select";
import Button from "../../components/common/Button";
import { showToast } from "../../components/common/Toast";

// Keep these values aligned with the statuses accepted by your backend.
const DEVELOPER_STATUSES = ["Assigned", "In Progress", "Fixed"];
const STATUS_STYLES = {
  Assigned: "bg-blue-50 text-blue-700 ring-blue-200",
  "In Progress": "bg-amber-50 text-amber-700 ring-amber-200",
  Fixed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};
const SEVERITY_STYLES = {
  Low: "bg-gray-100 text-gray-700",
  Medium: "bg-blue-50 text-blue-700",
  High: "bg-orange-50 text-orange-700",
  Critical: "bg-red-50 text-red-700",
};

const getPayload = (response) => response?.data?.data ?? response?.data;
const getList = (response) => {
  const payload = getPayload(response);
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.bugs)) return payload.bugs;
  return [];
};

const normalizeBug = (bug) => ({
  ...bug,
  id: bug.uuid ?? bug.id,
  title: bug.title ?? "Untitled bug",
  description: bug.description ?? "",
  severity: bug.severity ?? "Medium",
  status: bug.status ?? "Assigned",
  createdAt: bug.createdAt ?? bug.created_at ?? null,
});

// The dropdown uses the project's public UUID, like Bugs.jsx. The assigned-bugs
// controller expects the internal numeric projects.id, so keep both values.
const getProjectUuid = (project) => String(project?.uuid ?? project?.id ?? "");

export default function BugFixing() {
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState("");
  const [projectMap, setProjectMap] = useState({});
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingBugId, setSavingBugId] = useState(null);
  const [statusChanges, setStatusChanges] = useState({});

  useEffect(() => {
    let active = true;

    const fetchProjects = async () => {
      setLoadingProjects(true);
      try {
        // Use the same project dropdown source and UUID -> numeric ID mapping
        // as Bugs.jsx. The assigned-bugs controller calls Number(projectId).
        const response = await axios.get("/api/bugs/projects-dropdown", {
          withCredentials: true,
        });
        const payload = getPayload(response);
        const list = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.projects)
            ? payload.projects
            : [];
        const idMap = Object.fromEntries(
          list.map((project) => [getProjectUuid(project), project.id]),
        );

        if (active) {
          setProjects(list);
          setProjectMap(idMap);
          if (list.length) {
            setProjectId((current) => current || getProjectUuid(list[0]));
          }
        }
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

  const fetchAssignedBugs = useCallback(async () => {
    if (!projectId) {
      setBugs([]);
      setStatusChanges({});
      return;
    }

    setLoading(true);
    try {
      const numericProjectId = projectMap[projectId];
      if (!numericProjectId) {
        setBugs([]);
        showToast.error("Could not resolve the selected project ID.");
        return;
      }

      // This controller expects the internal numeric projects.id, not UUID.
      const response = await axios.get(
        `/api/bugs/projects/${encodeURIComponent(numericProjectId)}/assigned-bugs`,
        { withCredentials: true },
      );
      const list = getList(response).map(normalizeBug);
      setBugs(list);
      setStatusChanges({});
    } catch (error) {
      showToast.error(
        error.response?.data?.message || "Failed to load assigned bugs.",
      );
    } finally {
      setLoading(false);
    }
  }, [projectId, projectMap]);

  useEffect(() => {
    fetchAssignedBugs();
  }, [fetchAssignedBugs]);

  const handleStatusSave = async (bug) => {
    const nextStatus = statusChanges[bug.id] ?? bug.status;
    if (nextStatus === bug.status) {
      showToast.error("Choose a different status before saving.");
      return;
    }

    setSavingBugId(bug.id);

    try {
      const res = await axios.put(
        `/api/bugs/developer/${bug.uuid}/status`,
        { status: nextStatus },
        { withCredentials: true },
      );

      if (res.status == 200) {
        showToast.success("Bug status updated successfully.");
        await fetchAssignedBugs();
      }
    } catch (error) {
      showToast.error(
        error.response?.data?.message || "Failed to update bug status.",
      );
    } finally {
      setSavingBugId(null);
    }
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-cm-text">Bug Fixing</h2>
          <p className="text-sm text-cm-text-muted">
            Bugs assigned to you in this project.
          </p>
        </div>
        <Button
          type="button"
          onClick={fetchAssignedBugs}
          disabled={loading || !projectId}
        >
          <span className="inline-flex items-center gap-2">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </span>
        </Button>
      </div>

      <section className="rounded-cm-lg border border-cm-border bg-cm-card p-5">
        <Select
          label="Project"
          name="projectId"
          required
          value={projectId}
          options={projects.map((project) => ({
            value: getProjectUuid(project),
            label:
              project.name ??
              project.projectName ??
              `Project ${getProjectUuid(project)}`,
          }))}
          placeholder={
            loadingProjects ? "Loading projects..." : "Select project"
          }
          disabled={loadingProjects}
          onChange={(eventOrValue) => {
            const value = eventOrValue?.target?.value ?? eventOrValue;
            setProjectId(value);
            setBugs([]);
            setStatusChanges({});
          }}
        />
      </section>

      {!projectId ? (
        <div className="rounded-cm-lg border border-dashed border-cm-border p-8 text-center text-sm text-cm-text-muted">
          Select a project to view your assigned bugs.
        </div>
      ) : null}

      <div className="rounded-cm-lg border border-cm-border bg-cm-card p-4">
        <p className="text-sm text-cm-text-muted">Assigned bugs</p>
        <p className="mt-1 text-2xl font-semibold text-cm-text">
          {bugs.length}
        </p>
      </div>

      {!projectId ? null : loading ? (
        <p className="py-8 text-center text-sm text-cm-text-muted">
          Loading assigned bugs...
        </p>
      ) : bugs.length === 0 ? (
        <div className="rounded-cm-lg border border-dashed border-cm-border p-8 text-center">
          <Bug className="mx-auto mb-2 text-cm-text-muted" size={28} />
          <p className="font-medium text-cm-text">No assigned bugs found</p>
          <p className="mt-1 text-sm text-cm-text-muted">
            Bugs assigned to you for this project will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {bugs.map((bug) => {
            const selectedStatus = statusChanges[bug.id] ?? bug.status;
            const isSaving = savingBugId === bug.id;

            return (
              <article
                key={bug.id}
                className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-cm-text">{bug.title}</h3>
                    {bug.description && (
                      <p className="mt-2 whitespace-pre-wrap text-sm text-cm-text-muted">
                        {bug.description}
                      </p>
                    )}
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${SEVERITY_STYLES[bug.severity] ?? SEVERITY_STYLES.Medium}`}
                  >
                    <AlertCircle className="mr-1 inline" size={13} />
                    {bug.severity}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-cm-text-muted">
                  <span
                    className={`rounded-full px-2.5 py-1 font-medium ring-1 ring-inset ${STATUS_STYLES[bug.status] ?? "bg-gray-100 text-gray-700 ring-gray-200"}`}
                  >
                    {bug.status}
                  </span>
                  {bug.createdAt && (
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays size={14} />
                      {new Date(bug.createdAt).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <div className="mt-4 flex flex-col gap-3 border-t border-cm-border pt-4 sm:flex-row sm:items-end">
                  <div className="w-full sm:max-w-xs">
                    <Select
                      label="Update status"
                      name={`status-${bug.id}`}
                      value={selectedStatus}
                      options={DEVELOPER_STATUSES.map((status) => ({
                        value: status,
                        label: status,
                      }))}
                      onChange={(eventOrValue) => {
                        const value =
                          eventOrValue?.target?.value ?? eventOrValue;
                        setStatusChanges((previous) => ({
                          ...previous,
                          [bug.id]: value,
                        }));
                      }}
                      disabled={isSaving}
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={() => handleStatusSave(bug)}
                    disabled={isSaving || selectedStatus === bug.status}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Save size={16} />
                      {isSaving ? "Saving..." : "Save Status"}
                    </span>
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
