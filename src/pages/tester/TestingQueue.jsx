import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";

import Badge from "../../components/common/Badge";
import Select from "../../components/common/Select";
import DataTable from "../../components/tables/DataTable";
import TableSearch from "../../components/tables/TableSearch";

const TEST_STATUSES = ["Pending", "In Progress", "Passed", "Failed"];

const PRIORITY_TONE = {
  Critical: "danger",
  High: "danger",
  Medium: "warning",
  Low: "neutral",
};

const TEST_STATUS_TONE = {
  Pending: "neutral",
  "In Progress": "info",
  Passed: "success",
  Failed: "danger",
};

const getSelectValue = (value) => value?.target?.value ?? value;

const getErrorMessage = (error) =>
  error.response?.data?.message ||
  error.message ||
  "Something went wrong. Please try again.";

const getTesterName = (tester) => {
  const user = tester?.user;

  if (!user) return "—";

  return [user.firstName, user.lastName].filter(Boolean).join(" ") || "—";
};

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function PageHeader({ data }) {
  const pending = data.filter((test) => test.status === "Pending").length;
  const inProgress = data.filter(
    (test) => test.status === "In Progress",
  ).length;
  const completed = data.filter(
    (test) => test.status === "Passed" || test.status === "Failed",
  ).length;

  return (
    <section className="relative isolate overflow-hidden rounded-[28px] border border-slate-800 bg-gradient-to-br from-[#080d25] via-[#0b1734] to-[#1b2052] px-6 py-7 shadow-[0_18px_45px_rgba(15,23,42,0.16)] sm:px-8 sm:py-8">
      <div className="pointer-events-none absolute -right-16 -top-24 -z-10 h-72 w-72 rounded-full border border-blue-300/10" />
      <div className="pointer-events-none absolute -right-5 -top-12 -z-10 h-52 w-52 rounded-full border border-blue-300/10" />
      <div className="pointer-events-none absolute -bottom-28 right-1/4 -z-10 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative flex flex-col justify-between gap-7 xl:flex-row xl:items-center">
        <div className="min-w-0 max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-200">
              Tester Workspace
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-[34px]">
            Testing Queue
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300 sm:text-[15px]">
            Review testing assignments, monitor test progress, and record
            verified test results for assigned tasks.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-xs font-medium text-slate-200">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
              {data.length}{" "}
              {data.length === 1 ? "Testing Record" : "Testing Records"}
            </span>

            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-xs font-medium text-slate-200">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              {pending} Pending
            </span>

            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-xs font-medium text-slate-200">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
              {inProgress} In Progress
            </span>
          </div>
        </div>

        <div className="grid w-full grid-cols-2 gap-3 xl:w-[280px] xl:shrink-0">
          <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Total Tests
            </p>
            <p className="mt-2 text-3xl font-bold tabular-nums text-white">
              {data.length}
            </p>
            <p className="mt-1 text-xs text-slate-400">Assigned records</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Finalized
            </p>
            <p className="mt-2 text-3xl font-bold tabular-nums text-emerald-300">
              {completed}
            </p>
            <p className="mt-1 text-xs text-slate-400">Passed or failed</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function SummaryCard({ label, value, tone, description, icon }) {
  const iconStyles = {
    neutral: "bg-slate-100 text-slate-600",
    info: "bg-blue-50 text-blue-600",
    success: "bg-emerald-50 text-emerald-600",
    danger: "bg-rose-50 text-rose-600",
  };

  return (
    <article className="rounded-[20px] border border-cm-border bg-cm-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-cm-text-muted">{label}</p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-cm-text">
            {value}
          </p>
          <p className="mt-1 text-[11px] text-cm-text-muted">{description}</p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconStyles[tone]}`}
        >
          {icon}
        </div>
      </div>
    </article>
  );
}

function QueueSummary({ data }) {
  const counts = {
    pending: data.filter((test) => test.status === "Pending").length,
    inProgress: data.filter((test) => test.status === "In Progress").length,
    passed: data.filter((test) => test.status === "Passed").length,
    failed: data.filter((test) => test.status === "Failed").length,
  };

  const summaries = [
    {
      label: "Pending",
      value: counts.pending,
      description: "Awaiting testing",
      tone: "neutral",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
          <circle
            cx="12"
            cy="12"
            r="9"
            stroke="currentColor"
            strokeWidth="1.7"
          />
          <path
            d="M12 7v5l3 2"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    {
      label: "In Progress",
      value: counts.inProgress,
      description: "Currently being tested",
      tone: "info",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
          <path
            d="M4 12h4l2.5-6 4 12 2.5-6h3"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      label: "Passed",
      value: counts.passed,
      description: "Successfully passed",
      tone: "success",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
          <path
            d="m5 12.5 4.2 4.2L19 7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      label: "Failed",
      value: counts.failed,
      description: "Issues identified",
      tone: "danger",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
          <path
            d="m7 7 10 10M17 7 7 17"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle
            cx="12"
            cy="12"
            r="9"
            stroke="currentColor"
            strokeWidth="1.7"
          />
        </svg>
      ),
    },
  ];

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
      {summaries.map((summary) => (
        <SummaryCard key={summary.label} {...summary} />
      ))}
    </section>
  );
}

function AlertMessage({ type, message, onRetry }) {
  const isError = type === "error";

  return (
    <div
      role={isError ? "alert" : "status"}
      className={`flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${
        isError
          ? "border-rose-200 bg-rose-50 text-rose-700"
          : "border-blue-200 bg-blue-50 text-blue-700"
      }`}
    >
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 shrink-0">
          {isError ? (
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
              <path
                d="M12 8v5m0 3h.01M10.3 3.8 2.9 17a2 2 0 0 0 1.7 3h14.8a2 2 0 0 0 1.7-3l-7.4-13.2a2 2 0 0 0-3.4 0Z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
              <path
                d="m5 12.5 4.2 4.2L19 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </span>

        <p className="text-sm leading-5">{message}</p>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 self-start rounded-lg px-3 py-1.5 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 sm:self-center"
        >
          Retry
        </button>
      )}
    </div>
  );
}

function StatusUpdateModal({
  modal,
  onClose,
  onNotesChange,
  onConfirm,
  submitting,
  validationError,
}) {
  if (!modal) return null;

  const isFailed = modal.nextStatus === "Failed";

  const statusDescriptions = {
    Pending: "Move this test record back to the pending queue.",
    "In Progress": "Mark this test record as currently in progress.",
    Passed: "Confirm that this test has passed successfully.",
    Failed: "Record a failed test result and document the issue found.",
  };

  const statusColors = {
    Pending: "text-slate-700 bg-slate-100",
    "In Progress": "text-blue-700 bg-blue-50",
    Passed: "text-emerald-700 bg-emerald-50",
    Failed: "text-rose-700 bg-rose-50",
  };

  const canSubmit = !submitting && (!isFailed || modal.testNotes.trim());

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) {
          onClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="test-status-modal-title"
        className="my-auto w-full max-w-lg overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_25px_80px_rgba(2,6,23,0.3)]"
      >
        <header className="relative isolate overflow-hidden bg-gradient-to-br from-[#080d25] via-[#0b1734] to-[#1b2052] px-6 py-6">
          <div className="pointer-events-none absolute -right-10 -top-16 -z-10 h-48 w-48 rounded-full border border-blue-300/10" />
          <div className="pointer-events-none absolute -bottom-20 right-1/4 -z-10 h-40 w-40 rounded-full bg-blue-500/10 blur-2xl" />

          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-blue-200">
                  Testing Workflow
                </span>
              </div>

              <h2
                id="test-status-modal-title"
                className="text-xl font-bold tracking-tight text-white"
              >
                Confirm Test Result
              </h2>

              <p className="mt-1.5 text-xs leading-5 text-slate-300">
                Review the selected status before submitting the update.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              aria-label="Close status update dialog"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.07] text-slate-300 transition-colors hover:bg-white/15 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                <path
                  d="m7 7 10 10M17 7 7 17"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </header>

        <div className="space-y-5 p-6">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Test Record
                </p>
                <p className="mt-1 text-sm font-bold text-slate-800">
                  TEST-{String(modal.testId).padStart(3, "0")}
                </p>
              </div>

              <span
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${statusColors[modal.nextStatus]}`}
              >
                {modal.nextStatus}
              </span>
            </div>

            <div className="mt-3 border-t border-slate-200 pt-3">
              <p className="text-xs text-slate-500">Task</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {modal.taskTitle || "Untitled task"}
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm leading-6 text-slate-700">
              {statusDescriptions[modal.nextStatus]}
            </p>
          </div>

          {isFailed && (
            <div>
              <label
                htmlFor="test-failure-notes"
                className="mb-2 block text-sm font-semibold text-slate-800"
              >
                Test Notes <span className="text-rose-600">*</span>
              </label>

              <textarea
                id="test-failure-notes"
                rows={4}
                value={modal.testNotes}
                onChange={(event) => onNotesChange(event.target.value)}
                placeholder="Describe the issue found during testing..."
                disabled={submitting}
                className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-50"
              />

              <p className="mt-1.5 text-[11px] text-slate-500">
                Provide clear details about the failure so the development
                team can investigate.
              </p>

              {validationError && (
                <p className="mt-2 text-xs font-medium text-rose-600">
                  {validationError}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={!canSubmit}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                isFailed
                  ? "bg-rose-600 hover:bg-rose-700"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {submitting && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              )}
              {submitting ? "Updating..." : "Confirm Update"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function TestingQueue() {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [updatingIds, setUpdatingIds] = useState([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [statusModal, setStatusModal] = useState(null);
  const [modalValidationError, setModalValidationError] = useState("");

  const fetchTestingQueue = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get("/api/task-testing/", {
        params: {
          status: statusFilter === "All" ? undefined : statusFilter,
          search: search.trim() || undefined,
        },
      });

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Failed to fetch testing queue.",
        );
      }

      setData(response.data.data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    fetchTestingQueue();
  }, [fetchTestingQueue]);

  const openStatusModal = (testUuid, value) => {
    const nextStatus = getSelectValue(value);

    if (!TEST_STATUSES.includes(nextStatus)) return;

    const currentTest = data.find((test) => test.uuid === testUuid);

    if (!currentTest || currentTest.status === nextStatus) return;

    setModalValidationError("");
    setNotice("");
    setStatusModal({
      testUuid,
      testId: currentTest.id,
      taskTitle: currentTest.task?.title,
      currentStatus: currentTest.status,
      nextStatus,
      testNotes: currentTest.testNotes || "",
    });
  };

  const closeStatusModal = () => {
    if (statusModal && updatingIds.includes(statusModal.testUuid)) return;

    setStatusModal(null);
    setModalValidationError("");
  };

  const updateTestStatus = async () => {
    if (!statusModal) return;

    const { testUuid, nextStatus } = statusModal;

    if (!TEST_STATUSES.includes(nextStatus)) return;

    const testNotes = statusModal.testNotes || "";

    if (nextStatus === "Failed" && !testNotes.trim()) {
      setModalValidationError("Please provide test notes when a test fails.");
      return;
    }

    try {
      setUpdatingIds((current) => [...current, testUuid]);
      setError("");
      setNotice("");
      setModalValidationError("");

      const response = await axios.patch(
        `/api/task-testing/${testUuid}/status`,
        {
          status: nextStatus,
          testNotes: testNotes.trim() || null,
        },
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Failed to update test result.",
        );
      }

      // The backend also updates project_tasks transactionally.
      // Refresh so the task status and test result stay in sync.
      await fetchTestingQueue();

      setStatusModal(null);

      setNotice(
        nextStatus === "Failed"
          ? "Test failed. The task has been returned to In Progress."
          : nextStatus === "Passed"
            ? "Test passed. The task has been marked Done."
            : "Testing status updated successfully.",
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUpdatingIds((current) => current.filter((id) => id !== testUuid));
    }
  };

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return data.filter((test) => {
      const matchesStatus =
        statusFilter === "All" || test.status === statusFilter;

      const searchableText = [
        `TEST-${String(test.id).padStart(3, "0")}`,
        test.task?.title,
        test.project?.name,
        test.task?.module?.name,
        test.task?.phase?.name,
        getTesterName(test.tester),
        test.task?.priority,
        test.task?.status,
        test.status,
        test.testNotes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesStatus && (!query || searchableText.includes(query));
    });
  }, [data, search, statusFilter]);

  const columns = [
    {
      key: "id",
      header: "Test ID",
      render: (row) => (
        <div className="min-w-24">
          <span className="inline-flex rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1.5 text-xs font-bold tracking-wide text-blue-700">
            TEST-{String(row.id).padStart(3, "0")}
          </span>
        </div>
      ),
    },
    {
      key: "task",
      header: "Task",
      render: (row) => (
        <div className="min-w-44">
          <p className="font-semibold text-cm-text">
            {row.task?.title || "—"}
          </p>
          <p className="mt-1 text-xs text-cm-text-muted">
            Task status: {row.task?.status || "—"}
          </p>
        </div>
      ),
    },
    {
      key: "project",
      header: "Project",
      render: (row) => (
        <span className="font-medium text-cm-text">
          {row.project?.name || "—"}
        </span>
      ),
    },
    {
      key: "module",
      header: "Module / Phase",
      render: (row) => (
        <div className="min-w-32">
          <p className="font-medium text-cm-text">
            {row.task?.module?.name || "—"}
          </p>
          <p className="mt-1 text-xs text-cm-text-muted">
            {row.task?.phase?.name || "—"}
          </p>
        </div>
      ),
    },
    {
      key: "tester",
      header: "Tester",
      render: (row) => (
        <span className="text-sm font-medium text-cm-text">
          {getTesterName(row.tester)}
        </span>
      ),
    },
    {
      key: "priority",
      header: "Priority",
      render: (row) => (
        <Badge tone={PRIORITY_TONE[row.task?.priority] || "neutral"}>
          {row.task?.priority || "Medium"}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Test Result",
      render: (row) => (
        <div className="flex min-w-40 flex-col gap-2">
          <Badge tone={TEST_STATUS_TONE[row.status] || "neutral"}>
            {row.status}
          </Badge>

          <Select
            value={row.status}
            disabled={
              updatingIds.includes(row.uuid) ||
              (statusModal?.testUuid === row.uuid)
            }
            options={TEST_STATUSES.map((status) => ({
              value: status,
              label: status,
            }))}
            onChange={(value) => openStatusModal(row.uuid, value)}
          />

          {updatingIds.includes(row.uuid) && (
            <span className="text-xs font-medium text-blue-600">
              Updating...
            </span>
          )}
        </div>
      ),
    },
    {
      key: "testedAt",
      header: "Tested At",
      render: (row) => (
        <span className="whitespace-nowrap text-sm text-cm-text-muted">
          {formatDate(row.testedAt)}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader data={data} />

      {error && (
        <AlertMessage
          type="error"
          message={error}
          onRetry={fetchTestingQueue}
        />
      )}

      {notice && (
        <AlertMessage type="success" message={notice} />
      )}

      <QueueSummary data={data} />

      <section className="space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-cm-text">
              Testing Assignments
            </h2>
            <p className="mt-1 text-xs text-cm-text-muted">
              Search assignments, filter test statuses, and update test
              results.
            </p>
          </div>

          <span className="text-xs font-medium text-cm-text-muted">
            {rows.length} {rows.length === 1 ? "record" : "records"} found
          </span>
        </div>

        <div className="rounded-[22px] border border-cm-border bg-cm-card p-4 shadow-sm sm:p-5">
          <div className="grid items-end gap-4 md:grid-cols-2">
            <div className="min-w-0">
              <TableSearch
                value={search}
                onChange={setSearch}
                placeholder="Search task, project, module, tester..."
              />
            </div>

            <div className="min-w-0">
              <Select
                label="Test status"
                value={statusFilter}
                options={[
                  { value: "All", label: "All statuses" },
                  ...TEST_STATUSES.map((status) => ({
                    value: status,
                    label: status,
                  })),
                ]}
                onChange={(value) =>
                  setStatusFilter(getSelectValue(value))
                }
              />
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[22px] border border-cm-border bg-cm-card shadow-sm">
          <div className="border-b border-cm-border px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-cm-text">
                  Test Records
                </h3>
                <p className="mt-1 text-[11px] text-cm-text-muted">
                  Review assignments and manage test outcomes.
                </p>
              </div>

              <span className="rounded-full border border-cm-border bg-cm-bg px-3 py-1 text-[10px] font-semibold text-cm-text-muted">
                {rows.length} Records
              </span>
            </div>
          </div>

          <DataTable
            columns={columns}
            rows={rows}
            loading={loading}
            emptyMessage="No testing assignments match your filters."
          />
        </div>
      </section>

      <StatusUpdateModal
        modal={statusModal}
        onClose={closeStatusModal}
        onNotesChange={(value) => {
          setStatusModal((current) =>
            current ? { ...current, testNotes: value } : current,
          );
          setModalValidationError("");
        }}
        onConfirm={updateTestStatus}
        submitting={
          statusModal
            ? updatingIds.includes(statusModal.testUuid)
            : false
        }
        validationError={modalValidationError}
      />
    </div>
  );
}
