import { useEffect, useState } from "react";
import axios from "axios";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileImage,
  FileText,
  FolderKanban,
  Layers3,
  Save,
  Upload,
} from "lucide-react";

import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import FileUpload from "../../components/common/FileUpload";
import { showToast } from "../../components/common/Toast";

const BASE_URL = "/api/project-lead/planning";
const API_CONFIG = { withCredentials: true };

const INITIAL_FORM = {
  description: "",
  deadline: "",
  technologyStack: "",
};

const INITIAL_SAVED_FILES = {
  erDiagramUploaded: false,
  flowchartUploaded: false,
};

const TECHNOLOGY_OPTIONS = [
  "MERN",
  "MEAN",
  ".NET + React",
  "Java + React",
  "Python + React",
  "Django",
  "Spring Boot",
  "Other",
];

function SectionHeading({ icon: Icon, title, description }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        <Icon size={19} />
      </div>

      <div className="min-w-0">
        <h3 className="text-sm font-bold text-slate-800">{title}</h3>
        {description && (
          <p className="mt-1 text-xs leading-5 text-slate-500">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

function StatusPanel({ icon: Icon, title, description, tone = "blue" }) {
  const tones = {
    blue: {
      container: "border-blue-200 bg-blue-50/70",
      icon: "bg-blue-100 text-blue-600",
      title: "text-blue-900",
      description: "text-blue-700",
    },
    slate: {
      container: "border-slate-200 bg-slate-50",
      icon: "bg-slate-100 text-slate-500",
      title: "text-slate-800",
      description: "text-slate-500",
    },
    amber: {
      container: "border-amber-200 bg-amber-50",
      icon: "bg-amber-100 text-amber-600",
      title: "text-amber-900",
      description: "text-amber-700",
    },
  };

  const style = tones[tone];

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border p-4 ${style.container}`}
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${style.icon}`}
      >
        <Icon size={17} />
      </div>

      <div className="min-w-0">
        <p className={`text-sm font-semibold ${style.title}`}>{title}</p>
        <p className={`mt-1 text-xs leading-5 ${style.description}`}>
          {description}
        </p>
      </div>
    </div>
  );
}

function DocumentCard({
  icon: Icon,
  title,
  description,
  uploaded,
  selectedFile,
  children,
}) {
  return (
    <div className="flex min-w-0 flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Icon size={19} />
          </div>

          <div className="min-w-0">
            <h4 className="text-sm font-bold text-slate-800">{title}</h4>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {description}
            </p>
          </div>
        </div>

        {uploaded && !selectedFile && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
            <CheckCircle2 size={12} />
            Saved
          </span>
        )}
      </div>

      <div className="min-w-0">{children}</div>
    </div>
  );
}

function ProjectPlanning() {
  const [projects, setProjects] = useState([]);
  const [selectedUuid, setSelectedUuid] = useState("");

  const [form, setForm] = useState(INITIAL_FORM);
  const [erFile, setErFile] = useState(null);
  const [flowFile, setFlowFile] = useState(null);
  const [savedFiles, setSavedFiles] = useState(INITIAL_SAVED_FILES);

  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingPlanning, setLoadingPlanning] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedProject = projects.find(
    (project) => project.uuid === selectedUuid,
  );

  // Update form fields
  const update = (key, value) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  // Reset planning form when switching projects
  const resetPlanning = () => {
    setForm({ ...INITIAL_FORM });
    setErFile(null);
    setFlowFile(null);
    setSavedFiles({ ...INITIAL_SAVED_FILES });
  };

  // API 1: Fetch projects for the dropdown
  useEffect(() => {
    let cancelled = false;

    async function fetchProjects() {
      setLoadingProjects(true);

      try {
        const response = await axios.get(`${BASE_URL}/projects`, API_CONFIG);

        if (cancelled) return;

        const data = response.data.data;

        setProjects(Array.isArray(data) ? data : []);
      } catch (error) {
        if (!cancelled) {
          showToast.error(
            error.response?.data?.message ||
              "Could not load assigned projects.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingProjects(false);
        }
      }
    }

    fetchProjects();

    return () => {
      cancelled = true;
    };
  }, []);

  // API 2: Fetch planning only after a project is selected
  useEffect(() => {
    resetPlanning();

    if (!selectedUuid) {
      setLoadingPlanning(false);
      return;
    }

    let cancelled = false;

    async function fetchPlanning() {
      setLoadingPlanning(true);

      try {
        const response = await axios.get(
          `${BASE_URL}/projects/${selectedUuid}`,
          API_CONFIG,
        );

        if (cancelled) return;

        const data = response.data.data;

        // No saved planning data: keep the form empty.
        if (!data) {
          resetPlanning();
          return;
        }

        setForm({
          description: data.description || "",
          deadline: data.deadline ? String(data.deadline).slice(0, 10) : "",
          technologyStack: data.technologyStack || "",
        });

        setSavedFiles({
          erDiagramUploaded: Boolean(data.erDiagramUploaded),
          flowchartUploaded: Boolean(data.flowchartUploaded),
        });
      } catch (error) {
        if (cancelled) return;

        // A 404 can mean planning has not been created yet.
        if (error.response?.status === 404) {
          resetPlanning();
        } else {
          showToast.error(
            error.response?.data?.message ||
              "Could not load project planning.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingPlanning(false);
        }
      }
    }

    fetchPlanning();

    return () => {
      cancelled = true;
    };
  }, [selectedUuid]);

  // API 3: Save or update project planning
  const save = async (event) => {
    event.preventDefault();

    if (!selectedUuid) {
      showToast.error("Please select a project first.");
      return;
    }

    const payload = new FormData();

    payload.append("description", form.description);
    payload.append("deadline", form.deadline);
    payload.append("technologyStack", form.technologyStack);

    if (erFile) {
      payload.append("erDiagram", erFile);
    }

    if (flowFile) {
      payload.append("flowchart", flowFile);
    }

    setSaving(true);

    try {
      const response = await axios.put(
        `${BASE_URL}/projects/${selectedUuid}`,
        payload,
        API_CONFIG,
      );

      const data = response.data.data ?? response.data;

      setForm({
        description: data.description || "",
        deadline: data.deadline ? String(data.deadline).slice(0, 10) : "",
        technologyStack: data.technologyStack || "",
      });

      setSavedFiles({
        erDiagramUploaded: Boolean(data.erDiagramUploaded),
        flowchartUploaded: Boolean(data.flowchartUploaded),
      });

      setErFile(null);
      setFlowFile(null);

      showToast.success("Project planning saved successfully.");
    } catch (error) {
      showToast.error(
        error.response?.data?.message || "Could not save project planning.",
      );
    } finally {
      setSaving(false);
    }
  };

  // Direct URL for saved documents
  const documentLink = (kind, label) => (
    <a
      href={`${BASE_URL}/projects/${selectedUuid}/files/${kind}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-[40px] w-fit items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      <FileText size={14} />
      View {label}
    </a>
  );

  // Page Header
  const pageHeader = (
    <section className="relative overflow-hidden rounded-[24px] bg-gradient-to-r from-[#080d25] via-[#0b1734] to-[#1b2052] px-6 py-7 shadow-lg sm:px-8">
      <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full border border-white/[0.08]" />
      <div className="pointer-events-none absolute -right-10 -top-20 h-52 w-52 rounded-full border border-white/[0.08]" />
      <div className="pointer-events-none absolute bottom-[-100px] right-[25%] h-48 w-48 rounded-full bg-blue-500/[0.08] blur-3xl" />

      <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <div className="mb-3 flex items-center gap-2">
            <Layers3 size={16} className="text-blue-200" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-200">
              Project Management Workspace
            </p>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Project Planning
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
            Define project timelines, document technical decisions, and
            maintain essential planning resources for your assigned projects.
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

  // Loading State
  if (loadingProjects) {
    return (
      <div className="flex flex-col gap-6">
        {pageHeader}

        <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-blue-100 border-t-blue-600" />

          <p className="mt-4 text-sm font-semibold text-slate-700">
            Loading assigned projects
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Retrieving your project assignments...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {pageHeader}

      {projects.length === 0 ? (
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
      ) : (
        <>
          {/* Project Selection */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
              <SectionHeading
                icon={FolderKanban}
                title="Project Selection"
                description="Choose an assigned project to access or update its planning details."
              />
            </div>

            <div className="grid grid-cols-1 gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(220px,0.7fr)] lg:items-end">
              <div className="flex min-w-0 flex-col gap-2">
                <label
                  htmlFor="planning-project"
                  className="text-sm font-semibold text-slate-700"
                >
                  Select Project
                  <span className="ml-1 text-rose-500">*</span>
                </label>

                <select
                  id="planning-project"
                  value={selectedUuid}
                  onChange={(event) => setSelectedUuid(event.target.value)}
                  disabled={saving || loadingPlanning}
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-700 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                >
                  <option value="">-- Select a project --</option>

                  {projects.map((project) => (
                    <option key={project.uuid} value={project.uuid}>
                      {project.name}
                    </option>
                  ))}
                </select>

                {selectedProject?.clientName && (
                  <p className="mt-1 text-xs text-slate-500">
                    Client:{" "}
                    <span className="font-semibold text-slate-700">
                      {selectedProject.clientName}
                    </span>
                  </p>
                )}
              </div>

              <div className="flex min-h-[44px] items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Layers3 size={17} />
                </div>

                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Planning Workspace
                  </p>

                  <p className="mt-0.5 truncate text-sm font-semibold text-slate-700">
                    {selectedProject?.name || "No project selected"}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Planning Content */}
          {!selectedUuid ? (
            <StatusPanel
              icon={FolderKanban}
              title="Select a Project to Continue"
              description="Choose one of your assigned projects above. Its existing planning details will load here, or you can create new planning information."
              tone="blue"
            />
          ) : loadingPlanning ? (
            <section className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-blue-100 border-t-blue-600" />

              <p className="mt-4 text-sm font-semibold text-slate-700">
                Loading Planning Details
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Fetching the selected project's planning information...
              </p>
            </section>
          ) : (
            <form onSubmit={save} className="flex flex-col gap-6">
              {/* Planning Details */}
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
                  <SectionHeading
                    icon={FileText}
                    title="Planning Details"
                    description="Define the project deadline, technology stack, and essential project information."
                  />
                </div>

                <div className="flex flex-col gap-5 p-5 sm:p-6">
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div className="min-w-0">
                      <Input
                        label="Project Deadline"
                        type="date"
                        value={form.deadline}
                        disabled={saving}
                        onChange={(event) =>
                          update("deadline", event.target.value)
                        }
                      />
                    </div>

                    <div className="min-w-0">
                      <Select
                        label="Technology Stack"
                        value={form.technologyStack}
                        options={TECHNOLOGY_OPTIONS.map((value) => ({
                          value,
                          label: value,
                        }))}
                        disabled={saving}
                        onChange={(event) =>
                          update("technologyStack", event.target.value)
                        }
                      />
                    </div>

                    <div className="min-w-0 md:col-span-2">
                      <Input
                        label="Project Information"
                        multiline
                        rows={4}
                        maxLength={10000}
                        value={form.description}
                        disabled={saving}
                        onChange={(event) =>
                          update("description", event.target.value)
                        }
                      />

                      <p className="mt-2 text-right text-[11px] text-slate-400">
                        {form.description.length.toLocaleString("en-IN")} /
                        10,000 characters
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Technical Documentation */}
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
                  <SectionHeading
                    icon={FileImage}
                    title="Technical Documentation"
                    description="Upload supporting diagrams to document the project's structure and workflow."
                  />
                </div>

                <div className="flex flex-col gap-4 p-5 sm:p-6">
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {/* ER Diagram */}
                    <DocumentCard
                      icon={Layers3}
                      title="ER Diagram"
                      description="Entity Relationship Diagram"
                      uploaded={savedFiles.erDiagramUploaded}
                      selectedFile={erFile}
                    >
                      <FileUpload
                        label="ER Diagram"
                        accept=".pdf,.png,.jpg,.jpeg,.webp,.svg"
                        maxSizeMB={10}
                        onFileSelect={setErFile}
                        helperText={
                          erFile?.name ||
                          (savedFiles.erDiagramUploaded
                            ? "A diagram is already saved."
                            : "Optional planning document.")
                        }
                      />

                      {savedFiles.erDiagramUploaded && !erFile && (
                        <div className="mt-3">
                          {documentLink("erDiagram", "ER Diagram")}
                        </div>
                      )}
                    </DocumentCard>

                    {/* Flowchart */}
                    <DocumentCard
                      icon={FileImage}
                      title="Flowchart"
                      description="Project Process and Workflow Diagram"
                      uploaded={savedFiles.flowchartUploaded}
                      selectedFile={flowFile}
                    >
                      <FileUpload
                        label="Flowchart"
                        accept=".pdf,.png,.jpg,.jpeg,.webp,.svg"
                        maxSizeMB={10}
                        onFileSelect={setFlowFile}
                        helperText={
                          flowFile?.name ||
                          (savedFiles.flowchartUploaded
                            ? "A flowchart is already saved."
                            : "Optional planning document.")
                        }
                      />

                      {savedFiles.flowchartUploaded && !flowFile && (
                        <div className="mt-3">
                          {documentLink("flowchart", "Flowchart")}
                        </div>
                      )}
                    </DocumentCard>
                  </div>

                  <StatusPanel
                    icon={Upload}
                    title="Document Upload Guidelines"
                    description="ER diagrams and flowcharts are optional. Supported formats: PDF, PNG, JPG, JPEG, WEBP, and SVG. Maximum file size: 10 MB per document."
                    tone="slate"
                  />
                </div>
              </section>

              {/* Save Planning */}
              <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <CheckCircle2 size={19} />
                  </div>

                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      Ready to Save Planning?
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Save the planning details and uploaded documents for the
                      selected project.
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
                      {saving ? "Saving Planning..." : "Save Planning"}
                    </span>
                  </Button>
                </div>
              </section>
            </form>
          )}
        </>
      )}
    </div>
  );
}

export default ProjectPlanning;