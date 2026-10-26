import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  CalendarDays, CalendarCheck2, CalendarX2, Clock3, Coffee,
  ChevronLeft, ChevronRight, RefreshCw, Sparkles, BriefcaseBusiness,
  CircleCheck, CircleX, Sun, CalendarClock, TrendingUp,
} from "lucide-react";

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

const STAT_CARDS = [
  { key: "present", label: "Present", icon: CircleCheck, tone: "emerald", hint: "Days attended" },
  { key: "absent", label: "Absent", icon: CircleX, tone: "rose", hint: "Days missed" },
  { key: "halfDay", label: "Half day", icon: Clock3, tone: "amber", hint: "Partial attendance" },
  { key: "paidLeave", label: "Paid leave", icon: CalendarCheck2, tone: "teal", hint: "Paid time off" },
  { key: "unpaidLeave", label: "Unpaid leave", icon: CalendarX2, tone: "orange", hint: "Unpaid time off" },
  { key: "holidays", label: "Holidays", icon: Sun, tone: "blue", hint: "Company holidays" },
];

const TONES = {
  emerald: { icon: "bg-emerald-50 text-emerald-700 ring-emerald-100", value: "text-emerald-700", dot: "bg-emerald-500" },
  rose: { icon: "bg-rose-50 text-rose-700 ring-rose-100", value: "text-rose-700", dot: "bg-rose-500" },
  amber: { icon: "bg-amber-50 text-amber-700 ring-amber-100", value: "text-amber-700", dot: "bg-amber-500" },
  teal: { icon: "bg-teal-50 text-teal-700 ring-teal-100", value: "text-teal-700", dot: "bg-teal-500" },
  orange: { icon: "bg-orange-50 text-orange-700 ring-orange-100", value: "text-orange-700", dot: "bg-orange-500" },
  blue: { icon: "bg-blue-50 text-blue-700 ring-blue-100", value: "text-blue-700", dot: "bg-blue-500" },
};

function StatCard({ stat, value }) {
  const Icon = stat.icon;
  const tone = TONES[stat.tone];

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.025)] transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_12px_30px_rgba(15,23,42,0.07)] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${tone.icon}`}>
          <Icon size={19} strokeWidth={1.9} />
        </div>
        <span className={`mt-1 h-2 w-2 rounded-full ${tone.dot}`} />
      </div>
      <p className="mt-4 text-sm font-medium text-slate-500">{stat.label}</p>
      <div className="mt-1 flex items-end justify-between gap-2">
        <p className={`text-3xl font-bold tracking-tight ${tone.value}`}>{value}</p>
        <span className="pb-1 text-[11px] font-medium text-slate-400">{stat.hint}</span>
      </div>
      <div className="absolute -bottom-8 -right-6 h-20 w-20 rounded-full bg-slate-50 opacity-0 transition group-hover:opacity-100" />
    </article>
  );
}

function SummaryMetric({ label, value, icon: Icon, accent = "text-slate-900" }) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm ring-1 ring-slate-200/70">
        <Icon size={17} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className={`mt-1 text-xl font-bold tracking-tight ${accent}`}>{value ?? 0}</p>
      </div>
    </div>
  );
}

function AttendanceByUser() {
  const initial = getCurrentMonthYear();
  const [month, setMonth] = useState(initial.month);
  const [year, setYear] = useState(initial.year);
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");

  const getMonthlyAttendance = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setIsRefreshing(true);
      else setIsLoading(true);
      setError("");

      const response = await axios.get("/api/attendance/monthly", {
        params: { month, year },
        withCredentials: true,
      });

      if (response.status !== 200 || !response.data?.success) {
        throw new Error(response.data?.message || "Unable to fetch monthly attendance.");
      }
      setData(response.data.data || null);
    } catch (fetchError) {
      console.error("Get monthly attendance error:", fetchError);
      const message = fetchError.response?.data?.message || fetchError.message || "Unable to fetch monthly attendance.";
      setError(message);
      showToast.error(message);
      setData(null);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [month, year]);

  useEffect(() => {
    getMonthlyAttendance();
  }, [getMonthlyAttendance]);

  const daysByDate = useMemo(() => {
    const map = new Map();
    for (const day of data?.days || []) map.set(day.date, day);
    return map;
  }, [data]);

  const summary = useMemo(() => {
    const counts = { present: 0, absent: 0, halfDay: 0, paidLeave: 0, unpaidLeave: 0, holidays: 0, weekends: 0 };
    for (const day of data?.days || []) {
      if (isFutureDate(day.date)) continue;
      switch (getOverallStatus(day)) {
        case "Present": counts.present += 1; break;
        case "Absent": counts.absent += 1; break;
        case "Half Day": counts.halfDay += 1; break;
        case "Paid Leave": counts.paidLeave += 1; break;
        case "Unpaid Leave": counts.unpaidLeave += 1; break;
        case "Holiday": counts.holidays += 1; break;
        case "Weekend": counts.weekends += 1; break;
        default: break;
      }
    }
    return counts;
  }, [data]);

  const handlePreviousMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear((value) => value - 1);
    } else setMonth((value) => value - 1);
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear((value) => value + 1);
    } else setMonth((value) => value + 1);
  };

  const handleCurrentMonth = () => {
    const current = getCurrentMonthYear();
    setMonth(current.month);
    setYear(current.year);
  };

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 11 }, (_, index) => currentYear - 5 + index);
  }, []);

  const isCurrentMonth = month === initial.month && year === initial.year;
  const monthlySummary = data?.summary;
  const workingDays = Number(monthlySummary?.workingDays || 0);
  const presentUnits = Number(monthlySummary?.presentUnits || 0);
  const attendanceRate = workingDays > 0 ? Math.min(100, Math.round((presentUnits / workingDays) * 100)) : 0;

  if (isLoading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center rounded-3xl border border-slate-200 bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
            <CalendarDays size={25} />
            <span className="absolute -right-1 -top-1 h-4 w-4 animate-ping rounded-full bg-indigo-400/40" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-800">Preparing your attendance</p>
            <p className="mt-1 text-xs text-slate-500">Loading your monthly overview…</p>
          </div>
          <Loader />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-6 pb-8">
      {/* Premium page heading */}
      <section className="relative isolate overflow-hidden rounded-[28px] bg-[#080D2B] px-5 py-6 text-white shadow-[0_18px_50px_rgba(8,13,43,0.16)] sm:px-8 sm:py-8">
        <div className="pointer-events-none absolute -right-16 -top-28 -z-10 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 right-1/3 -z-10 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-100">
              <Sparkles size={13} /> Personal workspace
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">My attendance</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
              A clear view of your attendance, time off and working-day history — all in one place.
            </p>
            {data?.employee ? (
              <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                <span className="font-semibold text-white">{data.employee.fullName}</span>
                {data.employee.email ? <span className="text-slate-300">{data.employee.email}</span> : null}
                {data.employee.joiningDate ? (
                  <span className="inline-flex items-center gap-1.5 text-slate-300">
                    <BriefcaseBusiness size={14} /> Joined {data.employee.joiningDate}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Selected period</p>
              <p className="mt-1 text-lg font-bold">{MONTHS[month - 1]} {year}</p>
            </div>
            <button
              type="button"
              onClick={() => getMonthlyAttendance(true)}
              disabled={isRefreshing}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.08] px-4 text-sm font-semibold text-white transition hover:bg-white/[0.14] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw size={15} className={isRefreshing ? "animate-spin" : ""} />
              {isRefreshing ? "Refreshing" : "Refresh"}
            </button>
          </div>
        </div>
      </section>

      {/* Period controls */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_3px_14px_rgba(15,23,42,0.025)] sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700"><CalendarDays size={20} /></div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Attendance calendar</p>
              <h2 className="mt-0.5 text-lg font-bold tracking-tight text-slate-900">{MONTHS[month - 1]} {year}</h2>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={handlePreviousMonth} aria-label="Previous month" className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"><ChevronLeft size={18} /></button>
            <label className="sr-only" htmlFor="attendance-month">Month</label>
            <select id="attendance-month" value={month} onChange={(event) => setMonth(Number(event.target.value))} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100">
              {MONTHS.map((monthName, index) => <option key={monthName} value={index + 1}>{monthName}</option>)}
            </select>
            <label className="sr-only" htmlFor="attendance-year">Year</label>
            <select id="attendance-year" value={year} onChange={(event) => setYear(Number(event.target.value))} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100">
              {yearOptions.map((yearValue) => <option key={yearValue} value={yearValue}>{yearValue}</option>)}
            </select>
            <button type="button" onClick={handleCurrentMonth} disabled={isCurrentMonth} className="h-10 rounded-xl bg-[#080D2B] px-4 text-sm font-semibold text-white transition hover:bg-indigo-950 disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-400">Current month</button>
            <button type="button" onClick={handleNextMonth} aria-label="Next month" className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"><ChevronRight size={18} /></button>
          </div>
        </div>
      </section>

      {error ? (
        <section className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-rose-600 ring-1 ring-rose-100"><CalendarX2 size={19} /></div>
            <div><p className="text-sm font-bold text-rose-900">We couldn't load attendance</p><p className="mt-1 text-sm text-rose-700">{error}</p></div>
          </div>
          <Button variant="outline" onClick={() => getMonthlyAttendance(true)} disabled={isRefreshing}>{isRefreshing ? "Trying again…" : "Try again"}</Button>
        </section>
      ) : null}

      {/* Attendance statistics */}
      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-bold tracking-tight text-slate-900">Your month at a glance</h2>
            <p className="mt-1 text-sm text-slate-500">Attendance totals through today. Future dates are excluded.</p>
          </div>
          <span className="hidden rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 sm:inline-flex">{MONTHS[month - 1]} {year}</span>
        </div>
        <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
          {STAT_CARDS.map((stat) => <StatCard key={stat.key} stat={stat} value={summary[stat.key]} />)}
        </div>
      </section>

      {/* Calendar and legend */}
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_3px_14px_rgba(15,23,42,0.025)]">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div><h2 className="text-base font-bold text-slate-900">Attendance timeline</h2><p className="mt-1 text-sm text-slate-500">Review recorded attendance day by day.</p></div>
          <div className="flex flex-wrap gap-x-3 gap-y-2">
            {[
              ["bg-emerald-500", "Present"], ["bg-rose-500", "Absent"], ["bg-amber-400", "Half day"],
              ["bg-teal-500", "Leave"], ["bg-blue-500", "Holiday"], ["bg-slate-400", "Weekend"],
            ].map(([color, label]) => (
              <span key={label} className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500"><span className={`h-2 w-2 rounded-full ${color}`} />{label}</span>
            ))}
          </div>
        </div>
        <div className="p-3 sm:p-5"><AttendanceCalendar month={month} year={year} data={data} daysByDate={daysByDate} /></div>
      </section>

      {/* Monthly roll-up */}
      {monthlySummary ? (
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_3px_14px_rgba(15,23,42,0.025)] sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700"><TrendingUp size={14} /> Monthly breakdown</div>
              <h2 className="mt-3 text-lg font-bold tracking-tight text-slate-900">Attendance summary</h2>
              <p className="mt-1 text-sm text-slate-500">A roll-up of recorded working and leave units for this period.</p>
            </div>
            <div className="min-w-[190px] rounded-2xl bg-[#080D2B] p-4 text-white">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-indigo-200">Present units / working days</p>
              <div className="mt-2 flex items-baseline gap-1"><span className="text-3xl font-bold tracking-tight">{presentUnits}</span><span className="text-sm text-slate-400">/ {workingDays}</span></div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${attendanceRate}%` }} /></div>
              <p className="mt-2 text-xs text-slate-300">{attendanceRate}% of working days</p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryMetric label="Total calendar days" value={monthlySummary.totalDays} icon={CalendarDays} />
            <SummaryMetric label="Working days" value={monthlySummary.workingDays} icon={BriefcaseBusiness} />
            <SummaryMetric label="Present units" value={monthlySummary.presentUnits} icon={CircleCheck} accent="text-emerald-700" />
            <SummaryMetric label="Absent units" value={monthlySummary.absentUnits} icon={CircleX} accent="text-rose-700" />
            <SummaryMetric label="Paid leave units" value={monthlySummary.paidLeaveUnits} icon={CalendarCheck2} accent="text-teal-700" />
            <SummaryMetric label="Unpaid leave units" value={monthlySummary.unpaidLeaveUnits} icon={CalendarX2} accent="text-orange-700" />
            <SummaryMetric label="Paid holiday units" value={monthlySummary.paidHolidayUnits} icon={Sun} accent="text-blue-700" />
            <SummaryMetric label="Weekend days" value={monthlySummary.weekendDays} icon={Coffee} />
          </div>
        </section>
      ) : null}

      <p className="flex items-center justify-center gap-2 px-3 text-center text-xs text-slate-400"><CalendarClock size={14} />Attendance records are shown as returned by your company system. Future dates are excluded from the totals.</p>
    </div>
  );
}

export default AttendanceByUser;
