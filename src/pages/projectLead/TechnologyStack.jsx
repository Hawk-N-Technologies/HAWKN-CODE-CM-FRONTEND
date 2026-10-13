import { useCallback, useEffect, useState } from "react";
import Button from "../../components/common/Button";
import Select from "../../components/common/Select";
import { showToast } from "../../components/common/Toast";
import {
  getTechStackProjects,
  getProjectTechStack,
  saveProjectTechStack,
} from "../../services/projectLeadTechStackService";

function TechnologyStack() {
  const [projects, setProjects] = useState([]);
  const [projectUuid, setProjectUuid] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);
  const [stack, setStack] = useState("");
  const [loading, setLoading] = useState(true);
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
      return;
    }

    let cancelled = false;

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

  if (loading) {
    return (
      <p className="text-sm text-cm-text-muted">
        Loading assigned projects...
      </p>
    );
  }

  if (!projects.length) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-bold text-cm-text">Technology Stack</h1>
          <p className="mt-1 text-sm text-cm-text-muted">
            Manage the technologies used by each project.
          </p>
        </div>
        <section className="rounded-cm-lg border border-cm-border bg-cm-card p-6 shadow-sm">
          <p className="text-sm text-cm-text-muted">
            No projects are currently assigned to you as Project Lead.
          </p>
        </section>
      </div>
    );
  }

  const technologies = stack
    .split(",")
    .map((technology) => technology.trim())
    .filter(Boolean);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-cm-text">Technology Stack</h1>
        <p className="mt-1 text-sm text-cm-text-muted">
          Keep each project's technology choices clear and up to date.
        </p>
      </div>

      <section className="rounded-cm-lg border border-cm-border bg-cm-card p-6 shadow-sm">
        <form onSubmit={save}>
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

          {selectedProject && (
            <>
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="text-xs text-cm-text-muted">Project status</span>
                <span className="rounded-full border border-cm-border px-3 py-1 text-xs text-cm-text">
                  {selectedProject.status}
                </span>
              </div>

              <div className="mt-6">
                <label
                  htmlFor="technology-stack"
                  className="text-sm font-medium text-cm-text"
                >
                  Technologies
                </label>
                <p className="mt-1 text-xs text-cm-text-muted">
                  Enter technologies separated by commas, for example:
                  React, Node.js, PostgreSQL, Docker.
                </p>

                <textarea
                  id="technology-stack"
                  value={stack}
                  maxLength={100}
                  rows={3}
                  disabled={saving}
                  onChange={(event) => setStack(event.target.value)}
                  placeholder="React, Node.js, PostgreSQL..."
                  className="mt-3 w-full rounded-cm-md border border-cm-border bg-white p-3 text-sm text-cm-text focus:border-cm-blue-500 focus:outline-none focus:ring-2 focus:ring-cm-blue-500 disabled:bg-cm-bg"
                />

                <p className="mt-1 text-right text-xs text-cm-text-muted">
                  {stack.length}/100 characters
                </p>
              </div>

              <div className="mt-5 rounded-lg border border-cm-border p-4">
                <p className="text-xs font-medium text-cm-text-muted">
                  Current stack preview
                </p>

                {technologies.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {technologies.map((technology, index) => (
                      <span
                        key={`${technology}-${index}`}
                        className="rounded-full border border-cm-border bg-cm-bg px-3 py-1.5 text-sm text-cm-text"
                      >
                        {technology}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-cm-text-muted">
                    No technologies have been added yet.
                  </p>
                )}
              </div>

              <div className="mt-6 flex justify-end border-t border-cm-border pt-4">
                <Button type="submit" loading={saving}>
                  Save Technology Stack
                </Button>
              </div>
            </>
          )}
        </form>
      </section>
    </div>
  );
}

export default TechnologyStack;