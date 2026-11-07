import { useCallback, useEffect, useState } from "react";
import {
  ArrowRightLeft,
  Check,
  CheckCircle2,
  FolderKanban,
  Layers3,
  Save,
  ShieldCheck,
  Users,
  UserRound,
  UserRoundCheck,
  Wrench,
} from "lucide-react";

import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Select from "../../components/common/Select";
import { showToast } from "../../components/common/Toast";
import {
  getTeamProjects,
  getProjectTeam,
  saveProjectTeam,
} from "../../services/projectLeadTeamService";

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

function MemberCard({ person, selected, disabled, onChange, role }) {
  return (
    <label
      className={`flex min-h-[76px] min-w-0 cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition ${
        selected
          ? "border-blue-300 bg-blue-50/70 shadow-sm"
          : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50"
      } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
    >
      <input
        type="checkbox"
        checked={selected}
        disabled={disabled}
        onChange={onChange}
        className="h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 text-blue-600 accent-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:cursor-not-allowed"
      />

      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          selected
            ? "bg-blue-100 text-blue-700"
            : "bg-slate-100 text-slate-500"
        }`}
      >
        <UserRound size={18} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-800">
          {person.name}
        </p>

        <p className="mt-1 truncate text-xs text-slate-500">
          {person.email || person.role || role}
        </p>
      </div>

      {selected && (
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
          <Check size={13} strokeWidth={3} />
        </div>
      )}
    </label>
  );
}

function Team() {
  const [projects, setProjects] = useState([]);
  const [projectUuid, setProjectUuid] = useState("");
  const [data, setData] = useState(null);

  const [projectLeadId, setProjectLeadId] = useState("");
  const [developerIds, setDeveloperIds] = useState([]);
  const [testerIds, setTesterIds] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingTeam, setLoadingTeam] = useState(false);
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
      setProjectLeadId("");
      setDeveloperIds([]);
      setTesterIds([]);
      setLoadingTeam(false);
      return;
    }

    let cancelled = false;

    setData(null);
    setProjectLeadId("");
    setDeveloperIds([]);
    setTesterIds([]);
    setLoadingTeam(true);

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
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingTeam(false);
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

  const selectedLead = data?.options.projectLeads.find(
    (person) => String(person.id) === projectLeadId,
  );

  const selectedDevelopers = data
    ? data.options.developers.filter((person) =>
        developerIds.includes(String(person.id)),
      )
    : [];

  const selectedTesters = data
    ? data.options.testers.filter((person) =>
        testerIds.includes(String(person.id)),
      )
    : [];

  const totalSelected =
    (selectedLead ? 1 : 0) +
    selectedDevelopers.length +
    selectedTesters.length;

  const selectedProject = projects.find(
    (project) => project.uuid === projectUuid,
  );

  // Shared Page Header
  const pageHeader = (
    <section className="relative overflow-hidden rounded-[24px] bg-gradient-to-r from-[#080d25] via-[#0b1734] to-[#1b2052] px-6 py-7 shadow-lg sm:px-8">
      <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full border border-white/[0.08]" />
      <div className="pointer-events-none absolute -right-10 -top-20 h-52 w-52 rounded-full border border-white/[0.08]" />
      <div className="pointer-events-none absolute bottom-[-100px] right-[25%] h-48 w-48 rounded-full bg-blue-500/[0.08] blur-3xl" />

      <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <div className="mb-3 flex items-center gap-2">
            <Users size={16} className="text-blue-200" />

            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-200">
              Project Management Workspace
            </p>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Team Management
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
            Manage project leadership, assign developers and QA testers, and
            maintain your project team allocation.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3 self-start rounded-xl border border-white/10 bg-white/[0.07] px-4 py-3 backdrop-blur-sm sm:self-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-400/15 text-blue-200">
            <Users size={20} />
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

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        {pageHeader}

        <section className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-blue-100 border-t-blue-600" />

          <p className="mt-4 text-sm font-semibold text-slate-700">
            Loading assigned projects
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Retrieving your project assignments...
          </p>
        </section>
      </div>
    );
  }

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
            description="Choose a project to review and manage its team assignments."
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
                {selectedProject?.name || "No project selected"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Loading State */}
      {loadingTeam && (
        <section className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-blue-100 border-t-blue-600" />

          <p className="mt-4 text-sm font-semibold text-slate-700">
            Loading Project Team
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Fetching current assignments and available team members...
          </p>
        </section>
      )}

      {/* Team Assignment Content */}
      {!loadingTeam && data && (
        <>
          {/* Project Information */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
              <SectionHeading
                icon={ShieldCheck}
                title="Project Information"
                description="Review the selected project's current status before managing its team."
              />
            </div>

            <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:p-6">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Project Name
                </p>

                <p className="mt-2 break-words text-sm font-bold text-slate-800">
                  {data.project.name}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Project Status
                </p>

                <div className="mt-2">
                  <Badge tone="info">{data.project.status}</Badge>
                </div>
              </div>
            </div>
          </section>

          {/* Project Lead Assignment */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
              <SectionHeading
                icon={UserRoundCheck}
                title="Project Lead Assignment"
                description="Select the Project Lead responsible for coordinating this project."
              />
            </div>

            <div className="p-5 sm:p-6">
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-end">
                <div className="min-w-0">
                  <Select
                    label="Project Lead"
                    value={projectLeadId}
                    disabled={saving}
                    options={personOptions(data.options.projectLeads)}
                    onChange={(event) =>
                      setProjectLeadId(event.target.value)
                    }
                  />
                </div>

                <div className="flex min-h-[44px] items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <UserRound size={17} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Current Selection
                    </p>

                    <p className="mt-0.5 truncate text-sm font-semibold text-slate-700">
                      {selectedLead?.name || "No Project Lead selected"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Developer Assignment */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
              <SectionHeading
                icon={Wrench}
                title="Developer Assignment"
                description="Select all developers assigned to this project."
                count={`${developerIds.length} Selected`}
              />
            </div>

            <div className="p-5 sm:p-6">
              {data.options.developers.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {data.options.developers.map((person) => (
                    <MemberCard
                      key={person.id}
                      person={person}
                      role="Developer"
                      selected={developerIds.includes(String(person.id))}
                      disabled={saving}
                      onChange={() =>
                        toggle(person.id, developerIds, setDeveloperIds)
                      }
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center">
                  <Users
                    size={22}
                    className="mx-auto text-slate-400"
                  />
                  <p className="mt-3 text-sm font-semibold text-slate-700">
                    No Developers Available
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    No developer options were returned for this project.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Tester / QA Assignment */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
              <SectionHeading
                icon={CheckCircle2}
                title="Tester / QA Assignment"
                description="Select all testers responsible for quality assurance on this project."
                count={`${testerIds.length} Selected`}
              />
            </div>

            <div className="p-5 sm:p-6">
              {data.options.testers.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {data.options.testers.map((person) => (
                    <MemberCard
                      key={person.id}
                      person={person}
                      role="Tester / QA"
                      selected={testerIds.includes(String(person.id))}
                      disabled={saving}
                      onChange={() =>
                        toggle(person.id, testerIds, setTesterIds)
                      }
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center">
                  <Users
                    size={22}
                    className="mx-auto text-slate-400"
                  />
                  <p className="mt-3 text-sm font-semibold text-slate-700">
                    No Testers Available
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    No tester options were returned for this project.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Selected Team Summary */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
              <SectionHeading
                icon={Users}
                title="Selected Team"
                description="Review the current team selection before saving assignments."
                count={`${totalSelected} Members`}
              />
            </div>

            <div className="p-5 sm:p-6">
              {totalSelected > 0 ? (
                <div className="flex flex-wrap gap-2.5">
                  {selectedLead && (
                    <Badge key={selectedLead.id} tone="info">
                      Lead: {selectedLead.name}
                    </Badge>
                  )}

                  {selectedDevelopers.map((person) => (
                    <Badge key={person.id} tone="neutral">
                      {person.name}
                    </Badge>
                  ))}

                  {selectedTesters.map((person) => (
                    <Badge key={person.id} tone="purple">
                      QA: {person.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-7 text-center">
                  <Users
                    size={22}
                    className="mx-auto text-slate-400"
                  />
                  <p className="mt-3 text-sm font-semibold text-slate-700">
                    No Team Members Selected
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Select a Project Lead, developers, or testers above.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Save Team */}
          <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={19} />
              </div>

              <div>
                <p className="text-sm font-bold text-slate-800">
                  Ready to Update Project Team?
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Save the selected Project Lead, developers, and QA
                  assignments.
                </p>
              </div>
            </div>

            <div className="flex w-full justify-end sm:w-auto">
              <Button
                onClick={save}
                loading={saving}
                disabled={saving || !projectLeadId}
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <Save size={16} />
                  {saving ? "Saving Team..." : "Save Team"}
                </span>
              </Button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default Team;