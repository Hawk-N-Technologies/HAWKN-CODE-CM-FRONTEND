import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { CheckCircle2, Clock3, ExternalLink, Hammer, Plus, RefreshCw, XCircle } from "lucide-react";

import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import TextArea from "../../components/common/TextArea";
import Modal from "../../components/common/Modal";
import ErrorState from "../../components/common/ErrorState";
import { showToast } from "../../components/common/Toast";
import StatCard from "../../components/cards/StatCard";
import PageHeader from "../../components/layout/PageHeader";
import DataTable from "../../components/tables/DataTable";
import TableSearch from "../../components/tables/TableSearch";
import ResultModal from "../../components/testing/ResultModal";
import { RESULT_TONE, formatDateTime, matches } from "../../components/testing/testingUtils";
import {
  addBuild,
  getBuilds,
  getTesterProjects,
  getTestingError,
  recordBuildResult,
} from "../../services/testingService";

/**
 * Tester → Build Testing.
 * Add each version (build) of a project and record whether it passed.
 * The project lead is told about every result.
 */

const ENVIRONMENTS = ["QA", "Staging", "Production"];
const FILTERS = ["All", "Pending", "Passed", "Failed"];

function AddBuildModal({ projects, onClose, onSaved }) {
  const [saving, setSaving] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: { projectId: projects[0]?.uuid ?? "", versionLabel: "", environment: "QA", buildUrl: "", releaseNotes: "" },
  });

  const onSubmit = async (values) => {
    setSaving(true);
    try {
      await addBuild(values);
      showToast.success("Build added.");
      onSaved();
    } catch (error) {
      showToast.error(getTestingError(error, "Couldn't add the build."));
      setSaving(false);
    }
  };

  return (
    <Modal
      onClose={onClose}
      closeDisabled={saving}
      eyebrow="BUILD TESTING"
      title="Add Build"
      description="Add the version you're about to test. Record the result once you've checked it."
      icon={Hammer}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-6 py-6 sm:px-8">
        <Select
          label="Project"
          required
          options={projects.map((project) => ({ value: project.uuid, label: project.name }))}
          placeholder="Select project"
          {...register("projectId", { required: "Pick a project" })}
          error={errors.projectId?.message}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Version"
            required
            maxLength={50}
            placeholder="e.g. v1.4.2"
            {...register("versionLabel", { required: "Version is required" })}
            error={errors.versionLabel?.message}
          />
          <Select
            label="Environment"
            options={ENVIRONMENTS.map((value) => ({ value, label: value }))}
            {...register("environment")}
          />
        </div>
        <Input
          label="Build link (optional)"
          placeholder="https://staging.example.com"
          {...register("buildUrl", {
            pattern: { value: /^(https?:\/\/\S+)?$/i, message: "Use a full link starting with https://" },
          })}
          error={errors.buildUrl?.message}
        />
        <TextArea
          label="What changed (optional)"
          rows={3}
          maxLength={5000}
          placeholder="Release notes from the developers"
          {...register("releaseNotes")}
        />
        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" loading={saving} leftIcon={<Plus size={16} />}>
            Add build
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function BuildTesting() {
  const [builds, setBuilds] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [adding, setAdding] = useState(false);
  const [recording, setRecording] = useState(null);

  useEffect(() => {
    let ignore = false;

    Promise.all([getBuilds(), getTesterProjects()])
      .then(([list, projectList]) => {
        if (ignore) return;
        setBuilds(list);
        setProjects(projectList);
        setLoadError("");
      })
      .catch((error) => {
        if (!ignore) setLoadError(getTestingError(error, "Couldn't load builds."));
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [reloadKey]);

  const reload = () => {
    setIsLoading(true);
    setReloadKey((key) => key + 1);
  };

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return builds
      .filter((build) => filter === "All" || build.result === filter)
      .filter((build) => matches(query, build.project.name, build.versionLabel, build.environment))
      .map((build) => ({ ...build, id: build.uuid }));
  }, [builds, search, filter]);

  const countOf = (result) => builds.filter((build) => build.result === result).length;
  const live = (value) => (isLoading ? "…" : loadError ? "—" : String(value));

  const saveResult = async (result, testNotes) => {
    try {
      await recordBuildResult(recording.uuid, { result, testNotes });
      showToast.success(`${recording.versionLabel} marked as ${result.toLowerCase()}.`);
      setRecording(null);
      reload();
      return true;
    } catch (error) {
      showToast.error(getTestingError(error, "Couldn't save the result."));
      return false;
    }
  };

  const columns = [
    {
      key: "build",
      header: "Build",
      render: (row) => (
        <div className="min-w-[150px]">
          <div className="font-semibold text-slate-800">{row.versionLabel}</div>
          <div className="mt-0.5 text-xs text-slate-500">{row.project.name}</div>
        </div>
      ),
    },
    { key: "environment", header: "Environment", render: (row) => <Badge tone="neutral">{row.environment}</Badge> },
    {
      key: "link",
      header: "Link",
      render: (row) =>
        row.buildUrl ? (
          <a
            href={row.buildUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:underline"
          >
            Open <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      key: "result",
      header: "Result",
      render: (row) => (
        <div className="max-w-[260px]">
          <Badge tone={RESULT_TONE[row.result]}>{row.result}</Badge>
          {row.testNotes && <p className="mt-1 line-clamp-2 text-xs text-slate-500">{row.testNotes}</p>}
        </div>
      ),
    },
    {
      key: "tested",
      header: "Tested",
      render: (row) =>
        row.testedAt ? (
          <div className="whitespace-nowrap text-xs text-slate-600">
            {formatDateTime(row.testedAt)}
            <div className="text-slate-400">{row.testedBy}</div>
          </div>
        ) : (
          <span className="text-xs text-slate-400">Not yet</span>
        ),
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <Button size="sm" variant={row.result === "Pending" ? "primary" : "outline"} onClick={() => setRecording(row)}>
          {row.result === "Pending" ? "Record result" : "Change"}
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 pb-8">
      <PageHeader
        eyebrow="TESTING"
        title="Build Testing"
        description="Check every version of your projects before it moves on. The project lead hears about each result."
        icon={Hammer}
        actions={
          <Button
            type="button"
            variant="outline"
            leftIcon={<Plus size={16} />}
            disabled={isLoading || projects.length === 0}
            onClick={() => setAdding(true)}
            className="!min-h-[44px] !whitespace-nowrap"
          >
            Add Build
          </Button>
        }
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Waiting for testing" value={live(countOf("Pending"))} icon={<Clock3 size={18} />} accent="warning" />
        <StatCard label="Passed" value={live(countOf("Passed"))} icon={<CheckCircle2 size={18} />} accent="success" />
        <StatCard label="Failed" value={live(countOf("Failed"))} icon={<XCircle size={18} />} accent="purple" />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#101a3a]">Builds</h2>
            <p className="text-sm text-slate-500">Newest first.</p>
          </div>
          <Button size="sm" variant="outline" leftIcon={<RefreshCw size={14} />} onClick={reload}>
            Refresh
          </Button>
        </div>

        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex-1">
            <TableSearch value={search} onChange={setSearch} placeholder="Search project, version or environment…" />
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={filter === item}
                onClick={() => setFilter(item)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  filter === item
                    ? "border-[#0b1932] bg-[#0b1932] text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50/50"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {loadError ? (
          <ErrorState title="Couldn't load builds" description={loadError} onRetry={reload} />
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            isLoading={isLoading}
            emptyMessage={
              builds.length === 0
                ? projects.length === 0
                  ? "You aren't testing any projects yet."
                  : "No builds yet — add the first one."
                : "No builds match this filter or search."
            }
          />
        )}
      </section>

      {adding && (
        <AddBuildModal
          projects={projects}
          onClose={() => setAdding(false)}
          onSaved={() => {
            setAdding(false);
            reload();
          }}
        />
      )}

      {recording && (
        <ResultModal
          eyebrow="BUILD TESTING"
          title={`Result for ${recording.versionLabel}`}
          description={`${recording.project.name} · ${recording.environment}`}
          initialNotes={recording.testNotes ?? ""}
          onClose={() => setRecording(null)}
          onSave={saveResult}
        />
      )}
    </div>
  );
}
