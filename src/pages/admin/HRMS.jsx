import { useMemo, useState } from "react";
import StatCard from "../../components/cards/StatCard";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import DataTable from "../../components/tables/DataTable";
import TableSearch from "../../components/tables/TableSearch";

const EMPLOYEES = [
  {
    id: "EMP-001",
    name: "Aarav Shah",
    role: "Developer",
    department: "Engineering",
    status: "Active",
    type: "Full Time",
  },
  {
    id: "EMP-002",
    name: "Mira Patel",
    role: "Tester",
    department: "QA",
    status: "Active",
    type: "Full Time",
  },
  {
    id: "EMP-003",
    name: "Rohan Mehta",
    role: "Project Lead",
    department: "Delivery",
    status: "Active",
    type: "Full Time",
  },
  {
    id: "EMP-004",
    name: "Neha Joshi",
    role: "Developer",
    department: "Engineering",
    status: "On Leave",
    type: "Full Time",
  },
];

const ATTENDANCE = [
  { label: "Present Today", value: "18" },
  { label: "On Leave", value: "2" },
  { label: "Interns", value: "3" },
  { label: "Probation", value: "4" },
];

const STATUS_TONE = {
  Active: "success",
  "On Leave": "warning",
};

function HRMS() {
  const [search, setSearch] = useState("");
  const [activeSection, setActiveSection] = useState("overview");

  const filteredEmployees = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return EMPLOYEES;
    return EMPLOYEES.filter(
      (employee) =>
        employee.name.toLowerCase().includes(query) ||
        employee.role.toLowerCase().includes(query) ||
        employee.department.toLowerCase().includes(query),
    );
  }, [search]);

  const columns = [
    { key: "id", header: "Employee ID" },
    { key: "name", header: "Employee" },
    { key: "role", header: "Role" },
    { key: "department", header: "Department" },
    { key: "type", header: "Type" },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <Badge tone={STATUS_TONE[row.status] ?? "neutral"}>{row.status}</Badge>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-cm-text">HRMS</h1>
        <p className="mt-1 text-sm text-cm-text-muted">
          Company-wide employee, attendance, leave, payroll and people
          administration.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ATTENDANCE.map((item) => (
          <StatCard key={item.label} label={item.label} value={item.value} />
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          ["overview", "Overview"],
          ["employees", "Employees"],
          ["attendance", "Attendance"],
          ["leave", "Leave & LOP"],
          ["payroll", "Payroll"],
          ["internship", "Internship / Probation"],
          ["hierarchy", "Employee Hierarchy"],
          ["sops", "SOPs"],
        ].map(([value, label]) => (
          <Button
            key={value}
            size="sm"
            variant={activeSection === value ? "primary" : "outline"}
            onClick={() => setActiveSection(value)}
          >
            {label}
          </Button>
        ))}
      </div>

      {activeSection === "overview" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-cm-text">
              Attendance & Leave
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {ATTENDANCE.map((item) => (
                <div
                  key={item.label}
                  className="rounded-lg border border-cm-border p-4"
                >
                  <p className="text-xs text-cm-text-muted">{item.label}</p>
                  <p className="mt-1 text-lg font-semibold text-cm-text">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-cm-text">
              Payroll & People
            </h2>
            <div className="mt-4 space-y-3 text-sm text-cm-text-muted">
              <p>Payroll is based on attendance and LOP records.</p>
              <p>Salary increments use an effective date.</p>
              <p>Bonuses and intern stipends can be tracked here.</p>
            </div>
          </section>
        </div>
      )}

      {activeSection === "employees" && (
        <section className="flex flex-col gap-4">
          <TableSearch
            value={search}
            onChange={setSearch}
            placeholder="Search employee, role, department…"
          />
          <DataTable
            columns={columns}
            rows={filteredEmployees}
            emptyMessage="No employees match your search."
          />
        </section>
      )}

      {activeSection !== "overview" && activeSection !== "employees" && (
        <section className="rounded-cm-lg border border-cm-border bg-cm-card p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-cm-text">
            {activeSection === "attendance" && "Attendance"}
            {activeSection === "leave" && "Leave & LOP"}
            {activeSection === "payroll" && "Payroll"}
            {activeSection === "internship" && "Internship / Probation"}
            {activeSection === "hierarchy" && "Employee Hierarchy"}
            {activeSection === "sops" && "SOPs"}
          </h2>
          <p className="mt-2 text-sm text-cm-text-muted">
            This admin view is prepared from the BRD structure. Connect the
            corresponding HRMS APIs when the backend is available.
          </p>
        </section>
      )}
    </div>
  );
}

export default HRMS;
