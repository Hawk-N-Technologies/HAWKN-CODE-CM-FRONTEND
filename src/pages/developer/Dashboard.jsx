import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  ArrowRightLeft,
  LoaderCircle,
  FolderKanban,
  CheckCircle2,
  Sparkles,
  BriefcaseBusiness,
} from "lucide-react";

import StatCard from "../../components/cards/StatCard";
import Badge from "../../components/common/Badge";
import AttendanceButton from "../../components/common/AttendanceButton";
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
                (mode) => String(mode).toLowerCase() === "project_lead"
              )
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
                  { withCredentials: true }
                );

                return getList(response);
              } catch (error) {
                console.error(
                  `Failed to load assigned bugs for project ${project.id}:`,
                  error
                );

                bugsAvailable = false;
                return null;
              }
            })
          );

          if (bugsAvailable) {
            const uniqueBugs = new Map();

            bugResponses
              .filter(Array.isArray)
              .flat()
              .forEach((bug) => {
                const bugKey = bug.uuid ?? bug.id;

                if (
                  bugKey &&
                  !CLOSED_BUG_STATUSES.includes(
                    String(bug.status || "").trim()
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
                : null
          );
        }
      } catch (error) {
        console.error("Developer dashboard loading failed:", error);

        if (mounted) {
          setDashboardError(
            error.response?.data?.message ||
              "Unable to load developer dashboard data."
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
          "Unable to switch dashboard."
      );
    } finally {
      setSwitching(false);
    }
  };

  const completedTasks = tasks.filter(
    (task) => task.status === "Done"
  ).length;

  return (
    <div className="flex flex-col gap-6">
      {/* =====================================================
          STANDARD NAVY DEVELOPER PAGE HEADER
      ===================================================== */}
      <section className="relative isolate overflow-hidden rounded-[28px] border border-slate-800 bg-gradient-to-br from-[#080d25] via-[#0b1734] to-[#1b2052] px-6 py-7 text-white shadow-[0_18px_45px_rgba(15,23,42,0.16)] sm:px-8 sm:py-8">
        {/* Decorative background rings */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-24 -z-10 h-[290px] w-[290px] rounded-full border border-white/10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-5 -top-20 -z-10 h-[220px] w-[220px] rounded-full border border-white/10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 -z-20 w-1/3 bg-gradient-to-l from-indigo-500/10 to-transparent"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-[-100px] left-[38%] -z-10 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl"
        />

        <div className="relative z-10 flex flex-col justify-between gap-7 xl:flex-row xl:items-end">
          {/* Page identity */}
          <div className="min-w-0">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-100">
              <Sparkles size={13} />
              Personal Workspace
            </div>

            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-[34px]">
              Developer Dashboard
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 sm:text-[15px]">
              Monitor your assigned projects, tasks and development progress
              from one place.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-slate-300">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Developer workspace
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-2">
                <FolderKanban size={14} className="text-blue-300" />
                {dashboardLoading ? "Loading projects..." : `${projects.length} assigned projects`}
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-2">
                <CheckCircle2 size={14} className="text-emerald-300" />
                Live dashboard data
              </span>
            </div>
          </div>

          {/* Header actions */}
          <div className="relative z-10 flex shrink-0 flex-wrap items-center gap-3 xl:justify-end">
            <AttendanceButton />

            {!checkingModes && canSwitchToLead && (
              <button
                type="button"
                onClick={switchToLead}
                disabled={switching}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.09] px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm backdrop-blur-sm transition-colors hover:border-white/25 hover:bg-white/[0.16] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {switching ? (
                  <LoaderCircle size={15} className="animate-spin" />
                ) : (
                  <ArrowRightLeft size={15} />
                )}

                {switching ? "Switching..." : "Switch to Project Lead"}
              </button>
            )}

            {checkingModes && (
              <span className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-white/15 bg-white/[0.07] px-3 text-[11px] text-slate-300">
                <LoaderCircle size={13} className="animate-spin" />
                Checking access
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Dashboard Error */}
      {dashboardError && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          <p className="font-semibold">Dashboard data unavailable</p>
          <p className="mt-1">{dashboardError}</p>
        </div>
      )}

      {/* =====================================================
          PERFORMANCE OVERVIEW
      ===================================================== */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-[#101b32] sm:text-xl">
              Performance Overview
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Key development and workload metrics.
            </p>
          </div>

          <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-500">
            Current totals
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
      </section>

      {/* =====================================================
          MY PROJECTS
      ===================================================== */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <FolderKanban size={19} />
            </div>

            <div>
              <h2 className="text-sm font-bold text-[#101b32] sm:text-base">
                My Projects
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Projects assigned to you as a project lead or developer.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/developer/projects")}
            className="inline-flex min-h-[36px] items-center justify-center rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          >
            View all projects
          </button>
        </div>

        <div className="p-4 sm:p-5">
          {dashboardLoading ? (
            <div className="flex min-h-32 items-center justify-center gap-2 text-sm text-slate-500">
              <LoaderCircle
                size={18}
                className="animate-spin text-blue-600"
              />
              Loading projects...
            </div>
          ) : projects.length === 0 ? (
            <div className="flex min-h-36 flex-col items-center justify-center text-center">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <FolderKanban size={20} />
              </div>

              <h3 className="text-sm font-semibold text-[#101b32]">
                No assigned projects
              </h3>

              <p className="mt-1 max-w-sm text-xs text-slate-500">
                Projects assigned to you will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              {projects.slice(0, 5).map((project) => {
                const progress = getProgress(project.progress);

                return (
                  <article
                    key={project.uuid || project.id}
                    className="rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-blue-200"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          {project.assignmentRole || "Assigned project"}
                        </p>

                        <h3 className="mt-1 text-sm font-semibold text-[#101b32]">
                          {project.name || "Untitled project"}
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                          {project.taskCount ?? 0} total tasks
                          <span className="mx-1.5 text-slate-300">·</span>
                          {project.completedTaskCount ?? 0} completed
                        </p>
                      </div>

                      <Badge tone="info">
                        {project.status || "Not specified"}
                      </Badge>
                    </div>

                    <div className="mt-4">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="text-xs font-medium text-slate-500">
                          Project progress
                        </span>
                        <span className="text-xs font-bold tabular-nums text-[#101b32]">
                          {progress}%
                        </span>
                      </div>

                      <div
                        className="h-2 overflow-hidden rounded-full bg-slate-100"
                        role="progressbar"
                        aria-label={`${project.name || "Project"} progress`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={progress}
                      >
                        <div
                          className="h-full rounded-full bg-blue-600 transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
                        <CheckCircle2
                          size={13}
                          className="text-emerald-600"
                        />
                        Task-based progress
                      </span>

                      <span className="text-[11px] font-medium text-slate-500">
                        {project.completedTaskCount ?? 0}/
                        {project.taskCount ?? 0} tasks
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {!dashboardLoading && projects.length > 5 && (
            <div className="mt-4 border-t border-slate-100 pt-3 text-center">
              <button
                type="button"
                onClick={() => navigate("/developer/projects")}
                className="text-xs font-semibold text-blue-700 transition-colors hover:text-blue-800"
              >
                View all {projects.length} projects
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
