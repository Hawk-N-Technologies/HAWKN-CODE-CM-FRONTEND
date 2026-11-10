import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  CircleDashed,
  Code2,
  FileText,
  Layers3,
  RefreshCw,
  Save,
  Search,
  Users,
  UserRound,
} from "lucide-react";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Select from "../../components/common/Select";
import Loader from "../../components/common/Loader";
import MultiSelect from "../../components/common/MultiSelect";
import { showToast } from "../../components/common/Toast";

const API_URL = "/api/operations";

const EMPTY_ASSIGNMENTS = {
  lead: "",
  testers: [],
  developers: [],
  technology: "",
};

const TECHNOLOGY_OPTIONS = [
  { value: "MERN", label: "MERN Stack" },
  { value: ".NET + React", label: ".NET + React" },
  { value: "Java + React", label: "Java + React" },
];

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong. Please try again."
  );
}

function getEmployeeName(employee) {
  const user = employee?.user || {};
  return (
    user.name ||
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    employee?.name ||
    employee?.companyEmail ||
    user.email ||
    `Employee ${employee?.id ?? ""}`
  );
}

function getEmployeeEmail(employee) {
  return (
    employee?.user?.email || employee?.email || employee?.companyEmail || ""
  );
}

function getClientName(project) {
  const user = project?.client?.user || {};
  return (
    user.name ||
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    project?.client?.name ||
    "Client"
  );
}

function getProjectName(project) {
  return project?.name || project?.projectName || "Untitled project";
}

function getProjectCode(project) {
  return (
    project?.projectCode ||
    project?.code ||
    project?.uuid ||
    `PRJ-${project?.id}`
  );
}

function getPlanAssignments(project) {
  const plan = project?.operationsPlan;
  const getEmployeeId = (item) =>
    item?.employeeId ?? item?.employee_id ?? item?.employee?.id ?? item?.id;

  return {
    lead: plan?.projectLeadId
      ? String(plan.projectLeadId)
      : plan?.project_lead_id
        ? String(plan.project_lead_id)
        : "",
    testers: (plan?.testers || [])
      .map(getEmployeeId)
      .filter(Boolean)
      .map(String),
    developers: (plan?.developers || [])
      .map(getEmployeeId)
      .filter(Boolean)
      .map(String),
    technology: plan?.technologyStack || plan?.technology_stack || "",
  };
}

function getPlanningStatus(project) {
  const status = project?.operationsPlan?.planningStatus;

  if (status === "COMPLETED") {
    return { label: "Completed", tone: "success" };
  }

  if (status === "IN_PROGRESS") {
    return { label: "In progress", tone: "warning" };
  }

  return project?.operationsPlan
    ? { label: "Not started", tone: "neutral" }
    : { label: "Not planned", tone: "neutral" };
}

function SectionHeading({ icon: Icon, title, description }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700">
        <Icon size={18} />
      </span>

      <div className="min-w-0">
        <h2 className="text-base font-semibold tracking-tight text-slate-900">
          {title}
        </h2>

        {description && (
          <p className="mt-1 text-sm leading-5 text-slate-500">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, detail }) {
  return (
    <article className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>

          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
        </div>

        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700 transition-colors group-hover:bg-blue-100">
          <Icon size={19} />
        </span>
      </div>

      {detail && (
        <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>
      )}
    </article>
  );
}

function Operations() {
  const [projects, setProjects] = useState([]);
  const [options, setOptions] = useState({
    projectLeads: [],
    developers: [],
    testers: [],
  });

  const [selectedId, setSelectedId] = useState("");
  const selectedIdRef = useRef("");

  const [assignments, setAssignments] = useState({
    ...EMPTY_ASSIGNMENTS,
  });

  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const [projectsResponse, optionsResponse] = await Promise.all([
        axios.get(`${API_URL}/projects`, { withCredentials: true }),
        axios.get(`${API_URL}/options`, { withCredentials: true }),
      ]);

      if (projectsResponse.data?.success === false) {
        throw new Error(
          projectsResponse.data?.message || "Could not load projects.",
        );
      }

      if (optionsResponse.data?.success === false) {
        throw new Error(
          optionsResponse.data?.message || "Could not load assignment options.",
        );
      }

      const projectRecords = Array.isArray(projectsResponse.data?.data)
        ? projectsResponse.data.data
        : [];

      const employeeOptions = optionsResponse.data?.data || {};

      setProjects(projectRecords);

      setOptions({
        projectLeads: Array.isArray(employeeOptions.projectLeads)
          ? employeeOptions.projectLeads
          : [],
        developers: Array.isArray(employeeOptions.developers)
          ? employeeOptions.developers
          : [],
        testers: Array.isArray(employeeOptions.testers)
          ? employeeOptions.testers
          : [],
      });

      const selectedProject =
        projectRecords.find(
          (project) => String(project.id) === selectedIdRef.current,
        ) ||
        projectRecords[0] ||
        null;

      const nextId = selectedProject ? String(selectedProject.id) : "";

      selectedIdRef.current = nextId;
      setSelectedId(nextId);

      setAssignments(
        selectedProject
          ? getPlanAssignments(selectedProject)
          : { ...EMPTY_ASSIGNMENTS },
      );
    } catch (requestError) {
      const message = getErrorMessage(requestError);
      setError(message);
      showToast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedProject = useMemo(
    () =>
      projects.find((project) => String(project.id) === selectedId) || null,
    [projects, selectedId],
  );

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return projects;

    return projects.filter((project) =>
      [
        getProjectName(project),
        getProjectCode(project),
        getClientName(project),
        project?.uuid,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [projects, search]);

  const stats = useMemo(() => {
    const planned = projects.filter((project) =>
      Boolean(project.operationsPlan),
    ).length;

    const completed = projects.filter(
      (project) => project.operationsPlan?.planningStatus === "COMPLETED",
    ).length;

    return {
      total: projects.length,
      planned,
      pending: projects.length - planned,
      completed,
    };
  }, [projects]);

  const leadOptions = useMemo(
    () =>
      options.projectLeads.map((employee) => ({
        value: String(employee.id),
        label: getEmployeeName(employee),
      })),
    [options.projectLeads],
  );

  const testerOptions = useMemo(
    () =>
      options.testers.map((employee) => ({
        value: String(employee.id),
        label: getEmployeeName(employee),
      })),
    [options.testers],
  );

  const developerOptions = useMemo(
    () =>
      options.developers.map((employee) => ({
        value: String(employee.id),
        label: getEmployeeName(employee),
      })),
    [options.developers],
  );

  const selectProject = (project) => {
    selectedIdRef.current = String(project.id);
    setSelectedId(String(project.id));
    setAssignments(getPlanAssignments(project));
  };

  const updateAssignment = (field, value) => {
    setAssignments((current) => ({ ...current, [field]: value }));
  };

  const toggleAssignment = (field, employeeId) => {
    const id = String(employeeId);

    setAssignments((current) => ({
      ...current,
      [field]: current[field].includes(id)
        ? current[field].filter((selected) => selected !== id)
        : [...current[field], id],
    }));
  };

  const viewPlanningFile = (project, kind) => {
    const projectUuid = project?.uuid;

    console.log(kind);

    if (!projectUuid) {
      showToast.error("Project UUID not found.");
      return;
    }

    const url = `/api/project-lead/planning/projects/${projectUuid}/files/${kind}`;

    window.open(url, "_blank", "noopener,noreferrer");
  };

  const savePlan = async () => {
    console.log(selectedProject.brd.uuid);
    // console.log(selectedProject);
    console.log(assignments);

    if (!selectedProject) {
      showToast.warning("Select a project first.");
      return;
    }

    if (isSaving) return;

    setIsSaving(true);

    try {
      const response = await axios.put(
        `${API_URL}/projects/${selectedProject.brd.uuid || selectedProject.id}`,
        {
          projectLeadId: assignments.lead ? Number(assignments.lead) : null,
          testerIds: assignments.testers.map(Number),
          developerIds: assignments.developers.map(Number),
          technologyStack: assignments.technology || null,
        },
        { withCredentials: true },
      );

      if (response.data?.success === false) {
        throw new Error(
          response.data?.message || "Could not save operations plan.",
        );
      }

      showToast.success("Operations plan saved successfully.");
      await loadData();
    } catch (saveError) {
      showToast.error(getErrorMessage(saveError));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && projects.length === 0) {
    return <Loader context="page" label="Loading approved projects..." />;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <header className="relative overflow-hidden rounded-[28px] border border-slate-800 bg-gradient-to-br from-[#080d25] via-[#0b1734] to-[#1b2052] px-6 py-7 shadow-[0_18px_45px_rgba(15,23,42,0.16)] sm:px-8 sm:py-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full border border-white/10"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-8 -top-16 h-48 w-48 rounded-full border border-white/10"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-0 h-64 w-64 bg-blue-500/10 blur-3xl"
        />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-blue-100">
                <BriefcaseBusiness size={22} />
              </div>

              <span className="inline-flex items-center rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-200">
                ADMINISTRATION
              </span>
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-[34px]">
              Project Operations
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Assign project teams and manage delivery planning for
              client-approved BRDs.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-blue-100">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Operations workspace
              </span>

              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-slate-200">
                {stats.total} approved projects
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={isLoading || isSaving}
            leftIcon={<RefreshCw size={15} />}
            className="border-white/20 bg-white/10 text-white hover:bg-white/15"
          >
            Refresh
          </Button>
        </div>
      </header>

      {/* Summary */}
      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Operations overview
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Current project planning and team assignment status.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Client-approved projects"
            value={stats.total}
            icon={BriefcaseBusiness}
          />

          <StatCard
            label="Plans created"
            value={stats.planned}
            icon={FileText}
          />

          <StatCard
            label="Awaiting planning"
            value={stats.pending}
            icon={CircleDashed}
          />

          <StatCard
            label="Planning completed"
            value={stats.completed}
            icon={CheckCircle2}
          />
        </div>
      </section>

      {error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={loadData}
          >
            Try again
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        {/* Project list */}
        <aside className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50/70 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold tracking-tight text-slate-900">
                  Approved Projects
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  {projects.length} project
                  {projects.length === 1 ? "" : "s"} available
                </p>
              </div>

              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700">
                <BriefcaseBusiness size={18} />
              </span>
            </div>

            <div className="relative mt-4">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search projects or clients..."
                aria-label="Search approved projects"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="max-h-[640px] space-y-2 overflow-y-auto p-3">
            {filteredProjects.length === 0 ? (
              <div className="px-3 py-10 text-center">
                <BriefcaseBusiness
                  size={26}
                  className="mx-auto text-slate-500"
                />

                <p className="mt-3 text-sm font-semibold text-slate-900">
                  {projects.length
                    ? "No matching projects"
                    : "No approved projects"}
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {projects.length
                    ? "Try a different search term."
                    : "Projects appear here after the client approves their BRD."}
                </p>
              </div>
            ) : (
              filteredProjects.map((project) => {
                const active = String(project.id) === selectedId;
                const status = getPlanningStatus(project);

                return (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => selectProject(project)}
                    className={[
                      "w-full rounded-xl border p-4 text-left transition-all duration-200",
                      active
                        ? "border-blue-300 bg-blue-50 shadow-sm ring-1 ring-blue-100"
                        : "border-transparent hover:border-slate-200 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {getProjectCode(project)}
                        </p>

                        <p className="mt-1 truncate text-sm font-semibold text-slate-900">
                          {getProjectName(project)}
                        </p>
                      </div>

                      {active && (
                        <CheckCircle2
                          size={17}
                          className="shrink-0 text-blue-700"
                        />
                      )}
                    </div>

                    <p className="mt-2 truncate text-xs text-slate-500">
                      Client: {getClientName(project)}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge tone="success">BRD approved</Badge>
                      <Badge tone={status.tone}>{status.label}</Badge>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Operations plan */}
        <main className="min-w-0">
          {!selectedProject ? (
            <section className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500">
                <BriefcaseBusiness size={28} />
              </div>

              <h2 className="mt-4 text-base font-semibold text-slate-900">
                Select an approved project
              </h2>

              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                Choose a project from the list to assign its team and configure
                the operations plan.
              </p>
            </section>
          ) : (
            <div className="flex flex-col gap-6">
              {/* Selected project overview */}
              <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute right-0 top-0 h-36 w-36 rounded-full bg-blue-50 blur-2xl"
                />

                <div className="relative flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {getProjectCode(selectedProject)}
                    </p>

                    <h2 className="mt-1 break-words text-xl font-bold tracking-tight text-slate-900">
                      {getProjectName(selectedProject)}
                    </h2>

                    <p className="mt-2 text-sm text-slate-500">
                      Client: {getClientName(selectedProject)}
                    </p>
                  </div>

                  <Badge tone="success">Client approved</Badge>
                </div>
              </section>

              {/* Team assignments */}
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <SectionHeading
                  icon={Users}
                  title="Team Assignments"
                  description="Select the project lead, tester, and developers responsible for delivery."
                />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Select
                    label="Project Lead"
                    value={assignments.lead}
                    placeholder="Select project lead"
                    options={leadOptions}
                    onChange={(event) =>
                      updateAssignment("lead", event.target.value)
                    }
                  />

                  <div>
                    <MultiSelect
                      label="Testers"
                      value={assignments.testers}
                      options={testerOptions}
                      placeholder="Search testers..."
                      onChange={(selectedIds) =>
                        updateAssignment("testers", selectedIds)
                      }
                    />
                  </div>
                </div>

                <div className="mt-6 border-t border-slate-100 pt-5">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">
                        Developers
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        Assign developers to this project.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <MultiSelect
                      label="Developers"
                      value={assignments.developers}
                      options={developerOptions}
                      placeholder="Search developers..."
                      onChange={(selectedIds) =>
                        updateAssignment("developers", selectedIds)
                      }
                    />
                  </div>
                </div>
              </section>

              {/* Technology stack */}
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <SectionHeading
                  icon={Layers3}
                  title="Technology Stack"
                  description="Choose the primary technology stack for the project."
                />

                <div className="max-w-xl">
                  <Select
                    label="Technology"
                    value={assignments.technology}
                    placeholder="Select technology stack"
                    options={TECHNOLOGY_OPTIONS}
                    onChange={(event) =>
                      updateAssignment("technology", event.target.value)
                    }
                  />
                </div>
              </section>

              {/* Project documents */}
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <SectionHeading
                  icon={FileText}
                  title="Project Documents"
                  description="View uploaded diagrams for this project."
                />

                {[
                  {
                    label: "ER Diagram",
                    kind: "erDiagram",
                    path: selectedProject.operationsPlan?.er_diagram_path,
                    status: selectedProject.operationsPlan?.er_diagram_status,
                  },
                  {
                    label: "Flowchart",
                    kind: "flowchart",
                    path: selectedProject.operationsPlan?.flowchart_path,
                    status: selectedProject.operationsPlan?.flowchart_status,
                  },
                ].map((document) => {
                  console.log(document);

                  const uploaded =
                    Boolean(document.path) &&
                    document.status !== "NOT_UPLOADED";

                  return (
                    <div
                      key={document.kind}
                      className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 last:mb-0"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-blue-700">
                          <FileText size={19} />
                        </span>

                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {document.label}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {uploaded ? "Uploaded" : "Not uploaded"}
                          </p>
                        </div>
                      </div>

                      {uploaded && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            viewPlanningFile(selectedProject, document.kind)
                          }
                        >
                          View
                        </Button>
                      )}
                    </div>
                  );
                })}
              </section>

              {/* Summary + save */}
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <SectionHeading
                  icon={Code2}
                  title="Plan Summary"
                  description="Review the current assignments before saving."
                />

                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {[
                    {
                      label: "Project lead",
                      value: assignments.lead ? "Assigned" : "Not assigned",
                    },
                    {
                      label: "Testers / QA",
                      value: String(assignments.testers.length),
                    },
                    {
                      label: "Developers",
                      value: String(assignments.developers.length),
                    },
                    {
                      label: "Technology",
                      value: assignments.technology || "Not selected",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                    >
                      <p className="text-xs font-medium text-slate-500">
                        {item.label}
                      </p>

                      <p className="mt-1 break-words text-sm font-semibold text-slate-900">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs leading-5 text-slate-500">
                    Saving creates a plan or updates the existing project plan.
                  </p>

                  <Button
                    type="button"
                    onClick={savePlan}
                    loading={isSaving}
                    disabled={isSaving || isLoading}
                    leftIcon={<Save size={15} />}
                  >
                    Save Operations Plan
                  </Button>
                </div>
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default Operations;
