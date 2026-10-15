import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";

import Button from "./Button";
import Loader from "./Loader";
import { showToast } from "./Toast";
import AttendanceCalendar from "./AttendanceCalendar";

import {
  MONTHS,
  getCurrentMonthYear,
  getOverallStatus,
  isFutureDate,
} from "./attendanceUtils";

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

  /*
   * Keep the API data unchanged.
   *
   * Future dates are filtered at the UI/calendar level.
   * This prevents future Absent records from being displayed.
   */
  const daysByDate = useMemo(() => {
    const map = new Map();

    for (const day of data?.days || []) {
      map.set(day.date, day);
    }

    return map;
  }, [data]);

  /*
   * Summary only counts dates up to today.
   *
   * For previous months:
   *   all dates are counted.
   *
   * For current/future months:
   *   future dates are ignored.
   */
  const summary = useMemo(() => {
    const days = data?.days || [];

    let present = 0;
    let absent = 0;
    let halfDay = 0;
    let paidLeave = 0;
    let unpaidLeave = 0;
    let holidays = 0;
    let weekends = 0;

    for (const day of days) {
      if (isFutureDate(day.date)) {
        continue;
      }

      const status = getOverallStatus(day);

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
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
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
        </div>
      </section>

      {/* Calendar */}
      <AttendanceCalendar
        month={month}
        year={year}
        data={data}
        daysByDate={daysByDate}
      />

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
