import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useMemo, useState } from "react";

import Badge from "./Badge";
import {
  MONTHS,
  WEEK_DAYS,
  formatCheckIn,
  getCalendarStartOffset,
  getMonthDays,
  getOverallStatus,
  getOverallTone,
  getSessionColor,
  getSessionShortLabel,
  isFutureDate,
} from "./attendanceUtils";

function AttendanceCalendar({ month, year, data, daysByDate }) {
  const [selectedDate, setSelectedDate] = useState(null);
  const today = new Date();

  const todayString = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  const calendarCells = useMemo(() => {
    const offset = getCalendarStartOffset(year, month);
    return [...Array(offset).fill(null), ...getMonthDays(year, month)];
  }, [year, month]);

  const summary = data?.summary ?? {};
  const totalDays = summary.totalDays ?? 0;

  const calendarDays = useMemo(() => {
    return calendarCells.map((dayNumber, index) => {
      if (!dayNumber) return { key: `empty-${index}`, empty: true };

      const dateString = `${year}-${String(month).padStart(2, "0")}-${String(
        dayNumber,
      ).padStart(2, "0")}`;

      const futureDate = isFutureDate(dateString);
      const day = futureDate ? null : daysByDate.get(dateString);

      return {
        key: dateString,
        dayNumber,
        dateString,
        futureDate,
        day,
        isToday: dateString === todayString,
        isWeekend: index % 7 === 0 || index % 7 === 6,
      };
    });
  }, [calendarCells, year, month, daysByDate, todayString]);

  const selected = selectedDate
    ? calendarDays.find((item) => item.dateString === selectedDate)
    : null;

  return (
    <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_16px_50px_rgba(15,23,42,0.07)]">
      {/* Editorial header */}
      <header className="relative isolate overflow-hidden bg-slate-950 px-4 py-5 text-white sm:px-6 sm:py-6 lg:px-8">
        <div className="pointer-events-none absolute -right-12 -top-20 -z-10 h-56 w-56 rounded-full bg-indigo-500/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 -z-10 h-48 w-48 rounded-full bg-cyan-400/20 blur-3xl" />

        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-100">
              <Sparkles size={13} />
              Attendance overview
            </div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {MONTHS[month - 1]}{" "}
              <span className="text-indigo-200">{year}</span>
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-300">
              Your month, at a glance. Select any recorded day to inspect its
              attendance details.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:min-w-[250px]">
            <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-3 backdrop-blur-sm">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Recorded days
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {totalDays}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-3 backdrop-blur-sm">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Sessions / day
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">02</p>
            </div>
          </div>
        </div>
      </header>

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-px border-b border-slate-100 bg-slate-100 sm:grid-cols-4">
        <SummaryItem
          label="Present"
          value={summary.present ?? summary.presentDays ?? "—"}
          dot="bg-emerald-500"
        />
        <SummaryItem
          label="Absent"
          value={summary.absent ?? summary.absentDays ?? "—"}
          dot="bg-rose-500"
        />
        <SummaryItem
          label="Leave"
          value={summary.leave ?? summary.leaveDays ?? "—"}
          dot="bg-amber-500"
        />
        <SummaryItem
          label="Holidays"
          value={summary.holidays ?? summary.holidayDays ?? "—"}
          dot="bg-sky-500"
        />
      </div>

      {/* Responsive weekday labels and calendar */}
      <div className="px-2 py-3 sm:px-4 sm:py-4 lg:px-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] font-medium text-slate-500 sm:gap-x-4">
            <LegendDot className="bg-emerald-500" label="Present" />
            <LegendDot className="bg-rose-500" label="Absent" />
            <LegendDot className="bg-amber-500" label="Leave / half day" />
            <LegendDot className="bg-sky-500" label="Holiday" />
          </div>
          <div className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400">
            <span className="h-2 w-2 rounded-full bg-indigo-500" /> Today
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {WEEK_DAYS.map((day, index) => (
            <div key={day} className="py-2 text-center">
              <span className="hidden text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 sm:inline">
                {day}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:hidden">
                {day.slice(0, 1)}
              </span>
            </div>
          ))}

          {calendarDays.map((item) => {
            if (item.empty) {
              return (
                <div
                  key={item.key}
                  aria-hidden="true"
                  className="min-h-[54px] sm:min-h-[92px] lg:min-h-[118px]"
                />
              );
            }

            const day = item.day;
            const status = day ? getOverallStatus(day) : null;
            const isSelected = selectedDate === item.dateString;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() =>
                  setSelectedDate(isSelected ? null : item.dateString)
                }
                aria-pressed={isSelected}
                aria-label={`${item.dateString}${status ? `, ${status}` : item.futureDate ? ", future date" : ", no attendance record"}`}
                className={`group relative flex min-h-[54px] min-w-0 flex-col items-center rounded-xl border p-1.5 text-left transition duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 sm:min-h-[92px] sm:items-stretch sm:rounded-2xl sm:p-2.5 lg:min-h-[118px] lg:p-3 ${
                  item.isToday
                    ? "border-indigo-300 bg-indigo-50/80 ring-1 ring-inset ring-indigo-200"
                    : isSelected
                      ? "border-indigo-300 bg-indigo-50"
                      : day?.holiday
                        ? "border-sky-100 bg-sky-50/80 hover:border-sky-200"
                        : day
                          ? "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50/50 hover:shadow-sm"
                          : "border-slate-100 bg-slate-50/60 hover:border-slate-200"
                }`}
              >
                <div className="flex w-full items-center justify-center sm:justify-between">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold sm:h-7 sm:w-7 ${
                      item.isToday
                        ? "bg-indigo-600 text-white"
                        : item.futureDate
                          ? "text-slate-300"
                          : "text-slate-700"
                    }`}
                  >
                    {item.dayNumber}
                  </span>
                  {item.isToday && (
                    <span className="hidden text-[9px] font-bold uppercase tracking-wide text-indigo-600 sm:inline">
                      Today
                    </span>
                  )}
                  {day?.isSunday && (
                    <span className="hidden text-[9px] font-medium text-slate-400 lg:inline">
                      Sun
                    </span>
                  )}
                  {day?.isSaturday && (
                    <span className="hidden text-[9px] font-medium text-amber-600 lg:inline">
                      Half day
                    </span>
                  )}
                </div>

                <div className="mt-1.5 flex w-full flex-1 flex-col items-center justify-center gap-1 sm:mt-2 sm:items-stretch sm:justify-start">
                  {day?.holiday ? (
                    <span className="w-full truncate rounded-md bg-sky-100 px-1 py-1 text-center text-[8px] font-bold text-sky-800 sm:text-left sm:text-[10px]">
                      {day.holiday.name}
                    </span>
                  ) : null}

                  {day?.sessions?.firstHalf && (
                    <SessionPill session={day.sessions.firstHalf} label="AM" />
                  )}
                  {day?.sessions?.secondHalf && (
                    <SessionPill session={day.sessions.secondHalf} label="PM" />
                  )}

                  {!item.futureDate && !day && (
                    <span className="hidden text-[10px] text-slate-300 sm:block">
                      No record
                    </span>
                  )}
                </div>

                {day && (
                  <div className="mt-1.5 hidden w-full items-center justify-between gap-1 border-t border-slate-100 pt-1.5 sm:flex">
                    <span className="truncate text-[9px] text-slate-400">
                      {status}
                    </span>
                    <ChevronRight
                      size={12}
                      className={`shrink-0 text-slate-300 transition-transform ${isSelected ? "rotate-90 text-indigo-500" : "group-hover:translate-x-0.5"}`}
                    />
                  </div>
                )}
                {day && (
                  <span
                    className={`mt-1 h-1 w-1 rounded-full sm:hidden ${
                      /present/i.test(status)
                        ? "bg-emerald-500"
                        : /absent/i.test(status)
                          ? "bg-rose-500"
                          : /holiday/i.test(status)
                            ? "bg-sky-500"
                            : "bg-amber-500"
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected-day detail panel */}
      {selected && !selected.empty && (
        <div className="border-t border-slate-200 bg-slate-50/80 px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-indigo-600">
                Selected day
              </p>
              <h3 className="mt-1 text-base font-semibold text-slate-900">
                {new Date(`${selected.dateString}T12:00:00`).toLocaleDateString(
                  undefined,
                  {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  },
                )}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {selected.day
                  ? getOverallStatus(selected.day)
                  : selected.futureDate
                    ? "Future date — no attendance shown"
                    : "No attendance record for this date"}
              </p>
            </div>
            {selected.day && (
              <Badge tone={getOverallTone(getOverallStatus(selected.day))}>
                {getOverallStatus(selected.day)}
              </Badge>
            )}
          </div>

          {selected.day?.holiday && (
            <div className="mt-3 rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900">
              <p className="font-semibold">{selected.day.holiday.name}</p>
              <p className="mt-1 text-xs text-sky-700">
                {selected.day.holiday.isPaid
                  ? "Paid holiday"
                  : "Unpaid holiday"}
              </p>
            </div>
          )}

          {selected.day?.sessions && (
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <SessionDetail
                title="First half"
                session={selected.day.sessions.firstHalf}
              />
              <SessionDetail
                title="Second half"
                session={selected.day.sessions.secondHalf}
              />
            </div>
          )}
        </div>
      )}

      <footer className="border-t border-slate-100 px-4 py-3 sm:px-6">
        <p className="text-[11px] leading-relaxed text-slate-400">
          Future dates are intentionally left blank. Select a day to see its
          details.
        </p>
      </footer>
    </section>
  );
}

function SummaryItem({ label, value, dot }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5 bg-white px-4 py-3 sm:px-5">
      <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
      <div className="min-w-0">
        <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </p>
        <p className="mt-0.5 text-lg font-semibold tabular-nums text-slate-900">
          {value}
        </p>
      </div>
    </div>
  );
}

function SessionPill({ session, label }) {
  return (
    <span
      className={`w-full min-w-0 truncate rounded-md border px-1 py-1 text-center text-[8px] font-semibold sm:px-1.5 sm:text-left sm:text-[10px] ${getSessionColor(session)}`}
    >
      <span className="sm:hidden">{label}</span>
      <span className="hidden sm:inline">{label} · </span>
      {getSessionShortLabel(session)}
    </span>
  );
}

function SessionDetail({ title, session }) {
  if (!session) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-3">
        <p className="text-xs font-semibold text-slate-500">{title}</p>
        <p className="mt-1 text-xs text-slate-400">No session record</p>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border p-3 sm:p-4 ${getSessionColor(session)}`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] opacity-70">
        {title}
      </p>
      <p className="mt-1 text-sm font-semibold">
        {getSessionShortLabel(session)}
      </p>
      {session.checkIn && (
        <p className="mt-2 inline-flex items-center gap-1.5 text-xs opacity-80">
          <Clock3 size={13} />
          Check-in: {formatCheckIn(session.checkIn)}
        </p>
      )}
      {session.leave?.type && (
        <p className="mt-1 text-xs opacity-80">Leave: {session.leave.type}</p>
      )}
    </div>
  );
}

function LegendDot({ className, label }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${className}`} />
      {label}
    </span>
  );
}

export default AttendanceCalendar;
