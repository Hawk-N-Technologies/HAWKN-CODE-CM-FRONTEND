import { useState } from "react";
import AttendanceToday from "./AttendanceToday";
import AttendanceHistory from "./AttendanceHistory";

function Attendance() {
  const [activeTab, setActiveTab] = useState("today");

  return (
    <div className="flex flex-col gap-6">
      {/* Attendance Header */}
      <div className="relative isolate overflow-hidden rounded-[24px] border border-slate-200 bg-gradient-to-br from-white via-white to-blue-50/70 px-6 py-6 shadow-sm sm:px-8">
        {/* Decorative circles */}
        <div className="pointer-events-none absolute -right-16 -top-32 h-80 w-80 rounded-full border-2 border-blue-100/80" />
        <div className="pointer-events-none absolute -right-5 -top-24 h-56 w-56 rounded-full border-2 border-blue-100/80" />

        <div className="relative z-10 flex items-center gap-5">
          {/* HR Icon */}
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] bg-[#0b1833] text-xl font-bold text-white shadow-md">
            HR
          </div>

          {/* Header Content */}
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-700 sm:text-sm">
              People Operations
            </p>

            <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Attendance
            </h1>

            <p className="mt-2 text-sm text-slate-500 sm:text-base">
              Manage employee attendance, daily check-ins, and historical
              attendance records.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-sm font-medium text-slate-500">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Attendance workspace
              </span>

              <span className="inline-flex items-center rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-sm font-medium text-slate-500">
                Today &amp; History
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Tabs */}
      <div className="flex w-fit rounded-xl border border-cm-border bg-cm-card p-1.5 shadow-sm">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "today"}
          onClick={() => setActiveTab("today")}
          className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
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
          className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
            activeTab === "history"
              ? "bg-[#0b1833] text-white shadow-sm"
              : "text-cm-text-muted hover:bg-cm-hover hover:text-cm-text"
          }`}
        >
          History
        </button>
      </div>

      {/* Tab Content */}
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