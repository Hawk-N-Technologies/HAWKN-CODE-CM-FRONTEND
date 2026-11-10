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
import { getSalaries, setSalary } from "../../services/payrollService";

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

  password: "",
  confirmPassword: "",
  companyEmail: "",
  role: "",
  githubUrl: "",
  linkedinUrl: "",
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
  dateOfBirth: "",
  aadhaarLast4: "",
  salary: "",
  isActive: true,
};

const STATUS_TONE = {
  Active: "success",
  Inactive: "danger",
};

const EMPLOYMENT_TYPES = ["Full Time", "Intern", "Probation"];
const EMPLOYMENT_STATUSES = ["Active", "On Leave", "Exited"];

function normalizeRole(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
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
    (typeof user.role === "string" && user.roleUuid ? "" : "");

  const roleName =
    roleRecord?.name ||
    user.roleName ||
    (typeof user.role === "string" ? user.role : "");

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

    companyEmail: user.employee?.companyEmail || user.companyEmail || "",
    phone1: user.phone1 || "",
    phone1CountryCode:
      user.phone1CountryCode || user.phone1DialCode || DEFAULT_DIAL_CODE,
    phone2: user.phone2 || "",
    phone2CountryCode:
      user.phone2CountryCode || user.phone2DialCode || DEFAULT_DIAL_CODE,
    whatsapp: user.whatsapp || "",
    whatsappCountryCode:
      user.whatsappCountryCode || user.whatsappDialCode || DEFAULT_DIAL_CODE,
    address: user.employee?.address || user.address || "",
    city: user.employee?.city || user.city || "",
    country: user.employee?.country || user.country || "",
    joiningDate: user.joiningDate || "",
    dateOfBirth: user.dateOfBirth || user.employee?.dateOfBirth || "",
    linkedinUrl: user?.linkedinUrl || user.employee?.linkedinUrl || "",
    githubUrl: user?.githubUrl || user.employee?.githubUrl || "",
    aadhaarLast4: user?.aadhaarLast4 || user.employee?.aadhaarLast4 || "",

    role: roleUuid,
    roleName,

    isActive: user.isActive ?? true,

    status: user.isActive ? "Active" : "Inactive",
    employmentStatus: user?.employmentStatus || "Active",
    type: user?.employmentType || "Full Time",
    employeeId: user?.employeeId || null,
    employeeUuid: user.employeeUuid || user.employee?.uuid || null,

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
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce server-side search and reset pagination together.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);
  const [activeRole, setActiveRole] = useState("all");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  const [selected, setSelected] = useState(null);

  const [isFormOpen, setIsFormOpen] = useState(false);

  const [form, setForm] = useState(EMPTY_FORM);

  const [errors, setErrors] = useState({});

  const [isPeopleLoading, setIsPeopleLoading] = useState(true);
  const [hasLoadedPeople, setHasLoadedPeople] = useState(false);
  const [isRolesLoading, setIsRolesLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef(null);
  const profileRef = useRef(null);
  const peopleRequestRef = useRef(null);

  // Only the first load may replace the page with a full-screen loader.
  // Later searches keep the search input mounted and focused.
  const isInitialLoading = isRolesLoading || !hasLoadedPeople;

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
  const apiRole = useMemo(() => {
    if (activeRole === "all") return "";

    return roles.find((role) => role.uuid === activeRole)?.name || "";
  }, [activeRole, roles]);

  const getPeople = useCallback(async () => {
    // Cancel the previous request so stale responses cannot overwrite newer
    // search, filter, or pagination results.
    peopleRequestRef.current?.abort();

    const controller = new AbortController();
    peopleRequestRef.current = controller;
    setIsPeopleLoading(true);

    try {
      const params = {
        search: debouncedSearch || undefined,
        page,
        limit,
        status: status || undefined,
        role: apiRole || undefined,
      };

      const res = await axios.get("/api/employees/getPeople", {
        params,
        withCredentials: true,
        signal: controller.signal,
      });

      if (controller.signal.aborted) return;

      // Supports either { data: [...], pagination } or
      // { data: { rows: [...], pagination } } API response formats.
      const payload = res.data?.data;
      const data = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.rows)
          ? payload.rows
          : Array.isArray(res.data?.rows)
            ? res.data.rows
            : [];

      const meta = payload?.pagination ||
        res.data?.pagination || {
          total: data.length,
          page,
          limit,
          totalPages: data.length ? 1 : 0,
        };

      const total = Number(meta.total ?? data.length);
      const responseLimit = Number(meta.limit ?? limit);

      setPeople(data.map(mapUserFromApi));
      setPagination({
        total,
        page: Number(meta.page ?? page),
        limit: responseLimit,
        totalPages: Number(
          meta.totalPages ?? Math.ceil(total / Math.max(responseLimit, 1)),
        ),
      });
    } catch (error) {
      // Aborted requests are expected when search or filters change.
      if (controller.signal.aborted || axios.isCancel(error)) return;

      console.error("Get people error:", error);
      showToast.error(
        error.response?.data?.message || "Failed to load people.",
      );
      // Preserve the last successful rows during transient failures.
    } finally {
      if (peopleRequestRef.current === controller) {
        peopleRequestRef.current = null;
        setIsPeopleLoading(false);
        setHasLoadedPeople(true);
      }
    }
  }, [apiRole, limit, page, debouncedSearch, status]);

  // Roles are reference data: fetch once, not on every search or page change.
  useEffect(() => {
    getRoles();
  }, [getRoles]);

  // Fetch people whenever a server-side query parameter changes.
  useEffect(() => {
    getPeople();

    return () => {
      const activeRequest = peopleRequestRef.current;
      peopleRequestRef.current = null;
      activeRequest?.abort();
    };
  }, [getPeople]);

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

      case "companyEmail":
        if (!formValue) return "";

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValue.trim())) {
          return "Enter a valid company email address.";
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

      case "phone1":
      case "phone2":
      case "whatsapp":
        if (name === "phone1" && !formValue.trim()) {
          return "Phone number is required.";
        }

        if (!formValue.trim()) return "";

        if (!/^[6-9]\d{9}$/.test(formValue.trim())) {
          return "Enter a valid 10-digit mobile number.";
        }

        return "";

      case "aadhaarLast4":
        if (!formValue.trim()) return "Aadhaar is required.";

        if (!/^\d{4}$/.test(formValue.trim())) {
          return "aadhaarLast4 must contain exactly 4 digits.";
        }

        return "";

      case "linkedinUrl":
        if (!formValue.trim()) return "LinkedIn is required.";

        if (!/^https?:\/\/(www\.)?linkedin\.com\/.+$/i.test(formValue.trim())) {
          return "Enter a valid LinkedIn URL.";
        }

        return "";

      case "githubUrl":
        if (!formValue.trim()) return "GitHub is required.";

        if (!/^https?:\/\/(www\.)?github\.com\/.+$/i.test(formValue.trim())) {
          return "Enter a valid GitHub URL.";
        }

        return "";

      case "dateOfBirth":
        if (!formValue.trim()) return "Date of birth is required.";
        return "";

      case "role":
        if (!formValue) {
          return "Please select a role.";
        }

        return "";

      case "type":
        if (!formValue) return "Please select employment type.";
        return "";

      case "employmentStatus":
        if (!formValue) return "Please select employment status.";
        return "";

      case "salary":
        if (!formValue) return "";

        if (!Number.isInteger(Number(formValue)) || Number(formValue) <= 0) {
          return "Salary must be a positive whole number.";
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
      "companyEmail",
      "password",
      "confirmPassword",
      "phone1",
      "phone2",
      "whatsapp",
      "aadhaarLast4",
      "linkedinUrl",
      "githubUrl",
      "dateOfBirth",
      "role",
      "type",
      "employmentStatus",
      "salary",
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
      employmentStatus: "Active",
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
  const openEdit = async (person) => {
    if (isSubmitting) {
      return;
    }

    const userUuid = person.userUuid || person.uuid;
    let salary = person.salary ?? person.employee?.salary ?? "";

    if (userUuid) {
      try {
        const salaries = await getSalaries(userUuid);
        const salaryRecord = Array.isArray(salaries) ? salaries[0] : salaries;
        salary = salaryRecord?.salary ?? salaryRecord?.data?.salary ?? salary;
      } catch (error) {
        console.error("Get employee salary error:", error);
        showToast.error(
          error.response?.data?.message || "Failed to load employee salary.",
        );
      }
    }

    setForm({
      ...EMPTY_FORM,

      id: person.id,
      uuid: userUuid,
      employeeId: person.employeeId,
      employeeUuid: person.employeeUuid,

      firstName: person.firstName || "",
      lastName: person.lastName || "",

      email: person.email || "",
      companyEmail: person.companyEmail || "",

      phone1: person.phone1 || "",
      phone1CountryCode:
        person.phone1CountryCode || person.phone1DialCode || DEFAULT_DIAL_CODE,
      phone2: person.phone2 || "",
      phone2CountryCode:
        person.phone2CountryCode || person.phone2DialCode || DEFAULT_DIAL_CODE,
      whatsapp: person.whatsapp || "",
      whatsappCountryCode:
        person.whatsappCountryCode ||
        person.whatsappDialCode ||
        DEFAULT_DIAL_CODE,

      address: person.address || person.employee?.address || "",
      city: person.city || person.employee?.city || "",
      country: person.country || person.employee?.country || "",

      joiningDate: person.joiningDate || "",
      dateOfBirth: person.dateOfBirth || "",

      linkedinUrl: person.linkedinUrl || "",
      githubUrl: person.githubUrl || "",

      aadhaarLast4: person.aadhaarLast4 || "",
      salary,

      password: "",
      confirmPassword: "",

      role: person.role || "",

      isActive: person.isActive ?? true,
      employmentStatus: person.employmentStatus || "Active",
      type: person.type || "Full Time",
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

  useEffect(() => {
    if (!isFormOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isSubmitting) {
        setIsFormOpen(false);
        setErrors({});
        setForm(EMPTY_FORM);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isFormOpen, isSubmitting]);

  const roleOptions = useMemo(
    () => [
      { value: "all", label: "All roles" },
      ...roles
        .filter((role) => normalizeRole(role.name) !== "client")
        .map((role) => ({
          value: role.uuid,
          label: role.name,
        })),
    ],
    [roles],
  );
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

    const userPayload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      githubUrl: form.githubUrl,
      linkedinUrl: form.linkedinUrl,
      phone1: form.phone1,
      phone2: form.phone2,
      whatsapp: form.whatsapp,
      dateOfBirth: form.dateOfBirth,
      joiningDate: form.joiningDate,
      aadhaarLast4: form.aadhaarLast4,
      roleUuid: form.role,

      isActive: form.isActive,
    };

    const employeePayload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      companyEmail: form.companyEmail?.trim() || null,
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
      dateOfBirth: form.dateOfBirth || null,
      linkedinUrl: form.linkedinUrl?.trim() || null,
      githubUrl: form.githubUrl?.trim() || null,
      aadhaarLast4: form.aadhaarLast4 || null,
      roleUuid: form.role,
      employmentType: form.type,
      employmentStatus: form.employmentStatus,
    };

    const hasSalary = form.salary.trim() !== "";
    const salaryValue = Number(form.salary);

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
      employeePayload.password = form.password;
      employeePayload.confirmPassword = form.confirmPassword;
    } else if (form.password || form.confirmPassword) {
      userPayload.password = form.password;
      userPayload.confirmPassword = form.confirmPassword;
      employeePayload.password = form.password;
      employeePayload.confirmPassword = form.confirmPassword;
    }

    setIsSubmitting(true);

    try {
      let res;
      if (form.uuid && form.id) {
        res = await axios.put(
          `/api/employees/people/${form.uuid}`,
          employeePayload,
          {
            withCredentials: true,
          },
        );

        if (hasSalary) {
          await setSalary(form.uuid, salaryValue);
        }

        showToast.success(res.data?.message || "User updated successfully.");
      } else {
        res = await axios.post("/api/employees/create", employeePayload, {
          withCredentials: true,
        });

        if (hasSalary) {
          const createdUser = res.data?.data ?? res.data;
          const createdUserUuid =
            createdUser?.userUuid ||
            createdUser?.uuid ||
            createdUser?.user?.uuid ||
            createdUser?.employee?.userUuid ||
            createdUser?.employee?.user?.uuid;

          if (!createdUserUuid) {
            throw new Error("Created employee UUID was not returned.");
          }

          await setSalary(createdUserUuid, salaryValue);
        }

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
      render: (row) => row.userId ?? row.id,
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
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => {
              setSelected(row);
            }}
            title={`View ${row.name} profile`}
            className="group inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 shadow-sm transition-all duration-200 hover:border-cm-navy-950 hover:bg-cm-navy-950 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Eye size={15} strokeWidth={1.9} />
            <span>View</span>
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => openEdit(row)}
            title={`Edit ${row.name}`}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-cm-navy-950 px-3 text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:bg-cm-navy-800 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <PencilLine size={14} strokeWidth={2} />
            <span>Edit</span>
          </button>
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
    <div className="mx-auto flex w-full min-w-0 max-w-[1440px] flex-col gap-6 pb-8">
      {/* ADMINISTRATION HEADER */}
      <header className="relative overflow-hidden rounded-[28px] border border-slate-800 bg-gradient-to-br from-[#080d25] via-[#0b1734] to-[#1b2052] px-6 py-7 shadow-[0_18px_45px_rgba(15,23,42,0.16)] sm:px-8 sm:py-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full border border-white/10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-8 -top-16 h-48 w-48 rounded-full border border-white/10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-0 h-64 w-64 bg-blue-500/10 blur-3xl"
        />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-blue-100">
              <ContactRound size={24} strokeWidth={1.7} />
            </div>

            <div className="min-w-0">
              <span className="inline-flex items-center rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-200">
                ADMINISTRATION
              </span>

              <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-[34px]">
                People Management
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Manage company users, roles, employee records, and account
                access from one central workspace.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.07] px-3.5 py-2.5 backdrop-blur-sm">
              <ContactRound size={16} className="text-blue-200" />
              <span className="text-xs font-medium text-slate-100">
                {pagination.total}{" "}
                {pagination.total === 1 ? "Member" : "Members"}
              </span>
            </div>

            <Button
              onClick={openAdd}
              disabled={isSubmitting || isRolesLoading}
              className="w-full sm:w-auto"
            >
              <span className="inline-flex items-center gap-2">
                <UserPlus size={16} />
                {isRolesLoading ? "Loading roles..." : "Add Employee"}
              </span>
            </Button>
          </div>
        </div>
      </header>

      {/* CREATE / EDIT MODAL */}
      {isFormOpen && (
        <Modal
          open={isFormOpen}
          onClose={closeForm}
          title={
            form.id
              ? form.employeeId
                ? "Edit employee"
                : "Edit user"
              : "Add a team member"
          }
          description={
            form.id
              ? "Update account details, access, and employment information."
              : "Create an account and configure the member’s role and employment details."
          }
          icon={form.id ? UserRoundPen : UserPlus}
          size="xl"
          closeDisabled={isSubmitting}
        >
          <form
            ref={formRef}
            id="people-user-form"
            onSubmit={save}
            className="flex max-h-[min(88vh,900px)] flex-col gap-0 overflow-y-auto bg-white"
          >
            <fieldset
              disabled={isSubmitting}
              className="flex flex-col gap-4 px-6 py-6 sm:px-8"
            >
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

                <Input
                  label="Company Email"
                  type="email"
                  value={form.companyEmail}
                  error={errors.companyEmail}
                  onChange={handleChange("companyEmail")}
                />

                <Input
                  label="Salary"
                  type="number"
                  min="0"
                  step="1"
                  value={form.salary}
                  error={errors.salary}
                  onChange={handleChange("salary")}
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
                  label="Date of Joining"
                  type="date"
                  value={form.joiningDate}
                  error={errors.joiningDate}
                  onChange={handleChange("joiningDate")}
                />

                <Input
                  label="Date of Birth"
                  type="date"
                  required
                  value={form.dateOfBirth}
                  error={errors.dateOfBirth}
                  onChange={handleChange("dateOfBirth")}
                />

                <Input
                  label="LinkedIn URL"
                  required
                  value={form.linkedinUrl}
                  error={errors.linkedinUrl}
                  onChange={handleChange("linkedinUrl")}
                />

                <Input
                  label="GitHub URL"
                  required
                  value={form.githubUrl}
                  error={errors.githubUrl}
                  onChange={handleChange("githubUrl")}
                />

                <Input
                  label="Aadhaar Last 4"
                  required
                  value={form.aadhaarLast4}
                  error={errors.aadhaarLast4}
                  maxLength={4}
                  onChange={handleChange("aadhaarLast4")}
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

                <Select
                  label="Employment Status"
                  value={form.employmentStatus}
                  error={errors.employmentStatus}
                  options={EMPLOYMENT_STATUSES.map((value) => ({
                    value,
                    label: value,
                  }))}
                  onChange={handleChange("employmentStatus")}
                />
              </div>
            </fieldset>

            {/* FORM ACTIONS */}
            <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-200 bg-slate-50/95 px-6 py-4 backdrop-blur sm:px-8">
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
        </Modal>
      )}

      {/* PROFILE DETAILS MODAL */}
      {selected && (
        <Modal
          open={Boolean(selected)}
          onClose={() => setSelected(null)}
          title="Member profile"
          description="Account identity, role, and access overview."
          icon={ContactRound}
          size="lg"
        >
          <div className="max-h-[78vh] overflow-y-auto">
            <div className="bg-gradient-to-br from-[#080d25] via-[#0b1734] to-[#1b2052] px-6 py-7 text-white sm:px-8">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-xl font-bold shadow-inner">
                  {(
                    selected.firstName?.[0] ||
                    selected.name?.[0] ||
                    "U"
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
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${selected.isActive ? "bg-emerald-400/15 text-emerald-200" : "bg-rose-400/15 text-rose-200"}`}
                    >
                      {selected.isActive
                        ? "Active account"
                        : "Inactive account"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 p-6 sm:grid-cols-2 sm:p-8">
              {[
                ["First name", selected.firstName],
                ["Last name", selected.lastName],
                ["Email address", selected.email],
                [
                  "Role",
                  selected.roleName || rolesMap[selected.role]?.name || "—",
                ],
                ["Account status", selected.isActive ? "Active" : "Inactive"],
                [
                  "Employee record",
                  selected.employeeId ? "Linked employee" : "User only",
                ],
                ["Company email", selected.companyEmail],
                ["Phone", selected.phone1],
                ["WhatsApp", selected.whatsapp],
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
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                Close
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => openEdit(selected)}
                className="inline-flex items-center gap-2 rounded-xl bg-cm-navy-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-cm-navy-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50"
              >
                <UserRoundPen size={16} /> Edit member
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* PEOPLE DIRECTORY */}
      <section
        id="people-list-panel"
        role="tabpanel"
        aria-labelledby="people-list-heading"
        className="flex flex-col gap-5"
      >
        <div className="flex flex-col gap-4 rounded-2xl border border-[#d8e2ef] bg-[#f8faff] p-5 shadow-[0_3px_14px_rgba(20,40,75,0.035)] sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#d8e2ef] bg-[#eaf1fb] text-cm-navy-950">
              <ContactRound size={19} />
            </div>

            <div>
              <h2
                id="people-list-heading"
                className="text-base font-bold tracking-tight text-cm-navy-950"
              >
                People Directory
              </h2>

              <p className="mt-1 text-xs text-[#71819b]">
                {pagination.total}{" "}
                {pagination.total === 1 ? "member" : "members"} in your company
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:flex lg:items-end">
            <Select
              name="roleFilter"
              label="Role"
              value={activeRole}
              onChange={(event) => {
                setActiveRole(event.target.value);
                setPage(1);
              }}
              placeholder="All roles"
              options={roleOptions}
              containerClassName="w-full sm:w-44"
            />

            <Select
              name="statusFilter"
              label="Employment status"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
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
                placeholder="Search people..."
              />
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#d8e2ef] bg-white shadow-[0_3px_14px_rgba(20,40,75,0.035)]">
          <DataTable
            columns={columns}
            rows={people}
            isLoading={isPeopleLoading}
            emptyMessage={
              debouncedSearch
                ? "No users match your search."
                : "No users found."
            }
            pagination={pagination}
            onPageChange={setPage}
            onPageSizeChange={(nextLimit) => {
              setLimit(nextLimit);
              setPage(1);
            }}
            pageSizeOptions={[10, 25, 50, 100]}
          />
        </div>
      </section>
    </div>
  );
}

export default PeopleManagement;
