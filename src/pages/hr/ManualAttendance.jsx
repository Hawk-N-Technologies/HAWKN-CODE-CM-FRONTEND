import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import TableSearch from "../../components/tables/TableSearch";
import Loader from "../../components/common/Loader";
import { showToast } from "../../components/common/Toast";

const TODAY_URL = "/api/attendance/manual/today";
const MARK_URL = (employeeId) => `/api/attendance/manual/${employeeId}/mark`;

function getIndiaDate(value) {
  const date = value ? new Date(`${value}T12:00:00+05:30`) : new Date();
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getSessionLabel(session) {
  return session === "FIRST_HALF"
    ? "First Half"
    : session === "SECOND_HALF"
      ? "Second Half"
      : session || "—";
}

function getLeaveLabel(leave) {
  if (!leave) return "";
  const session = leave.leaveSession || leave.session;
  const type = leave.leaveType || leave.type;
  const sessionLabel =
    session === "FULL_DAY"
      ? "Full-day"
      : session === "FIRST_HALF"
        ? "First-half"
        : session === "SECOND_HALF"
          ? "Second-half"
          : "";
  const typeLabel = type
    ? `${String(type)
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase())} `
    : "";
  return `${typeLabel}${sessionLabel} leave`.trim() || "Leave";
}

function getEmployeeName(employee) {
  return (
    employee?.name ||
    `${employee?.user?.firstName || ""} ${employee?.user?.lastName || ""}`.trim() ||
    "Unknown Employee"
  );
}

function getSession(employee, key) {
  if (employee?.sessions?.[key]) return employee.sessions[key];
  const legacyStatus =
    key === "FIRST_HALF" ? employee?.firstHalf : employee?.secondHalf;
  return {
    status: legacyStatus || "NOT_MARKED",
    applicable: true,
    canMark: legacyStatus === "NOT_MARKED",
  };
}

function getStatusLabel(status) {
  const labels = {
    PRESENT: "Present",
    Present: "Present",
    ABSENT: "Absent",
    Absent: "Absent",
    ON_LEAVE: "On Leave",
    HOLIDAY: "Holiday",
    NOT_MARKED: "Not Marked",
    NOT_APPLICABLE: "Not Applicable",
    WEEKLY_OFF: "Weekly Off",
    "Leave Pending": "Leave Pending",
  };
  return labels[status] || status || "Unknown";
}

function getStatusTone(status) {
  if (["PRESENT", "Present"].includes(status)) return "success";
  if (["ABSENT", "Absent"].includes(status)) return "danger";
  if (["ON_LEAVE", "Leave Pending"].includes(status)) return "warning";
  if (["HOLIDAY", "Holiday"].includes(status)) return "info";
  return "neutral";
}

function AttendanceStatus({ status }) {
  return <Badge tone={getStatusTone(status)}>{getStatusLabel(status)}</Badge>;
}

export default function ManualAttendance() {
  const [employees, setEmployees] = useState([]);
  const [dayInfo, setDayInfo] = useState({
    date: null,
    timezone: "Asia/Kolkata",
    weekday: null,
    isHoliday: false,
    holiday: null,
    isWeekend: false,
    applicableSessions: ["FIRST_HALF", "SECOND_HALF"],
  });
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingActions, setLoadingActions] = useState({});
  const [error, setError] = useState("");

  const fetchToday = useCallback(async ({ refresh = false, signal } = {}) => {
    refresh ? setIsRefreshing(true) : setIsLoading(true);
    setError("");
    try {
      const response = await axios.get(TODAY_URL, {
        withCredentials: true,
        signal,
      });
      if (
        response.status !== 200 ||
        response.data?.success !== true ||
        !response.data?.data
      ) {
        throw new Error(
          response.data?.message || "Unable to load today's attendance.",
        );
      }
      const data = response.data.data;
      setEmployees(Array.isArray(data.employees) ? data.employees : []);
      setDayInfo({
        date: data.date || null,
        timezone: data.timezone || "Asia/Kolkata",
        weekday: data.weekday || null,
        isHoliday: Boolean(data.isHoliday),
        holiday: data.holiday || null,
        isWeekend: Boolean(data.isWeekend),
        applicableSessions: Array.isArray(data.applicableSessions)
          ? data.applicableSessions
          : ["FIRST_HALF", "SECOND_HALF"],
      });
    } catch (err) {
      if (err.code === "ERR_CANCELED") return;
      const message =
        err.response?.data?.message ||
        err.message ||
        "Unable to load today's attendance.";
      setError(message);
      showToast.error(message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchToday({ signal: controller.signal });
    return () => controller.abort();
  }, [fetchToday]);

  const isSunday =
    dayInfo.weekday === "Sun" ||
    (dayInfo.isWeekend && dayInfo.weekday !== "Sat");
  const isSaturday = dayInfo.weekday === "Sat";
  const hasSecondHalf =
    dayInfo.applicableSessions.includes("SECOND_HALF") &&
    !isSunday &&
    !isSaturday;

  const filteredEmployees = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return employees;
    return employees.filter((employee) => {
      const leaveText = [
        getSession(employee, "FIRST_HALF").leave,
        getSession(employee, "SECOND_HALF").leave,
      ]
        .map(getLeaveLabel)
        .join(" ");
      return [
        getEmployeeName(employee),
        employee.email,
        employee.employeeCode,
        employee.employee_code,
        leaveText,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [employees, search]);

  const stats = useMemo(() => {
    const sessions = employees.flatMap((employee) =>
      dayInfo.applicableSessions.map((session) =>
        getSession(employee, session),
      ),
    );
    return {
      employees: employees.length,
      present: sessions.filter((session) =>
        ["PRESENT", "Present"].includes(session.status),
      ).length,
      onLeave: employees.filter((employee) =>
        dayInfo.applicableSessions.some(
          (session) => getSession(employee, session).status === "ON_LEAVE",
        ),
      ).length,
      notMarked: sessions.filter((session) => session.status === "NOT_MARKED")
        .length,
    };
  }, [employees, dayInfo.applicableSessions]);

  const markPresent = async (employee, session) => {
    const sessionData = getSession(employee, session);
    if (
      dayInfo.isHoliday ||
      isSunday ||
      !sessionData.canMark ||
      !sessionData.applicable
    )
      return;
    const actionKey = `${employee.id}:${session}`;
    if (loadingActions[actionKey]) return;
    setLoadingActions((current) => ({ ...current, [actionKey]: true }));
    try {
      const response = await axios.post(
        MARK_URL(employee.id),
        { session },
        { withCredentials: true },
      );
      if (response.status !== 201 || response.data?.success !== true) {
        throw new Error(response.data?.message || "Unable to mark attendance.");
      }
      showToast.success(
        response.data.message ||
          `${getSessionLabel(session)} attendance marked.`,
      );
      await fetchToday({ refresh: true });
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Unable to mark attendance.";
      showToast.error(message);
      // Refresh after a conflict so the UI reflects any concurrent HR update.
      if (err.response?.status === 409) await fetchToday({ refresh: true });
    } finally {
      setLoadingActions((current) => {
        const next = { ...current };
        delete next[actionKey];
        return next;
      });
    }
  };

  const renderSessionAction = (employee, session) => {
    const item = getSession(employee, session);
    const actionKey = `${employee.id}:${session}`;
    const actionLoading = Boolean(loadingActions[actionKey]);
    if (dayInfo.isHoliday)
      return (
        <Button size="sm" variant="outline" disabled>
          Holiday
        </Button>
      );
    if (isSunday || !item.applicable)
      return (
        <Button size="sm" variant="outline" disabled>
          {isSunday ? "Weekly Off" : "Not Applicable"}
        </Button>
      );
    if (item.status === "ON_LEAVE")
      return (
        <Button size="sm" variant="outline" disabled>
          On Leave
        </Button>
      );
    if (["PRESENT", "Present"].includes(item.status))
      return (
        <Button size="sm" variant="outline" disabled>
          Present ✓
        </Button>
      );
    if (["ABSENT", "Absent"].includes(item.status))
      return (
        <Button size="sm" variant="outline" disabled>
          Already Marked
        </Button>
      );
    return (
      <Button
        size="sm"
        onClick={() => markPresent(employee, session)}
        disabled={!item.canMark || actionLoading}
      >
        {actionLoading ? "Saving..." : "Mark Present"}
      </Button>
    );
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-cm-text-muted">
            {getIndiaDate(dayInfo.date)} · India
          </p>
          <h1 className="mt-1 text-xl font-semibold text-cm-text">
            Manual Attendance
          </h1>
          <p className="mt-1 text-sm text-cm-text-muted">
            Mark employee attendance for each applicable session.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => fetchToday({ refresh: true })}
          disabled={isRefreshing}
        >
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-cm-lg border border-red-200 bg-red-50 p-4">
          <div>
            <p className="text-sm font-semibold text-red-700">
              Unable to load attendance
            </p>
            <p className="mt-1 text-sm text-red-600">{error}</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => fetchToday({ refresh: true })}
            disabled={isRefreshing}
          >
            Try Again
          </Button>
        </div>
      )}

      {dayInfo.isHoliday ? (
        <div className="rounded-cm-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm font-semibold text-blue-800">
            Today is a company holiday
            {dayInfo.holiday?.name ? `: ${dayInfo.holiday.name}` : ""}
          </p>
          <p className="mt-1 text-sm text-blue-700">
            Attendance actions are disabled for all employees.
          </p>
        </div>
      ) : isSunday ? (
        <div className="rounded-cm-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-800">
            Sunday · Weekly off
          </p>
          <p className="mt-1 text-sm text-amber-700">
            Attendance actions are disabled for today.
          </p>
        </div>
      ) : isSaturday ? (
        <div className="rounded-cm-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-800">
            Saturday schedule
          </p>
          <p className="mt-1 text-sm text-amber-700">
            Only first-half attendance is applicable today.
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm">
          <p className="text-xs text-cm-text-muted">Total Employees</p>
          <p className="mt-2 text-2xl font-bold text-cm-text">
            {stats.employees}
          </p>
          <p className="mt-1 text-xs text-cm-text-muted">
            Employees in this company
          </p>
        </div>
        <div className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm">
          <p className="text-xs text-cm-text-muted">Present Sessions</p>
          <p className="mt-2 text-2xl font-bold text-green-600">
            {stats.present}
          </p>
          <p className="mt-1 text-xs text-cm-text-muted">Attendance marked</p>
        </div>
        <div className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm">
          <p className="text-xs text-cm-text-muted">Employees on Leave</p>
          <p className="mt-2 text-2xl font-bold text-amber-600">
            {stats.onLeave}
          </p>
          <p className="mt-1 text-xs text-cm-text-muted">
            Approved leave today
          </p>
        </div>
        <div className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm">
          <p className="text-xs text-cm-text-muted">Sessions Not Marked</p>
          <p className="mt-2 text-2xl font-bold text-cm-text">
            {stats.notMarked}
          </p>
          <p className="mt-1 text-xs text-cm-text-muted">
            Awaiting manual attendance
          </p>
        </div>
      </div>

      <section className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-cm-text">
              Today's Employee Attendance
            </h2>
            <p className="mt-1 text-xs text-cm-text-muted">
              {filteredEmployees.length} employee
              {filteredEmployees.length === 1 ? "" : "s"} found
            </p>
          </div>
          <Badge tone="neutral">Live Data</Badge>
        </div>
        <div className="mt-5">
          <TableSearch
            value={search}
            onChange={setSearch}
            placeholder="Search employee, email or employee ID…"
          />
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-cm-border text-xs text-cm-text-muted">
                <th className="px-3 py-3 font-medium">Employee</th>
                <th className="px-3 py-3 font-medium">First Half</th>
                {hasSecondHalf && (
                  <th className="px-3 py-3 font-medium">Second Half</th>
                )}
                <th className="px-3 py-3 font-medium">Leave</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((employee) => {
                const first = getSession(employee, "FIRST_HALF");
                const second = getSession(employee, "SECOND_HALF");
                const leave = first.leave || second.leave;
                return (
                  <tr
                    key={employee.id}
                    className="border-b border-cm-border last:border-0"
                  >
                    <td className="px-3 py-4">
                      <p className="font-medium text-cm-text">
                        {getEmployeeName(employee)}
                      </p>
                      <p className="mt-1 text-xs text-cm-text-muted">
                        {employee.employeeCode ||
                          employee.employee_code ||
                          employee.id}{" "}
                        · {employee.email || "—"}
                      </p>
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex min-w-[150px] flex-col items-start gap-2">
                        <AttendanceStatus status={first.status} />
                        {renderSessionAction(employee, "FIRST_HALF")}
                      </div>
                    </td>
                    {hasSecondHalf && (
                      <td className="px-3 py-4">
                        <div className="flex min-w-[150px] flex-col items-start gap-2">
                          <AttendanceStatus status={second.status} />
                          {renderSessionAction(employee, "SECOND_HALF")}
                        </div>
                      </td>
                    )}
                    <td className="px-3 py-4">
                      {leave ? (
                        <Badge tone="warning">{getLeaveLabel(leave)}</Badge>
                      ) : (
                        <span className="text-cm-text-muted">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredEmployees.length === 0 && (
                <tr>
                  <td
                    colSpan={hasSecondHalf ? 4 : 3}
                    className="px-3 py-10 text-center text-sm text-cm-text-muted"
                  >
                    {error
                      ? "Unable to display employees until data loads."
                      : search
                        ? "No employees match your search."
                        : "No employees found for this company."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
