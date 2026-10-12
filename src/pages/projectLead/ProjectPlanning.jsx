import { useCallback, useEffect, useState } from "react";
import axios from "axios";

import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import FileUpload from "../../components/common/FileUpload";
import { showToast } from "../../components/common/Toast";

import {
  getPlanningProjects,
  getProjectPlanning,
  getPlanningFileUrl,
  saveProjectPlanning,
} from "../../services/projectLeadPlanningService";

const INITIAL_FORM = {
  description: "",
  deadline: "",
  technologyStack: "",
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
  const [savedFiles, setSavedFiles] = useState({
    erDiagramUploaded: false,
    flowchartUploaded: false,
  });
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingPlanning, setLoadingPlanning] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedProject = projects.find(
    (project) => project.uuid === selectedUuid,
  );

  const update = (key, value) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const loadProjects = useCallback(async () => {
    setLoadingProjects(true);

    try {
      const data = await getPlanningProjects();
      setProjects(data);

      setSelectedUuid((current) => {
        if (current && data.some((project) => project.uuid === current)) {
          return current;
        }

        return data[0]?.uuid || "";
      });
    } catch (error) {
      showToast.error(
        error.response?.data?.message || "Could not load assigned projects.",
      );
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (!selectedUuid) {
      setForm(INITIAL_FORM);
      setErFile(null);
      setFlowFile(null);
      setSavedFiles({
        erDiagramUploaded: false,
        flowchartUploaded: false,
      });
      return;
    }

    let cancelled = false;

    async function loadPlanning() {
      setLoadingPlanning(true);
      setErFile(null);
      setFlowFile(null);

      try {
        const data = await getProjectPlanning(selectedUuid);

        if (cancelled) return;

        setForm({
          description: data.description || "",
          deadline: data.deadline || "",
          technologyStack: data.technologyStack || "",
        });

        setSavedFiles({
          erDiagramUploaded: Boolean(data.erDiagramUploaded),
          flowchartUploaded: Boolean(data.flowchartUploaded),
        });
      } catch (error) {
        if (!cancelled) {
          showToast.error(
            error.response?.data?.message ||
              "Could not load this project's planning.",
          );
        }
      } finally {
        if (!cancelled) setLoadingPlanning(false);
      }
    }

    loadPlanning();

    return () => {
      cancelled = true;
    };
  }, [selectedUuid]);

  const save = async (event) => {
    event.preventDefault();

    if (!selectedUuid) {
      showToast.error("Select a project before saving.");
      return;
    }

    const payload = new FormData();
    payload.append("description", form.description);
    payload.append("deadline", form.deadline);
    payload.append("technologyStack", form.technologyStack);

    if (erFile) payload.append("erDiagram", erFile);
    if (flowFile) payload.append("flowchart", flowFile);

    setSaving(true);

    try {
      const response = await saveProjectPlanning(selectedUuid, payload);
      const data = response.data;

      setForm({
        description: data.description || "",
        deadline: data.deadline || "",
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

  const documentLink = (kind, label) => (
    <a
      href={getPlanningFileUrl(selectedUuid, kind)}
      target="_blank"
      rel="noreferrer"
      className="text-sm font-medium text-cm-blue-600 hover:underline"
    >
      View saved {label}
    </a>
  );

  if (loadingProjects) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-bold text-cm-text">Project Planning</h1>
          <p className="mt-1 text-sm text-cm-text-muted">
            Loading your assigned projects...
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
          Maintain project information, deadlines, technology and planning
          documents.
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="planning-project"
                className="text-sm font-medium text-cm-text"
              >
                Project
              </label>
              <select
                id="planning-project"
                value={selectedUuid}
                onChange={(event) => setSelectedUuid(event.target.value)}
                disabled={loadingPlanning || saving}
                className="h-10 w-full rounded-cm-md border border-cm-border bg-white px-3 text-sm text-cm-text focus:border-cm-blue-500 focus:outline-none focus:ring-2 focus:ring-cm-blue-500 disabled:bg-cm-bg"
              >
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

            <Input
              label="Project Deadline"
              type="date"
              value={form.deadline}
              disabled={loadingPlanning || saving}
              onChange={(event) => update("deadline", event.target.value)}
            />

            <Input
              label="Project Information"
              multiline
              rows={4}
              maxLength={10000}
              value={form.description}
              disabled={loadingPlanning || saving}
              onChange={(event) =>
                update("description", event.target.value)
              }
            />

            <Select
              label="Technology Stack"
              value={form.technologyStack}
              options={TECHNOLOGY_OPTIONS.map((value) => ({
                value,
                label: value,
              }))}
              disabled={loadingPlanning || saving}
              onChange={(event) =>
                update("technologyStack", event.target.value)
              }
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <FileUpload
                label="ERP / ER Diagram"
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
                documentLink("erDiagram", "ER diagram")}
            </div>

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
                documentLink("flowchart", "flowchart")}
            </div>
          </div>

          <div className="flex justify-end border-t border-cm-border pt-4">
            <Button type="submit" loading={saving} disabled={loadingPlanning}>
              Save Planning
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

export default ProjectPlanning;