
import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";

import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import DataTable from "../../components/tables/DataTable";
import TableSearch from "../../components/tables/TableSearch";
import TablePagination from "../../components/tables/TablePagination";
import Loader from "../../components/common/Loader";
import Input from "../../components/common/Input";
import { showToast } from "../../components/common/Toast";

function formatDate(value) {
  if (!value) return "—";

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
  if (!value) return "";

  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
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
    case "Half Day":
      return "warning";
    default:
      return "neutral";
  }
}

function getOverallStatus(row) {
  if (row.firstHalf === "Holiday" && row.secondHalf === "Holiday") {
    return "Holiday";
  }

  if (row.firstHalf === "Leave" || row.secondHalf === "Leave") {
    return "Leave";
  }

  if (row.firstHalf === "Absent" && row.secondHalf === "Absent") {
    return "Absent";
  }

  if (row.firstHalf === "Present" && row.secondHalf === "Present") {
    return "Present";
  }

  if (
    (row.firstHalf === "Present" && row.secondHalf === "Absent") ||
    (row.firstHalf === "Absent" && row.secondHalf === "Present")
  ) {
    return "Half Day";
  }

  if (row.firstHalf && row.secondHalf && row.firstHalf !== row.secondHalf) {
    return "Half Day";
  }

  return row.firstHalf || row.secondHalf || "—";
}

function groupAttendanceRecords(records) {
  const grouped = new Map();

  for (const record of records) {
    const employeeId = record.employeeId;
    const attendanceDate = record.attendanceDate;
    const key = `${employeeId}-${attendanceDate}`;

    const user = record.employee?.user;

    const employeeName = user
      ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
      : "Unknown Employee";

    const employeeEmail = user?.email || "—";

    if (!grouped.has(key)) {
      grouped.set(key, {
        employeeId,
        employeeName,
        employeeEmail,
        attendanceDate,
        firstHalf: null,
        firstHalfCheckIn: null,
        secondHalf: null,
        secondHalfCheckIn: null,
      });
    }

    const row = grouped.get(key);

    if (record.session === "FIRST_HALF") {
      row.firstHalf = record.status;
      row.firstHalfCheckIn = record.checkIn;
    }

    if (record.session === "SECOND_HALF") {
      row.secondHalf = record.status;
      row.secondHalfCheckIn = record.checkIn;
    }
  }

  return Array.from(grouped.values()).sort((a, b) => {
    if (a.attendanceDate !== b.attendanceDate) {
      return b.attendanceDate.localeCompare(a.attendanceDate);
    }

    return a.employeeName.localeCompare(b.employeeName);
  });
}

function AttendanceHistory() {
  const [records, setRecords] = useState([]);

  const [search, setSearch] = useState("");
  const [employee, setEmployee] = useState("ALL");
  const [status, setStatus] = useState("ALL");

  const [from, setFrom] = useState("2026-09-01");
  const [to, setTo] = useState("2026-10-01");

  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [employees, setEmployees] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [error, setError] = useState("");

  const getHistory = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }

        setError("");

        const params = {
          page,
          limit: pageSize,
          from: from || undefined,
          to: to || undefined,
          employeeId: employee === "ALL" ? undefined : employee,
          search: search.trim() || undefined,
        };

        const res = await axios.get("/api/attendance/history", {
          params,
          withCredentials: true,
        });

        if (res.status !== 200 || !res.data?.success) {
          throw new Error(
            res.data?.message || "Unable to fetch attendance history.",
          );
        }

        const apiRecords = Array.isArray(res.data?.data) ? res.data.data : [];

        const pagination = res.data?.pagination || {};

        const groupedRecords = groupAttendanceRecords(apiRecords);

        const filteredRecords =
          status === "ALL"
            ? groupedRecords
            : groupedRecords.filter(
                (record) => getOverallStatus(record) === status,
              );

        setRecords(filteredRecords);

        const employeeMap = new Map();

        for (const record of apiRecords) {
          const user = record.employee?.user;

          if (!user || employeeMap.has(record.employeeId)) {
            continue;
          }

          employeeMap.set(record.employeeId, {
            id: record.employeeId,
            name:
              `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
              "Unknown Employee",
          });
        }

        setEmployees(
          Array.from(employeeMap.values()).sort((a, b) =>
            a.name.localeCompare(b.name),
          ),
        );

        setTotal(Number(pagination.total || 0));
        setTotalPages(Math.max(1, Number(pagination.totalPages || 1)));
      } catch (error) {
        console.error("Get attendance history error:", error);

        const message =
          error.response?.data?.message ||
          error.message ||
          "Unable to fetch attendance history.";

        setError(message);
        showToast.error(message);

        setRecords([]);
        setTotal(0);
        setTotalPages(1);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [page, pageSize, from, to, employee, status, search],
  );

  useEffect(() => {
    getHistory();
  }, [getHistory]);

  const statistics = useMemo(() => {
    return {
      total,
      present: records.filter(
        (record) => getOverallStatus(record) === "Present",
      ).length,
      absent: records.filter(
        (record) => getOverallStatus(record) === "Absent",
      ).length,
      holiday: records.filter(
        (record) => getOverallStatus(record) === "Holiday",
      ).length,
      halfDay: records.filter(
        (record) => getOverallStatus(record) === "Half Day",
      ).length,
      leave: records.filter(
        (record) => getOverallStatus(record) === "Leave",
      ).length,
    };
  }, [records, total]);

  const columns = [
    {
      key: "employee",
      header: "Employee",
      render: (row) => (
        <div className="min-w-[180px]">
          <p className="font-semibold text-cm-text">
            {row.employeeName || "Unknown Employee"}
          </p>

          <p className="mt-1 text-xs text-cm-text-muted">
            {row.employeeEmail || "—"}
          </p>
        </div>
      ),
    },
    {
      key: "date",
      header: "Date",
      render: (row) => (
        <span className="whitespace-nowrap font-medium text-cm-text">
          {formatDate(row.attendanceDate)}
        </span>
      ),
    },
    {
      key: "firstHalf",
      header: "First Half",
      render: (row) => (
        <div>
          <Badge tone={getStatusTone(row.firstHalf)}>
            {row.firstHalf || "—"}
          </Badge>

          {row.firstHalfCheckIn && (
            <p className="mt-1 text-xs text-cm-text-muted">
              {formatCheckIn(row.firstHalfCheckIn)}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "secondHalf",
      header: "Second Half",
      render: (row) => (
        <div>
          <Badge tone={getStatusTone(row.secondHalf)}>
            {row.secondHalf || "—"}
          </Badge>

          {row.secondHalfCheckIn && (
            <p className="mt-1 text-xs text-cm-text-muted">
              {formatCheckIn(row.secondHalfCheckIn)}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Overall Status",
      render: (row) => {
        const overallStatus = getOverallStatus(row);

        return (
          <Badge tone={getStatusTone(overallStatus)}>
            {overallStatus}
          </Badge>
        );
      },
    },
  ];

  function resetFilters() {
    setFrom("2026-09-01");
    setTo("2026-10-01");
    setEmployee("ALL");
    setStatus("ALL");
    setSearch("");
    setPage(1);
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-cm-border bg-cm-card shadow-sm">
        <Loader />
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Records",
      value: statistics.total,
      color: "text-cm-text",
      accent: "bg-slate-500",
    },
    {
      label: "Present",
      value: statistics.present,
      color: "text-emerald-600",
      accent: "bg-emerald-500",
    },
    {
      label: "Half Day",
      value: statistics.halfDay,
      color: "text-amber-600",
      accent: "bg-amber-500",
    },
    {
      label: "Absent",
      value: statistics.absent,
      color: "text-red-600",
      accent: "bg-red-500",
    },
    {
      label: "Holidays",
      value: statistics.holiday,
      color: "text-blue-600",
      accent: "bg-blue-500",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Attendance History Filters */}
      <section className="overflow-hidden rounded-2xl border border-cm-border bg-cm-card shadow-sm">
        <div className="relative isolate overflow-hidden bg-gradient-to-r from-[#0b1833] via-[#122b4d] to-[#1c4168] px-6 py-5">
          <div className="pointer-events-none absolute -right-8 -top-16 h-44 w-44 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute right-8 top-5 h-28 w-28 rounded-full border border-white/10" />

          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-white">
                Attendance History
              </h2>
              <p className="mt-1 text-sm text-blue-100/75">
                Review and filter employee attendance records.
              </p>
            </div>

            <Button
              variant="outline"
              onClick={() => getHistory(true)}
              disabled={isRefreshing}
            >
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>

        <div className="p-5 md:p-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            <Input
              label="From Date"
              type="date"
              value={from}
              onChange={(event) => {
                setFrom(event.target.value);
                setPage(1);
              }}
            />

            <Input
              label="To Date"
              type="date"
              value={to}
              onChange={(event) => {
                setTo(event.target.value);
                setPage(1);
              }}
            />

            <div>
              <label className="mb-2 block text-sm font-medium text-cm-text">
                Employee
              </label>

              <select
                value={employee}
                onChange={(event) => {
                  setEmployee(event.target.value);
                  setPage(1);
                }}
                className="w-full rounded-cm-md border border-cm-border bg-cm-card px-3 py-2.5 text-sm text-cm-text outline-none transition focus:border-[#1c4168] focus:ring-2 focus:ring-blue-900/10"
              >
                <option value="ALL">All Employees</option>

                {employees.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-cm-text">
                Attendance Status
              </label>

              <select
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value);
                  setPage(1);
                }}
                className="w-full rounded-cm-md border border-cm-border bg-cm-card px-3 py-2.5 text-sm text-cm-text outline-none transition focus:border-[#1c4168] focus:ring-2 focus:ring-blue-900/10"
              >
                <option value="ALL">All Status</option>
                <option value="Present">Present</option>
                <option value="Half Day">Half Day</option>
                <option value="Absent">Absent</option>
                <option value="Holiday">Holiday</option>
                <option value="Leave">Leave</option>
              </select>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-t border-cm-border pt-5">
            <div className="w-full sm:max-w-sm">
              <TableSearch
                value={search}
                onChange={(value) => {
                  setSearch(value);
                  setPage(1);
                }}
                placeholder="Search employee or email..."
              />
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={resetFilters}
            >
              Reset Filters
            </Button>
          </div>
        </div>
      </section>

      {/* Error State */}
      {error && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 p-5">
          <div>
            <p className="text-sm font-semibold text-red-700">
              Unable to load attendance history
            </p>

            <p className="mt-1 text-sm text-red-600">{error}</p>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => getHistory(true)}
            disabled={isRefreshing}
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Attendance Statistics */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="relative overflow-hidden rounded-2xl border border-cm-border bg-cm-card p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <div
              className={`absolute left-0 top-0 h-full w-1 ${card.accent}`}
            />

            <p className="text-sm font-medium text-cm-text-muted">
              {card.label}
            </p>

            <p
              className={`mt-3 text-3xl font-bold tracking-tight ${card.color}`}
            >
              {card.value}
            </p>
          </div>
        ))}
      </section>

      {/* Attendance Records */}
      <section className="overflow-hidden rounded-2xl border border-cm-border bg-cm-card shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-cm-border px-5 py-5 md:px-6">
          <div>
            <h2 className="text-base font-semibold text-cm-text">
              Attendance Records
            </h2>

            <p className="mt-1 text-sm text-cm-text-muted">
              Employee-wise attendance details for the selected period.
            </p>
          </div>

          <Badge tone={total > 0 ? "success" : "neutral"}>
            {total} Records
          </Badge>
        </div>

        <div className="p-4 md:p-5">
          <DataTable
            columns={columns}
            rows={records}
            isLoading={isRefreshing}
            emptyMessage="No attendance records found."
          />

          <div className="mt-5 border-t border-cm-border pt-4">
            <TablePagination
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={setPage}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

export default AttendanceHistory;
