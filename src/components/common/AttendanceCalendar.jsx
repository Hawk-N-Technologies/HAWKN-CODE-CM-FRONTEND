import Badge from "./Badge";

import {
  MONTHS,
  WEEK_DAYS,
  formatCheckIn,
  getCalendarStartOffset,
  getDayCardClass,
  getMonthDays,
  getOverallStatus,
  getOverallTone,
  getSessionColor,
  getSessionShortLabel,
  isFutureDate,
} from "./attendanceUtils";

function AttendanceCalendar({ month, year, data, daysByDate }) {
  const offset = getCalendarStartOffset(year, month);

  const days = getMonthDays(year, month);

  const calendarCells = [...Array(offset).fill(null), ...days];

  const today = new Date();

  const todayString = `${today.getFullYear()}-${String(
    today.getMonth() + 1,
  ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  return (
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

      {/* Calendar */}
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

          /*
           * IMPORTANT:
           *
           * Future dates are intentionally treated
           * as having no attendance data.
           *
           * This means:
           *
           * October 5  -> show attendance
           * October 6  -> blank
           * October 7  -> blank
           *
           * No "Upcoming".
           * No "Absent".
           */
          const futureDate = isFutureDate(dateString);

          const day = futureDate ? null : daysByDate.get(dateString);

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
                <AttendanceSession session={firstHalf} label="1st" />
              )}

              {/* Second half */}
              {secondHalf && (
                <AttendanceSession session={secondHalf} label="2nd" />
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
  );
}

function AttendanceSession({ session, label }) {
  return (
    <div
      className={`mt-2 rounded-md border px-2 py-1.5 ${getSessionColor(
        session,
      )}`}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="text-[9px] font-semibold uppercase tracking-wide opacity-70">
          {label}
        </span>

        <span className="text-[9px] font-medium opacity-70">
          {formatCheckIn(session.checkIn) || ""}
        </span>
      </div>

      <p className="mt-0.5 truncate text-[10px] font-semibold sm:text-xs">
        {getSessionShortLabel(session)}
      </p>

      {session.leave?.type && (
        <p className="mt-0.5 truncate text-[9px] opacity-80">
          {session.leave.type}
        </p>
      )}
    </div>
  );
}

export default AttendanceCalendar;
