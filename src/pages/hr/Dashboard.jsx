import Badge from "../../components/common/Badge";

const KPIS = [
  ["Total Employees", "25"],
  ["Present Today", "21"],
  ["On Leave", "2"],
  ["Pending Onboarding", "2"],
  ["Interns / Probation", "7"],
];

function Dashboard() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-cm-text">HR Dashboard</h1>
        <p className="mt-1 text-sm text-cm-text-muted">
          Employee, attendance, leave, payroll and people overview.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {KPIS.map(([label, value]) => (
          <div
            key={label}
            className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm"
          >
            <p className="text-xs text-cm-text-muted">{label}</p>
            <p className="mt-2 text-2xl font-bold text-cm-text">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-cm-text">
            Today's Attendance
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone="success">Present 21</Badge>
            <Badge tone="warning">On Leave 2</Badge>
            <Badge tone="neutral">Absent 2</Badge>
          </div>
        </section>

        <section className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-cm-text">HR Actions</h2>
          <ul className="mt-4 space-y-2 text-sm text-cm-text-muted">
            <li>2 employees are awaiting onboarding completion.</li>
            <li>2 leave requests need review.</li>
            <li>1 salary increment has an upcoming effective date.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
