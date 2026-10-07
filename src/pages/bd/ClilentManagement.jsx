import { useEffect, useMemo, useState } from "react";
import axios from "axios";

import Button from "../../components/common/Button";
import Badge from "../../components/common/Badge";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import Loader from "../../components/common/Loader";
import DataTable from "../../components/tables/DataTable";
import TableSearch from "../../components/tables/TableSearch";
import { showToast } from "../../components/common/Toast";

const EMPTY_FORM = {
  id: null,
  uuid: null,

  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",

  phone: "",
  address: "",
};

const STATUS_TONE = {
  Active: "success",
  Inactive: "danger",
};

function ClientManagement() {
  const [clients, setClients] = useState([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [isFormOpen, setIsFormOpen] = useState(false);

  const [selected, setSelected] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);

  const [errors, setErrors] = useState({});

  /**
   * -------------------------------------------------------
   * FETCH CLIENTS
   * -------------------------------------------------------
   */
  const fetchClients = async () => {
    try {
      setLoading(true);

      const response = await axios.get("/api/clients", {
        withCredentials: true,
      });

      const data = Array.isArray(response.data?.data) ? response.data.data : [];

      setClients(data);
    } catch (error) {
      console.error("Failed to fetch clients:", error);

      setClients([]);

      showToast.error(
        error.response?.data?.message || "Failed to fetch clients.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

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

      case "phone":
        if (!formValue) {
          return "";
        }

        if (!/^[6-9]\d{9}$/.test(formValue)) {
          return "Enter a valid 10-digit mobile number.";
        }

        return "";

      case "address":
        if (formValue && formValue.trim().length < 5) {
          return "Address must be at least 5 characters.";
        }

        return "";

      default:
        return "";
    }
  };

  /**
   * -------------------------------------------------------
   * FULL FORM VALIDATION
   * -------------------------------------------------------
   */
  const validateClientForm = (currentForm) => {
    const validationErrors = {};

    const fields = [
      "firstName",
      "lastName",
      "email",
      "password",
      "confirmPassword",
      "phone",
      "address",
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

      /**
       * Confirm password depends on password.
       */
      if (field === "confirmPassword") {
        const confirmError = validateField("confirmPassword", value, nextForm);

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
    if (saving) {
      return;
    }

    setForm({
      ...EMPTY_FORM,
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
  const openEdit = (client) => {
    if (saving) {
      return;
    }

    const user = client.user || {};

    setForm({
      ...EMPTY_FORM,

      id: client.id,
      uuid: client.uuid,

      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",

      password: "",
      confirmPassword: "",

      phone: client.phone || "",
      address: client.address || "",
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
    if (saving) {
      return;
    }

    setIsFormOpen(false);
    setErrors({});
    setForm(EMPTY_FORM);
  };

  /**
   * -------------------------------------------------------
   * SAVE CLIENT
   * -------------------------------------------------------
   */
  const saveClient = async (event) => {
    event.preventDefault();

    if (saving) {
      return;
    }

    const validationErrors = validateClientForm(form);

    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      showToast.error("Please fix the validation errors.");
      return;
    }

    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),

      phone: form.phone.trim() || null,
      address: form.address.trim() || null,
    };

    /**
     * Password is required only during creation.
     * During update it is optional.
     */
    if (!form.id) {
      payload.password = form.password;
      payload.confirmPassword = form.confirmPassword;
    } else if (form.password || form.confirmPassword) {
      payload.password = form.password;
      payload.confirmPassword = form.confirmPassword;
    }

    try {
      setSaving(true);

      let response;

      if (form.uuid && form.id) {
        response = await axios.put(`/api/clients/${form.uuid}`, payload, {
          withCredentials: true,
        });

        showToast.success(
          response.data?.message || "Client updated successfully.",
        );
      } else {
        response = await axios.post("/api/clients", payload, {
          withCredentials: true,
        });

        showToast.success(
          response.data?.message || "Client created successfully.",
        );
      }

      await fetchClients();

      setIsFormOpen(false);
      setForm(EMPTY_FORM);
      setErrors({});
    } catch (error) {
      console.error("Failed to save client:", error);

      showToast.error(
        error.response?.data?.message || "Failed to save client.",
      );
    } finally {
      setSaving(false);
    }
  };

  /**
   * -------------------------------------------------------
   * SEARCH
   * -------------------------------------------------------
   */
  const filteredClients = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return clients;
    }

    return clients.filter((client) => {
      const user = client.user || {};

      const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();

      return (
        fullName.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        client.phone?.toLowerCase().includes(query) ||
        client.address?.toLowerCase().includes(query)
      );
    });
  }, [clients, search]);

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
      header: "Client",

      render: (row) => {
        const user = row.user || {};

        return (
          <div>
            <p className="font-medium text-cm-text">
              {user.firstName || ""} {user.lastName || ""}
            </p>

            <p className="text-xs text-cm-text-muted">{user.email || "—"}</p>
          </div>
        );
      },
    },

    {
      key: "phone",
      header: "Phone",

      render: (row) => row.phone || "—",
    },

    {
      key: "role",
      header: "Role",

      render: (row) => (
        <Badge tone="info">{row.user?.role?.name || "Client"}</Badge>
      ),
    },

    {
      key: "status",
      header: "Status",

      render: (row) => {
        const active = row.user?.isActive ?? row.isActive;

        return (
          <Badge tone={active ? "success" : "danger"}>
            {active ? "Active" : "Inactive"}
          </Badge>
        );
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
            disabled={saving}
            onClick={() => setSelected(row)}
          >
            Profile
          </Button>

          <Button
            size="sm"
            variant="outline"
            disabled={saving}
            onClick={() => openEdit(row)}
          >
            Edit
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-cm-text">Client Management</h1>

          <p className="mt-1 text-sm text-cm-text-muted">
            Create client login accounts and manage client information.
          </p>
        </div>

        <Button onClick={openAdd} disabled={saving}>
          Add Client
        </Button>
      </div>

      {/* FORM */}
      {isFormOpen && (
        <form
          onSubmit={saveClient}
          className="flex flex-col gap-5 rounded-cm-lg border border-cm-border bg-cm-card p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-cm-text">
                {form.id ? "Edit Client" : "Create Client"}
              </h2>

              <p className="mt-1 text-xs text-cm-text-muted">
                {form.id
                  ? "Update client account and information."
                  : "Create a client account with login credentials."}
              </p>
            </div>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={closeForm}
              disabled={saving}
            >
              Close
            </Button>
          </div>

          <fieldset disabled={saving} className="flex flex-col gap-4">
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

              {/* PHONE */}
              <Input
                label="Phone"
                value={form.phone}
                error={errors.phone}
                onChange={handleChange("phone")}
              />

              {/* PASSWORD */}
              <Input
                label={form.id ? "New Password" : "Password"}
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
                value="Client"
                disabled
                options={[
                  {
                    value: "Client",
                    label: "Client",
                  },
                ]}
                onChange={() => {}}
              />

              {/* ADDRESS */}
              <div className="md:col-span-2">
                <Input
                  label="Address"
                  value={form.address}
                  error={errors.address}
                  onChange={handleChange("address")}
                />
              </div>
            </div>
          </fieldset>

          {/* FORM ACTIONS */}
          <div className="flex justify-end gap-3 border-t border-cm-border pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={closeForm}
              disabled={saving}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={saving}>
              {saving
                ? form.id
                  ? "Saving..."
                  : "Creating..."
                : form.id
                  ? "Save Changes"
                  : "Create Client"}
            </Button>
          </div>
        </form>
      )}

      {/* CLIENT PROFILE / VIEW */}
      {selected && (
        <section className="rounded-cm-lg border border-cm-border bg-cm-card p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs text-cm-text-muted">
                Client ID: {selected.id}
              </p>

              <h2 className="mt-1 text-lg font-semibold text-cm-text">
                {selected.user?.firstName || ""} {selected.user?.lastName || ""}
              </h2>

              <p className="mt-1 text-sm text-cm-text-muted">
                {selected.user?.role?.name || "Client"}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={saving}
                onClick={() => openEdit(selected)}
              >
                Edit
              </Button>

              <Button
                size="sm"
                variant="outline"
                disabled={saving}
                onClick={() => setSelected(null)}
              >
                Close
              </Button>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["First Name", selected.user?.firstName],
              ["Last Name", selected.user?.lastName || "—"],
              ["Email", selected.user?.email],
              ["Phone", selected.phone || "—"],
              ["Role", selected.user?.role?.name || "Client"],
              ["Status", selected.user?.isActive ? "Active" : "Inactive"],
              ["Address", selected.address || "—"],
              [
                "Created",
                selected.createdAt
                  ? new Date(selected.createdAt).toLocaleDateString()
                  : "—",
              ],
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
          placeholder="Search client, email, address or phone..."
        />

        {loading ? (
          <div className="flex min-h-[250px] items-center justify-center">
            <Loader />
          </div>
        ) : (
          <DataTable
            columns={columns}
            rows={filteredClients}
            emptyMessage={
              search ? "No clients match your search." : "No clients found."
            }
          />
        )}
      </div>
    </div>
  );
}

export default ClientManagement;
