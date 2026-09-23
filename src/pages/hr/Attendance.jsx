import { useMemo, useState } from "react";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import DataTable from "../../components/tables/DataTable";
import TableSearch from "../../components/tables/TableSearch";
import { showToast } from "../../components/common/Toast";

const INITIAL = [
  {
    id: "ATT-001",
    employee: "Aarav Shah",
    date: "2026-09-23",
    login: "09:12",
    logout: "18:05",
    status: "Present",
  },
  {
    id: "ATT-002",
    employee: "Mira Patel",
    date: "2026-09-23",
    login: "09:04",
    logout: "18:11",
    status: "Present",
  },
  {
    id: "ATT-003",
    employee: "Neha Joshi",
    date: "2026-09-23",
    login: "—",
    logout: "—",
    status: "On Leave",
  },
];

function Attendance() {
  const [records, setRecords] = useState(INITIAL);
  const [search, setSearch] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return records;
    return records.filter(
      (row) =>
        row.employee.toLowerCase().includes(query) ||
        row.status.toLowerCase().includes(query),
    );
  }, [records, search]);

  const selfLogin = () => {
    setLoggedIn(true);
    showToast.success("Self login recorded.");
  };

  const selfLogout = () => {
    setLoggedIn(false);
    showToast.success("Self logout recorded.");
  };

  const columns = [
    { key: "employee", header: "Employee" },
    { key: "date", header: "Date" },
    { key: "login", header: "Login" },
    { key: "logout", header: "Logout" },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <Badge tone={row.status === "Present" ? "success" : "warning"}>
          {row.status}
        </Badge>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-cm-text">Attendance</h1>
          <p className="mt-1 text-sm text-cm-text-muted">
            Self login/logout, today's attendance, employee records and monthly
            attendance.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={selfLogin} disabled={loggedIn}>
            Self Login
          </Button>
          <Button variant="outline" onClick={selfLogout} disabled={!loggedIn}>
            Self Logout
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          [
            "Present Today",
            records.filter((r) => r.status === "Present").length,
          ],
          ["On Leave", records.filter((r) => r.status === "On Leave").length],
          ["Self Status", loggedIn ? "Logged In" : "Logged Out"],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm"
          >
            <p className="text-xs text-cm-text-muted">{label}</p>
            <p className="mt-2 text-lg font-semibold text-cm-text">{value}</p>
          </div>
        ))}
      </div>

      <section className="flex flex-col gap-4">
        <TableSearch
          value={search}
          onChange={setSearch}
          placeholder="Search employee or attendance status…"
        />
        <DataTable
          columns={columns}
          rows={filtered}
          emptyMessage="No attendance records."
        />
      </section>
    </div>
  );
}

export default Attendance;
