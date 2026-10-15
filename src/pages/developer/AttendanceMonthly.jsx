import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";

import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import { showToast } from "../../components/common/Toast";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getCurrentMonthYear() {
  const now = new Date();

  return {
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  };
}

function formatCheckIn(value) {
  if (!value) {
    return null;
  }

  try {
    return new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(value));
  } catch {
    return null;
  }
}

function getMonthDays(year, month) {
  const daysInMonth = new Date(year, month, 0).getDate();

  return Array.from({ length: daysInMonth }, (_, index) => index + 1);
}

function getCalendarStartOffset(year, month) {
  return new Date(year, month - 1, 1).getDay();
}

function getSessionLabel(session) {
  if (session === "FIRST_HALF") {
    return "First Half";
  }

  if (session === "SECOND_HALF") {
    return "Second Half";
  }

  return session || "—";
}

function getStatusLabel(session) {
  if (!session) {
    return "—";
  }

  if (session.type === "ATTENDANCE") {
    return session.status || "Attendance";
  }

  if (session.type === "LEAVE") {
    return session.status || "Leave";
  }

  if (session.type === "HOLIDAY") {
    return session.status || "Holiday";
  }

  if (session.type === "WEEKEND") {
    return "Weekend";
  }

  if (session.type === "UPCOMING") {
    return "Upcoming";
  }

  return session.status || session.type || "—";
}

function isFutureDate(dateString) {
  if (!dateString) {
    return false;
  }

  const today = new Date();

  const currentDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  const [year, month, day] = dateString.split("-").map(Number);

  const targetDate = new Date(year, month - 1, day);

  return targetDate > currentDate;
}

function normalizeSession(session, date) {
  if (!session) {
    return null;
  }

  if (
    session.type === "ATTENDANCE" &&
    session.status === "Absent" &&
    isFutureDate(date)
  ) {
    return {
      ...session,
      type: "UPCOMING",
      status: "Upcoming",
      isPaid: false,
    };
  }

  return session;
}

function getOverallTone(status) {
  switch (status) {
    case "Present":
      return "success";

    case "Half Day":
      return "warning";

    case "Absent":
      return "danger";

    case "Paid Leave":
      return "success";

    case "Unpaid Leave":
      return "warning";

    case "Leave":
      return "warning";

    case "Holiday":
      return "info";

    case "Weekend":
      return "neutral";

    case "Upcoming":
      return "neutral";

    default:
      return "neutral";
  }
}

function getSessionColor(session) {
  if (!session) {
    return "border-cm-border bg-cm-bg text-cm-text-muted";
  }

  if (session.type === "UPCOMING") {
    return "border-slate-200 bg-slate-50 text-slate-500";
  }

  if (session.type === "WEEKEND") {
    return "border-slate-200 bg-slate-50 text-slate-500";
  }

  if (session.type === "HOLIDAY") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (session.type === "LEAVE") {
    if (session.isPaid) {
      return "border-green-200 bg-green-50 text-green-700";
    }

    return "border-orange-200 bg-orange-50 text-orange-700";
  }

  if (session.status === "Present") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (session.status === "Absent") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-cm-border bg-cm-card text-cm-text";
}

function getOverallStatus(day) {
  if (!day) {
    return "—";
  }

  if (day.overallStatus) {
    return day.overallStatus;
  }

  const firstHalf = day.sessions?.firstHalf;
  const secondHalf = day.sessions?.secondHalf;

  if (firstHalf?.type === "WEEKEND") {
    return "Weekend";
  }

  if (firstHalf?.type === "HOLIDAY") {
    return "Holiday";
  }

  const firstStatus = firstHalf?.status;
  const secondStatus = secondHalf?.status;

  if (firstStatus === "Present" && secondStatus === "Present") {
    return "Present";
  }

  if (firstStatus === "Absent" && secondStatus === "Absent") {
    return "Absent";
  }

  if (
    (firstStatus === "Present" && secondStatus === "Absent") ||
    (firstStatus === "Absent" && secondStatus === "Present")
  ) {
    return "Half Day";
  }

  if (firstHalf?.type === "LEAVE" || secondHalf?.type === "LEAVE") {
    if (firstHalf?.isPaid || secondHalf?.isPaid) {
      return "Paid Leave";
    }

    return "Unpaid Leave";
  }

  if (firstHalf?.type === "UPCOMING" || secondHalf?.type === "UPCOMING") {
    return "Upcoming";
  }

  return firstStatus || secondStatus || "—";
}

function getDayCardClass(day, isToday) {
  const status = getOverallStatus(day);

  let statusClass = "border-cm-border bg-cm-card";

  switch (status) {
    case "Present":
      statusClass = "border-green-200 bg-green-50/50";
      break;

    case "Absent":
      statusClass = "border-red-200 bg-red-50/40";
      break;

    case "Half Day":
      statusClass = "border-yellow-200 bg-yellow-50/40";
      break;

    case "Paid Leave":
      statusClass = "border-green-200 bg-green-50/40";
      break;

    case "Unpaid Leave":
      statusClass = "border-orange-200 bg-orange-50/40";
      break;

    case "Holiday":
      statusClass = "border-blue-200 bg-blue-50/40";
      break;

    case "Weekend":
      statusClass = "border-slate-200 bg-slate-50";
      break;

    case "Upcoming":
      statusClass = "border-slate-200 bg-white";
      break;

    default:
      break;
  }

  if (isToday) {
    statusClass += " ring-2 ring-[#000052]/20";
  }

  return statusClass;
}

function getSessionShortLabel(session) {
  if (!session) {
    return "—";
  }

  if (session.type === "ATTENDANCE") {
    if (session.status === "Present") {
      return "Present";
    }

    if (session.status === "Absent") {
      return "Absent";
    }
  }

  if (session.type === "LEAVE") {
    return session.isPaid ? "Paid Leave" : "Unpaid Leave";
  }

  if (session.type === "HOLIDAY") {
    return "Holiday";
  }

  if (session.type === "WEEKEND") {
    return "Weekend";
  }

  if (session.type === "UPCOMING") {
    return "Upcoming";
  }

  return getStatusLabel(session);
}

function AttendanceByUser() {
  const initial = getCurrentMonthYear();

  const [month, setMonth] = useState(initial.month);
  const [year, setYear] = useState(initial.year);

  const [data, setData] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [error, setError] = useState("");

  const getMonthlyAttendance = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }

        setError("");

        const response = await axios.get("/api/attendance/monthly", {
          params: {
            month,
            year,
          },
          withCredentials: true,
        });

        if (response.status !== 200 || !response.data?.success) {
          throw new Error(
            response.data?.message || "Unable to fetch monthly attendance.",
          );
        }

        setData(response.data.data || null);
      } catch (error) {
        console.error("Get monthly attendance error:", error);

        const message =
          error.response?.data?.message ||
          error.message ||
          "Unable to fetch monthly attendance.";

        setError(message);
        showToast.error(message);

        setData(null);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [month, year],
  );

  useEffect(() => {
    getMonthlyAttendance();
  }, [getMonthlyAttendance]);

  const daysByDate = useMemo(() => {
    const map = new Map();

    for (const day of data?.days || []) {
      map.set(day.date, {
        ...day,
        sessions: {
          firstHalf: normalizeSession(day.sessions?.firstHalf, day.date),
          secondHalf: normalizeSession(day.sessions?.secondHalf, day.date),
        },
      });
    }

    return map;
  }, [data]);

  const calendarCells = useMemo(() => {
    const offset = getCalendarStartOffset(year, month);
    const days = getMonthDays(year, month);

    return [...Array(offset).fill(null), ...days];
  }, [month, year]);

  const todayString = useMemo(() => {
    const now = new Date();

    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");

    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const summary = useMemo(() => {
    const days = data?.days || [];

    let present = 0;
    let absent = 0;
    let halfDay = 0;
    let paidLeave = 0;
    let unpaidLeave = 0;
    let holidays = 0;
    let weekends = 0;
    let upcoming = 0;

    for (const day of days) {
      const status = getOverallStatus({
        ...day,
        sessions: {
          firstHalf: normalizeSession(day.sessions?.firstHalf, day.date),
          secondHalf: normalizeSession(day.sessions?.secondHalf, day.date),
        },
      });

      switch (status) {
        case "Present":
          present += 1;
          break;

        case "Absent":
          absent += 1;
          break;

        case "Half Day":
          halfDay += 1;
          break;

        case "Paid Leave":
          paidLeave += 1;
          break;

        case "Unpaid Leave":
          unpaidLeave += 1;
          break;

        case "Holiday":
          holidays += 1;
          break;

        case "Weekend":
          weekends += 1;
          break;

        case "Upcoming":
          upcoming += 1;
          break;

        default:
          break;
      }
    }

    return {
      present,
      absent,
      halfDay,
      paidLeave,
      unpaidLeave,
      holidays,
      weekends,
      upcoming,
    };
  }, [data]);

  function handlePreviousMonth() {
    if (month === 1) {
      setMonth(12);
      setYear((value) => value - 1);
      return;
    }

    setMonth((value) => value - 1);
  }

  function handleNextMonth() {
    if (month === 12) {
      setMonth(1);
      setYear((value) => value + 1);
      return;
    }

    setMonth((value) => value + 1);
  }

  function handleCurrentMonth() {
    const current = getCurrentMonthYear();

    setMonth(current.month);
    setYear(current.year);
  }

  function handleMonthChange(event) {
    setMonth(Number(event.target.value));
  }

  function handleYearChange(event) {
    setYear(Number(event.target.value));
  }

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();

    return Array.from({ length: 11 }, (_, index) => currentYear - 5 + index);
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-cm-text">My Attendance</h1>

          <p className="mt-1 text-sm text-cm-text-muted">
            View your attendance, leaves, holidays and working days.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => getMonthlyAttendance(true)}
          disabled={isRefreshing}
        >
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {/* Employee information */}
      {data?.employee && (
        <section className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs text-cm-text-muted">Employee</p>

              <h2 className="mt-1 text-lg font-semibold text-cm-text">
                {data.employee.fullName}
              </h2>

              <p className="mt-1 text-sm text-cm-text-muted">
                {data.employee.email}
              </p>
            </div>

            {data.employee.joiningDate && (
              <div className="text-left sm:text-right">
                <p className="text-xs text-cm-text-muted">Joining Date</p>

                <p className="mt-1 text-sm font-medium text-cm-text">
                  {data.employee.joiningDate}
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Month selector */}
      <section className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-medium text-cm-text-muted">
              Attendance Period
            </p>

            <h2 className="mt-1 text-lg font-semibold text-cm-text">
              {MONTHS[month - 1]} {year}
            </h2>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-2 block text-xs font-medium text-cm-text">
                Month
              </label>

              <select
                value={month}
                onChange={handleMonthChange}
                className="rounded-cm-md border border-cm-border bg-cm-card px-3 py-2.5 text-sm text-cm-text outline-none focus:border-[#000052]"
              >
                {MONTHS.map((monthName, index) => (
                  <option key={monthName} value={index + 1}>
                    {monthName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium text-cm-text">
                Year
              </label>

              <select
                value={year}
                onChange={handleYearChange}
                className="rounded-cm-md border border-cm-border bg-cm-card px-3 py-2.5 text-sm text-cm-text outline-none focus:border-[#000052]"
              >
                {yearOptions.map((yearValue) => (
                  <option key={yearValue} value={yearValue}>
                    {yearValue}
                  </option>
                ))}
              </select>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleCurrentMonth}
            >
              Current Month
            </Button>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-cm-border pt-4">
          <Button type="button" variant="outline" onClick={handlePreviousMonth}>
            ← Previous
          </Button>

          <p className="hidden text-sm font-medium text-cm-text sm:block">
            {MONTHS[month - 1]} {year}
          </p>

          <Button type="button" variant="outline" onClick={handleNextMonth}>
            Next →
          </Button>
        </div>
      </section>

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
            onClick={() => getMonthlyAttendance(true)}
            disabled={isRefreshing}
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-7">
        <div className="rounded-cm-lg border border-green-200 bg-green-50 p-4">
          <p className="text-xs text-green-700">Present</p>

          <p className="mt-2 text-2xl font-bold text-green-700">
            {summary.present}
          </p>
        </div>

        <div className="rounded-cm-lg border border-red-200 bg-red-50 p-4">
          <p className="text-xs text-red-700">Absent</p>

          <p className="mt-2 text-2xl font-bold text-red-700">
            {summary.absent}
          </p>
        </div>

        <div className="rounded-cm-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-xs text-yellow-700">Half Day</p>

          <p className="mt-2 text-2xl font-bold text-yellow-700">
            {summary.halfDay}
          </p>
        </div>

        <div className="rounded-cm-lg border border-green-200 bg-green-50 p-4">
          <p className="text-xs text-green-700">Paid Leave</p>

          <p className="mt-2 text-2xl font-bold text-green-700">
            {summary.paidLeave}
          </p>
        </div>

        <div className="rounded-cm-lg border border-orange-200 bg-orange-50 p-4">
          <p className="text-xs text-orange-700">Unpaid Leave</p>

          <p className="mt-2 text-2xl font-bold text-orange-700">
            {summary.unpaidLeave}
          </p>
        </div>

        <div className="rounded-cm-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-xs text-blue-700">Holidays</p>

          <p className="mt-2 text-2xl font-bold text-blue-700">
            {summary.holidays}
          </p>
        </div>

        <div className="rounded-cm-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs text-slate-600">Upcoming</p>

          <p className="mt-2 text-2xl font-bold text-slate-700">
            {summary.upcoming}
          </p>
        </div>
      </div>

      {/* Legend */}
      <section className="rounded-cm-lg border border-cm-border bg-cm-card p-4 shadow-sm">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2 text-xs text-cm-text-muted">
            <span className="h-3 w-3 rounded-full bg-green-500" />
            Present
          </div>

          <div className="flex items-center gap-2 text-xs text-cm-text-muted">
            <span className="h-3 w-3 rounded-full bg-red-500" />
            Absent
          </div>

          <div className="flex items-center gap-2 text-xs text-cm-text-muted">
            <span className="h-3 w-3 rounded-full bg-yellow-500" />
            Half Day
          </div>

          <div className="flex items-center gap-2 text-xs text-cm-text-muted">
            <span className="h-3 w-3 rounded-full bg-green-300" />
            Leave
          </div>

          <div className="flex items-center gap-2 text-xs text-cm-text-muted">
            <span className="h-3 w-3 rounded-full bg-blue-500" />
            Holiday
          </div>

          <div className="flex items-center gap-2 text-xs text-cm-text-muted">
            <span className="h-3 w-3 rounded-full bg-slate-400" />
            Weekend
          </div>

          <div className="flex items-center gap-2 text-xs text-cm-text-muted">
            <span className="h-3 w-3 rounded-full bg-slate-200" />
            Upcoming
          </div>
        </div>
      </section>

      {/* Calendar */}
      <section className="rounded-cm-lg border border-cm-border bg-cm-card p-4 shadow-sm sm:p-5">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-cm-text">
              {MONTHS[month - 1]} {year}
            </h2>

            <p className="mt-1 text-xs text-cm-text-muted">
              Daily attendance by first and second half.
            </p>
          </div>

          <Badge tone="neutral">{data?.summary?.totalDays || 0} Days</Badge>
        </div>

        {/* Week headers */}
        <div className="grid grid-cols-7 border-b border-cm-border">
          {WEEK_DAYS.map((day) => (
            <div
              key={day}
              className="px-1 py-3 text-center text-xs font-semibold text-cm-text-muted sm:px-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {calendarCells.map((dayNumber, index) => {
            if (!dayNumber) {
              return (
                <div
                  key={`empty-${index}`}
                  className="min-h-[150px] border-b border-r border-cm-border bg-cm-bg/30"
                />
              );
            }

            const dateString = `${year}-${String(month).padStart(
              2,
              "0",
            )}-${String(dayNumber).padStart(2, "0")}`;

            const day = daysByDate.get(dateString);

            const firstHalf = day?.sessions?.firstHalf;
            const secondHalf = day?.sessions?.secondHalf;

            const isToday = dateString === todayString;

            return (
              <div
                key={dateString}
                className={`min-h-[150px] border-b border-r border-cm-border p-1.5 sm:p-2 ${getDayCardClass(
                  day,
                  isToday,
                )}`}
              >
                {/* Day header */}
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                      isToday ? "bg-[#000052] text-white" : "text-cm-text"
                    }`}
                  >
                    {dayNumber}
                  </span>

                  {day?.isSaturday && (
                    <span className="hidden text-[10px] font-medium text-slate-500 sm:block">
                      1 Half
                    </span>
                  )}

                  {day?.isSunday && (
                    <span className="hidden text-[10px] font-medium text-slate-500 sm:block">
                      Weekend
                    </span>
                  )}
                </div>

                {/* Holiday */}
                {day?.holiday && (
                  <div className="mt-2 rounded-md border border-blue-200 bg-blue-50 px-2 py-1.5">
                    <p className="truncate text-[10px] font-semibold text-blue-700 sm:text-xs">
                      {day.holiday.name}
                    </p>

                    <p className="mt-0.5 text-[9px] text-blue-600">
                      {day.holiday.isPaid ? "Paid Holiday" : "Unpaid Holiday"}
                    </p>
                  </div>
                )}

                {/* First half */}
                {firstHalf && (
                  <div
                    className={`mt-2 rounded-md border px-2 py-1.5 ${getSessionColor(
                      firstHalf,
                    )}`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[9px] font-semibold uppercase tracking-wide opacity-70">
                        1st
                      </span>

                      <span className="text-[9px] font-medium opacity-70">
                        {formatCheckIn(firstHalf.checkIn) || ""}
                      </span>
                    </div>

                    <p className="mt-0.5 truncate text-[10px] font-semibold sm:text-xs">
                      {getSessionShortLabel(firstHalf)}
                    </p>

                    {firstHalf.leave?.type && (
                      <p className="mt-0.5 truncate text-[9px] opacity-80">
                        {firstHalf.leave.type}
                      </p>
                    )}
                  </div>
                )}

                {/* Second half */}
                {secondHalf && (
                  <div
                    className={`mt-1 rounded-md border px-2 py-1.5 ${getSessionColor(
                      secondHalf,
                    )}`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[9px] font-semibold uppercase tracking-wide opacity-70">
                        2nd
                      </span>

                      <span className="text-[9px] font-medium opacity-70">
                        {formatCheckIn(secondHalf.checkIn) || ""}
                      </span>
                    </div>

                    <p className="mt-0.5 truncate text-[10px] font-semibold sm:text-xs">
                      {getSessionShortLabel(secondHalf)}
                    </p>

                    {secondHalf.leave?.type && (
                      <p className="mt-0.5 truncate text-[9px] opacity-80">
                        {secondHalf.leave.type}
                      </p>
                    )}
                  </div>
                )}

                {/* Overall status */}
                {day && (
                  <div className="mt-2 flex justify-end">
                    <Badge tone={getOverallTone(getOverallStatus(day))}>
                      {getOverallStatus(day)}
                    </Badge>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Monthly details */}
      {data?.summary && (
        <section className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-cm-text">
            Monthly Summary
          </h2>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-cm-md bg-cm-bg p-4">
              <p className="text-xs text-cm-text-muted">Total Days</p>

              <p className="mt-1 text-lg font-semibold text-cm-text">
                {data.summary.totalDays}
              </p>
            </div>

            <div className="rounded-cm-md bg-cm-bg p-4">
              <p className="text-xs text-cm-text-muted">Working Units</p>

              <p className="mt-1 text-lg font-semibold text-cm-text">
                {data.summary.workingDays}
              </p>
            </div>

            <div className="rounded-cm-md bg-cm-bg p-4">
              <p className="text-xs text-cm-text-muted">Present Units</p>

              <p className="mt-1 text-lg font-semibold text-green-600">
                {data.summary.presentUnits}
              </p>
            </div>

            <div className="rounded-cm-md bg-cm-bg p-4">
              <p className="text-xs text-cm-text-muted">Absent Units</p>

              <p className="mt-1 text-lg font-semibold text-red-600">
                {data.summary.absentUnits}
              </p>
            </div>

            <div className="rounded-cm-md bg-cm-bg p-4">
              <p className="text-xs text-cm-text-muted">Paid Leave Units</p>

              <p className="mt-1 text-lg font-semibold text-green-600">
                {data.summary.paidLeaveUnits}
              </p>
            </div>

            <div className="rounded-cm-md bg-cm-bg p-4">
              <p className="text-xs text-cm-text-muted">Unpaid Leave Units</p>

              <p className="mt-1 text-lg font-semibold text-orange-600">
                {data.summary.unpaidLeaveUnits}
              </p>
            </div>

            <div className="rounded-cm-md bg-cm-bg p-4">
              <p className="text-xs text-cm-text-muted">Paid Holidays</p>

              <p className="mt-1 text-lg font-semibold text-blue-600">
                {data.summary.paidHolidayUnits}
              </p>
            </div>

            <div className="rounded-cm-md bg-cm-bg p-4">
              <p className="text-xs text-cm-text-muted">Weekend Days</p>

              <p className="mt-1 text-lg font-semibold text-cm-text">
                {data.summary.weekendDays}
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default AttendanceByUser;
