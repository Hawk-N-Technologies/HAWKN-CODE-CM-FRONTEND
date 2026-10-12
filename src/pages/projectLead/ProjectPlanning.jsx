import { useEffect, useState } from "react";
import axios from "axios";

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
            error.response?.data?.message || "Could not load project planning.",
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
      className="inline-flex w-fit items-center gap-2 rounded-cm-md border border-cm-border px-3 py-2 text-sm font-medium text-cm-blue-600 hover:bg-cm-bg hover:underline"
    >
      View {label}
    </a>
  );

  if (loadingProjects) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-bold text-cm-text">Project Planning</h1>
          <p className="mt-1 text-sm text-cm-text-muted">
            Loading assigned projects...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-cm-text">Project Planning</h1>
        <p className="mt-1 text-sm text-cm-text-muted">
          Select a project to view or create its planning details.
        </p>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-cm-lg border border-cm-border bg-cm-card p-6 text-sm text-cm-text-muted shadow-sm">
          No projects are currently assigned to you as Project Lead.
        </div>
      ) : (
        <form
          onSubmit={save}
          className="flex flex-col gap-5 rounded-cm-lg border border-cm-border bg-cm-card p-6 shadow-sm"
        >
          {/* Project selection */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="planning-project"
              className="text-sm font-medium text-cm-text"
            >
              Select Project
            </label>

            <select
              id="planning-project"
              value={selectedUuid}
              onChange={(event) => setSelectedUuid(event.target.value)}
              disabled={saving || loadingPlanning}
              className="h-10 w-full rounded-cm-md border border-cm-border bg-white px-3 text-sm text-cm-text focus:border-cm-blue-500 focus:outline-none focus:ring-2 focus:ring-cm-blue-500 disabled:bg-cm-bg"
            >
              <option value="">-- Select a project --</option>

              {projects.map((project) => (
                <option key={project.uuid} value={project.uuid}>
                  {project.name}
                </option>
              ))}
            </select>

            {selectedProject?.clientName && (
              <p className="text-xs text-cm-text-muted">
                Client: {selectedProject.clientName}
              </p>
            )}
          </div>

          {/* Do not show the planning form until a project is selected */}
          {!selectedUuid ? (
            <p className="text-sm text-cm-text-muted">
              Select a project above to load its planning details.
            </p>
          ) : loadingPlanning ? (
            <p className="text-sm text-cm-text-muted">
              Loading planning details...
            </p>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input
                  label="Project Deadline"
                  type="date"
                  value={form.deadline}
                  disabled={saving}
                  onChange={(event) => update("deadline", event.target.value)}
                />

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
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* ER Diagram */}
                <div className="flex flex-col gap-2">
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

                  {savedFiles.erDiagramUploaded &&
                    !erFile &&
                    documentLink("erDiagram", "ER Diagram")}
                </div>
                {/* Flowchart */}
                <div className="flex flex-col gap-2">
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

                  {savedFiles.flowchartUploaded &&
                    !flowFile &&
                    documentLink("flowchart", "Flowchart")}
                </div>
              </div>

              <div className="flex justify-end border-t border-cm-border pt-4">
                <Button type="submit" loading={saving} disabled={saving}>
                  Save Planning
                </Button>
              </div>
            </>
          )}
        </form>
      )}
    </div>
  );
}

export default ProjectPlanning;
