import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";

import Badge from "../../components/common/Badge";
import Avatar from "../../components/common/Avatar";
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

  password: "",
  confirmPassword: "",

  role: "",

  isActive: true,
};

const STATUS_TONE = {
  Active: "success",
  Inactive: "danger",
};

const ROLE_TABS = [
  { key: "all", label: "All members", aliases: [] },
  { key: "admin", label: "Admins", aliases: ["admin"] },
  {
    key: "bde",
    label: "BDEs",
    aliases: ["bde", "businessdevelopment", "businessdevelopmentexecutive"],
  },
  { key: "hr", label: "HR", aliases: ["hr", "humanresources"] },
  {
    key: "projectlead",
    label: "Project Leads",
    aliases: ["projectlead", "projectmanager"],
  },
  { key: "developer", label: "Developers", aliases: ["developer"] },
  { key: "tester", label: "Testers", aliases: ["tester", "qa"] },
  { key: "client", label: "Clients", aliases: ["client"] },
];

function normalizeRole(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function personMatchesRole(person, tab, rolesMap = {}) {
  if (tab.key === "all") return true;

  const role = normalizeRole(
    person.roleName || rolesMap[person.role]?.name,
  );

  return tab.aliases.some(
    (alias) => role === alias || role.includes(alias),
  );
}

function mapUserFromApi(user) {
  const roleRecord =
    user.role && typeof user.role === "object"
      ? user.role
      : Array.isArray(user.roles)
        ? user.roles[0]
        : null;

  const roleUuid =
    roleRecord?.uuid ||
    user.roleUuid ||
    user.roleId ||
    (typeof user.role === "string" ? user.role : "");

  const roleName =
    roleRecord?.name ||
    user.roleName ||
    (typeof user.role === "string" && !user.roleUuid ? user.role : "");

  return {
    ...user,

    id: user.id,
    uuid: user.uuid,

    firstName: user.firstName || "",
    lastName: user.lastName || "",

    name:
      `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
      user.email ||
      "Unnamed User",

    email: user.email || "",

    role: roleUuid,
    roleName,

    isActive: user.isActive ?? true,

    status: user.isActive ? "Active" : "Inactive",

    /**
     * Employee information is optional.
     *
     * A user can exist without an employee record.
     */
    employee: user.employee || null,
  };
}

function PeopleManagement() {
  const [people, setPeople] = useState([]);
  const [roles, setRoles] = useState([]);
  const [rolesMap, setRolesMap] = useState({});

  const [search, setSearch] = useState("");
  const [activeRole, setActiveRole] = useState("all");

  const [selected, setSelected] = useState(null);

  const [isFormOpen, setIsFormOpen] = useState(false);

  const [form, setForm] = useState(EMPTY_FORM);

  const [errors, setErrors] = useState({});

  const [isPeopleLoading, setIsPeopleLoading] = useState(true);
  const [isRolesLoading, setIsRolesLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef(null);
  const profileRef = useRef(null);

  const isInitialLoading = isPeopleLoading || isRolesLoading;

  const roleCounts = useMemo(
    () =>
      Object.fromEntries(
        ROLE_TABS.map((tab) => [
          tab.key,
          tab.key === "all"
            ? people.length
            : people.filter((person) =>
                personMatchesRole(person, tab, rolesMap),
              ).length,
        ]),
      ),
    [people, rolesMap],
  );

  /**
   * -------------------------------------------------------
   * GET ROLES
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
      console.log(map);

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
   * GET PEOPLE
   *
   * IMPORTANT:
   *
   * This endpoint should return ALL users for the
   * logged-in admin's company.
   *
   * It must NOT return only employees.
   *
   * User without employee:
   *   employee: null
   *
   * User with employee:
   *   employee: {...}
   * -------------------------------------------------------
   */
  const getPeople = useCallback(async () => {
    setIsPeopleLoading(true);

    try {
      const res = await axios.get("/api/employees/getPeople", {
        withCredentials: true,
      });

      const data = Array.isArray(res.data?.data) ? res.data.data : [];

      setPeople(data.map(mapUserFromApi));
    } catch (error) {
      console.error("Get people error:", error);

      setPeople([]);

      showToast.error(
        error.response?.data?.message || "Failed to load people.",
      );
    } finally {
      setIsPeopleLoading(false);
    }
  }, []);

  /**
   * -------------------------------------------------------
   * INITIAL DATA
   * -------------------------------------------------------
   */
  useEffect(() => {
    getRoles();
    getPeople();
  }, [getRoles, getPeople]);

  /**
   * -------------------------------------------------------
   * SEARCH
   * -------------------------------------------------------
   */
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const activeTab =
      ROLE_TABS.find((tab) => tab.key === activeRole) ?? ROLE_TABS[0];
    const roleFiltered = people.filter((person) =>
      personMatchesRole(person, activeTab, rolesMap),
    );

    if (!query) {
      return roleFiltered;
    }

    return roleFiltered.filter((person) => {
      return (
        person.name?.toLowerCase().includes(query) ||
        person.firstName?.toLowerCase().includes(query) ||
        person.lastName?.toLowerCase().includes(query) ||
        person.email?.toLowerCase().includes(query) ||
        person.roleName?.toLowerCase().includes(query)
      );
    });
  }, [activeRole, people, rolesMap, search]);

  useEffect(() => {
    const target = isFormOpen
      ? formRef.current
      : selected
        ? profileRef.current
        : null;

    if (target) {
      target.scrollIntoView({ block: "start" });
    }
  }, [isFormOpen, selected]);

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

      case "password":
        /**
         * Password required only while creating.
         */
        if (!currentForm.id && !formValue) {
          return "Password is required.";
        }

        if (formValue && formValue.length < 8) {
          return "Password must be at least 8 characters.";
        }

        return "";

      case "confirmPassword":
        /**
         * Confirm password required only while creating.
         */
        if (!currentForm.id && !formValue) {
          return "Confirm password is required.";
        }

        if (formValue && formValue !== currentForm.password) {
          return "Passwords do not match.";
        }

        return "";

      case "role":
        if (!formValue) {
          return "Please select a role.";
        }

        return "";

      default:
        return "";
    }
  };

  const validateForm = (currentForm) => {
    const validationErrors = {};

    const fields = [
      "firstName",
      "lastName",
      "email",
      "password",
      "confirmPassword",
      "role",
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
   * ACTIVE / INACTIVE CHANGE
   * -------------------------------------------------------
   */
  const handleStatusChange = (event) => {
    const value = event.target.value === "true";

    setForm((previous) => ({
      ...previous,
      isActive: value,
    }));
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
      role: roles.length > 0 ? roles[0].uuid : "",
      isActive: true,
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
  const openEdit = (person) => {
    if (isSubmitting) {
      return;
    }
    console.log(person);
    setForm({
      ...EMPTY_FORM,

      id: person.id,
      uuid: person.userUuid,

      firstName: person.firstName || "",
      lastName: person.lastName || "",

      email: person.email || "",

      password: "",
      confirmPassword: "",

      role: person.role || "",

      isActive: person.isActive ?? true,
    });

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
   * SAVE USER
   * -------------------------------------------------------
   */
  const save = async (event) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const validationErrors = validateForm(form);

    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      showToast.error("Please fix the validation errors.");
      return;
    }

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
     * Admin only sends user-related fields.
     *
     * No:
     * phone
     * DOB
     * joining date
     * Aadhaar
     * employment type
     * employment status
     * LinkedIn
     * GitHub
     */
    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),

      roleUuid: form.role,

      isActive: form.isActive,
    };

    /**
     * Password:
     *
     * CREATE:
     * password is required.
     *
     * UPDATE:
     * password is optional.
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
      console.log(form.uuid);
      if (form.uuid && form.id) {
        res = await axios.put(`/api/employees/people/${form.uuid}`, payload, {
          withCredentials: true,
        });

        showToast.success(res.data?.message || "User updated successfully.");
      } else {
        res = await axios.post("/api/employees/create", payload, {
          withCredentials: true,
        });

        showToast.success(res.data?.message || "User created successfully.");
      }

      await getPeople();

      setIsFormOpen(false);
      setForm(EMPTY_FORM);
      setErrors({});
    } catch (error) {
      console.error("Save user error:", error);

      showToast.error(error.response?.data?.message || "Failed to save user.");
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
      header: "User",
      render: (row) => (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={row.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-cm-text">{row.name}</p>

            <p className="truncate text-xs text-cm-text-muted">{row.email}</p>
          </div>
        </div>
      ),
    },

    {
      key: "role",
      header: "Role",
      render: (row) => (
        <span>{row.roleName || rolesMap[row.role]?.name || "—"}</span>
      ),
    },

    {
      key: "employee",
      header: "Employee",
      render: (row) =>
        row.employeeId ? (
          <Badge tone="success">Employee</Badge>
        ) : (
          <Badge tone="neutral">User Only</Badge>
        ),
    },

    {
      key: "status",
      header: "Status",
      render: (row) => {
        const status = row.isActive ? "Active" : "Inactive";

        return <Badge tone={STATUS_TONE[status] ?? "neutral"}>{status}</Badge>;
      },
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
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cm-border border-t-cm-blue-600 motion-reduce:animate-none" />

          <p className="text-sm text-cm-text-muted">Loading people...</p>
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
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6">
      {/* HEADER */}
      <header className="flex flex-col gap-4 border-b border-cm-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-cm-blue-700">
            Company administration
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-cm-text">
            People Management
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-cm-text-muted">
            Manage company users, roles and account access.
          </p>
        </div>

        <Button
          onClick={openAdd}
          disabled={isSubmitting || isRolesLoading}
          className="w-full sm:w-auto"
        >
          {isRolesLoading ? "Loading roles..." : "Add User"}
        </Button>
      </header>

      <section aria-label="Filter people by role" className="rounded-cm-lg border border-cm-border bg-cm-card p-2 shadow-cm-sm sm:p-3">
        <div
          role="tablist"
          aria-label="People sections"
          className="flex gap-2 overflow-x-auto pb-1"
        >
          {ROLE_TABS.map((tab) => {
            const isActive = activeRole === tab.key;

            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls="people-list-panel"
                onClick={() => setActiveRole(tab.key)}
                className={[
                  "flex min-w-max items-center gap-2 rounded-cm-md border px-4 py-3 text-sm font-semibold transition-colors",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cm-focus",
                  isActive
                    ? "border-cm-navy-950 bg-cm-navy-950 text-white shadow-cm-sm"
                    : "border-transparent text-cm-text-muted hover:border-cm-border hover:bg-cm-bg hover:text-cm-text",
                ].join(" ")}
              >
                <span>{tab.label}</span>
                <span
                  className={[
                    "rounded-full px-2 py-0.5 text-xs",
                    isActive
                      ? "bg-white/15 text-white"
                      : "bg-cm-bg text-cm-text-muted",
                  ].join(" ")}
                >
                  {roleCounts[tab.key]}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* FORM */}
      {isFormOpen && (
        <form
          ref={formRef}
          id="people-user-form"
          onSubmit={save}
          className="flex flex-col gap-5 rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-cm-md sm:p-6"
        >
          <div className="flex flex-col gap-1 border-b border-cm-border pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-cm-text">
                {form.id ? "Edit User" : "Add User"}
              </h2>
              <p className="mt-1 text-sm text-cm-text-muted">
                {form.id
                  ? "Update account details, role and access status."
                  : "Create a user account and assign its initial role."}
              </p>
            </div>

            {isSubmitting && (
              <div className="flex items-center gap-2 text-xs text-cm-text-muted">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-cm-border border-t-cm-blue-600 motion-reduce:animate-none" />
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

              {/* ROLE */}
              <Select
                label="Role"
                value={form.role}
                error={errors.role}
                disabled={isRolesLoading}
                options={roles.map((role) => ({
                  label: role.name,
                  value: role.uuid,
                }))}
                onChange={handleChange("role")}
              />

              {/* STATUS */}
              <Select
                label="Account Status"
                value={String(form.isActive)}
                options={[
                  {
                    label: "Active",
                    value: "true",
                  },
                  {
                    label: "Inactive",
                    value: "false",
                  },
                ]}
                onChange={handleStatusChange}
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
                "Add User"
              )}
            </Button>
          </div>
        </form>
      )}

      {/* PROFILE */}
      {selected && (
        <section
          ref={profileRef}
          aria-labelledby="selected-person-heading"
          className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-cm-sm sm:p-6"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs text-cm-text-muted">
                User ID: {selected.id}
              </p>

              <h2 id="selected-person-heading" className="mt-1 text-lg font-semibold text-cm-text">
                {selected.name}
              </h2>

              <p className="mt-1 text-sm text-cm-text-muted">
                {selected.email}
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
              ["Email", selected.email],
              [
                "Role",
                selected.roleName || rolesMap[selected.role]?.name || "—",
              ],
              ["Account Status", selected.status],
              ["Employee", selected.employee ? "Employee" : "User Only"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-cm-md border border-cm-border bg-cm-bg/40 p-4"
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
      <section
        id="people-list-panel"
        role="tabpanel"
        aria-labelledby="people-list-heading"
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="people-list-heading" className="text-base font-semibold text-cm-text">
              All users
            </h2>
            <p className="mt-1 text-sm text-cm-text-muted">
              {search
                ? `${filtered.length} matching ${filtered.length === 1 ? "user" : "users"}`
                : `${people.length} ${people.length === 1 ? "user" : "users"} in this company`}
            </p>
          </div>

          <TableSearch
            value={search}
            onChange={setSearch}
            placeholder="Search users, email, role..."
          />
        </div>

        {isPeopleLoading ? (
          <div className="flex min-h-[250px] items-center justify-center rounded-cm-lg border border-cm-border bg-cm-card">
            <div className="flex flex-col items-center gap-3">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-cm-border border-t-cm-blue-600 motion-reduce:animate-none" />

              <p className="text-sm text-cm-text-muted">Loading people...</p>
            </div>
          </div>
        ) : (
          <DataTable
            columns={columns}
            rows={filtered}
            emptyMessage={
              search ? "No users match your search." : "No users found."
            }
          />
        )}
      </section>
    </div>
  );
}

export default PeopleManagement;
