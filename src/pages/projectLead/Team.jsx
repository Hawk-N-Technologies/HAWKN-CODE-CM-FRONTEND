import { useCallback, useEffect, useState } from "react";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Select from "../../components/common/Select";
import { showToast } from "../../components/common/Toast";
import {
  getTeamProjects,
  getProjectTeam,
  saveProjectTeam,
} from "../../services/projectLeadTeamService";

function Team() {
  const [projects, setProjects] = useState([]);
  const [projectUuid, setProjectUuid] = useState("");
  const [data, setData] = useState(null);
  const [projectLeadId, setProjectLeadId] = useState("");
  const [developerIds, setDeveloperIds] = useState([]);
  const [testerIds, setTesterIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadProjects = useCallback(async () => {
    try {
      const result = await getTeamProjects();
      setProjects(result);
      setProjectUuid((current) =>
        current && result.some((item) => item.uuid === current)
          ? current
          : result[0]?.uuid || "",
      );
    } catch (error) {
      showToast.error(
        error.response?.data?.message || "Could not load your projects.",
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
      setData(null);
      return;
    }

    let cancelled = false;

    getProjectTeam(projectUuid)
      .then((result) => {
        if (cancelled) return;

        setData(result);
        setProjectLeadId(String(result.team.projectLeadId || ""));
        setDeveloperIds(result.team.developerIds.map(String));
        setTesterIds(result.team.testerIds.map(String));
      })
      .catch((error) => {
        if (!cancelled) {
          showToast.error(
            error.response?.data?.message || "Could not load this team.",
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [projectUuid]);

  const toggle = (id, values, setter) => {
    setter((previous) =>
      previous.includes(String(id))
        ? previous.filter((value) => value !== String(id))
        : [...previous, String(id)],
    );
  };

  const save = async () => {
    if (!projectUuid || !projectLeadId) {
      showToast.error("Select a project and project lead.");
      return;
    }

    setSaving(true);

    try {
      await saveProjectTeam(projectUuid, {
        projectLeadId: Number(projectLeadId),
        developerIds: developerIds.map(Number),
        testerIds: testerIds.map(Number),
      });

      showToast.success("Project team updated successfully.");

      // The current lead may have reassigned the project to another lead.
      // Reload the list so access changes are reflected.
      await loadProjects();
    } catch (error) {
      showToast.error(
        error.response?.data?.message || "Could not save the project team.",
      );
    } finally {
      setSaving(false);
    }
  };

  const personOptions = (items) =>
    items.map((person) => ({
      value: String(person.id),
      label: `${person.name}${person.email ? ` · ${person.email}` : ""}`,
    }));

  if (loading) {
    return <p className="text-sm text-cm-text-muted">Loading projects...</p>;
  }

  if (!projects.length) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-bold text-cm-text">Team</h1>
          <p className="mt-1 text-sm text-cm-text-muted">
            Manage the people assigned to your projects.
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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-cm-text">Team</h1>
        <p className="mt-1 text-sm text-cm-text-muted">
          Select a project, review its current team, and update assignments.
        </p>
      </div>

      <section className="rounded-cm-lg border border-cm-border bg-cm-card p-6 shadow-sm">
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

        {data && (
          <>
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Select
                label="Project Lead"
                value={projectLeadId}
                disabled={saving}
                options={personOptions(data.options.projectLeads)}
                onChange={(event) => setProjectLeadId(event.target.value)}
              />
              <div className="flex flex-col gap-1.5">
                <p className="text-sm font-medium text-cm-text">
                  Project Status
                </p>
                <p className="flex h-10 items-center text-sm text-cm-text-muted">
                  {data.project.status}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-sm font-medium text-cm-text">Developers</p>
              <p className="mt-1 text-xs text-cm-text-muted">
                Select all developers assigned to this project.
              </p>
              <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                {data.options.developers.map((person) => (
                  <label
                    key={person.id}
                    className="flex cursor-pointer items-center gap-3 rounded-cm-md border border-cm-border p-3 hover:bg-cm-bg"
                  >
                    <input
                      type="checkbox"
                      checked={developerIds.includes(String(person.id))}
                      disabled={saving}
                      onChange={() =>
                        toggle(person.id, developerIds, setDeveloperIds)
                      }
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-cm-text">
                        {person.name}
                      </span>
                      <span className="block text-xs text-cm-text-muted">
                        {person.email || person.role}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <p className="text-sm font-medium text-cm-text">Testers / QA</p>
              <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                {data.options.testers.map((person) => (
                  <label
                    key={person.id}
                    className="flex cursor-pointer items-center gap-3 rounded-cm-md border border-cm-border p-3 hover:bg-cm-bg"
                  >
                    <input
                      type="checkbox"
                      checked={testerIds.includes(String(person.id))}
                      disabled={saving}
                      onChange={() =>
                        toggle(person.id, testerIds, setTesterIds)
                      }
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-cm-text">
                        {person.name}
                      </span>
                      <span className="block text-xs text-cm-text-muted">
                        {person.email || person.role}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-lg border border-cm-border p-4">
              <p className="text-xs text-cm-text-muted">Selected team</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {data.options.projectLeads
                  .filter((person) => String(person.id) === projectLeadId)
                  .map((person) => (
                    <Badge key={person.id} tone="info">
                      Lead: {person.name}
                    </Badge>
                  ))}
                {data.options.developers
                  .filter((person) => developerIds.includes(String(person.id)))
                  .map((person) => (
                    <Badge key={person.id} tone="neutral">
                      {person.name}
                    </Badge>
                  ))}
                {data.options.testers
                  .filter((person) => testerIds.includes(String(person.id)))
                  .map((person) => (
                    <Badge key={person.id} tone="purple">
                      QA: {person.name}
                    </Badge>
                  ))}
              </div>
            </div>

            <div className="mt-6 flex justify-end border-t border-cm-border pt-4">
              <Button onClick={save} loading={saving}>
                Save Team
              </Button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

export default Team;