/**
 * Reusable KPI stat card used across dashboards (Total Employees,
 * Active Projects, etc.) so cards stay visually consistent instead of
 * each dashboard hand-rolling its own card markup.
 *
 * trend: { direction: "up" | "down", label: string } — optional.
 */
function StatCard({ label, value, icon, trend, accent = "blue" }) {
  const ACCENTS = {
    blue: "bg-cm-blue-50 text-cm-blue-700",
    success: "bg-cm-success-100 text-cm-success-600",
    warning: "bg-cm-warning-100 text-cm-warning-600",
    purple: "bg-cm-purple-100 text-cm-purple-500",
  };

  return (
    <div className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-cm-text-muted">{label}</p>
          <p className="mt-2 text-2xl font-bold text-cm-text">{value}</p>
        </div>
        {icon && (
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-cm-md ${ACCENTS[accent]}`}>
            <span className="h-5 w-5">{icon}</span>
          </span>
        )}
      </div>

      {trend && (
        <p
          className={[
            "mt-3 flex items-center gap-1 text-xs font-medium",
            trend.direction === "up" ? "text-cm-success-600" : "text-cm-danger-600",
          ].join(" ")}
        >
          <span aria-hidden="true">{trend.direction === "up" ? "↑" : "↓"}</span>
          {trend.label}
        </p>
      )}
    </div>
  );
}

export default StatCard;