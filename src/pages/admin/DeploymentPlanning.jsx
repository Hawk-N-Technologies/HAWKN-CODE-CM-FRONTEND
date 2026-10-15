import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { CheckCircle2, Circle, Rocket } from "lucide-react";
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

// ---------------------------------------------------------------------------
// Constants + helpers
// ---------------------------------------------------------------------------

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

// API plan (nulls) → form values ("" for empty boxes)
const toFormValues = (plan) =>
  Object.fromEntries(Object.keys(EMPTY_PLAN).map((key) => [key, plan?.[key] ?? EMPTY_PLAN[key]]));

const statusTone = (value) => {
  if (value === "Connected" || value === "Configured" || value === "Active" || value === "Added") return "success";
  if (value === "Not Configured" || value === "Not Active" || value === "Not Added") return "warning";
  return "neutral";
};

const toOptions = (list) => list.map((value) => ({ value, label: value }));

// One ✓ / ○ cell in the overview table
const Check = ({ ok, label }) =>
  ok ? (
    <CheckCircle2 className="h-4 w-4 text-green-600" aria-label={`${label}: done`} />
  ) : (
    <Circle className="h-4 w-4 text-cm-text-muted" aria-label={`${label}: not done`} />
  );

// ---------------------------------------------------------------------------
// Plan form for ONE project
// ---------------------------------------------------------------------------

function PlanForm({ projectUuid, onSaved }) {
  const [loadState, setLoadState] = useState({ isLoading: true, error: null, project: null });
  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: EMPTY_PLAN });

  // Load the selected project's saved plan (or defaults)
  useEffect(() => {
    let ignore = false;
    getDeploymentPlan(projectUuid)
      .then((data) => {
        if (ignore) return;
        reset(toFormValues(data.plan));
        setLoadState({ isLoading: false, error: null, project: data.project });
      })
      .catch((error) => {
        if (!ignore) setLoadState({ isLoading: false, error: getErrorMessage(error, "Couldn't load the plan."), project: null });
      });
    return () => {
      ignore = true;
    };
  }, [projectUuid, reset]);

  // Live badges follow what's typed
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
        Object.entries(fieldErrors).forEach(([field, message]) => setError(field, { type: "server", message }));
      }
      showToast.error(getErrorMessage(error, "Couldn't save the deployment plan."));
    }
  };

  if (loadState.isLoading) {
    return <p className="rounded-cm-lg border border-cm-border bg-cm-card p-6 text-sm text-cm-text-muted">Loading plan…</p>;
  }
  if (loadState.error) {
    return (
      <div className="rounded-cm-lg border border-cm-border bg-cm-card">
        <ErrorState title="Couldn't load the plan" description={loadState.error} />
      </div>
    );
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-6 rounded-cm-lg border border-cm-border bg-cm-card p-6 shadow-sm"
    >
      <div>
        <h2 className="text-sm font-semibold text-cm-text">
          Deployment Status — {loadState.project.name}
          <span className="ml-2 text-xs font-normal text-cm-text-muted">({loadState.project.clientName})</span>
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-cm-border p-4">
            <p className="text-xs text-cm-text-muted">GitHub</p>
            <Badge tone={repositoryUrl ? "success" : "warning"}>{repositoryUrl ? "Connected" : "Not Connected"}</Badge>
          </div>
          <div className="rounded-lg border border-cm-border p-4">
            <p className="text-xs text-cm-text-muted">Server</p>
            <Badge tone={statusTone(serverStatus)}>{serverStatus}</Badge>
          </div>
          <div className="rounded-lg border border-cm-border p-4">
            <p className="text-xs text-cm-text-muted">CI/CD</p>
            <Badge tone={statusTone(cicdStatus)}>{cicdStatus}</Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          label="GitHub Repository"
          placeholder="https://github.com/org/repository"
          error={errors.repositoryUrl?.message}
          {...register("repositoryUrl", {
            validate: (value) => !value || /^https?:\/\//i.test(value) || "Must start with http:// or https://",
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
          helperText="Track status only — never paste real passwords or keys here."
          error={errors.credentialsStatus?.message}
          {...register("credentialsStatus")}
        />
      </div>

      <div>
        <h2 className="text-sm font-semibold text-cm-text">Environment Domain Mapping</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Input label="Development" placeholder="dev.example.com" error={errors.devDomain?.message} {...register("devDomain")} />
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
      </div>

      <Input
        label="CI/CD / Deployment Documentation Link (optional)"
        placeholder="https://docs.example.com/deployment"
        helperText="Link to the docs (Drive, Notion, Confluence…)."
        error={errors.documentationUrl?.message}
        {...register("documentationUrl", {
          validate: (value) => !value || /^https?:\/\//i.test(value) || "Must start with http:// or https://",
        })}
      />

      <div className="flex justify-end border-t border-cm-border pt-4">
        <Button type="submit" loading={isSubmitting}>
          Save Deployment Plan
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function DeploymentPlanning() {
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedUuid, setSelectedUuid] = useState("");

  useEffect(() => {
    let ignore = false; // page closed before the answer arrived → drop it
    getDeploymentProjects()
      .then((list) => {
        if (ignore) return;
        setRows(list);
        setLoadError(null);
      })
      .catch((error) => {
        if (!ignore) setLoadError(getErrorMessage(error, "Couldn't load projects."));
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [reloadKey]);

  const reload = () => setReloadKey((key) => key + 1); // quiet refresh (table stays on screen)
  const retry = () => {
    setIsLoading(true);
    setLoadError(null);
    reload();
  };

  const selectProject = (uuid) => {
    setSelectedUuid(uuid);
    if (uuid) window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const readyCount = useMemo(() => rows.filter((row) => row.readiness.isReady).length, [rows]);

  const columns = [
    {
      key: "project",
      header: "Project",
      render: (row) => (
        <div>
          <div className="font-medium text-cm-text">{row.project.name}</div>
          <div className="text-xs text-cm-text-muted">{row.project.clientName}</div>
        </div>
      ),
    },
    { key: "github", header: "GitHub", render: (row) => <Check ok={row.readiness.checks.github} label="GitHub" /> },
    { key: "server", header: "Server", render: (row) => <Check ok={row.readiness.checks.server} label="Server" /> },
    { key: "cicd", header: "CI/CD", render: (row) => <Check ok={row.readiness.checks.cicd} label="CI/CD" /> },
    {
      key: "credentials",
      header: "Credentials",
      render: (row) => <Check ok={row.readiness.checks.credentials} label="Credentials" />,
    },
    { key: "live", header: "Live Domain", render: (row) => row.plan.liveDomain || <span className="text-cm-text-muted">—</span> },
    {
      key: "readiness",
      header: "Readiness",
      render: (row) =>
        row.readiness.isReady ? (
          <Badge tone="success">Ready</Badge>
        ) : (
          <Badge tone={row.hasPlan ? "warning" : "neutral"}>
            {row.hasPlan ? `${row.readiness.done}/${row.readiness.total}` : "No plan"}
          </Badge>
        ),
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <Button size="sm" variant="outline" onClick={() => selectProject(row.project.uuid)}>
          {row.hasPlan ? "Edit Plan" : "Create Plan"}
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-cm-text">Deployment Planning</h1>
          <p className="mt-1 text-sm text-cm-text-muted">
            Track repository, server, CI/CD and environment configuration for each project.
          </p>
        </div>

        {/* Plain <select>: the shared Select is built for forms (uncontrolled) */}
        <label className="flex flex-col gap-1.5 text-sm font-medium text-cm-text">
          Project
          <select
            value={selectedUuid}
            onChange={(event) => selectProject(event.target.value)}
            disabled={isLoading || rows.length === 0}
            className="h-10 min-w-[16rem] rounded-cm-md border border-cm-border bg-white px-3 text-sm text-cm-text focus:border-cm-blue-500 focus:outline-none focus:ring-2 focus:ring-cm-blue-500"
          >
            <option value="">Select a project…</option>
            {rows.map((row) => (
              <option key={row.project.uuid} value={row.project.uuid}>
                {row.project.name} — {row.project.clientName}
              </option>
            ))}
          </select>
        </label>
      </div>

      {selectedUuid ? (
        <PlanForm key={selectedUuid} projectUuid={selectedUuid} onSaved={reload} />
      ) : (
        !isLoading &&
        !loadError &&
        rows.length > 0 && (
          <div className="flex items-center gap-3 rounded-cm-lg border border-dashed border-cm-border bg-cm-card p-6 text-sm text-cm-text-muted">
            <Rocket className="h-5 w-5" aria-hidden="true" />
            Pick a project above (or use “Create Plan” below) to set up its deployment.
          </div>
        )
      )}

      {loadError ? (
        <div className="rounded-cm-lg border border-cm-border bg-cm-card">
          <ErrorState title="Couldn't load projects" description={loadError} onRetry={retry} />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-cm-text">
            All Projects{" "}
            {!isLoading && rows.length > 0 && (
              <span className="font-normal text-cm-text-muted">
                · {readyCount} of {rows.length} ready to deploy
              </span>
            )}
          </h2>
          <DataTable
            columns={columns}
            rows={rows.map((row) => ({ ...row, id: row.project.uuid }))}
            isLoading={isLoading}
            emptyMessage="No projects yet — create one in Project Management first."
          />
        </div>
      )}
    </div>
  );
}

export default DeploymentPlanning;