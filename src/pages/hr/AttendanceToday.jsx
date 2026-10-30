
import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";

import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import DataTable from "../../components/tables/DataTable";
import TableSearch from "../../components/tables/TableSearch";
import Loader from "../../components/common/Loader";
import { showToast } from "../../components/common/Toast";

function formatDate(value) {
  if (!value) {
    return "—";
  }

  try {
    const [year, month, day] = value.split("-");

    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(Number(year), Number(month) - 1, Number(day)));
  } catch {
    return value;
  }
}

function formatCheckIn(value) {
  if (!value) {
    return "—";
  }

  try {
    return new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }).format(new Date(value));
  } catch {
    return "—";
  }
}

function getEmployeeName(record) {
  const firstName = record?.employee?.user?.firstName || "";
  const lastName = record?.employee?.user?.lastName || "";

  return `${firstName} ${lastName}`.trim() || "Unknown Employee";
}

function getEmployeeEmail(record) {
  return record?.employee?.user?.email || record?.employee?.companyEmail || "—";
}

function getSessionLabel(session) {
  switch (session) {
    case "FIRST_HALF":
      return "First Half";

    case "SECOND_HALF":
      return "Second Half";

    default:
      return session || "—";
  }
}

function getSessionTone(session) {
  switch (session) {
    case "FIRST_HALF":
      return "info";

    case "SECOND_HALF":
      return "success";

    default:
      return "neutral";
  }
}

function getStatusTone(status) {
  switch (status) {
    case "Present":
      return "success";

    case "Absent":
      return "danger";

    case "Holiday":
      return "info";

    case "Leave":
      return "warning";

    default:
      return "neutral";
  }
}

function AttendanceToday() {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [error, setError] = useState("");

  const getTodaysRecord = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setError("");

      const res = await axios.get("/api/attendance/today", {
        withCredentials: true,
      });

      if (res.status !== 200 || !res.data?.success) {
        throw new Error(
          res.data?.message || "Unable to fetch today's attendance.",
        );
      }

      setRecords(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (error) {
      console.error("Get today's attendance error:", error);

      const message =
        error.response?.data?.message ||
        error.message ||
        "Unable to fetch today's attendance.";

      setError(message);

      showToast.error(message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    getTodaysRecord();
  }, [getTodaysRecord]);

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return records;
    }

    return records.filter((record) => {
      const employeeName = getEmployeeName(record).toLowerCase();
      const employeeEmail = getEmployeeEmail(record).toLowerCase();
      const session = getSessionLabel(record.session).toLowerCase();
      const status = String(record.status || "").toLowerCase();

      return (
        employeeName.includes(query) ||
        employeeEmail.includes(query) ||
        session.includes(query) ||
        status.includes(query)
      );
    });
  }, [records, search]);

  const statistics = useMemo(() => {
    const present = records.filter(
      (record) => record.status === "Present",
    ).length;

    const absent = records.filter(
      (record) => record.status === "Absent",
    ).length;

    const firstHalf = records.filter(
      (record) => record.session === "FIRST_HALF",
    ).length;

    const secondHalf = records.filter(
      (record) => record.session === "SECOND_HALF",
    ).length;

    const uniqueEmployees = new Set(
      records.map((record) => record.employeeId).filter(Boolean),
    ).size;

    return {
      total: records.length,
      present,
      absent,
      firstHalf,
      secondHalf,
      uniqueEmployees,
    };
  }, [records]);

  const columns = [
    {
      key: "employee",
      header: "Employee",
      render: (row) => (
        <div className="min-w-[180px]">
          <p className="font-semibold text-cm-text">
            {getEmployeeName(row)}
          </p>

          <p className="mt-1 text-xs text-cm-text-muted">
            {getEmployeeEmail(row)}
          </p>
        </div>
      ),
    },
    {
      key: "date",
      header: "Date",
      render: (row) => formatDate(row.attendanceDate),
    },
    {
      key: "session",
      header: "Session",
      render: (row) => (
        <Badge tone={getSessionTone(row.session)}>
          {getSessionLabel(row.session)}
        </Badge>
      ),
    },
    {
      key: "checkIn",
      header: "Check In",
      render: (row) => (
        <span className="font-medium text-cm-text">
          {formatCheckIn(row.checkIn)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <Badge tone={getStatusTone(row.status)}>
          {row.status || "Unknown"}
        </Badge>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-xl border border-cm-border bg-cm-card">
        <Loader />
      </div>
    );
  }

  const todayLabel = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date());

  const statCards = [
    {
      label: "Attendance Records",
      value: statistics.total,
      description: "Today's entries",
      valueClass: "text-cm-text",
    },
    {
      label: "Employees Present",
      value: statistics.uniqueEmployees,
      description: "Employees with attendance",
      valueClass: "text-green-600",
    },
    {
      label: "First Half",
      value: statistics.firstHalf,
      description: "Check-ins",
      valueClass: "text-cm-text",
    },
    {
      label: "Second Half",
      value: statistics.secondHalf,
      description: "Check-ins",
      valueClass: "text-cm-text",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Date and Refresh */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 rounded-lg border border-cm-border bg-cm-card px-3 py-2">
          <span className="text-sm font-medium text-cm-text">
            {todayLabel}
          </span>
          <span className="text-xs text-cm-text-muted">India</span>
        </div>

        <Button
          variant="outline"
          onClick={() => getTodaysRecord(true)}
          disabled={isRefreshing}
        >
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <div>
            <p className="text-sm font-semibold text-red-700">
              Unable to load attendance
            </p>

            <p className="mt-1 text-sm text-red-600">{error}</p>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => getTodaysRecord(true)}
            disabled={isRefreshing}
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-cm-border bg-cm-card p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <p className="text-xs font-medium text-cm-text-muted">
              {card.label}
            </p>

            <p className={`mt-3 text-3xl font-bold ${card.valueClass}`}>
              {card.value}
            </p>

            <p className="mt-2 text-xs text-cm-text-muted">
              {card.description}
            </p>
          </div>
        ))}

        <div className="rounded-xl border border-cm-border bg-cm-card p-5 shadow-sm transition-shadow hover:shadow-md">
          <p className="text-xs font-medium text-cm-text-muted">Status</p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge tone="success">{statistics.present} Present</Badge>

            {statistics.absent > 0 && (
              <Badge tone="danger">{statistics.absent} Absent</Badge>
            )}
          </div>

          <p className="mt-3 text-xs text-cm-text-muted">
            Today's attendance
          </p>
        </div>
      </div>

      {/* Attendance Records */}
      <section className="overflow-hidden rounded-xl border border-cm-border bg-cm-card shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-cm-border p-5">
          <div>
            <h2 className="text-base font-semibold text-cm-text">
              Today's Attendance
            </h2>

            <p className="mt-1 text-sm text-cm-text-muted">
              {filteredRecords.length} record
              {filteredRecords.length === 1 ? "" : "s"} found
            </p>
          </div>

          <Badge tone={records.length > 0 ? "success" : "neutral"}>
            {records.length} Records
          </Badge>
        </div>

        <div className="p-5">
          <div className="mb-4 max-w-md">
            <TableSearch
              value={search}
              onChange={setSearch}
              placeholder="Search employee, email, session or status…"
            />
          </div>

          <DataTable
            columns={columns}
            rows={filteredRecords}
            emptyMessage={
              search
                ? "No attendance records match your search."
                : "No attendance records for today."
            }
          />
        </div>
      </section>
    </div>
  );
}

export default AttendanceToday;
