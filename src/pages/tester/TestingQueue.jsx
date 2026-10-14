import { useMemo, useState } from "react";

import Badge from "../../components/common/Badge";
import Select from "../../components/common/Select";
import DataTable from "../../components/tables/DataTable";
import TableSearch from "../../components/tables/TableSearch";

// Static examples follow the project_modules, project_phases, project_tasks,
// and task_testing schema. Replace these records with API data when integrating.
const INITIAL_TESTS = [
  {
    uuid: "a12b0000-0000-4000-8000-000000000001",
    id: 1,
    project: { id: 1, name: "Acme Retail ERP" },
    task: {
      id: 1,
      uuid: "b12b0000-0000-4000-8000-000000000001",
      title: "Implement authentication API",
      priority: "High",
      status: "Testing",
      module: { id: 1, name: "Authentication" },
      phase: { id: 1, name: "API Development" },
    },
    tester: { id: 4, name: "Meera Joshi" },
    status: "Pending",
    testNotes: null,
    testedAt: null,
  },
  {
    uuid: "a12b0000-0000-4000-8000-000000000002",
    id: 2,
    project: { id: 1, name: "Acme Retail ERP" },
    task: {
      id: 2,
      uuid: "b12b0000-0000-4000-8000-000000000002",
      title: "Build dashboard overview",
      priority: "Medium",
      status: "Testing",
      module: { id: 2, name: "Dashboard" },
      phase: { id: 2, name: "Frontend Development" },
    },
    tester: { id: 4, name: "Meera Joshi" },
    status: "In Progress",
    testNotes: "Checking responsive layouts and dashboard metrics.",
    testedAt: null,
  },
  {
    uuid: "a12b0000-0000-4000-8000-000000000003",
    id: 3,
    project: { id: 2, name: "Internal HRMS" },
    task: {
      id: 3,
      uuid: "b12b0000-0000-4000-8000-000000000003",
      title: "Fix attendance summary query",
      priority: "High",
      status: "Testing",
      module: { id: 3, name: "Attendance" },
      phase: { id: 3, name: "Reporting" },
    },
    tester: { id: 5, name: "Ishaan Mehta" },
    status: "Passed",
    testNotes: "Summary values match the attendance records.",
    testedAt: "2026-10-12T10:30:00Z",
  },
  {
    uuid: "a12b0000-0000-4000-8000-000000000004",
    id: 4,
    project: { id: 1, name: "Acme Retail ERP" },
    task: {
      id: 4,
      uuid: "b12b0000-0000-4000-8000-000000000004",
      title: "Integrate payment gateway",
      priority: "Critical",
      status: "Testing",
      module: { id: 4, name: "Payments" },
      phase: { id: 4, name: "Gateway Integration" },
    },
    tester: { id: 4, name: "Meera Joshi" },
    status: "Failed",
    testNotes: "Webhook retry scenario failed; investigate duplicate events.",
    testedAt: "2026-10-12T14:15:00Z",
  },
];

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
  const [data, setData] = useState(INITIAL_TESTS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

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
        test.tester?.name,
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

  const updateTestStatus = (testUuid, value) => {
    const nextStatus = getSelectValue(value);
    if (!TEST_STATUSES.includes(nextStatus)) return;

    setData((current) =>
      current.map((test) =>
        test.uuid === testUuid
          ? {
              ...test,
              status: nextStatus,
              testedAt:
                nextStatus === "Passed" || nextStatus === "Failed"
                  ? new Date().toISOString()
                  : null,
            }
          : test,
      ),
    );
  };

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
      render: (row) => row.tester?.name || "—",
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
            options={TEST_STATUSES.map((status) => ({
              value: status,
              label: status,
            }))}
            onChange={(value) => updateTestStatus(row.uuid, value)}
          />
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
          Review task testing assignments and record test results.
        </p>
      </div>

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
        emptyMessage="No testing assignments match your filters."
      />
    </div>
  );
}
