
import { useState } from "react";
import AttendanceToday from "./AttendanceToday";
import AttendanceHistory from "./AttendanceHistory";

function Attendance() {
  const [activeTab, setActiveTab] = useState("today");

  return (
    <div className="flex flex-col gap-6">
      {/* PAGE HEADER */}
      <header className="relative overflow-hidden rounded-[28px] border border-slate-800 bg-gradient-to-br from-[#080d25] via-[#0b1734] to-[#1b2052] px-6 py-7 shadow-[0_18px_45px_rgba(15,23,42,0.16)] sm:px-8 sm:py-8">
        {/* Decorative Background */}
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-8 -top-16 h-48 w-48 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 bg-blue-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div className="min-w-0">
            <span className="inline-flex items-center rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-200">
              HUMAN RESOURCES
            </span>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-[34px]">
              Attendance
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Manage employee attendance, daily check-ins, and historical
              attendance records.
            </p>
          </div>

          <div className="relative z-10 flex shrink-0 flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3.5 py-2 text-xs font-medium text-slate-200">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Attendance Workspace
            </span>

            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.06] px-3.5 py-2 text-xs font-medium text-slate-200">
              Today &amp; History
            </span>
          </div>
        </div>
      </header>

      {/* ATTENDANCE TABS */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-cm-text">
            Attendance Overview
          </h2>

          <p className="mt-1 text-sm text-cm-text-muted">
            Switch between today's attendance and historical records.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Attendance views"
          className="inline-flex w-full rounded-xl border border-cm-border bg-cm-card p-1.5 shadow-sm sm:w-auto"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "today"}
            onClick={() => setActiveTab("today")}
            className={`flex-1 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all duration-200 sm:flex-none ${
              activeTab === "today"
                ? "bg-[#0b1833] text-white shadow-sm"
                : "text-cm-text-muted hover:bg-cm-hover hover:text-cm-text"
            }`}
          >
            Today
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "history"}
            onClick={() => setActiveTab("history")}
            className={`flex-1 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all duration-200 sm:flex-none ${
              activeTab === "history"
                ? "bg-[#0b1833] text-white shadow-sm"
                : "text-cm-text-muted hover:bg-cm-hover hover:text-cm-text"
            }`}
          >
            History
          </button>
        </div>
      </div>

      {/* TAB CONTENT */}
      <div className="min-w-0">
        {activeTab === "today" ? (
          <AttendanceToday />
        ) : (
          <AttendanceHistory />
        )}
      </div>
    </div>
  );
}

export default Attendance;
