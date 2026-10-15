import { useState } from "react";

import AttendanceToday from "./AttendanceToday";
import AttendanceHistory from "./AttendanceHistory";

function Attendance() {
  const [activeTab, setActiveTab] = useState("today");

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-cm-text">Attendance</h1>

        <p className="mt-1 text-sm text-cm-text-muted">
          Manage employee attendance and attendance history.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex w-fit rounded-cm-lg border border-cm-border bg-cm-card p-1 shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab("today")}
          className={`rounded-cm-md px-5 py-2 text-sm font-medium transition ${
            activeTab === "today"
              ? "bg-[#000052] text-white"
              : "text-cm-text-muted hover:bg-cm-bg"
          }`}
        >
          Today
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={`rounded-cm-md px-5 py-2 text-sm font-medium transition ${
            activeTab === "history"
              ? "bg-[#000052] text-white"
              : "text-cm-text-muted hover:bg-cm-bg"
          }`}
        >
          History
        </button>
      </div>

      {activeTab === "today" ? <AttendanceToday /> : <AttendanceHistory />}
    </div>
  );
}

export default Attendance;
