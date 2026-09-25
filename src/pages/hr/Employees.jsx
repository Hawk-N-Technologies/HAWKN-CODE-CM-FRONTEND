import { useMemo, useState } from "react";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import DataTable from "../../components/tables/DataTable";
import TableSearch from "../../components/tables/TableSearch";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import { showToast } from "../../components/common/Toast";

const INITIAL_EMPLOYEES = [
  {
    id: "EMP-001",
    name: "Aarav Shah",
    photo: "",
    phone1: "+91 90000 00001",
    phone2: "",
    whatsapp: "+91 90000 00001",
    email: "aarav@example.com",
    companyEmail: "aarav@company.example",
    joiningDate: "2025-04-10",
    dob: "1998-06-12",
    linkedin: "",
    github: "",
    aadhaar: "•••• •••• 1001",
    role: "Developer",
    status: "Active",
    type: "Full Time",
  },
  {
    id: "EMP-002",
    name: "Mira Patel",
    photo: "",
    phone1: "+91 90000 00002",
    phone2: "",
    whatsapp: "+91 90000 00002",
    email: "mira@example.com",
    companyEmail: "mira@company.example",
    joiningDate: "2024-11-04",
    dob: "1997-03-19",
    linkedin: "",
    github: "",
    aadhaar: "•••• •••• 1002",
    role: "Tester",
    status: "Active",
    type: "Full Time",
  },
  {
    id: "EMP-003",
    name: "Rohan Mehta",
    photo: "",
    phone1: "+91 90000 00003",
    phone2: "",
    whatsapp: "+91 90000 00003",
    email: "rohan@example.com",
    companyEmail: "rohan@company.example",
    joiningDate: "2023-08-21",
    dob: "1995-09-02",
    linkedin: "",
    github: "",
    aadhaar: "•••• •••• 1003",
    role: "Project Lead",
    status: "Active",
    type: "Full Time",
  },
  {
    id: "EMP-004",
    name: "Neha Joshi",
    photo: "",
    phone1: "+91 90000 00004",
    phone2: "",
    whatsapp: "+91 90000 00004",
    email: "neha@example.com",
    companyEmail: "neha@company.example",
    joiningDate: "2026-01-15",
    dob: "2000-01-25",
    linkedin: "",
    github: "",
    aadhaar: "•••• •••• 1004",
    role: "Developer",
    status: "On Leave",
    type: "Full Time",
  },
];

const EMPTY_FORM = {
  name: "",
  phone1: "",
  phone2: "",
  whatsapp: "",
  email: "",
  companyEmail: "",
  joiningDate: "",
  dob: "",
  linkedin: "",
  github: "",
  aadhaar: "",
  role: "Developer",
  status: "Active",
  type: "Full Time",
};

const STATUS_TONE = {
  Active: "success",
  "On Leave": "warning",
  Exited: "danger",
};

function Employees() {
  const [employees, setEmployees] = useState(INITIAL_EMPLOYEES);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return employees;
    return employees.filter(
      (employee) =>
        employee.name.toLowerCase().includes(query) ||
        employee.email.toLowerCase().includes(query) ||
        employee.role.toLowerCase().includes(query) ||
        employee.type.toLowerCase().includes(query),
    );
  }, [employees, search]);

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setSelected(null);
    setIsFormOpen(true);
  };

  const openEdit = (employee) => {
    setForm(employee);
    setSelected(null);
    setIsFormOpen(true);
  };

  const save = (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      showToast.error("Name and email are required.");
      return;
    }

    const existing = employees.find((employee) => employee.id === form.id);
    if (existing) {
      setEmployees((prev) =>
        prev.map((employee) => (employee.id === form.id ? form : employee)),
      );
      showToast.success("Employee updated.");
    } else {
      setEmployees((prev) => [
        { ...form, id: `EMP-${String(prev.length + 1).padStart(3, "0")}` },
        ...prev,
      ]);
      showToast.success("Employee added.");
    }
    setIsFormOpen(false);
  };

  const columns = [
    { key: "id", header: "ID" },
    { key: "name", header: "Employee" },
    { key: "role", header: "Role" },
    { key: "type", header: "Type" },
    { key: "joiningDate", header: "Joined" },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <Badge tone={STATUS_TONE[row.status] ?? "neutral"}>{row.status}</Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={() => setSelected(row)}>
            Profile
          </Button>
          <Button size="sm" variant="outline" onClick={() => openEdit(row)}>
            Edit
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-cm-text">Employees</h1>
          <p className="mt-1 text-sm text-cm-text-muted">
            All employees, active employees, interns, probation and employee
            profiles.
          </p>
        </div>
        <Button onClick={openAdd}>Add Employee</Button>
      </div>

      {isFormOpen && (
        <form
          onSubmit={save}
          className="flex flex-col gap-4 rounded-cm-lg border border-cm-border bg-cm-card p-6 shadow-sm"
        >
          <h2 className="text-sm font-semibold text-cm-text">
            {form.id ? "Edit Employee" : "Add Employee"}
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              label="Email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Input
              label="Phone 1"
              value={form.phone1}
              onChange={(e) => setForm({ ...form, phone1: e.target.value })}
            />
            <Input
              label="Phone 2"
              value={form.phone2}
              onChange={(e) => setForm({ ...form, phone2: e.target.value })}
            />
            <Input
              label="WhatsApp"
              value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
            />
            <Input
              label="Company Email"
              value={form.companyEmail}
              onChange={(e) =>
                setForm({ ...form, companyEmail: e.target.value })
              }
            />
            <Input
              label="Date of Joining"
              type="date"
              value={form.joiningDate}
              onChange={(e) =>
                setForm({ ...form, joiningDate: e.target.value })
              }
            />
            <Input
              label="Date of Birth"
              type="date"
              value={form.dob}
              onChange={(e) => setForm({ ...form, dob: e.target.value })}
            />
            <Input
              label="LinkedIn"
              value={form.linkedin}
              onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
            />
            <Input
              label="GitHub"
              value={form.github}
              onChange={(e) => setForm({ ...form, github: e.target.value })}
            />
            <Input
              label="Aadhaar Details"
              value={form.aadhaar}
              onChange={(e) => setForm({ ...form, aadhaar: e.target.value })}
            />
            <Select
              label="Assigned Role"
              value={form.role}
              options={["Developer", "Tester", "Project Lead", "HR", "BD"].map(
                (v) => ({ value: v, label: v }),
              )}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            />
            <Select
              label="Employment Type"
              value={form.type}
              options={["Full Time", "Intern", "Probation"].map((v) => ({
                value: v,
                label: v,
              }))}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            />
            <Select
              label="Status"
              value={form.status}
              options={["Active", "On Leave", "Exited"].map((v) => ({
                value: v,
                label: v,
              }))}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-3 border-t border-cm-border pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsFormOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {form.id ? "Save Changes" : "Add Employee"}
            </Button>
          </div>
        </form>
      )}

      {selected && (
        <section className="rounded-cm-lg border border-cm-border bg-cm-card p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs text-cm-text-muted">{selected.id}</p>
              <h2 className="mt-1 text-lg font-semibold text-cm-text">
                {selected.name}
              </h2>
              <p className="mt-1 text-sm text-cm-text-muted">
                {selected.role} · {selected.type}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelected(null)}
            >
              Close
            </Button>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["Phone 1", selected.phone1],
              ["Phone 2", selected.phone2 || "—"],
              ["WhatsApp", selected.whatsapp],
              ["Email", selected.email],
              ["Company Email", selected.companyEmail],
              ["Date of Joining", selected.joiningDate],
              ["Date of Birth", selected.dob],
              ["LinkedIn", selected.linkedin || "—"],
              ["GitHub", selected.github || "—"],
              ["Aadhaar", selected.aadhaar || "—"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-lg border border-cm-border p-4"
              >
                <p className="text-xs text-cm-text-muted">{label}</p>
                <p className="mt-1 text-sm font-medium text-cm-text">{value}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="flex flex-col gap-4">
        <TableSearch
          value={search}
          onChange={setSearch}
          placeholder="Search employees, role, type…"
        />
        <DataTable
          columns={columns}
          rows={filtered}
          emptyMessage="No employees found."
        />
      </div>
    </div>
  );
}

export default Employees;
