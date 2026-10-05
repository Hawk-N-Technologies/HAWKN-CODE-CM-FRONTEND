import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";

import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import DataTable from "../../components/tables/DataTable";
import TableSearch from "../../components/tables/TableSearch";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import { showToast } from "../../components/common/Toast";

const EMPTY_FORM = {
  id: null,
  uuid: null,

  firstName: "",
  lastName: "",

  email: "",
  companyEmail: "",

  password: "",
  confirmPassword: "",

  phone1: "",
  phone2: "",
  whatsapp: "",

  joiningDate: "",
  dob: "",

  linkedin: "",
  github: "",

  aadhaar: "",

  role: "",
  status: "Active",
  type: "Full Time",
};

const STATUS_TONE = {
  Active: "success",
  "On Leave": "warning",
  Exited: "danger",
};

const EMPLOYMENT_TYPES = ["Full Time", "Intern", "Probation"];

const EMPLOYMENT_STATUSES = ["Active", "On Leave", "Exited"];

/**
 * Convert API employee -> UI employee
 *
 * Adjust only this function if your backend response
 * uses slightly different property names.
 */
const mapEmployeeFromApi = (employee) => {
  const user = employee.user || {};

  const firstName = user.firstName || employee.firstName || "";
  const lastName = user.lastName || employee.lastName || "";

  return {
    ...employee,

    id: employee.id,
    uuid: employee.uuid,

    firstName,
    lastName,

    name:
      employee.name ||
      `${firstName} ${lastName}`.trim() ||
      employee.email ||
      "Unnamed Employee",

    email: user.email || employee.email || "",

    companyEmail: employee.companyEmail || user.companyEmail || "",

    phone1: employee.phone1 || "",
    phone2: employee.phone2 || "",
    whatsapp: employee.whatsapp || "",

    joiningDate: employee.joiningDate || "",
    dob: employee.dateOfBirth || employee.dob || "",

    linkedin: employee.linkedinUrl || employee.linkedin || "",
    github: employee.githubUrl || employee.github || "",

    aadhaar: employee.aadhaarLast4 || employee.aadhaar || "",

    role: employee.role?.uuid || employee.roleUuid || employee.role?.id || "",

    roleName: employee.role?.name || employee.roleName || "",

    status: employee.employmentStatus || employee.status || "Active",

    type: employee.employmentType || employee.type || "Full Time",
  };
};

function Employees() {
  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [rolesMap, setRolesMap] = useState({});

  const [search, setSearch] = useState("");

  const [selected, setSelected] = useState(null);

  const [isFormOpen, setIsFormOpen] = useState(false);

  const [form, setForm] = useState(EMPTY_FORM);

  const [errors, setErrors] = useState({});

  /**
   * Loading states
   */
  const [isEmployeesLoading, setIsEmployeesLoading] = useState(true);
  const [isRolesLoading, setIsRolesLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Combined initial loading.
   */
  const isInitialLoading = isEmployeesLoading || isRolesLoading;

  /**
   * -------------------------------------------------------
   * FETCH ROLES
   * -------------------------------------------------------
   */
  const getRoles = useCallback(async () => {
    setIsRolesLoading(true);

    try {
      const res = await axios.get("/api/employees/roles", {
        withCredentials: true,
      });

      const data = Array.isArray(res.data?.data) ? res.data.data : [];

      setRoles(data);

      const map = Object.fromEntries(data.map((role) => [role.uuid, role]));

      setRolesMap(map);
    } catch (error) {
      console.error("Get roles error:", error);

      setRoles([]);
      setRolesMap({});

      showToast.error(error.response?.data?.message || "Failed to load roles.");
    } finally {
      setIsRolesLoading(false);
    }
  }, []);

  /**
   * -------------------------------------------------------
   * FETCH EMPLOYEES
   * -------------------------------------------------------
   */
  const getEmployees = useCallback(async () => {
    setIsEmployeesLoading(true);

    try {
      const res = await axios.get("/api/employees", {
        withCredentials: true,
      });

      const data = Array.isArray(res.data?.data) ? res.data.data : [];

      const mappedEmployees = data.map(mapEmployeeFromApi);

      setEmployees(mappedEmployees);
    } catch (error) {
      console.error("Get employees error:", error);

      setEmployees([]);

      showToast.error(
        error.response?.data?.message || "Failed to load employees.",
      );
    } finally {
      setIsEmployeesLoading(false);
    }
  }, []);

  /**
   * -------------------------------------------------------
   * INITIAL DATA
   * -------------------------------------------------------
   */
  useEffect(() => {
    getRoles();
    getEmployees();
  }, [getRoles, getEmployees]);

  /**
   * -------------------------------------------------------
   * SEARCH
   * -------------------------------------------------------
   */
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return employees;
    }

    return employees.filter((employee) => {
      return (
        employee.name?.toLowerCase().includes(query) ||
        employee.email?.toLowerCase().includes(query) ||
        employee.roleName?.toLowerCase().includes(query) ||
        employee.type?.toLowerCase().includes(query) ||
        employee.status?.toLowerCase().includes(query)
      );
    });
  }, [employees, search]);

  /**
   * -------------------------------------------------------
   * VALIDATION
   * -------------------------------------------------------
   */
  const validateField = (name, value, currentForm) => {
    const formValue = value ?? "";

    switch (name) {
      case "firstName":
        if (!formValue.trim()) {
          return "First name is required.";
        }

        if (formValue.trim().length < 2) {
          return "First name must be at least 2 characters.";
        }

        if (!/^[a-zA-Z\s'-]+$/.test(formValue.trim())) {
          return "First name contains invalid characters.";
        }

        return "";

      case "lastName":
        if (!formValue.trim()) {
          return "Last name is required.";
        }

        if (formValue.trim().length < 2) {
          return "Last name must be at least 2 characters.";
        }

        if (!/^[a-zA-Z\s'-]+$/.test(formValue.trim())) {
          return "Last name contains invalid characters.";
        }

        return "";

      case "email":
        if (!formValue.trim()) {
          return "Email is required.";
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValue.trim())) {
          return "Enter a valid email address.";
        }

        return "";

      case "companyEmail":
        if (!formValue) {
          return "";
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValue.trim())) {
          return "Enter a valid company email address.";
        }

        return "";

      case "password":
        if (!currentForm.id && !formValue) {
          return "Password is required.";
        }

        if (formValue && formValue.length < 8) {
          return "Password must be at least 8 characters.";
        }

        return "";

      case "confirmPassword":
        if (!currentForm.id && !formValue) {
          return "Confirm password is required.";
        }

        if (formValue && formValue !== currentForm.password) {
          return "Passwords do not match.";
        }

        return "";

      case "phone1":
      case "phone2":
      case "whatsapp":
        if (!formValue) {
          return "";
        }

        if (!/^[6-9]\d{9}$/.test(formValue)) {
          return "Enter a valid 10-digit mobile number.";
        }

        return "";

      case "aadhaar":
        if (!formValue) {
          return "";
        }

        if (!/^\d{4}$/.test(formValue)) {
          return "Aadhaar must contain exactly 4 digits.";
        }

        return "";

      case "linkedin":
        if (!formValue) {
          return "";
        }

        if (!/^https?:\/\/(www\.)?linkedin\.com\/.+$/i.test(formValue.trim())) {
          return "Enter a valid LinkedIn URL.";
        }

        return "";

      case "github":
        if (!formValue) {
          return "";
        }

        if (!/^https?:\/\/(www\.)?github\.com\/.+$/i.test(formValue.trim())) {
          return "Enter a valid GitHub URL.";
        }

        return "";

      case "role":
        if (!formValue) {
          return "Please select a role.";
        }

        return "";

      case "type":
        if (!formValue) {
          return "Please select employment type.";
        }

        return "";

      case "status":
        if (!formValue) {
          return "Please select status.";
        }

        return "";

      default:
        return "";
    }
  };

  const validateEmployeeForm = (currentForm) => {
    const validationErrors = {};

    const fields = [
      "firstName",
      "lastName",
      "email",
      "companyEmail",
      "password",
      "confirmPassword",
      "phone1",
      "phone2",
      "whatsapp",
      "aadhaar",
      "linkedin",
      "github",
      "role",
      "type",
      "status",
    ];

    fields.forEach((field) => {
      const error = validateField(field, currentForm[field], currentForm);

      if (error) {
        validationErrors[field] = error;
      }
    });

    return validationErrors;
  };

  /**
   * -------------------------------------------------------
   * INPUT CHANGE
   * -------------------------------------------------------
   */
  const handleChange = (field) => (event) => {
    const value = event.target.value;

    const nextForm = {
      ...form,
      [field]: value,
    };
    console.log(nextForm);
    setForm(nextForm);

    const error = validateField(field, value, nextForm);

    setErrors((previousErrors) => {
      const nextErrors = {
        ...previousErrors,
      };

      if (error) {
        nextErrors[field] = error;
      } else {
        delete nextErrors[field];
      }

      /**
       * Password affects confirm password.
       */
      if (field === "password") {
        const confirmError = validateField(
          "confirmPassword",
          nextForm.confirmPassword,
          nextForm,
        );

        if (confirmError) {
          nextErrors.confirmPassword = confirmError;
        } else {
          delete nextErrors.confirmPassword;
        }
      }

      return nextErrors;
    });
  };

  /**
   * -------------------------------------------------------
   * OPEN ADD
   * -------------------------------------------------------
   */
  const openAdd = () => {
    if (isSubmitting) {
      return;
    }

    setForm({
      ...EMPTY_FORM,

      /**
       * Don't hardcode a role if roles have not loaded.
       */
      role: roles.length > 0 ? roles[0].uuid : "",

      status: "Active",
      type: "Full Time",
    });

    setErrors({});
    setSelected(null);
    setIsFormOpen(true);
  };

  /**
   * -------------------------------------------------------
   * OPEN EDIT
   * -------------------------------------------------------
   */
  const openEdit = (employee) => {
    if (isSubmitting) {
      return;
    }

    setForm({
      ...EMPTY_FORM,

      ...employee,

      id: employee.id,
      uuid: employee.uuid,

      password: "",
      confirmPassword: "",

      firstName: employee.firstName || "",
      lastName: employee.lastName || "",

      email: employee.email || "",
      companyEmail: employee.companyEmail || "",

      phone1: employee.phone1 || "",
      phone2: employee.phone2 || "",
      whatsapp: employee.whatsapp || "",

      joiningDate: employee.joiningDate || "",
      dob: employee.dob || "",

      linkedin: employee.linkedin || "",
      github: employee.github || "",

      aadhaar: employee.aadhaar || "",

      role: employee.user.role.uuid || "",
      type: employee.type || "Full Time",
      status: employee.status || "Active",
    });

    console.log(form.role);

    setErrors({});
    setSelected(null);
    setIsFormOpen(true);
  };

  /**
   * -------------------------------------------------------
   * CLOSE FORM
   * -------------------------------------------------------
   */
  const closeForm = () => {
    if (isSubmitting) {
      return;
    }

    setIsFormOpen(false);
    setErrors({});
    setForm(EMPTY_FORM);
  };

  /**
   * -------------------------------------------------------
   * SAVE
   * -------------------------------------------------------
   */
  const save = async (event) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    /**
     * Full validation.
     */
    const validationErrors = validateEmployeeForm(form);

    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      showToast.error("Please fix the validation errors.");
      return;
    }

    /**
     * Role must exist.
     */
    const selectedRole = rolesMap[form.role];

    if (!selectedRole) {
      setErrors((previous) => ({
        ...previous,
        role: "Invalid role selected.",
      }));

      showToast.error("Invalid role selected.");
      return;
    }

    /**
     * Build API payload.
     *
     * IMPORTANT:
     * Backend expects roleUuid, not roleId,
     * because frontend is using UUID.
     */
    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),

      email: form.email.trim(),

      companyEmail: form.companyEmail?.trim() || null,

      phone1: form.phone1 || null,
      phone2: form.phone2 || null,
      whatsapp: form.whatsapp || null,

      joiningDate: form.joiningDate || null,
      dateOfBirth: form.dob || null,

      linkedinUrl: form.linkedin?.trim() || null,
      githubUrl: form.github?.trim() || null,

      aadhaarLast4: form.aadhaar || null,

      roleUuid: form.role,

      employmentType: form.type,
      employmentStatus: form.status,
    };

    /**
     * Password:
     *
     * Create:
     *   send password + confirmPassword
     *
     * Update:
     *   send only when user entered a new password.
     */
    if (!form.id) {
      payload.password = form.password;
      payload.confirmPassword = form.confirmPassword;
    } else if (form.password || form.confirmPassword) {
      payload.password = form.password;
      payload.confirmPassword = form.confirmPassword;
    }

    setIsSubmitting(true);

    try {
      let res;

      if (form.id) {
        /**
         * Update
         */
        res = await axios.put(`/api/employees/${form.id}`, payload, {
          withCredentials: true,
        });

        showToast.success(
          res.data?.message || "Employee updated successfully.",
        );
      } else {
        /**
         * Create
         */
        res = await axios.post("/api/employees", payload, {
          withCredentials: true,
        });

        showToast.success(
          res.data?.message || "Employee created successfully.",
        );
      }

      /**
       * Refresh list from backend.
       */
      await getEmployees();

      /**
       * Close form only after successful request.
       */
      setIsFormOpen(false);
      setForm(EMPTY_FORM);
      setErrors({});
    } catch (error) {
      console.error("Save employee error:", error);

      const message =
        error.response?.data?.message || "Failed to save employee.";

      showToast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * -------------------------------------------------------
   * TABLE COLUMNS
   * -------------------------------------------------------
   */
  const columns = [
    {
      key: "id",
      header: "ID",
    },

    {
      key: "name",
      header: "Employee",
      render: (row) => (
        <div>
          <p className="font-medium text-cm-text">{row.name}</p>

          <p className="text-xs text-cm-text-muted">{row.email}</p>
        </div>
      ),
    },

    {
      key: "role",
      header: "Role",
      render: (row) => (
        <span>{row.user.role.name || rolesMap[row.role]?.name || "—"}</span>
      ),
    },

    {
      key: "type",
      header: "Type",
    },

    {
      key: "joiningDate",
      header: "Joined",
      render: (row) => row.joiningDate || "—",
    },

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
          <Button
            size="sm"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => setSelected(row)}
          >
            Profile
          </Button>

          <Button
            size="sm"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => openEdit(row)}
          >
            Edit
          </Button>
        </div>
      ),
    },
  ];

  /**
   * -------------------------------------------------------
   * INITIAL LOADING
   * -------------------------------------------------------
   */
  if (isInitialLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cm-border border-t-cm-primary" />

          <p className="text-sm text-cm-text-muted">Loading employees...</p>
        </div>
      </div>
    );
  }

  /**
   * -------------------------------------------------------
   * UI
   * -------------------------------------------------------
   */
  return (
    <div className="flex flex-col gap-6">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-cm-text">Employees</h1>

          <p className="mt-1 text-sm text-cm-text-muted">
            All employees, active employees, interns, probation and employee
            profiles.
          </p>
        </div>

        <Button onClick={openAdd} disabled={isSubmitting || isRolesLoading}>
          {isRolesLoading ? "Loading roles..." : "Add Employee"}
        </Button>
      </div>

      {/* FORM */}
      {isFormOpen && (
        <form
          onSubmit={save}
          className="flex flex-col gap-4 rounded-cm-lg border border-cm-border bg-cm-card p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-cm-text">
              {form.id ? "Edit Employee" : "Add Employee"}
            </h2>

            {isSubmitting && (
              <div className="flex items-center gap-2 text-xs text-cm-text-muted">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-cm-border border-t-cm-primary" />
                Saving...
              </div>
            )}
          </div>

          <fieldset disabled={isSubmitting} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* FIRST NAME */}
              <Input
                label="First Name"
                required
                value={form.firstName}
                error={errors.firstName}
                onChange={handleChange("firstName")}
              />

              {/* LAST NAME */}
              <Input
                label="Last Name"
                required
                value={form.lastName}
                error={errors.lastName}
                onChange={handleChange("lastName")}
              />

              {/* EMAIL */}
              <Input
                label="Email"
                type="email"
                required
                value={form.email}
                error={errors.email}
                onChange={handleChange("email")}
              />

              {/* COMPANY EMAIL */}
              <Input
                label="Company Email"
                type="email"
                value={form.companyEmail}
                error={errors.companyEmail}
                onChange={handleChange("companyEmail")}
              />

              {/* PASSWORD */}
              <Input
                label="Password"
                type="password"
                required={!form.id}
                value={form.password}
                error={errors.password}
                onChange={handleChange("password")}
              />

              {/* CONFIRM PASSWORD */}
              <Input
                label="Confirm Password"
                type="password"
                required={!form.id}
                value={form.confirmPassword}
                error={errors.confirmPassword}
                onChange={handleChange("confirmPassword")}
              />

              {/* PHONE */}
              <Input
                label="Phone 1"
                value={form.phone1}
                error={errors.phone1}
                onChange={handleChange("phone1")}
              />

              {/* PHONE 2 */}
              <Input
                label="Phone 2"
                value={form.phone2}
                error={errors.phone2}
                onChange={handleChange("phone2")}
              />

              {/* WHATSAPP */}
              <Input
                label="WhatsApp"
                value={form.whatsapp}
                error={errors.whatsapp}
                onChange={handleChange("whatsapp")}
              />

              {/* JOINING DATE */}
              <Input
                label="Date of Joining"
                type="date"
                value={form.joiningDate}
                error={errors.joiningDate}
                onChange={handleChange("joiningDate")}
              />

              {/* DOB */}
              <Input
                label="Date of Birth"
                type="date"
                value={form.dob}
                error={errors.dob}
                onChange={handleChange("dob")}
              />

              {/* LINKEDIN */}
              <Input
                label="LinkedIn"
                value={form.linkedin}
                error={errors.linkedin}
                onChange={handleChange("linkedin")}
              />

              {/* GITHUB */}
              <Input
                label="GitHub"
                value={form.github}
                error={errors.github}
                onChange={handleChange("github")}
              />

              {/* AADHAAR */}
              <Input
                label="Aadhaar Last 4"
                value={form.aadhaar}
                error={errors.aadhaar}
                maxLength={4}
                onChange={handleChange("aadhaar")}
              />

              {/* ROLE */}
              <Select
                label="Assigned Role"
                value={form.role}
                error={errors.role}
                disabled={isRolesLoading}
                options={roles.map((role) => ({
                  label: role.name,
                  value: role.uuid,
                }))}
                onChange={handleChange("role")}
              />

              {/* EMPLOYMENT TYPE */}
              <Select
                label="Employment Type"
                value={form.type}
                error={errors.type}
                options={EMPLOYMENT_TYPES.map((value) => ({
                  value,
                  label: value,
                }))}
                onChange={handleChange("type")}
              />

              {/* STATUS */}
              <Select
                label="Status"
                value={form.status}
                error={errors.status}
                options={EMPLOYMENT_STATUSES.map((value) => ({
                  value,
                  label: value,
                }))}
                onChange={handleChange("status")}
              />
            </div>
          </fieldset>

          {/* FORM ACTIONS */}
          <div className="flex justify-end gap-3 border-t border-cm-border pt-4">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={closeForm}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />

                  {form.id ? "Saving..." : "Creating..."}
                </span>
              ) : form.id ? (
                "Save Changes"
              ) : (
                "Add Employee"
              )}
            </Button>
          </div>
        </form>
      )}

      {/* PROFILE */}
      {selected && (
        <section className="rounded-cm-lg border border-cm-border bg-cm-card p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs text-cm-text-muted">{selected.id}</p>

              <h2 className="mt-1 text-lg font-semibold text-cm-text">
                {selected.name}
              </h2>

              <p className="mt-1 text-sm text-cm-text-muted">
                {selected.roleName || rolesMap[selected.role]?.name || "—"} ·{" "}
                {selected.type}
              </p>
            </div>

            <Button
              size="sm"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => setSelected(null)}
            >
              Close
            </Button>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["First Name", selected.firstName],
              ["Last Name", selected.lastName],
              ["Phone 1", selected.phone1],
              ["Phone 2", selected.phone2 || "—"],
              ["WhatsApp", selected.whatsapp],
              ["Email", selected.email],
              ["Company Email", selected.companyEmail || "—"],
              ["Date of Joining", selected.joiningDate || "—"],
              ["Date of Birth", selected.dob || "—"],
              ["LinkedIn", selected.linkedin || "—"],
              ["GitHub", selected.github || "—"],
              ["Aadhaar", selected.aadhaar ? `•••• ${selected.aadhaar}` : "—"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-lg border border-cm-border p-4"
              >
                <p className="text-xs text-cm-text-muted">{label}</p>

                <p className="mt-1 text-sm font-medium text-cm-text">
                  {value || "—"}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SEARCH + TABLE */}
      <div className="flex flex-col gap-4">
        <TableSearch
          value={search}
          onChange={setSearch}
          placeholder="Search employees, role, type…"
        />

        {isEmployeesLoading ? (
          <div className="flex min-h-[250px] items-center justify-center rounded-cm-lg border border-cm-border bg-cm-card">
            <div className="flex flex-col items-center gap-3">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-cm-border border-t-cm-primary" />

              <p className="text-sm text-cm-text-muted">Loading employees...</p>
            </div>
          </div>
        ) : (
          <DataTable
            columns={columns}
            rows={filtered}
            emptyMessage={
              search ? "No employees match your search." : "No employees found."
            }
          />
        )}
      </div>
    </div>
  );
}

export default Employees;
