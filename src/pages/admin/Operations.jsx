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
import { showToast } from "../../components/common/Toast";

const API_URL = "/api/operations";

const EMPTY_ASSIGNMENTS = {
  lead: "",
  tester: "",
  developers: [],
  technology: "",
  erDiagram: "NOT_UPLOADED",
  flowchart: "NOT_UPLOADED",
};

const TECHNOLOGY_OPTIONS = [
  { value: "MERN", label: "MERN Stack" },
  { value: ".NET + React", label: ".NET + React" },
  { value: "Java + React", label: "Java + React" },
];

const DIAGRAM_OPTIONS = [
  { value: "NOT_UPLOADED", label: "Not uploaded" },
  { value: "UPLOADED", label: "Uploaded" },
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
  return {
    lead: plan?.projectLeadId ? String(plan.projectLeadId) : "",
    tester: plan?.testerId ? String(plan.testerId) : "",
    developers: (plan?.developers || []).map((employee) => String(employee.id)),
    technology: plan?.technologyStack || "",
    erDiagram: plan?.erDiagramStatus || "NOT_UPLOADED",
    flowchart: plan?.flowchartStatus || "NOT_UPLOADED",
  };
}

function getPlanningStatus(project) {
  const status = project?.operationsPlan?.planningStatus;
  if (status === "COMPLETED") return { label: "Completed", tone: "success" };
  if (status === "IN_PROGRESS")
    return { label: "In progress", tone: "warning" };
  return project?.operationsPlan
    ? { label: "Not started", tone: "neutral" }
    : { label: "Not planned", tone: "neutral" };
}

function SectionHeading({ icon: Icon, title, description }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-cm-md bg-cm-bg text-cm-text">
        <Icon size={18} />
      </span>
      <div>
        <h2 className="text-sm font-semibold text-cm-text">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-cm-text-muted">{description}</p>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, detail }) {
  return (
    <div className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-cm-text-muted">{label}</p>
        <span className="flex h-9 w-9 items-center justify-center rounded-cm-md bg-cm-bg text-cm-text">
          <Icon size={18} />
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold text-cm-text">{value}</p>
      {detail && <p className="mt-1 text-xs text-cm-text-muted">{detail}</p>}
    </div>
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
  const [assignments, setAssignments] = useState({ ...EMPTY_ASSIGNMENTS });
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
    () => projects.find((project) => String(project.id) === selectedId) || null,
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

  const selectProject = (project) => {
    selectedIdRef.current = String(project.id);
    setSelectedId(String(project.id));
    setAssignments(getPlanAssignments(project));
  };

  const updateAssignment = (field, value) => {
    setAssignments((current) => ({ ...current, [field]: value }));
  };

  const toggleDeveloper = (employeeId) => {
    const id = String(employeeId);
    setAssignments((current) => ({
      ...current,
      developers: current.developers.includes(id)
        ? current.developers.filter((selected) => selected !== id)
        : [...current.developers, id],
    }));
  };

  const savePlan = async () => {
    if (!selectedProject) {
      showToast.warning("Select a project first.");
      return;
    }
    console.log(selectedProject.brd.uuid);
    if (isSaving) return;

    setIsSaving(true);
    try {
      const response = await axios.put(
        `${API_URL}/projects/${selectedProject.brd.uuid}`,
        {
          leadId: assignments.lead || null,
          testerId: assignments.tester || null,
          developerIds: assignments.developers.map(Number),
          technologyStack: assignments.technology || null,
          erDiagramStatus: assignments.erDiagram,
          flowchartStatus: assignments.flowchart,
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
      {/* Page heading follows the existing cm-* dashboard theme. */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-cm-text">Project Operations</h1>
          <p className="mt-1 text-sm text-cm-text-muted">
            Assign project teams and track delivery planning for client-approved
            BRDs.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={loadData}
          disabled={isLoading || isSaving}
          leftIcon={<RefreshCw size={15} />}
        >
          Refresh
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Client-approved projects"
          value={stats.total}
          icon={BriefcaseBusiness}
        />
        <StatCard label="Plans created" value={stats.planned} icon={FileText} />
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

      {error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-cm-lg border border-cm-danger-200 bg-cm-danger-50 p-4">
          <p className="text-sm text-cm-danger-700">{error}</p>
          <Button type="button" variant="outline" size="sm" onClick={loadData}>
            Try again
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        {/* Project list */}
        <aside className="overflow-hidden rounded-cm-lg border border-cm-border bg-cm-card shadow-sm">
          <div className="border-b border-cm-border p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-cm-text">
                  Approved Projects
                </h2>
                <p className="mt-1 text-xs text-cm-text-muted">
                  {projects.length} project{projects.length === 1 ? "" : "s"}{" "}
                  available
                </p>
              </div>
              <span className="flex h-9 w-9 items-center justify-center rounded-cm-md bg-cm-bg text-cm-text">
                <BriefcaseBusiness size={18} />
              </span>
            </div>

            <div className="relative mt-4">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-cm-text-muted"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search projects or clients..."
                aria-label="Search approved projects"
                className="h-10 w-full rounded-cm-md border border-cm-border bg-cm-bg pl-9 pr-3 text-sm text-cm-text placeholder:text-cm-text-muted focus:outline-none focus:ring-2 focus:ring-cm-blue-500"
              />
            </div>
          </div>

          <div className="max-h-[640px] space-y-2 overflow-y-auto p-3">
            {filteredProjects.length === 0 ? (
              <div className="px-3 py-10 text-center">
                <BriefcaseBusiness
                  size={26}
                  className="mx-auto text-cm-text-muted"
                />
                <p className="mt-3 text-sm font-medium text-cm-text">
                  {projects.length
                    ? "No matching projects"
                    : "No approved projects"}
                </p>
                <p className="mt-1 text-xs leading-5 text-cm-text-muted">
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
                      "w-full rounded-cm-md border p-4 text-left transition-colors",
                      active
                        ? "border-cm-blue-500 bg-cm-blue-50"
                        : "border-transparent hover:border-cm-border hover:bg-cm-bg",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-cm-text-muted">
                          {getProjectCode(project)}
                        </p>
                        <p className="mt-1 truncate text-sm font-semibold text-cm-text">
                          {getProjectName(project)}
                        </p>
                      </div>
                      {active && (
                        <CheckCircle2
                          size={17}
                          className="shrink-0 text-cm-blue-700"
                        />
                      )}
                    </div>
                    <p className="mt-2 truncate text-xs text-cm-text-muted">
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
            <section className="flex min-h-80 flex-col items-center justify-center rounded-cm-lg border border-cm-border bg-cm-card p-8 text-center shadow-sm">
              <BriefcaseBusiness size={34} className="text-cm-text-muted" />
              <h2 className="mt-4 text-sm font-semibold text-cm-text">
                Select an approved project
              </h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-cm-text-muted">
                Choose a project from the list to assign its team and configure
                the operations plan.
              </p>
            </section>
          ) : (
            <div className="flex flex-col gap-6">
              {/* Selected project overview */}
              <section className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-cm-text-muted">
                      {getProjectCode(selectedProject)}
                    </p>
                    <h2 className="mt-1 break-words text-lg font-bold text-cm-text">
                      {getProjectName(selectedProject)}
                    </h2>
                    <p className="mt-2 text-sm text-cm-text-muted">
                      Client: {getClientName(selectedProject)}
                    </p>
                  </div>
                  <Badge tone="success">Client approved</Badge>
                </div>
              </section>

              {/* Team assignments */}
              <section className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm sm:p-6">
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
                  <Select
                    label="Tester / QA"
                    value={assignments.tester}
                    placeholder="Select tester"
                    options={testerOptions}
                    onChange={(event) =>
                      updateAssignment("tester", event.target.value)
                    }
                  />
                </div>

                <div className="mt-6">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-cm-text">
                        Developers
                      </h3>
                      <p className="mt-1 text-xs text-cm-text-muted">
                        Select one or more active developers.
                      </p>
                    </div>
                    <Badge tone="info">
                      {assignments.developers.length} selected
                    </Badge>
                  </div>

                  {options.developers.length === 0 ? (
                    <p className="rounded-cm-md border border-dashed border-cm-border p-4 text-sm text-cm-text-muted">
                      No eligible developers were returned by the server.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {options.developers.map((employee) => {
                        const id = String(employee.id);
                        const checked = assignments.developers.includes(id);
                        return (
                          <label
                            key={employee.id}
                            className={[
                              "flex cursor-pointer items-center gap-3 rounded-cm-md border p-3 transition-colors",
                              checked
                                ? "border-cm-blue-500 bg-cm-blue-50"
                                : "border-cm-border hover:bg-cm-bg",
                            ].join(" ")}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleDeveloper(employee.id)}
                              className="h-4 w-4 rounded border-cm-border accent-[#000052]"
                            />
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cm-bg text-cm-text">
                              <UserRound size={17} />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium text-cm-text">
                                {getEmployeeName(employee)}
                              </span>
                              <span className="block truncate text-xs text-cm-text-muted">
                                {getEmployeeEmail(employee) || "Developer"}
                              </span>
                            </span>
                            {checked && (
                              <Check
                                size={16}
                                className="shrink-0 text-cm-blue-700"
                              />
                            )}
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </section>

              {/* Technology stack */}
              <section className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm sm:p-6">
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

              {/* Diagram status */}
              <section className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm sm:p-6">
                <SectionHeading
                  icon={FileText}
                  title="Project Documentation"
                  description="Record the current status of required project diagrams."
                />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Select
                    label="ER Diagram"
                    value={assignments.erDiagram}
                    options={DIAGRAM_OPTIONS}
                    onChange={(event) =>
                      updateAssignment("erDiagram", event.target.value)
                    }
                  />
                  <Select
                    label="Flowchart"
                    value={assignments.flowchart}
                    options={DIAGRAM_OPTIONS}
                    onChange={(event) =>
                      updateAssignment("flowchart", event.target.value)
                    }
                  />
                </div>
                <p className="mt-3 text-xs leading-5 text-cm-text-muted">
                  These controls save status values only; they do not upload or
                  verify diagram files.
                </p>
              </section>

              {/* Summary + save */}
              <section className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm sm:p-6">
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
                      label: "Tester / QA",
                      value: assignments.tester ? "Assigned" : "Not assigned",
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
                      className="rounded-cm-md bg-cm-bg p-3"
                    >
                      <p className="text-xs text-cm-text-muted">{item.label}</p>
                      <p className="mt-1 break-words text-sm font-semibold text-cm-text">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex flex-col-reverse gap-3 border-t border-cm-border pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs leading-5 text-cm-text-muted">
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
