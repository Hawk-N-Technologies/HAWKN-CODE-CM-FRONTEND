import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Code2,
  FolderKanban,
  Layers3,
  Save,
  Server,
  Wrench,
} from "lucide-react";

import Button from "../../components/common/Button";
import Select from "../../components/common/Select";
import { showToast } from "../../components/common/Toast";
import {
  getTechStackProjects,
  getProjectTechStack,
  saveProjectTechStack,
} from "../../services/projectLeadTechStackService";

function SectionHeading({ icon: Icon, title, description, count }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Icon size={19} />
        </div>

        <div className="min-w-0">
          <h2 className="text-sm font-bold text-slate-800">{title}</h2>

          {description && (
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {description}
            </p>
          )}
        </div>
      </div>

      {count !== undefined && (
        <span className="inline-flex w-fit shrink-0 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold tabular-nums text-slate-600">
          {count}
        </span>
      )}
    </div>
  );
}

function TechnologyStack() {
  const [projects, setProjects] = useState([]);
  const [projectUuid, setProjectUuid] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);
  const [stack, setStack] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadingStack, setLoadingStack] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadProjects = useCallback(async () => {
    try {
      const result = await getTechStackProjects();

      setProjects(result);

      setProjectUuid((current) =>
        current && result.some((item) => item.uuid === current)
          ? current
          : result[0]?.uuid || "",
      );
    } catch (error) {
      showToast.error(
        error.response?.data?.message || "Could not load projects.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (!projectUuid) {
      setSelectedProject(null);
      setStack("");
      setLoadingStack(false);
      return;
    }

    let cancelled = false;

    setSelectedProject(null);
    setStack("");
    setLoadingStack(true);

    getProjectTechStack(projectUuid)
      .then((result) => {
        if (cancelled) return;

        setSelectedProject(result);
        setStack(result.technologyStack || "");
      })
      .catch((error) => {
        if (!cancelled) {
          showToast.error(
            error.response?.data?.message ||
              "Could not load this project's technology stack.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingStack(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [projectUuid]);

  const save = async (event) => {
    event.preventDefault();

    if (!projectUuid) {
      showToast.error("Select a project first.");
      return;
    }

    if (stack.trim().length > 100) {
      showToast.error("Technology stack must be 100 characters or fewer.");
      return;
    }

    setSaving(true);

    try {
      const response = await saveProjectTechStack(
        projectUuid,
        stack.trim(),
      );

      setSelectedProject(response.data);
      setStack(response.data.technologyStack || "");

      showToast.success("Technology stack saved successfully.");
    } catch (error) {
      showToast.error(
        error.response?.data?.message ||
          "Could not save the technology stack.",
      );
    } finally {
      setSaving(false);
    }
  };

  const technologies = useMemo(
    () =>
      stack
        .split(",")
        .map((technology) => technology.trim())
        .filter(Boolean),
    [stack],
  );

  const selectedProjectName =
    projects.find((project) => project.uuid === projectUuid)?.name || "";

  // Shared Page Header
  const pageHeader = (
    <section className="relative overflow-hidden rounded-[24px] bg-gradient-to-r from-[#080d25] via-[#0b1734] to-[#1b2052] px-6 py-7 shadow-lg sm:px-8">
      <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full border border-white/[0.08]" />
      <div className="pointer-events-none absolute -right-10 -top-20 h-52 w-52 rounded-full border border-white/[0.08]" />
      <div className="pointer-events-none absolute bottom-[-100px] right-[25%] h-48 w-48 rounded-full bg-blue-500/[0.08] blur-3xl" />

      <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <div className="mb-3 flex items-center gap-2">
            <Code2 size={16} className="text-blue-200" />

            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-200">
              Project Management Workspace
            </p>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Technology Stack
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
            Manage and maintain the technologies used across your assigned
            projects.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3 self-start rounded-xl border border-white/10 bg-white/[0.07] px-4 py-3 backdrop-blur-sm sm:self-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-400/15 text-blue-200">
            <FolderKanban size={20} />
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-blue-200">
              Assigned Projects
            </p>

            <p className="mt-0.5 text-2xl font-bold leading-7 tabular-nums text-white">
              {projects.length}
            </p>
          </div>
        </div>
      </div>
    </section>
  );

  // Loading Projects
  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        {pageHeader}

        <section className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-blue-100 border-t-blue-600" />

          <p className="mt-4 text-sm font-semibold text-slate-700">
            Loading Assigned Projects
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Retrieving your project assignments...
          </p>
        </section>
      </div>
    );
  }

  // No Assigned Projects
  if (!projects.length) {
    return (
      <div className="flex flex-col gap-6">
        {pageHeader}

        <section className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <FolderKanban size={25} />
          </div>

          <h2 className="mt-4 text-base font-bold text-slate-800">
            No Assigned Projects
          </h2>

          <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
            No projects are currently assigned to you as Project Lead.
            Assigned projects will appear here when available.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {pageHeader}

      {/* Project Selection */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
          <SectionHeading
            icon={FolderKanban}
            title="Project Selection"
            description="Choose an assigned project to view and manage its technology stack."
          />
        </div>

        <div className="grid grid-cols-1 gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(220px,0.7fr)] lg:items-end">
          <div className="min-w-0">
            <Select
              label="Select Project"
              value={projectUuid}
              disabled={saving}
              options={projects.map((project) => ({
                value: project.uuid,
                label: project.name,
              }))}
              onChange={(event) => setProjectUuid(event.target.value)}
            />
          </div>

          <div className="flex min-h-[44px] items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Layers3 size={17} />
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Selected Project
              </p>

              <p className="mt-0.5 truncate text-sm font-semibold text-slate-700">
                {selectedProjectName || "No project selected"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* No Project Selected */}
      {!projectUuid && (
        <section className="flex flex-col items-center justify-center rounded-2xl border border-blue-200 bg-blue-50/60 px-6 py-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
            <Code2 size={22} />
          </div>

          <h2 className="mt-4 text-sm font-bold text-slate-800">
            Select a Project to Continue
          </h2>

          <p className="mt-2 max-w-md text-xs leading-5 text-slate-500">
            Choose a project from the selector above to view its current
            technology stack or configure its technologies.
          </p>
        </section>
      )}

      {/* Loading Selected Project */}
      {projectUuid && loadingStack && (
        <section className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-blue-100 border-t-blue-600" />

          <p className="mt-4 text-sm font-semibold text-slate-700">
            Loading Technology Stack
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Fetching the selected project's technology information...
          </p>
        </section>
      )}

      {/* Technology Stack Content */}
      {projectUuid && !loadingStack && selectedProject && (
        <form onSubmit={save} className="flex flex-col gap-6">
          {/* Project Information */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
              <SectionHeading
                icon={Server}
                title="Project Information"
                description="Review the selected project's current status before updating its technology stack."
              />
            </div>

            <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:p-6">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Project Name
                </p>

                <p className="mt-2 break-words text-sm font-bold text-slate-800">
                  {selectedProjectName || "Not available"}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Project Status
                </p>

                <div className="mt-2">
                  <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                    {selectedProject.status}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Technology Editor */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
              <SectionHeading
                icon={Wrench}
                title="Technology Configuration"
                description="Define the technologies and tools used to develop and maintain this project."
              />
            </div>

            <div className="flex flex-col gap-5 p-5 sm:p-6">
              <div>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <label
                    htmlFor="technology-stack"
                    className="text-sm font-semibold text-slate-700"
                  >
                    Technologies
                  </label>

                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Comma-separated values
                  </span>
                </div>

                <p className="mb-3 text-xs leading-5 text-slate-500">
                  Enter technologies separated by commas, for example:
                  React, Node.js, PostgreSQL, Docker.
                </p>

                <textarea
                  id="technology-stack"
                  value={stack}
                  maxLength={100}
                  rows={4}
                  disabled={saving}
                  onChange={(event) => setStack(event.target.value)}
                  placeholder="React, Node.js, PostgreSQL..."
                  className="w-full resize-y rounded-xl border border-slate-300 bg-white p-4 text-sm leading-6 text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                />

                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="text-[11px] text-slate-400">
                    Maximum 100 characters.
                  </p>

                  <p
                    className={`text-xs font-semibold tabular-nums ${
                      stack.length >= 90
                        ? "text-amber-600"
                        : "text-slate-500"
                    }`}
                  >
                    {stack.length}/100
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Technology Preview */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
              <SectionHeading
                icon={Code2}
                title="Technology Stack Preview"
                description="Review the technologies extracted from your current input."
                count={`${technologies.length} Technologies`}
              />
            </div>

            <div className="p-5 sm:p-6">
              {technologies.length > 0 ? (
                <div className="flex flex-wrap gap-2.5">
                  {technologies.map((technology, index) => (
                    <span
                      key={`${technology}-${index}`}
                      className="inline-flex min-h-[36px] items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-800"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                      {technology}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center">
                  <Code2 size={23} className="text-slate-400" />

                  <p className="mt-3 text-sm font-semibold text-slate-700">
                    No Technologies Added
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Enter comma-separated technologies above to see the
                    preview here.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Save Technology Stack */}
          <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={19} />
              </div>

              <div>
                <p className="text-sm font-bold text-slate-800">
                  Ready to Save Technology Stack?
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Save the updated technology configuration for the selected
                  project.
                </p>
              </div>
            </div>

            <div className="flex w-full justify-end sm:w-auto">
              <Button
                type="submit"
                loading={saving}
                disabled={saving}
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <Save size={16} />
                  {saving ? "Saving Stack..." : "Save Technology Stack"}
                </span>
              </Button>
            </div>
          </section>
        </form>
      )}
    </div>
  );
}

export default TechnologyStack;