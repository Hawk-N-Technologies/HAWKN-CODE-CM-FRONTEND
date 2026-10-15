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

export default function TestingQueue() {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [updatingIds, setUpdatingIds] = useState([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

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

  const updateTestStatus = async (testUuid, value) => {
    const nextStatus = getSelectValue(value);

    if (!TEST_STATUSES.includes(nextStatus)) return;

    const currentTest = data.find((test) => test.uuid === testUuid);

    if (!currentTest || currentTest.status === nextStatus) return;

    let testNotes = currentTest.testNotes || "";

    if (nextStatus === "Failed") {
      testNotes = window.prompt(
        "Describe the issue found during testing:",
        testNotes,
      );

      if (testNotes === null) return;

      if (!testNotes.trim()) {
        setNotice("Please provide test notes when a test fails.");
        return;
      }
    }

    try {
      setUpdatingIds((current) => [...current, testUuid]);
      setError("");
      setNotice("");

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
        <span className="font-medium text-cm-text">
          TEST-{String(row.id).padStart(3, "0")}
        </span>
      ),
    },
    {
      key: "task",
      header: "Task",
      render: (row) => (
        <div className="min-w-44">
          <p className="font-medium text-cm-text">{row.task?.title || "—"}</p>
          <p className="mt-1 text-xs text-cm-text-muted">
            Task status: {row.task?.status || "—"}
          </p>
        </div>
      ),
    },
    {
      key: "project",
      header: "Project",
      render: (row) => row.project?.name || "—",
    },
    {
      key: "module",
      header: "Module / Phase",
      render: (row) => (
        <div>
          <p className="text-cm-text">{row.task?.module?.name || "—"}</p>
          <p className="mt-1 text-xs text-cm-text-muted">
            {row.task?.phase?.name || "—"}
          </p>
        </div>
      ),
    },
    {
      key: "tester",
      header: "Tester",
      render: (row) => getTesterName(row.tester),
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
            disabled={updatingIds.includes(row.uuid)}
            options={TEST_STATUSES.map((status) => ({
              value: status,
              label: status,
            }))}
            onChange={(value) => updateTestStatus(row.uuid, value)}
          />

          {updatingIds.includes(row.uuid) && (
            <span className="text-xs text-cm-text-muted">Updating...</span>
          )}
        </div>
      ),
    },
    {
      key: "testedAt",
      header: "Tested At",
      render: (row) => formatDate(row.testedAt),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-cm-text">Testing Queue</h1>
        <p className="mt-1 text-sm text-cm-text-muted">
          Review testing assignments and record test results.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
          <button
            type="button"
            onClick={fetchTestingQueue}
            className="ml-3 font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700"
        >
          {notice}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <TableSearch
          value={search}
          onChange={setSearch}
          placeholder="Search task, project, module, tester..."
        />

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
          onChange={(value) => setStatusFilter(getSelectValue(value))}
        />
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        emptyMessage="No testing assignments match your filters."
      />
    </div>
  );
}
