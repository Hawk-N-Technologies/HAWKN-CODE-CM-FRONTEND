import { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  ClipboardCheck,
  Flag,
  GraduationCap,
  PackageCheck,
  RefreshCw,
  ShieldCheck,
  Wrench,
} from "lucide-react";

import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Select from "../../components/common/Select";
import { showToast } from "../../components/common/Toast";

// -----------------------------------------------------------------------------
// Constants + initial data
// -----------------------------------------------------------------------------

const INITIAL_PROJECTS = [
  {
    id: "PRJ-001",
    name: "Acme Retail ERP",
    phases: "4 / 4",
    handover: "Ready",
    buildTesting: "Pending",
    training: "Pending",
    delivery: "Pending",
  },
  {
    id: "PRJ-002",
    name: "Northstar Website",
    phases: "2 / 3",
    handover: "Blocked",
    buildTesting: "Not Started",
    training: "Not Started",
    delivery: "Not Started",
  },
];

const TRAINING_STATUSES = ["Pending", "In Progress", "Completed"];

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

const getStatusTone = (status) => {
  const normalized = status?.toLowerCase();

  if (
    normalized === "completed" ||
    normalized === "ready"
  ) {
    return "success";
  }

  if (
    normalized === "in progress"
  ) {
    return "info";
  }

  if (
    normalized === "blocked" ||
    normalized === "pending"
  ) {
    return "warning";
  }

  return "neutral";
};

const getPhaseProgress = (phases) => {
  const [completed, total] = phases.split(" / ").map(Number);

  if (!total) return 0;

  return Math.round((completed / total) * 100);
};

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
    blue: "border-blue-100 bg-blue-50 text-blue-700",
    green: "border-emerald-100 bg-emerald-50 text-emerald-700",
    amber: "border-amber-100 bg-amber-50 text-amber-700",
    slate: "border-slate-200 bg-slate-100 text-slate-700",
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

function StatusCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-slate-400" />
        <p className="text-xs font-medium text-slate-500">{label}</p>
      </div>

      <div className="mt-3">
        <Badge tone={getStatusTone(value)}>{value}</Badge>
      </div>
    </div>
  );
}

function PhaseProgress({ phases }) {
  const progress = getPhaseProgress(phases);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-slate-600">
          Phase completion
        </span>
        <span className="text-xs font-semibold tabular-nums text-slate-800">
          {phases}
        </span>
      </div>

      <div
        className="h-2 overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-label="Phase completion"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            progress === 100 ? "bg-emerald-500" : "bg-blue-600"
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="mt-1.5 text-right text-[10px] font-medium text-slate-500">
        {progress}% complete
      </p>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Project selection card
// -----------------------------------------------------------------------------

function ProjectCard({ project, selected, onClick }) {
  const phasesComplete =
    project.phases.split(" / ")[0] === project.phases.split(" / ")[1];

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`w-full rounded-2xl border p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
        selected
          ? "border-blue-400 bg-blue-50/50 ring-2 ring-blue-100"
          : "border-slate-200 bg-white hover:border-blue-200"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            {project.id}
          </p>

          <h3 className="mt-1.5 text-base font-semibold text-slate-900">
            {project.name}
          </h3>
        </div>

        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
            selected
              ? "bg-blue-100 text-blue-700"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          <PackageCheck className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-4">
        <PhaseProgress phases={project.phases} />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <Badge tone={getStatusTone(project.handover)}>
          {project.handover}
        </Badge>

        <span
          className={`inline-flex items-center gap-1 text-xs font-semibold ${
            phasesComplete ? "text-emerald-700" : "text-amber-700"
          }`}
        >
          {phasesComplete ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : (
            <CircleDashed className="h-3.5 w-3.5" />
          )}
          {phasesComplete ? "Phases complete" : "Phases pending"}
        </span>
      </div>
    </button>
  );
}

// -----------------------------------------------------------------------------
// Main page
// -----------------------------------------------------------------------------

function DeliveryHandover() {
  const [projects, setProjects] = useState(INITIAL_PROJECTS);
  const [selectedId, setSelectedId] = useState(projects[0]?.id ?? null);
  const [trainingStatus, setTrainingStatus] = useState("Pending");
  const [bugFixing, setBugFixing] = useState(false);

  const selected = projects.find((project) => project.id === selectedId);

  const phasesComplete =
    selected?.phases?.split(" / ")[0] ===
    selected?.phases?.split(" / ")[1];

  const readyCount = projects.filter(
    (project) => project.handover === "Ready",
  ).length;

  const completedDeliveryCount = projects.filter(
    (project) => project.delivery === "Completed",
  ).length;

  const updateStatus = (key, value) => {
    if (!selected) return;

    setProjects((prev) =>
      prev.map((project) =>
        project.id === selected.id
          ? { ...project, [key]: value }
          : project,
      ),
    );
  };

  const startHandover = () => {
    if (!selected || !phasesComplete) {
      showToast.error(
        "All project phases must be completed before handover.",
      );
      return;
    }

    updateStatus("handover", "In Progress");
    showToast.success("Handover initiated.");
  };

  const saveTraining = () => {
    updateStatus("training", trainingStatus);
    showToast.success("Training status updated.");
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Standardized Administration header */}
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
              <PackageCheck className="h-6 w-6" />
            </div>

            <div className="min-w-0">
              <span className="inline-flex items-center rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-200">
                ADMINISTRATION
              </span>

              <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-[34px]">
                Delivery & Handover
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Manage build testing, field training, bug resolution and final
                project delivery after phase completion.
              </p>
            </div>
          </div>

          <div className="relative z-10 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-blue-200">
              Projects
            </p>
            <p className="mt-1 text-2xl font-bold text-white">
              {projects.length}
            </p>
          </div>
        </div>
      </header>

      {/* Summary cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total Projects"
          value={projects.length}
          description="Projects in delivery workflow"
          icon={ClipboardCheck}
          tone="blue"
        />

        <SummaryCard
          label="Handover Ready"
          value={readyCount}
          description="Projects marked ready for handover"
          icon={CheckCircle2}
          tone="green"
        />

        <SummaryCard
          label="Delivery Completed"
          value={completedDeliveryCount}
          description="Projects with completed delivery"
          icon={PackageCheck}
          tone="green"
        />

        <SummaryCard
          label="Bug-Fixing Active"
          value={bugFixing ? 1 : 0}
          description="Current selected project"
          icon={Wrench}
          tone={bugFixing ? "amber" : "slate"}
        />
      </section>

      {/* Project selection */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <SectionHeading
          eyebrow="PROJECT WORKSPACE"
          title="Select Project"
          description="Choose a project to review its phase completion and delivery status."
          icon={ClipboardCheck}
        />

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              selected={project.id === selectedId}
              onClick={() => setSelectedId(project.id)}
            />
          ))}
        </div>
      </section>

      {/* Selected project */}
      {selected && (
        <>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <SectionHeading
                eyebrow="SELECTED PROJECT"
                title={selected.name}
                description={`Project reference: ${selected.id}`}
                icon={PackageCheck}
              />

              <Badge tone={phasesComplete ? "success" : "warning"}>
                {phasesComplete
                  ? "All Phases Completed"
                  : "Phases Pending"}
              </Badge>
            </div>

            <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
              <PhaseProgress phases={selected.phases} />
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatusCard
                label="Handover"
                value={selected.handover}
                icon={ClipboardCheck}
              />

              <StatusCard
                label="Build Testing"
                value={selected.buildTesting}
                icon={ShieldCheck}
              />

              <StatusCard
                label="Field Training"
                value={selected.training}
                icon={GraduationCap}
              />

              <StatusCard
                label="Delivery"
                value={selected.delivery}
                icon={PackageCheck}
              />
            </div>
          </section>

          {/* Handover actions */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <SectionHeading
              eyebrow="DELIVERY WORKFLOW"
              title="Handover Actions"
              description="Advance the selected project through the handover and delivery workflow."
              icon={ArrowRight}
            />

            {!phasesComplete && (
              <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <CircleDashed className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <div>
                  <p className="text-sm font-semibold text-amber-900">
                    Handover is currently blocked
                  </p>
                  <p className="mt-1 text-xs leading-5 text-amber-800">
                    All project phases must be completed before handover can
                    be initiated or build testing can be marked complete.
                  </p>
                </div>
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-3">
              <Button
                onClick={startHandover}
                disabled={!phasesComplete}
              >
                <ArrowRight className="mr-2 h-4 w-4" />
                Initiate Handover
              </Button>

              <Button
                variant="outline"
                onClick={() => updateStatus("buildTesting", "Completed")}
                disabled={!phasesComplete}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Mark Build Testing Complete
              </Button>

              <Button
                variant="outline"
                onClick={() => updateStatus("delivery", "Completed")}
                disabled={selected.training !== "Completed"}
              >
                <PackageCheck className="mr-2 h-4 w-4" />
                Complete Delivery
              </Button>
            </div>
          </section>

          {/* Training and bug fixing */}
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            {/* Field training */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <SectionHeading
                eyebrow="TEAM ENABLEMENT"
                title="Field Training"
                description="Update the training status for the selected project."
                icon={GraduationCap}
              />

              <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                <p className="text-xs leading-5 text-slate-600">
                  Tester updates training status on the training day.
                </p>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="min-w-0 flex-1">
                    <Select
                      label="Training Status"
                      value={trainingStatus}
                      options={TRAINING_STATUSES.map((value) => ({
                        value,
                        label: value,
                      }))}
                      onChange={(value) => setTrainingStatus(value)}
                    />
                  </div>

                  <Button size="sm" onClick={saveTraining}>
                    Save Training
                  </Button>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-4">
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Current saved status
                  </p>
                  <div className="mt-2">
                    <Badge tone={getStatusTone(selected.training)}>
                      {selected.training}
                    </Badge>
                  </div>
                </div>

                <GraduationCap className="h-6 w-6 text-slate-300" />
              </div>
            </section>

            {/* Bug fixing */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <SectionHeading
                eyebrow="ISSUE RESOLUTION"
                title="Bug-Fixing Loop"
                description="Manage the bug-fixing phase before continuing delivery."
                icon={Wrench}
              />

              <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                <p className="text-xs leading-5 text-slate-600">
                  Bug found → Bug-Fixing Phase → Fix → Retest → Continue
                  Delivery.
                </p>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <Badge tone={bugFixing ? "warning" : "neutral"}>
                    {bugFixing ? "Bug-Fixing Active" : "No Active Bug-Fixing"}
                  </Badge>

                  <Button
                    size="sm"
                    variant={bugFixing ? "danger" : "outline"}
                    onClick={() => setBugFixing((value) => !value)}
                  >
                    {bugFixing
                      ? "Bug-Fixing Phase Active"
                      : "Create Bug-Fixing Phase"}
                  </Button>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-slate-200 p-4">
                <div className="flex items-start gap-3">
                  <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <div>
                    <p className="text-xs font-semibold text-slate-700">
                      Resolution sequence
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Identify the bug, complete the fix, perform retesting,
                      then continue with delivery.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}

export default DeliveryHandover;
