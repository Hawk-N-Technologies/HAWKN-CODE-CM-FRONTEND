import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  ContactRound,
  Eye,
  PencilLine,
  UserPlus,
  UserRoundPen,
} from "lucide-react";

import Badge from "../../components/common/Badge";
import Avatar from "../../components/common/Avatar";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import DataTable from "../../components/tables/DataTable";
import TableSearch from "../../components/tables/TableSearch";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import { showToast } from "../../components/common/Toast";

const DEFAULT_DIAL_CODE = "+91";
const COUNTRY_DIAL_CODES = [
  { value: "+91", label: "India (+91)" },
  { value: "+1", label: "United States (+1)" },
  { value: "+44", label: "United Kingdom (+44)" },
  { value: "+61", label: "Australia (+61)" },
  { value: "+971", label: "United Arab Emirates (+971)" },
];

function PhoneField({
  label,
  code,
  value,
  error,
  required = false,
  onCodeChange,
  onChange,
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label className="text-sm font-medium text-cm-text">
        {label}
        {required && (
          <span className="ml-0.5 text-cm-danger-600" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <div className="flex min-w-0 gap-2">
        <select
          value={code}
          onChange={onCodeChange}
          aria-label={`${label} country dialing code`}
          className="h-10 w-[7.5rem] shrink-0 rounded-cm-md border border-cm-border bg-white px-2 text-xs text-cm-text focus:border-cm-focus focus:outline-none focus:ring-2 focus:ring-cm-focus/30"
        >
          {COUNTRY_DIAL_CODES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <input
          type="tel"
          inputMode="numeric"
          value={value}
          required={required}
          onChange={onChange}
          aria-invalid={Boolean(error) || undefined}
          className={`h-10 min-w-0 w-full rounded-cm-md border bg-white px-3 text-sm text-cm-text placeholder:text-cm-text-muted focus:border-cm-focus focus:outline-none focus:ring-2 focus:ring-cm-focus/30 ${error ? "border-cm-danger-600" : "border-cm-border"}`}
        />
      </div>
      {error && <p className="text-sm text-cm-danger-600">{error}</p>}
    </div>
  );
}

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
  phone1CountryCode: DEFAULT_DIAL_CODE,
  phone2: "",
  phone2CountryCode: DEFAULT_DIAL_CODE,
  whatsapp: "",
  whatsappCountryCode: DEFAULT_DIAL_CODE,
  address: "",
  city: "",
  country: "",
  joiningDate: "",
  dob: "",
  linkedin: "",
  github: "",
  aadhaar: "",
  role: "",
  status: "Active",
  type: "Full Time",
};

const EMPLOYMENT_TYPES = ["Full Time", "Intern", "Probation"];
const EMPLOYMENT_STATUSES = ["Active", "On Leave", "Exited"];

const STATUS_TONE = {
  Active: "success",
  "On Leave": "warning",
  Exited: "danger",
};

const toDateInput = (value) => {
  if (!value) return "";
  const date = String(value).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : "";
};

const mapEmployeeFromApi = (employee) => {
  const user = employee?.user || {};
  const roleRecord =
    user?.role && typeof user.role === "object"
      ? user.role
      : employee?.role && typeof employee.role === "object"
        ? employee.role
        : Array.isArray(user?.roles)
          ? user.roles[0]
          : null;

  const firstName = user.firstName || employee.firstName || "";
  const lastName = user.lastName || employee.lastName || "";
  const roleUuid =
    roleRecord?.uuid ||
    user.roleUuid ||
    employee.roleUuid ||
    (typeof employee.role === "string" ? employee.role : "");

  return {
    ...employee,
    id: employee.id ?? employee.employeeId ?? null,
    uuid: employee.uuid ?? employee.employeeUuid ?? null,
    userUuid: user.uuid || employee.userUuid || null,
    firstName,
    lastName,
    name:
      employee.name ||
      `${firstName} ${lastName}`.trim() ||
      user.name ||
      user.email ||
      employee.email ||
      "Unnamed Employee",
    email: user.email || employee.email || "",
    companyEmail: employee.companyEmail || user.companyEmail || "",
    phone1: employee.phone1 || user.phone1 || "",
    phone1CountryCode:
      employee.phone1CountryCode ||
      user.phone1CountryCode ||
      employee.phone1DialCode ||
      user.phone1DialCode ||
      DEFAULT_DIAL_CODE,
    phone2: employee.phone2 || user.phone2 || "",
    phone2CountryCode:
      employee.phone2CountryCode ||
      user.phone2CountryCode ||
      employee.phone2DialCode ||
      user.phone2DialCode ||
      DEFAULT_DIAL_CODE,
    whatsapp: employee.whatsapp || user.whatsapp || "",
    whatsappCountryCode:
      employee.whatsappCountryCode ||
      user.whatsappCountryCode ||
      employee.whatsappDialCode ||
      user.whatsappDialCode ||
      DEFAULT_DIAL_CODE,
    address: employee.address || user.address || "",
    city: employee.city || user.city || "",
    country: employee.country || user.country || "",
    joiningDate: toDateInput(employee.joiningDate || user.joiningDate),
    dob: toDateInput(
      employee.dateOfBirth || employee.dob || user.dateOfBirth || user.dob,
    ),
    linkedin:
      employee.linkedinUrl ||
      employee.linkedin ||
      user.linkedinUrl ||
      user.linkedin ||
      "",
    github:
      employee.githubUrl ||
      employee.github ||
      user.githubUrl ||
      user.github ||
      "",
    aadhaar: employee.aadhaarLast4 || employee.aadhaar || "",
    role: roleUuid,
    roleName: roleRecord?.name || employee.roleName || user.roleName || "",
    status: employee.employmentStatus || employee.status || "Active",
    type: employee.employmentType || employee.type || "Full Time",
    isActive: user.isActive ?? employee.isActive ?? true,
  };
};

function Employees() {
  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [rolesMap, setRolesMap] = useState({});

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [selected, setSelected] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  const [isEmployeesLoading, setIsEmployeesLoading] = useState(true);
  const [isRolesLoading, setIsRolesLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formRef = useRef(null);
  const profileRef = useRef(null);
  const isInitialLoading = isEmployeesLoading || isRolesLoading;

  const getRoles = useCallback(async () => {
    setIsRolesLoading(true);
    try {
      const res = await axios.get("/api/employees/roles", {
        withCredentials: true,
      });
      const data = Array.isArray(res.data?.data) ? res.data.data : [];
      setRoles(data);
      setRolesMap(Object.fromEntries(data.map((role) => [role.uuid, role])));
    } catch (error) {
      console.error("Get roles error:", error);
      setRoles([]);
      setRolesMap({});
      showToast.error(error.response?.data?.message || "Failed to load roles.");
    } finally {
      setIsRolesLoading(false);
    }
  }, []);

  const getEmployees = useCallback(async () => {
    setIsEmployeesLoading(true);
    try {
      const res = await axios.get("/api/employees", {
        withCredentials: true,
      });
      const payload = res.data?.data;
      const records = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.rows)
          ? payload.rows
          : Array.isArray(res.data?.rows)
            ? res.data.rows
            : [];

      setEmployees(records.map(mapEmployeeFromApi));
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

  useEffect(() => {
    getRoles();
    getEmployees();
  }, [getRoles, getEmployees]);

  const filteredEmployees = useMemo(() => {
    const query = search.trim().toLowerCase();

    return employees.filter((employee) => {
      const matchesSearch =
        !query ||
        [
          employee.name,
          employee.firstName,
          employee.lastName,
          employee.email,
          employee.companyEmail,
          employee.roleName,
          employee.type,
          employee.status,
        ].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(query),
        );

      const matchesStatus = !statusFilter || employee.status === statusFilter;

      const matchesRole = roleFilter === "all" || employee.role === roleFilter;

      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [employees, search, statusFilter, roleFilter]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, roleFilter, limit]);

  const total = filteredEmployees.length;
  const totalPages = Math.ceil(total / limit);
  const paginatedEmployees = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredEmployees.slice(start, start + limit);
  }, [filteredEmployees, page, limit]);

  const pagination = {
    total,
    page,
    limit,
    totalPages,
  };

  useEffect(() => {
    const target = isFormOpen
      ? formRef.current
      : selected
        ? profileRef.current
        : null;

    if (target) target.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [isFormOpen, selected]);

  const validateField = (name, value, currentForm) => {
    const fieldValue = value ?? "";

    switch (name) {
      case "firstName":
      case "lastName":
        if (!fieldValue.trim()) {
          return `${name === "firstName" ? "First" : "Last"} name is required.`;
        }
        if (fieldValue.trim().length < 2) {
          return `${name === "firstName" ? "First" : "Last"} name must be at least 2 characters.`;
        }
        if (!/^[a-zA-Z\s'-]+$/.test(fieldValue.trim())) {
          return "Name contains invalid characters.";
        }
        return "";

      case "email":
        if (!fieldValue.trim()) return "Email is required.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fieldValue.trim())) {
          return "Enter a valid email address.";
        }
        return "";

      case "companyEmail":
        if (
          fieldValue &&
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fieldValue.trim())
        ) {
          return "Enter a valid company email address.";
        }
        return "";

      case "password":
        if (!currentForm.id && !fieldValue) return "Password is required.";
        if (fieldValue && fieldValue.length < 8) {
          return "Password must be at least 8 characters.";
        }
        return "";

      case "confirmPassword":
        if (!currentForm.id && !fieldValue) {
          return "Confirm password is required.";
        }
        if (fieldValue && fieldValue !== currentForm.password) {
          return "Passwords do not match.";
        }
        return "";

      case "phone1":
      case "phone2":
      case "whatsapp":
        if (name === "phone1" && !fieldValue.trim()) {
          return "Phone number is required.";
        }
        if (fieldValue.trim() && !/^[6-9]\d{9}$/.test(fieldValue.trim())) {
          return "Enter a valid 10-digit mobile number.";
        }
        return "";

      case "aadhaar":
        if (!fieldValue.trim()) return "Aadhaar is required.";
        if (!/^\d{4}$/.test(fieldValue.trim())) {
          return "Aadhaar must contain exactly 4 digits.";
        }
        return "";

      case "linkedin":
        if (!fieldValue.trim()) return "LinkedIn is required.";
        if (
          !/^https?:\/\/(www\.)?linkedin\.com\/.+$/i.test(fieldValue.trim())
        ) {
          return "Enter a valid LinkedIn URL.";
        }
        return "";

      case "github":
        if (!fieldValue.trim()) return "GitHub is required.";
        if (
          !/^https?:\/\/(www\.)?github\.com\/.+$/i.test(fieldValue.trim())
        ) {
          return "Enter a valid GitHub URL.";
        }
        return "";

      case "dob":
        if (!fieldValue.trim()) return "Date of birth is required.";
        return "";

      case "role":
        return fieldValue ? "" : "Please select a role.";
      case "type":
        return fieldValue ? "" : "Please select employment type.";
      case "status":
        return fieldValue ? "" : "Please select employment status.";
      default:
        return "";
    }
  };

  const validateForm = (currentForm) => {
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
      "dob",
      "role",
      "type",
      "status",
    ];
    const nextErrors = {};
    fields.forEach((field) => {
      const error = validateField(field, currentForm[field], currentForm);
      if (error) nextErrors[field] = error;
    });
    return nextErrors;
  };

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    const nextForm = { ...form, [field]: value };
    setForm(nextForm);

    setErrors((previous) => {
      const nextErrors = { ...previous };
      const error = validateField(field, value, nextForm);
      if (error) nextErrors[field] = error;
      else delete nextErrors[field];

      if (field === "password") {
        const confirmError = validateField(
          "confirmPassword",
          nextForm.confirmPassword,
          nextForm,
        );
        if (confirmError) nextErrors.confirmPassword = confirmError;
        else delete nextErrors.confirmPassword;
      }
      return nextErrors;
    });
  };

  const openAdd = () => {
    if (isSubmitting) return;
    setForm({
      ...EMPTY_FORM,
      role: roles[0]?.uuid || "",
    });
    setErrors({});
    setSelected(null);
    setIsFormOpen(true);
  };

  const openEdit = (employee) => {
    if (isSubmitting) return;
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
      phone1CountryCode:
        employee.phone1CountryCode || employee.phone1DialCode || DEFAULT_DIAL_CODE,
      phone2CountryCode:
        employee.phone2CountryCode || employee.phone2DialCode || DEFAULT_DIAL_CODE,
      whatsappCountryCode:
        employee.whatsappCountryCode ||
        employee.whatsappDialCode ||
        DEFAULT_DIAL_CODE,
      address: employee.address || "",
      city: employee.city || "",
      country: employee.country || "",
      joiningDate: employee.joiningDate || "",
      dob: employee.dob || "",
      linkedin: employee.linkedin || "",
      github: employee.github || "",
      aadhaar: employee.aadhaar || "",
      role: employee.role || "",
      type: employee.type || "Full Time",
      status: employee.status || "Active",
    });
    setErrors({});
    setSelected(null);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    if (isSubmitting) return;
    setIsFormOpen(false);
    setErrors({});
    setForm(EMPTY_FORM);
  };

  useEffect(() => {
    if (!isFormOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isSubmitting) closeForm();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isFormOpen, isSubmitting]); // closeForm uses current component state

  const save = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    const validationErrors = validateForm(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length) {
      showToast.error("Please fix the validation errors.");
      return;
    }

    if (!rolesMap[form.role]) {
      setErrors((previous) => ({
        ...previous,
        role: "Invalid role selected.",
      }));
      showToast.error("Invalid role selected.");
      return;
    }

    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      companyEmail: form.companyEmail.trim() || null,
      phone1: form.phone1 || null,
      phone1CountryCode: form.phone1 ? form.phone1CountryCode : null,
      phone2: form.phone2 || null,
      phone2CountryCode: form.phone2 ? form.phone2CountryCode : null,
      whatsapp: form.whatsapp || null,
      whatsappCountryCode: form.whatsapp ? form.whatsappCountryCode : null,
      address: form.address.trim() || null,
      city: form.city.trim() || null,
      country: form.country.trim() || null,
      joiningDate: form.joiningDate || null,
      dateOfBirth: form.dob || null,
      linkedinUrl: form.linkedin.trim() || null,
      githubUrl: form.github.trim() || null,
      aadhaarLast4: form.aadhaar || null,
      roleUuid: form.role,
      employmentType: form.type,
      employmentStatus: form.status,
    };

    if (!form.id) {
      payload.password = form.password;
      payload.confirmPassword = form.confirmPassword;
    } else if (form.password || form.confirmPassword) {
      payload.password = form.password;
      payload.confirmPassword = form.confirmPassword;
    }

    setIsSubmitting(true);
    try {
      if (form.id) {
        await axios.put(`/api/employees/${form.id}`, payload, {
          withCredentials: true,
        });
        showToast.success("Employee updated successfully.");
      } else {
        await axios.post("/api/employees", payload, {
          withCredentials: true,
        });
        showToast.success("Employee created successfully.");
      }

      await getEmployees();
      setIsFormOpen(false);
      setForm(EMPTY_FORM);
      setErrors({});
    } catch (error) {
      console.error("Save employee error:", error);
      showToast.error(
        error.response?.data?.message || "Failed to save employee.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleOptions = useMemo(
    () => [
      { value: "all", label: "All roles" },
      ...roles.map((role) => ({ value: role.uuid, label: role.name })),
    ],
    [roles],
  );

  const columns = useMemo(
    () => [
      {
        key: "id",
        header: "ID",
        render: (row) => row.id ?? "—",
      },
      {
        key: "name",
        header: "Employee",
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
        key: "type",
        header: "Employment type",
        render: (row) => row.type || "—",
      },
      {
        key: "joiningDate",
        header: "Date joined",
        render: (row) => row.joiningDate || "—",
      },
      {
        key: "status",
        header: "Status",
        render: (row) => (
          <Badge tone={STATUS_TONE[row.status] || "neutral"}>
            {row.status || "Unknown"}
          </Badge>
        ),
      },
      {
        key: "actions",
        header: "",
        render: (row) => (
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setSelected(row)}
              title={`View ${row.name} profile`}
              className="group inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-cm-navy-950 hover:bg-cm-navy-950 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Eye size={15} strokeWidth={1.9} />
              <span>View</span>
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => openEdit(row)}
              title={`Edit ${row.name}`}
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-cm-navy-950 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-cm-navy-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <PencilLine size={14} strokeWidth={2} />
              <span>Edit</span>
            </button>
          </div>
        ),
      },
    ],
    [isSubmitting, openEdit, rolesMap],
  );

  if (isInitialLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cm-border border-t-cm-blue-600 motion-reduce:animate-none" />
          <p className="text-sm text-cm-text-muted">Loading employees...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6">
      <header className="flex flex-col gap-4 border-b border-cm-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-cm-blue-700">
            Company administration
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-cm-text">
            Employees
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-cm-text-muted">
            Manage employee profiles, roles, employment details and account
            information.
          </p>
        </div>
        <Button
          onClick={openAdd}
          disabled={isSubmitting || isRolesLoading}
          className="w-full sm:w-auto"
        >
          {isRolesLoading ? "Loading roles..." : "Add Employee"}
        </Button>
      </header>

      {isFormOpen && (
        <Modal
          open={isFormOpen}
          onClose={closeForm}
          title={form.id ? "Edit employee" : "Add employee"}
          description={
            form.id
              ? "Update employee details, role and employment information."
              : "Create an employee profile and configure their role and employment details."
          }
          icon={form.id ? UserRoundPen : UserPlus}
          size="xl"
          closeDisabled={isSubmitting}
        >
          <form
            ref={formRef}
            onSubmit={save}
            className="flex max-h-[min(88vh,900px)] flex-col gap-0 overflow-y-auto bg-white"
          >
            <fieldset
              disabled={isSubmitting}
              className="flex flex-col gap-4 px-6 py-6 sm:px-8"
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input
                  label="First name"
                  required
                  value={form.firstName}
                  error={errors.firstName}
                  onChange={handleChange("firstName")}
                />
                <Input
                  label="Last name"
                  required
                  value={form.lastName}
                  error={errors.lastName}
                  onChange={handleChange("lastName")}
                />
                <Input
                  label="Email"
                  type="email"
                  required
                  value={form.email}
                  error={errors.email}
                  onChange={handleChange("email")}
                />
                <Input
                  label="Company email"
                  type="email"
                  value={form.companyEmail}
                  error={errors.companyEmail}
                  onChange={handleChange("companyEmail")}
                />
                <Input
                  label="Address"
                  multiline
                  rows={3}
                  value={form.address}
                  onChange={handleChange("address")}
                />
                <Input
                  label="Place / City"
                  value={form.city}
                  onChange={handleChange("city")}
                />
                <Input
                  label="Country"
                  value={form.country}
                  onChange={handleChange("country")}
                />
                <Input
                  label="Password"
                  type="password"
                  required={!form.id}
                  value={form.password}
                  error={errors.password}
                  onChange={handleChange("password")}
                />
                <Input
                  label="Confirm password"
                  type="password"
                  required={!form.id}
                  value={form.confirmPassword}
                  error={errors.confirmPassword}
                  onChange={handleChange("confirmPassword")}
                />
                <PhoneField
                  label="Phone 1"
                  code={form.phone1CountryCode}
                  value={form.phone1}
                  error={errors.phone1}
                  required
                  onCodeChange={handleChange("phone1CountryCode")}
                  onChange={handleChange("phone1")}
                />
                <PhoneField
                  label="Phone 2"
                  code={form.phone2CountryCode}
                  value={form.phone2}
                  error={errors.phone2}
                  onCodeChange={handleChange("phone2CountryCode")}
                  onChange={handleChange("phone2")}
                />
                <PhoneField
                  label="WhatsApp"
                  code={form.whatsappCountryCode}
                  value={form.whatsapp}
                  error={errors.whatsapp}
                  onCodeChange={handleChange("whatsappCountryCode")}
                  onChange={handleChange("whatsapp")}
                />
                <Input
                  label="Date of joining"
                  type="date"
                  value={form.joiningDate}
                  onChange={handleChange("joiningDate")}
                />
                <Input
                  label="Date of birth"
                  type="date"
                  required
                  value={form.dob}
                  error={errors.dob}
                  onChange={handleChange("dob")}
                />
                <Input
                  label="LinkedIn URL"
                  required
                  value={form.linkedin}
                  error={errors.linkedin}
                  onChange={handleChange("linkedin")}
                />
                <Input
                  label="GitHub URL"
                  required
                  value={form.github}
                  error={errors.github}
                  onChange={handleChange("github")}
                />
                <Input
                  label="Aadhaar last 4 digits"
                  required
                  value={form.aadhaar}
                  error={errors.aadhaar}
                  maxLength={12}
                  onChange={handleChange("aadhaar")}
                />
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
                <Select
                  label="Employment type"
                  value={form.type}
                  error={errors.type}
                  options={EMPLOYMENT_TYPES.map((value) => ({
                    value,
                    label: value,
                  }))}
                  onChange={handleChange("type")}
                />
                <Select
                  label="Employment status"
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
            <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-200 bg-slate-50/90 px-6 py-4 backdrop-blur sm:px-8">
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
                  "Save changes"
                ) : (
                  "Add employee"
                )}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {selected && (
        <Modal
          open={Boolean(selected)}
          onClose={() => setSelected(null)}
          title="Employee profile"
          description="Employee identity, role and employment overview."
          icon={ContactRound}
          size="lg"
        >
          <div ref={profileRef} className="max-h-[78vh] overflow-y-auto">
            <div className="bg-cm-navy-950 px-6 py-7 text-white sm:px-8">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-xl font-bold shadow-inner">
                  {(
                    selected.firstName?.[0] ||
                    selected.name?.[0] ||
                    "E"
                  ).toUpperCase()}
                  {(selected.lastName?.[0] || "").toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-xl font-bold tracking-tight">
                    {selected.name}
                  </h3>
                  <p className="mt-1 truncate text-sm text-white/65">
                    {selected.email}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-xs font-semibold text-white/90">
                      {selected.roleName ||
                        rolesMap[selected.role]?.name ||
                        "No role assigned"}
                    </span>
                    <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white/90">
                      {selected.type || "Employment type unavailable"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 p-6 sm:grid-cols-2 sm:p-8">
              {[
                ["Employee ID", selected.id],
                ["First name", selected.firstName],
                ["Last name", selected.lastName],
                ["Email address", selected.email],
                ["Company email", selected.companyEmail],
                ["Role", selected.roleName || rolesMap[selected.role]?.name],
                ["Employment type", selected.type],
                ["Employment status", selected.status],
                ["Phone", selected.phone1],
                ["Alternate phone", selected.phone2],
                ["WhatsApp", selected.whatsapp],
                ["Date of joining", selected.joiningDate],
                ["Date of birth", selected.dob],
                ["LinkedIn", selected.linkedin],
                ["GitHub", selected.github],
                ["Aadhaar", selected.aadhaar ? `•••• ${selected.aadhaar}` : ""],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 transition-colors hover:border-slate-300 hover:bg-white"
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    {label}
                  </p>
                  <p className="mt-2 break-words text-sm font-semibold text-cm-navy-950">
                    {value || "—"}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50/80 px-6 py-4 sm:px-8">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelected(null)}
              >
                Close
              </Button>
              <Button
                type="button"
                disabled={isSubmitting}
                onClick={() => openEdit(selected)}
              >
                <span className="inline-flex items-center gap-2">
                  <UserRoundPen size={16} /> Edit employee
                </span>
              </Button>
            </div>
          </div>
        </Modal>
      )}

      <section id="employees-list-panel" className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-cm-text">
              Employees
            </h2>
            <p className="mt-1 text-sm text-cm-text-muted">
              {total} {total === 1 ? "employee" : "employees"} found
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:flex lg:items-end">
            <Select
              name="roleFilter"
              label="Role"
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
              options={roleOptions}
              containerClassName="w-full sm:w-44"
            />
            <Select
              name="employmentStatusFilter"
              label="Employment status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              placeholder="All statuses"
              options={EMPLOYMENT_STATUSES.map((value) => ({
                value,
                label: value,
              }))}
              containerClassName="w-full sm:w-48"
            />
            <div className="w-full lg:w-64">
              <TableSearch
                value={search}
                onChange={setSearch}
                placeholder="Search employees..."
              />
            </div>
          </div>
        </div>

        <DataTable
          columns={columns}
          rows={paginatedEmployees}
          isLoading={isEmployeesLoading}
          emptyMessage={
            search || statusFilter || roleFilter !== "all"
              ? "No employees match your filters."
              : "No employees found."
          }
          pagination={pagination}
          onPageChange={setPage}
          onPageSizeChange={setLimit}
          pageSizeOptions={[10, 25, 50, 100]}
        />
      </section>
    </div>
  );
}

export default Employees;
