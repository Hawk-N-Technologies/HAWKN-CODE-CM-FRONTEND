import { useMemo, useState } from "react";
import Button from "../../components/common/Button";
import Badge from "../../components/common/Badge";
import Avatar from "../../components/common/Avatar";
import DataTable from "../../components/tables/DataTable";
import TableSearch from "../../components/tables/TableSearch";
import TablePagination from "../../components/tables/TablePagination";
import EmployeeForm from "../../components/forms/EmployeeForm";
import { showToast } from "../../components/common/Toast";
import { MOCK_EMPLOYEES } from "../../data/employees";

const PAGE_SIZE = 5;

const STATUS_TONE = {
  Active: "success",
  "On Leave": "warning",
  Exited: "danger",
};

/**
 * Admin -> People Management. Company-wide employee directory
 * (view/add/edit/deactivate). HR's own Employees page will manage the
 * same records with HR-specific actions (payroll, leave, etc.) layered
 * on top — the base CRUD here is meant to be reused, not duplicated.
 */
function PeopleManagement() {
  const [employees, setEmployees] = useState(MOCK_EMPLOYEES);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return employees;
    return employees.filter(
      (emp) =>
        emp.name.toLowerCase().includes(query) ||
        emp.email.toLowerCase().includes(query) ||
        emp.department.toLowerCase().includes(query)
    );
  }, [employees, search]);

  const paginated = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  const openAddForm = () => {
    setEditingEmployee(null);
    setIsFormOpen(true);
  };

  const openEditForm = (employee) => {
    setEditingEmployee(employee);
    setIsFormOpen(true);
    setPendingDeleteId(null);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingEmployee(null);
  };

  const handleSubmit = async (values) => {
    setIsSaving(true);
    try {
      // TODO: replace with a real API call once the backend exists.
      await new Promise((resolve) => setTimeout(resolve, 400));

      if (editingEmployee) {
        setEmployees((prev) =>
          prev.map((emp) => (emp.id === editingEmployee.id ? { ...emp, ...values } : emp))
        );
        showToast.success("Employee updated.");
      } else {
        setEmployees((prev) => [{ id: crypto.randomUUID(), ...values }, ...prev]);
        showToast.success("Employee added.");
        setPage(1);
      }
      closeForm();
    } catch {
      showToast.error("Couldn't save the employee. Try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (id) => {
    if (pendingDeleteId === id) {
      setEmployees((prev) => prev.filter((emp) => emp.id !== id));
      setPendingDeleteId(null);
      showToast.info("Employee removed.");
    } else {
      setPendingDeleteId(id);
    }
  };

  const columns = [
    {
      key: "name",
      header: "Employee",
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.name} size="sm" />
          <div>
            <p className="font-medium text-cm-text">{row.name}</p>
            <p className="text-xs text-cm-text-muted">{row.email}</p>
          </div>
        </div>
      ),
    },
    { key: "designation", header: "Designation" },
    { key: "department", header: "Department" },
    { key: "employmentType", header: "Type" },
    { key: "joinDate", header: "Joined" },
    {
      key: "status",
      header: "Status",
      render: (row) => <Badge tone={STATUS_TONE[row.status] ?? "neutral"}>{row.status}</Badge>,
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={() => openEditForm(row)}>
            Edit
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleDeleteClick(row.id)}>
            {pendingDeleteId === row.id ? "Confirm?" : "Remove"}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-cm-text">People Management</h1>
          <p className="mt-1 text-sm text-cm-text-muted">
            Company-wide employee directory.
          </p>
        </div>
        {!isFormOpen && <Button onClick={openAddForm}>Add Employee</Button>}
      </div>

      {isFormOpen && (
        <EmployeeForm
          initialValues={editingEmployee}
          onSubmit={handleSubmit}
          onCancel={closeForm}
          isSaving={isSaving}
        />
      )}

      <div className="flex flex-col gap-4">
        <TableSearch
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Search by name, email, department…"
        />

        <DataTable
          columns={columns}
          rows={paginated}
          emptyMessage="No employees match your search."
        />

        <TablePagination
          page={page}
          pageSize={PAGE_SIZE}
          total={filtered.length}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}

export default PeopleManagement;