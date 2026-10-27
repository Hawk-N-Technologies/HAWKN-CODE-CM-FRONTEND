import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";

import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import TableSearch from "../../components/tables/TableSearch";
import Loader from "../../components/common/Loader";
import { showToast } from "../../components/common/Toast";

const TODAY_URL = "/api/attendance/manual/today";
const MARK_URL = (employeeId) => `/api/attendance/manual/${employeeId}/mark`;
const EDIT_URL = (employeeId) => `/api/attendance/manual/${employeeId}/edit`;

function getIndiaDate(value) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00+05:30`));
}

function getEmployeeName(employee) {
  return (
    employee?.name ||
    `${employee?.user?.firstName || ""} ${
      employee?.user?.lastName || ""
    }`.trim() ||
    "Unknown Employee"
  );
}

function getSession(employee, session) {
  if (employee?.sessions?.[session]) {
    return employee.sessions[session];
  }

  const status =
    session === "FIRST_HALF" ? employee?.firstHalf : employee?.secondHalf;

  return {
    status: status || "NOT_MARKED",
    applicable: true,
    canMark: !status || status === "NOT_MARKED",
    leave: null,
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
  };

  return labels[status] || status || "Unknown";
}

function getStatusTone(status) {
  if (["PRESENT", "Present"].includes(status)) return "success";
  if (["ABSENT", "Absent"].includes(status)) return "danger";
  if (status === "ON_LEAVE") return "warning";
  if (status === "HOLIDAY") return "info";
  return "neutral";
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
    ? String(type)
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase())
    : "Leave";

  return `${typeLabel}${sessionLabel ? ` · ${sessionLabel}` : ""}`;
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

  // Shared dialog state for marking absent and editing attendance.
  const [attendanceDialog, setAttendanceDialog] = useState(null);
  const [editStatus, setEditStatus] = useState("Present");
  const [leaveType, setLeaveType] = useState("SICK");
  const [customReason, setCustomReason] = useState("");
  const [isPaid, setIsPaid] = useState("");

  const fetchToday = useCallback(async ({ refresh = false, signal } = {}) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

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

  const isSunday = dayInfo.weekday === "Sun";
  const isSaturday = dayInfo.weekday === "Sat";

  const hasSecondHalf =
    dayInfo.applicableSessions.includes("SECOND_HALF") &&
    !isSunday &&
    !isSaturday;

  const filteredEmployees = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return employees;

    return employees.filter((employee) => {
      const first = getSession(employee, "FIRST_HALF");
      const second = getSession(employee, "SECOND_HALF");

      const leaveText = [first.leave, second.leave]
        .map((leave) => {
          if (!leave) return "";
          return `${getLeaveLabel(leave)} ${leave.reason || ""}`;
        })
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
      present: sessions.filter((item) =>
        ["PRESENT", "Present"].includes(item.status),
      ).length,
      absent: sessions.filter((item) =>
        ["ABSENT", "Absent"].includes(item.status),
      ).length,
      onLeave: employees.filter((employee) =>
        dayInfo.applicableSessions.some(
          (session) => getSession(employee, session).status === "ON_LEAVE",
        ),
      ).length,
      notMarked: sessions.filter((item) => item.status === "NOT_MARKED").length,
    };
  }, [employees, dayInfo.applicableSessions]);

  const closeAttendanceDialog = () => {
    setAttendanceDialog(null);
    setCustomReason("");
    setIsPaid("");
    setEditStatus("Present");
    setLeaveType("SICK");
  };

  // Open the dialog for a new absence.
  const openAbsenceDialog = (employee, session) => {
    const item = getSession(employee, session);

    if (dayInfo.isHoliday || isSunday || !item.applicable || !item.canMark) {
      return;
    }

    setEditStatus("Absent");
    setLeaveType("SICK");
    setCustomReason("");
    setIsPaid("");

    setAttendanceDialog({
      employee,
      session,
      isEditing: false,
    });
  };

  // Open the dialog for an existing Present/Absent record.
  const openEditDialog = (employee, session) => {
    const item = getSession(employee, session);

    if (
      dayInfo.isHoliday ||
      isSunday ||
      !item.applicable ||
      !["PRESENT", "Present", "ABSENT", "Absent"].includes(item.status)
    ) {
      return;
    }

    const currentlyAbsent = ["ABSENT", "Absent"].includes(item.status);
    const existingLeave = item.leave;

    setEditStatus(currentlyAbsent ? "Absent" : "Present");

    setLeaveType(
      ["SICK", "CASUAL", "OTHER"].includes(existingLeave?.leaveType)
        ? existingLeave.leaveType
        : "SICK",
    );

    setCustomReason(existingLeave?.reason || "");

    setIsPaid(
      typeof existingLeave?.isPaid === "boolean"
        ? String(existingLeave.isPaid)
        : "",
    );

    setAttendanceDialog({
      employee,
      session,
      isEditing: true,
    });
  };

  // Mark a new session Present, or create an absence with leave details.
  const markAttendance = async (
    employee,
    session,
    status,
    leaveDetails = {},
  ) => {
    const item = getSession(employee, session);

    if (dayInfo.isHoliday || isSunday || !item.applicable || !item.canMark) {
      return false;
    }

    const actionKey = `${employee.id}:${session}`;

    if (loadingActions[actionKey]) return false;

    setLoadingActions((current) => ({
      ...current,
      [actionKey]: true,
    }));

    try {
      const payload = { session, status };

      if (status === "Absent") {
        payload.leaveType = leaveDetails.leaveType;
        payload.reason = leaveDetails.reason;
        payload.isPaid = leaveDetails.isPaid;
      }

      const response = await axios.post(MARK_URL(employee.id), payload, {
        withCredentials: true,
      });

      if (response.status !== 201 || response.data?.success !== true) {
        throw new Error(response.data?.message || "Unable to mark attendance.");
      }

      showToast.success(
        response.data.message || "Attendance marked successfully.",
      );

      await fetchToday({ refresh: true });
      return true;
    } catch (err) {
      showToast.error(
        err.response?.data?.message ||
          err.message ||
          "Unable to mark attendance.",
      );

      if (err.response?.status === 409) {
        await fetchToday({ refresh: true });
      }

      return false;
    } finally {
      setLoadingActions((current) => {
        const next = { ...current };
        delete next[actionKey];
        return next;
      });
    }
  };

  const getAbsenceDetails = () => {
    if (leaveType === "OTHER" && !customReason.trim()) {
      showToast.error("Please enter a custom leave reason.");
      return null;
    }

    if (isPaid === "") {
      showToast.error("Please select whether the leave is paid.");
      return null;
    }

    const reason =
      leaveType === "SICK"
        ? "Sick Leave"
        : leaveType === "CASUAL"
          ? "Casual Leave"
          : customReason.trim();

    return {
      leaveType,
      reason,
      isPaid: isPaid === "true",
    };
  };

  const confirmAbsent = async (event) => {
    event.preventDefault();

    if (!attendanceDialog) return;

    const leaveDetails = getAbsenceDetails();
    if (!leaveDetails) return;

    const { employee, session } = attendanceDialog;

    const success = await markAttendance(
      employee,
      session,
      "Absent",
      leaveDetails,
    );

    if (success) {
      closeAttendanceDialog();
    }
  };

  // Update an existing attendance record using the PUT endpoint.
  const confirmEdit = async (event) => {
    event.preventDefault();

    if (!attendanceDialog) return;

    let leaveDetails = {};

    if (editStatus === "Absent") {
      leaveDetails = getAbsenceDetails();
      if (!leaveDetails) return;
    }

    const { employee, session } = attendanceDialog;
    const actionKey = `${employee.id}:${session}`;

    if (loadingActions[actionKey]) return;

    setLoadingActions((current) => ({
      ...current,
      [actionKey]: true,
    }));

    try {
      const payload = {
        session,
        status: editStatus,
      };

      if (editStatus === "Absent") {
        payload.leaveType = leaveDetails.leaveType;
        payload.reason = leaveDetails.reason;
        payload.isPaid = leaveDetails.isPaid;
      }

      const response = await axios.put(EDIT_URL(employee.id), payload, {
        withCredentials: true,
      });

      if (response.status !== 200 || response.data?.success !== true) {
        throw new Error(
          response.data?.message || "Unable to update attendance.",
        );
      }

      showToast.success(
        response.data.message || "Attendance updated successfully.",
      );

      closeAttendanceDialog();
      await fetchToday({ refresh: true });
    } catch (err) {
      showToast.error(
        err.response?.data?.message ||
          err.message ||
          "Unable to update attendance.",
      );

      if (err.response?.status === 409) {
        await fetchToday({ refresh: true });
      }
    } finally {
      setLoadingActions((current) => {
        const next = { ...current };
        delete next[actionKey];
        return next;
      });
    }
  };

  const renderSessionActions = (employee, session) => {
    const item = getSession(employee, session);
    const actionKey = `${employee.id}:${session}`;
    const actionLoading = Boolean(loadingActions[actionKey]);

    if (dayInfo.isHoliday || item.status === "HOLIDAY") {
      return (
        <Button size="sm" variant="outline" disabled>
          Holiday
        </Button>
      );
    }

    if (isSunday || !item.applicable) {
      return (
        <Button size="sm" variant="outline" disabled>
          {isSunday ? "Weekly Off" : "Not Applicable"}
        </Button>
      );
    }

    if (item.status === "ON_LEAVE") {
      return (
        <Button size="sm" variant="outline" disabled>
          On Leave
        </Button>
      );
    }

    if (["PRESENT", "Present"].includes(item.status)) {
      return (
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" disabled>
            Present ✓
          </Button>

          <Button
            size="sm"
            variant="outline"
            disabled={actionLoading}
            onClick={() => openEditDialog(employee, session)}
          >
            Edit
          </Button>
        </div>
      );
    }

    if (["ABSENT", "Absent"].includes(item.status)) {
      return (
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" disabled>
            Absent ✓
          </Button>

          <Button
            size="sm"
            variant="outline"
            disabled={actionLoading}
            onClick={() => openEditDialog(employee, session)}
          >
            Edit
          </Button>
        </div>
      );
    }

    const disabled = !item.canMark || actionLoading;

    return (
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          disabled={disabled}
          onClick={() => markAttendance(employee, session, "Present")}
        >
          {actionLoading ? "Saving..." : "Mark Present"}
        </Button>

        <Button
          size="sm"
          variant="outline"
          disabled={disabled}
          onClick={() => openAbsenceDialog(employee, session)}
        >
          Mark Absent
        </Button>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader />
      </div>
    );
  }

  const dialogActionKey = attendanceDialog
    ? `${attendanceDialog.employee.id}:${attendanceDialog.session}`
    : null;

  const dialogLoading = dialogActionKey
    ? Boolean(loadingActions[dialogActionKey])
    : false;

  return (
    <div className="flex flex-col gap-6">
      {/* Page heading */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-cm-text-muted">
            {getIndiaDate(dayInfo.date)} · India
          </p>

          <h1 className="mt-1 text-xl font-semibold text-cm-text">
            Manual Attendance
          </h1>

          <p className="mt-1 text-sm text-cm-text-muted">
            Mark and edit employee attendance for each applicable session.
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

      {/* Error */}
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

      {/* Holiday and schedule notices */}
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

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          {
            label: "Total Employees",
            value: stats.employees,
            detail: "Employees in this company",
            tone: "text-cm-text",
          },
          {
            label: "Present Sessions",
            value: stats.present,
            detail: "Marked present",
            tone: "text-green-600",
          },
          {
            label: "Absent Sessions",
            value: stats.absent,
            detail: "Marked absent",
            tone: "text-red-600",
          },
          {
            label: "Employees on Leave",
            value: stats.onLeave,
            detail: "Approved leave today",
            tone: "text-amber-600",
          },
          {
            label: "Sessions Not Marked",
            value: stats.notMarked,
            detail: "Awaiting attendance",
            tone: "text-cm-text",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm"
          >
            <p className="text-xs text-cm-text-muted">{card.label}</p>
            <p className={`mt-2 text-2xl font-bold ${card.tone}`}>
              {card.value}
            </p>
            <p className="mt-1 text-xs text-cm-text-muted">{card.detail}</p>
          </div>
        ))}
      </div>

      {/* Employee attendance table */}
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
                          employee.id}
                        {" · "}
                        {employee.email || "—"}
                      </p>
                    </td>

                    <td className="px-3 py-4">
                      <div className="flex min-w-[200px] flex-col items-start gap-2">
                        <AttendanceStatus status={first.status} />
                        {renderSessionActions(employee, "FIRST_HALF")}
                      </div>
                    </td>

                    {hasSecondHalf && (
                      <td className="px-3 py-4">
                        <div className="flex min-w-[200px] flex-col items-start gap-2">
                          <AttendanceStatus status={second.status} />
                          {renderSessionActions(employee, "SECOND_HALF")}
                        </div>
                      </td>
                    )}

                    <td className="px-3 py-4">
                      {leave ? (
                        <div className="flex flex-col items-start gap-1">
                          <Badge tone="warning">{getLeaveLabel(leave)}</Badge>
                          {leave.reason && (
                            <span className="max-w-[220px] break-words text-xs text-cm-text-muted">
                              {leave.reason}
                            </span>
                          )}
                        </div>
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

      {/* Mark Absent / Edit Attendance dialog */}
      {attendanceDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !dialogLoading) {
              closeAttendanceDialog();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="attendance-dialog-title"
            className="w-full max-w-md rounded-xl border border-cm-border bg-cm-card p-6 shadow-xl"
          >
            <h2
              id="attendance-dialog-title"
              className="text-lg font-semibold text-cm-text"
            >
              {attendanceDialog.isEditing
                ? "Edit Attendance"
                : "Mark Employee Absent"}
            </h2>

            <p className="mt-1 text-sm text-cm-text-muted">
              {getEmployeeName(attendanceDialog.employee)} ·{" "}
              {attendanceDialog.session === "FIRST_HALF"
                ? "First Half"
                : "Second Half"}
            </p>

            <form
              onSubmit={
                attendanceDialog.isEditing ? confirmEdit : confirmAbsent
              }
              className="mt-5 space-y-4"
            >
              {/* Status selector appears only when editing. */}
              {attendanceDialog.isEditing && (
                <div>
                  <label
                    htmlFor="editStatus"
                    className="mb-1 block text-sm font-medium text-cm-text"
                  >
                    Attendance status
                  </label>

                  <select
                    id="editStatus"
                    value={editStatus}
                    onChange={(event) => setEditStatus(event.target.value)}
                    disabled={dialogLoading}
                    className="w-full rounded-lg border border-cm-border bg-cm-card px-3 py-2 text-sm text-cm-text"
                  >
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                  </select>
                </div>
              )}

              {/* Leave details are required only for an absence. */}
              {(!attendanceDialog.isEditing || editStatus === "Absent") && (
                <>
                  <div>
                    <label
                      htmlFor="leaveType"
                      className="mb-1 block text-sm font-medium text-cm-text"
                    >
                      Absence type
                    </label>

                    <select
                      id="leaveType"
                      value={leaveType}
                      disabled={dialogLoading}
                      onChange={(event) => {
                        setLeaveType(event.target.value);
                        setCustomReason("");
                      }}
                      className="w-full rounded-lg border border-cm-border bg-cm-card px-3 py-2 text-sm text-cm-text"
                    >
                      <option value="SICK">Sick Leave</option>
                      <option value="CASUAL">Casual Leave</option>
                      <option value="OTHER">Custom Leave</option>
                    </select>
                  </div>

                  {leaveType === "OTHER" && (
                    <div>
                      <label
                        htmlFor="customReason"
                        className="mb-1 block text-sm font-medium text-cm-text"
                      >
                        Custom reason
                      </label>

                      <textarea
                        id="customReason"
                        value={customReason}
                        onChange={(event) =>
                          setCustomReason(event.target.value)
                        }
                        disabled={dialogLoading}
                        maxLength={1000}
                        rows={3}
                        required
                        placeholder="Enter the reason for absence"
                        className="w-full rounded-lg border border-cm-border bg-cm-card px-3 py-2 text-sm text-cm-text"
                      />
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="isPaid"
                      className="mb-1 block text-sm font-medium text-cm-text"
                    >
                      Is this leave paid?
                    </label>

                    <select
                      id="isPaid"
                      value={isPaid}
                      onChange={(event) => setIsPaid(event.target.value)}
                      disabled={dialogLoading}
                      required
                      className="w-full rounded-lg border border-cm-border bg-cm-card px-3 py-2 text-sm text-cm-text"
                    >
                      <option value="">Select payment status</option>
                      <option value="true">Paid</option>
                      <option value="false">Unpaid</option>
                    </select>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={dialogLoading}
                  onClick={closeAttendanceDialog}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={
                    dialogLoading ||
                    ((!attendanceDialog.isEditing || editStatus === "Absent") &&
                      ((leaveType === "OTHER" && !customReason.trim()) ||
                        isPaid === ""))
                  }
                >
                  {dialogLoading
                    ? "Saving..."
                    : attendanceDialog.isEditing
                      ? "Save Changes"
                      : "Confirm Absent"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
