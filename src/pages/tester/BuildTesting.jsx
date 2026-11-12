import { useState } from "react";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Select from "../../components/common/Select";
import Textarea from "../../components/common/TextArea";
import { showToast } from "../../components/common/Toast";

const buildResults = ["Pending", "Passed", "Failed"];

const getResultTone = (result) => {
  switch (result) {
    case "Passed":
      return "success";
    case "Failed":
      return "danger";
    default:
      return "warning";
  }
};

export default function BuildTesting() {
  const [data, setData] = useState([
    ["BUILD-142", "Acme Retail ERP", "Staging", "v1.4.2", "Pending"],
    ["BUILD-091", "Internal HRMS", "QA", "v0.9.1", "Passed"],
  ]);

  const passedCount = data.filter((build) => build[4] === "Passed").length;
  const failedCount = data.filter((build) => build[4] === "Failed").length;
  const pendingCount = data.filter((build) => build[4] === "Pending").length;

  const updateBuildResult = (buildId, nextResult) => {
    setData((previous) =>
      previous.map((build) =>
        build[0] === buildId
          ? [build[0], build[1], build[2], build[3], nextResult]
          : build,
      ),
    );
  };

  const handleSave = () => {
    showToast.success("Build test result saved.");
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <section className="relative overflow-hidden rounded-[28px] border border-slate-800 bg-gradient-to-br from-[#080d25] via-[#0b1734] to-[#1b2052] px-6 py-7 shadow-[0_18px_45px_rgba(15,23,42,0.16)] sm:px-8 sm:py-8">
        <div className="pointer-events-none absolute -right-16 -top-28 h-72 w-72 rounded-full border border-blue-300/10" />
        <div className="pointer-events-none absolute -right-8 -top-20 h-56 w-56 rounded-full border border-blue-300/10" />
        <div className="pointer-events-none absolute -bottom-24 right-24 h-52 w-52 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between gap-6 xl:flex-row xl:items-center">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-blue-200">
                Tester Workspace
              </span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-[34px]">
              Build Testing
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300 sm:text-[15px]">
              Validate application builds across assigned environments and
              record testing results before release.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-slate-200">
                {data.length} Assigned Builds
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-slate-200">
                Staging & QA Environments
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:min-w-[280px]">
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Total Builds
              </p>
              <p className="mt-2 text-3xl font-bold text-white tabular-nums">
                {data.length}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Assigned for validation
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Passed Builds
              </p>
              <p className="mt-2 text-3xl font-bold text-emerald-300 tabular-nums">
                {passedCount}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Successfully validated
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Build Summary */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-cm-border bg-cm-card p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-cm-text-muted">
                Pending Builds
              </p>
              <p className="mt-2 text-2xl font-bold text-cm-text tabular-nums">
                {pendingCount}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="9" />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 7v5l3 2"
                />
              </svg>
            </div>
          </div>
          <p className="mt-2 text-xs text-cm-text-muted">
            Awaiting testing results
          </p>
        </div>

        <div className="rounded-2xl border border-cm-border bg-cm-card p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-cm-text-muted">
                Passed Builds
              </p>
              <p className="mt-2 text-2xl font-bold text-cm-text tabular-nums">
                {passedCount}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m5 12 4 4L19 6"
                />
              </svg>
            </div>
          </div>
          <p className="mt-2 text-xs text-cm-text-muted">
            Builds marked as passed
          </p>
        </div>

        <div className="rounded-2xl border border-cm-border bg-cm-card p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-cm-text-muted">
                Failed Builds
              </p>
              <p className="mt-2 text-2xl font-bold text-cm-text tabular-nums">
                {failedCount}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="9" />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m9 9 6 6m0-6-6 6"
                />
              </svg>
            </div>
          </div>
          <p className="mt-2 text-xs text-cm-text-muted">
            Builds requiring attention
          </p>
        </div>
      </section>

      {/* Build Testing Queue */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cm-text-muted">
              Testing Queue
            </p>
            <h2 className="mt-1 text-xl font-bold text-cm-text">
              Assigned Application Builds
            </h2>
            <p className="mt-1 text-sm text-cm-text-muted">
              Review each build and update its testing result.
            </p>
          </div>

          <p className="text-xs font-medium text-cm-text-muted">
            {data.length} builds listed
          </p>
        </div>

        {data.map((build) => (
          <section
            key={build[0]}
            className="overflow-hidden rounded-2xl border border-cm-border bg-cm-card shadow-sm"
          >
            {/* Build Card Header */}
            <div className="flex flex-col gap-4 border-b border-cm-border px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-6 w-6"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m4.5 7.5 7.5 4.3 7.5-4.3M12 12v9"
                    />
                  </svg>
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-cm-text-muted">
                      {build[0]}
                    </span>
                    <span className="text-cm-text-muted">·</span>
                    <span className="text-xs font-medium text-cm-text-muted">
                      {build[3]}
                    </span>
                  </div>

                  <h3 className="mt-1 text-lg font-bold text-cm-text">
                    {build[1]}
                  </h3>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-md border border-cm-border bg-cm-bg px-2.5 py-1 text-xs font-medium text-cm-text-muted">
                      Environment: {build[2]}
                    </span>
                    <span className="rounded-md border border-cm-border bg-cm-bg px-2.5 py-1 text-xs font-medium text-cm-text-muted">
                      Version: {build[3]}
                    </span>
                  </div>
                </div>
              </div>

              <div className="sm:shrink-0">
                <Badge tone={getResultTone(build[4])}>
                  {build[4]}
                </Badge>
              </div>
            </div>

            {/* Build Testing Form */}
            <div className="p-5 sm:p-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Select
                    label="Build Result"
                    value={build[4]}
                    options={buildResults.map((value) => ({
                      value,
                      label: value,
                    }))}
                    onChange={(e) =>
                      updateBuildResult(build[0], e.target.value)
                    }
                  />

                  <p className="text-xs text-cm-text-muted">
                    Select the result of the build validation.
                  </p>
                </div>

                <div className="space-y-2">
                  <Textarea
                    label="Build Notes"
                    placeholder="Add build testing notes..."
                  />

                  <p className="text-xs text-cm-text-muted">
                    Record relevant build observations or testing details.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 border-t border-cm-border pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-5 text-cm-text-muted">
                  Verify the build result before saving.
                </p>

                <Button size="sm" onClick={handleSave}>
                  Save Result
                </Button>
              </div>
            </div>
          </section>
        ))}
      </section>
    </div>
  );
}
