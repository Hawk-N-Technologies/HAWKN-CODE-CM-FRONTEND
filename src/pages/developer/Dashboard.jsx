import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ArrowRightLeft, LoaderCircle } from "lucide-react";

import StatCard from "../../components/cards/StatCard";
import Badge from "../../components/common/Badge";
import AttendanceButton from "../../components/common/AttendanceButton";
import Button from "../../components/common/Button";
import { showToast } from "../../components/common/Toast";

const CLOSED_BUG_STATUSES = ["Fixed", "Closed", "Rejected"];

const getList = (response) => {
  const data = response?.data?.data ?? response?.data ?? [];
  return Array.isArray(data) ? data : [];
};

const getProgress = (value) =>
  Math.max(0, Math.min(100, Number(value) || 0));

export default function Dashboard() {
  const navigate = useNavigate();

  const [canSwitchToLead, setCanSwitchToLead] = useState(false);
  const [checkingModes, setCheckingModes] = useState(true);
  const [switching, setSwitching] = useState(false);

  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [openBugs, setOpenBugs] = useState(null);

  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");

  // Check whether this developer can also access the Project Lead dashboard.
  useEffect(() => {
    let mounted = true;

    const checkModes = async () => {
      try {
        const response = await axios.get("/api/auth/me/modes", {
          withCredentials: true,
        });

        if (mounted) {
          const modes =
            response.data?.data?.modes ?? response.data?.modes ?? [];

          setCanSwitchToLead(
            Array.isArray(modes) &&
              modes.some(
                (mode) => String(mode).toLowerCase() === "project_lead",
              ),
          );
        }
      } catch {
        if (mounted) setCanSwitchToLead(false);
      } finally {
        if (mounted) setCheckingModes(false);
      }
    };

    checkModes();

    return () => {
      mounted = false;
    };
  }, []);

  // Load real developer dashboard data.
  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      setDashboardLoading(true);
      setDashboardError("");

      try {
        const [projectsResponse, tasksResponse] = await Promise.all([
          axios.get("/api/operations/my-projects", {
            withCredentials: true,
          }),
          axios.get("/api/my-tasks", {
            withCredentials: true,
          }),
        ]);

        const projectList = getList(projectsResponse);
        const taskList = getList(tasksResponse);

        // Fetch bugs assigned to the logged-in developer in each assigned project.
        let bugCount = 0;
        let bugsAvailable = true;

        if (projectList.length > 0) {
          const bugResponses = await Promise.all(
            projectList.map(async (project) => {
              if (!project.id) return null;

              try {
                const response = await axios.get(
                  `/api/bugs/projects/${encodeURIComponent(project.id)}/assigned-bugs`,
                  { withCredentials: true },
                );

                return getList(response);
              } catch (error) {
                console.error(
                  `Failed to load assigned bugs for project ${project.id}:`,
                  error,
                );

                bugsAvailable = false;
                return null;
              }
            }),
          );

          if (bugsAvailable) {
            const uniqueBugs = new Map();

            bugResponses.filter(Array.isArray).flat().forEach((bug) => {
              const bugKey = bug.uuid ?? bug.id;

              if (
                bugKey &&
                !CLOSED_BUG_STATUSES.includes(
                  String(bug.status || "").trim(),
                )
              ) {
                uniqueBugs.set(String(bugKey), bug);
              }
            });

            bugCount = uniqueBugs.size;
          }
        }

        if (mounted) {
          setProjects(projectList);
          setTasks(taskList);
          setOpenBugs(
            projectList.length === 0
              ? 0
              : bugsAvailable
                ? bugCount
                : null,
          );
        }
      } catch (error) {
        console.error("Developer dashboard loading failed:", error);

        if (mounted) {
          setDashboardError(
            error.response?.data?.message ||
              "Unable to load developer dashboard data.",
          );
        }
      } finally {
        if (mounted) setDashboardLoading(false);
      }
    };

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  const switchToLead = async () => {
    setSwitching(true);

    try {
      const response = await axios.get("/api/auth/mee", {
        withCredentials: true,
      });

      if (response.data?.data?.allowed !== true) {
        throw new Error("You are not assigned as a project lead.");
      }

      navigate("/project-lead/dashboard");
      showToast.success("Switched to Project Lead dashboard.");
    } catch (error) {
      showToast.error(
        error.response?.data?.message ||
          error.message ||
          "Unable to switch dashboard.",
      );
    } finally {
      setSwitching(false);
    }
  };

  const completedTasks = tasks.filter(
    (task) => task.status === "Done",
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-cm-text">
            Developer Dashboard
          </h1>
          <p className="mt-1 text-sm text-cm-text-muted">
            View your projects, tasks, testing and development progress.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <AttendanceButton />

          {!checkingModes && canSwitchToLead && (
            <Button
              type="button"
              variant="outline"
              loading={switching}
              disabled={switching}
              leftIcon={<ArrowRightLeft size={16} />}
              onClick={switchToLead}
            >
              Switch to Project Lead
            </Button>
          )}

          {checkingModes && (
            <span className="inline-flex items-center gap-2 text-xs text-cm-text-muted">
              <LoaderCircle size={14} className="animate-spin" />
              Checking access
            </span>
          )}
        </div>
      </div>

      {dashboardError && (
        <div className="rounded-cm-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {dashboardError}
        </div>
      )}

      {/* Dynamic developer metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="My Projects"
          value={dashboardLoading ? "—" : projects.length}
        />

        <StatCard
          label="My Tasks"
          value={dashboardLoading ? "—" : tasks.length}
        />

        <StatCard
          label="Completed Tasks"
          value={dashboardLoading ? "—" : completedTasks}
        />

        <StatCard
          label="Open Bugs"
          value={
            dashboardLoading
              ? "—"
              : openBugs === null
                ? "—"
                : openBugs
          }
        />
      </div>

      {/* Dynamic assigned projects */}
      <section className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-cm-text">
              My Projects
            </h2>
            <p className="mt-1 text-xs text-cm-text-muted">
              Projects assigned to you as a project lead or developer.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/developer/projects")}
          >
            View all projects
          </Button>
        </div>

        {dashboardLoading ? (
          <div className="flex min-h-32 items-center justify-center gap-2 text-sm text-cm-text-muted">
            <LoaderCircle size={18} className="animate-spin" />
            Loading projects...
          </div>
        ) : projects.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm font-medium text-cm-text">
              No assigned projects
            </p>
            <p className="mt-1 text-sm text-cm-text-muted">
              Projects assigned to you will appear here.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {projects.slice(0, 5).map((project) => {
              const progress = getProgress(project.progress);

              return (
                <div
                  key={project.uuid || project.id}
                  className="rounded-cm-md border border-cm-border p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-cm-text-muted">
                        {project.assignmentRole || "Assigned project"}
                      </p>

                      <h3 className="mt-1 font-medium text-cm-text">
                        {project.name || "Untitled project"}
                      </h3>

                      <p className="mt-1 text-xs text-cm-text-muted">
                        {project.taskCount ?? 0} total tasks ·{" "}
                        {project.completedTaskCount ?? 0} completed
                      </p>
                    </div>

                    <Badge tone="info">
                      {project.status || "Not specified"}
                    </Badge>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-cm-border">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <p className="mt-2 text-xs text-cm-text-muted">
                    {progress}% task-based progress
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
