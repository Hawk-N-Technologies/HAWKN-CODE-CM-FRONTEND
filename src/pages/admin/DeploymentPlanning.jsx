import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { CheckCircle2, Circle, Rocket, Server, GitBranch, Activity, RefreshCw } from "lucide-react";

import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import ErrorState from "../../components/common/ErrorState";
import DataTable from "../../components/tables/DataTable";
import { showToast } from "../../components/common/Toast";

import {
  getDeploymentPlan,
  getDeploymentProjects,
  getErrorMessage,
  getFieldErrors,
  saveDeploymentPlan,
} from "../../services/deploymentService";

// -----------------------------------------------------------------------------
// Constants + helpers
// -----------------------------------------------------------------------------

const SERVER_STATUSES = ["Not Configured", "Configured"];
const CICD_STATUSES = ["Not Active", "Active"];
const CREDENTIAL_STATUSES = ["Not Added", "Added"];

const EMPTY_PLAN = {
  repositoryUrl: "",
  serverStatus: "Not Configured",
  cicdStatus: "Not Active",
  credentialsStatus: "Not Added",
  devDomain: "",
  stagingDomain: "",
  liveDomain: "",
  documentationUrl: "",
};

const toFormValues = (plan) =>
  Object.fromEntries(
    Object.keys(EMPTY_PLAN).map((key) => [
      key,
      plan?.[key] ?? EMPTY_PLAN[key],
    ])
  );

const statusTone = (value) => {
  if (
    value === "Connected" ||
    value === "Configured" ||
    value === "Active" ||
    value === "Added"
  ) {
    return "success";
  }

  if (
    value === "Not Configured" ||
    value === "Not Active" ||
    value === "Not Added"
  ) {
    return "warning";
  }

  return "neutral";
};

const toOptions = (list) =>
  list.map((value) => ({ value, label: value }));

const Check = ({ ok, label }) =>
  ok ? (
    <CheckCircle2
      className="h-4 w-4 text-green-600"
      aria-label={`${label}: done`}
    />
  ) : (
    <Circle
      className="h-4 w-4 text-slate-300"
      aria-label={`${label}: not done`}
    />
  );

// -----------------------------------------------------------------------------
// Reusable UI components
// -----------------------------------------------------------------------------

function SectionHeading({ eyebrow, title, description, icon: Icon }) {
  return (
    <div className="flex items-start gap-3">
      {Icon && (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700">
          <Icon className="h-5 w-5" />
        </div>
      )}

      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-600">
            {eyebrow}
          </p>
        )}
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {description && (
          <p className="mt-1 text-sm leading-5 text-slate-500">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, description, icon: Icon, tone = "blue" }) {
  const iconStyles = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    green: "bg-emerald-50 text-emerald-700 border-emerald-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    slate: "bg-slate-100 text-slate-700 border-slate-200",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${iconStyles[tone]}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function StatusCard({ label, value, description, tone = "neutral" }) {
  const styles = {
    success: "border-emerald-200 bg-emerald-50/70",
    warning: "border-amber-200 bg-amber-50/70",
    neutral: "border-slate-200 bg-slate-50",
  };

  return (
    <div className={`rounded-xl border p-4 ${styles[tone] || styles.neutral}`}>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <div className="mt-2">
        <Badge tone={tone}>{value}</Badge>
      </div>
      {description && (
        <p className="mt-2 text-xs text-slate-500">{description}</p>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Plan form for one project
// -----------------------------------------------------------------------------

function PlanForm({ projectUuid, onSaved }) {
  const [loadState, setLoadState] = useState({
    isLoading: true,
    error: null,
    project: null,
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: EMPTY_PLAN });

  // Load the selected project's saved plan or defaults.
  useEffect(() => {
    let ignore = false;

    getDeploymentPlan(projectUuid)
      .then((data) => {
        if (ignore) return;

        reset(toFormValues(data.plan));
        setLoadState({
          isLoading: false,
          error: null,
          project: data.project,
        });
      })
      .catch((error) => {
        if (!ignore) {
          setLoadState({
            isLoading: false,
            error: getErrorMessage(error, "Couldn't load the plan."),
            project: null,
          });
        }
      });

    return () => {
      ignore = true;
    };
  }, [projectUuid, reset]);

  // Live status indicators follow the current form values.
  const [repositoryUrl, serverStatus, cicdStatus] = useWatch({
    control,
    name: ["repositoryUrl", "serverStatus", "cicdStatus"],
  });

  const onSubmit = async (values) => {
    try {
      const res = await saveDeploymentPlan(projectUuid, values);

      showToast.success(`${res.message}.`);
      reset(toFormValues(res.data.plan));
      onSaved();
    } catch (error) {
      const fieldErrors = getFieldErrors(error);

      if (fieldErrors) {
        Object.entries(fieldErrors).forEach(([field, message]) =>
          setError(field, { type: "server", message })
        );
      }

      showToast.error(
        getErrorMessage(error, "Couldn't save the deployment plan.")
      );
    }
  };

  if (loadState.isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <p className="text-sm text-slate-500">Loading deployment plan...</p>
        </div>
      </div>
    );
  }

  if (loadState.error) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <ErrorState
          title="Couldn't load the plan"
          description={loadState.error}
        />
      </div>
    );
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-5"
    >
      {/* Deployment status */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <SectionHeading
            eyebrow="PROJECT CONFIGURATION"
            title="Deployment Status"
            description={`${loadState.project.name} · ${loadState.project.clientName}`}
            icon={Activity}
          />
          <Badge tone="neutral">Live form status</Badge>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatusCard
            label="GitHub Repository"
            value={repositoryUrl ? "Connected" : "Not Connected"}
            description="Repository URL configuration"
            tone={repositoryUrl ? "success" : "warning"}
          />

          <StatusCard
            label="Server"
            value={serverStatus}
            description="Server configuration status"
            tone={statusTone(serverStatus)}
          />

          <StatusCard
            label="CI/CD"
            value={cicdStatus}
            description="Pipeline activation status"
            tone={statusTone(cicdStatus)}
          />
        </div>
      </section>

      {/* Repository and infrastructure */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <SectionHeading
          eyebrow="INFRASTRUCTURE"
          title="Repository & Configuration"
          description="Configure the source repository, server, CI/CD and credential status."
          icon={GitBranch}
        />

        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
          <Input
            label="GitHub Repository"
            placeholder="https://github.com/org/repository"
            error={errors.repositoryUrl?.message}
            {...register("repositoryUrl", {
              validate: (value) =>
                !value ||
                /^https?:\/\//i.test(value) ||
                "Must start with http:// or https://",
            })}
          />

          <Select
            label="Server Configuration Status"
            options={toOptions(SERVER_STATUSES)}
            error={errors.serverStatus?.message}
            {...register("serverStatus")}
          />

          <Select
            label="CI/CD Status"
            options={toOptions(CICD_STATUSES)}
            error={errors.cicdStatus?.message}
            {...register("cicdStatus")}
          />

          <Select
            label="Credentials"
            options={toOptions(CREDENTIAL_STATUSES)}
            helperText="Track status only. Never paste real passwords or keys here."
            error={errors.credentialsStatus?.message}
            {...register("credentialsStatus")}
          />
        </div>
      </section>

      {/* Environment domains */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <SectionHeading
          eyebrow="ENVIRONMENT MAPPING"
          title="Environment Domains"
          description="Maintain the configured domain for each deployment environment."
          icon={Server}
        />

        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">
          <Input
            label="Development"
            placeholder="dev.example.com"
            error={errors.devDomain?.message}
            {...register("devDomain")}
          />

          <Input
            label="Staging"
            placeholder="staging.example.com"
            error={errors.stagingDomain?.message}
            {...register("stagingDomain")}
          />

          <Input
            label="Live / Production"
            placeholder="example.com"
            error={errors.liveDomain?.message}
            {...register("liveDomain")}
          />
        </div>
      </section>

      {/* Documentation */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <SectionHeading
          eyebrow="REFERENCE"
          title="Deployment Documentation"
          description="Add the documentation link used by the team for deployment reference."
          icon={Rocket}
        />

        <div className="mt-5">
          <Input
            label="CI/CD / Deployment Documentation Link (optional)"
            placeholder="https://docs.example.com/deployment"
            helperText="Link to the documentation in Drive, Notion, Confluence, or another source."
            error={errors.documentationUrl?.message}
            {...register("documentationUrl", {
              validate: (value) =>
                !value ||
                /^https?:\/\//i.test(value) ||
                "Must start with http:// or https://",
            })}
          />
        </div>
      </section>

      {/* Save action */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:px-6">
        <div>
          <p className="text-sm font-semibold text-slate-800">
            Save deployment configuration
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Changes are submitted for this selected project.
          </p>
        </div>

        <Button type="submit" loading={isSubmitting}>
          Save Deployment Plan
        </Button>
      </div>
    </form>
  );
}

// -----------------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------------

function DeploymentPlanning() {
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedUuid, setSelectedUuid] = useState("");

  useEffect(() => {
    let ignore = false;

    getDeploymentProjects()
      .then((list) => {
        if (ignore) return;

        setRows(list);
        setLoadError(null);
      })
      .catch((error) => {
        if (!ignore) {
          setLoadError(getErrorMessage(error, "Couldn't load projects."));
        }
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [reloadKey]);

  // Quiet refresh keeps the project table visible.
  const reload = () => setReloadKey((key) => key + 1);

  const retry = () => {
    setIsLoading(true);
    setLoadError(null);
    reload();
  };

  const selectProject = (uuid) => {
    setSelectedUuid(uuid);

    if (uuid) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const readyCount = useMemo(
    () => rows.filter((row) => row.readiness.isReady).length,
    [rows]
  );

  const plannedCount = useMemo(
    () => rows.filter((row) => row.hasPlan).length,
    [rows]
  );

  const columns = [
    {
      key: "project",
      header: "Project",
      render: (row) => (
        <div className="min-w-[150px]">
          <div className="font-semibold text-slate-800">
            {row.project.name}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {row.project.clientName}
          </div>
        </div>
      ),
    },
    {
      key: "github",
      header: "GitHub",
      render: (row) => (
        <div className="flex justify-center">
          <Check ok={row.readiness.checks.github} label="GitHub" />
        </div>
      ),
    },
    {
      key: "server",
      header: "Server",
      render: (row) => (
        <div className="flex justify-center">
          <Check ok={row.readiness.checks.server} label="Server" />
        </div>
      ),
    },
    {
      key: "cicd",
      header: "CI/CD",
      render: (row) => (
        <div className="flex justify-center">
          <Check ok={row.readiness.checks.cicd} label="CI/CD" />
        </div>
      ),
    },
    {
      key: "credentials",
      header: "Credentials",
      render: (row) => (
        <div className="flex justify-center">
          <Check
            ok={row.readiness.checks.credentials}
            label="Credentials"
          />
        </div>
      ),
    },
    {
      key: "live",
      header: "Live Domain",
      render: (row) =>
        row.plan.liveDomain || (
          <span className="text-xs text-slate-400">Not configured</span>
        ),
    },
    {
      key: "readiness",
      header: "Readiness",
      render: (row) =>
        row.readiness.isReady ? (
          <Badge tone="success">Ready</Badge>
        ) : (
          <Badge tone={row.hasPlan ? "warning" : "neutral"}>
            {row.hasPlan
              ? `${row.readiness.done}/${row.readiness.total}`
              : "No plan"}
          </Badge>
        ),
    },
    {
      key: "actions",
      header: "Action",
      render: (row) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => selectProject(row.project.uuid)}
        >
          {row.hasPlan ? "Edit Plan" : "Create Plan"}
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Standardized Admin header */}
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
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-blue-100">
              <Rocket className="h-6 w-6" />
            </div>

            <div className="min-w-0">
              <span className="inline-flex items-center rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-200">
                ADMINISTRATION
              </span>

              <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-[34px]">
                Deployment Planning
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Manage repository, infrastructure, CI/CD and environment
                configuration across approved projects.
              </p>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-3">
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2">
              <p className="text-[10px] font-medium uppercase tracking-wider text-blue-200">
                Projects
              </p>
              <p className="mt-0.5 text-xl font-bold text-white">
                {isLoading ? "..." : rows.length}
              </p>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={reload}
              disabled={isLoading}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      {/* Summary cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total Projects"
          value={isLoading ? "—" : rows.length}
          description="Projects available for deployment"
          icon={Server}
          tone="blue"
        />

        <SummaryCard
          label="Plans Created"
          value={isLoading ? "—" : plannedCount}
          description="Projects with a saved deployment plan"
          icon={GitBranch}
          tone="green"
        />

        <SummaryCard
          label="Awaiting Planning"
          value={isLoading ? "—" : rows.length - plannedCount}
          description="Projects without a deployment plan"
          icon={Circle}
          tone="amber"
        />

        <SummaryCard
          label="Ready to Deploy"
          value={isLoading ? "—" : readyCount}
          description="Projects meeting all readiness checks"
          icon={CheckCircle2}
          tone="green"
        />
      </section>

      {/* Project selection */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            eyebrow="PROJECT WORKSPACE"
            title="Select a Project"
            description="Choose a project to view or update its deployment configuration."
            icon={Server}
          />

          <label className="flex w-full flex-col gap-1.5 text-sm font-medium text-slate-700 md:w-auto">
            Project
            <select
              value={selectedUuid}
              onChange={(event) => selectProject(event.target.value)}
              disabled={isLoading || rows.length === 0}
              className="h-11 min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 md:min-w-[19rem]"
            >
              <option value="">Select a project...</option>
              {rows.map((row) => (
                <option key={row.project.uuid} value={row.project.uuid}>
                  {row.project.name} — {row.project.clientName}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {/* Selected project's plan */}
      {selectedUuid ? (
        <PlanForm
          key={selectedUuid}
          projectUuid={selectedUuid}
          onSaved={reload}
        />
      ) : (
        !isLoading &&
        !loadError &&
        rows.length > 0 && (
          <div className="flex items-start gap-4 rounded-2xl border border-dashed border-blue-200 bg-blue-50/50 p-5 sm:p-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-white text-blue-700">
              <Rocket className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                No project selected
              </p>
              <p className="mt-1 text-sm leading-5 text-slate-600">
                Select a project above or use the Create Plan action in the
                projects table to configure its deployment.
              </p>
            </div>
          </div>
        )
      )}

      {/* All projects table */}
      {loadError ? (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <ErrorState
            title="Couldn't load projects"
            description={loadError}
            onRetry={retry}
          />
        </div>
      ) : (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <SectionHeading
              eyebrow="DEPLOYMENT OVERVIEW"
              title="All Projects"
              description="Review deployment configuration and readiness across projects."
              icon={Activity}
            />

            {!isLoading && rows.length > 0 && (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                {readyCount} of {rows.length} ready to deploy
              </div>
            )}
          </div>

          <DataTable
            columns={columns}
            rows={rows.map((row) => ({
              ...row,
              id: row.project.uuid,
            }))}
            isLoading={isLoading}
            emptyMessage="No projects yet — create one in Project Management first."
          />
        </section>
      )}
    </div>
  );
}

export default DeploymentPlanning;
