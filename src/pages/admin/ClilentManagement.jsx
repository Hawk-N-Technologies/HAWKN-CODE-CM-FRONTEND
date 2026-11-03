
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
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
  phone: "",
  address: "",
  type: "lead",
  gst: "",
  domain: "",
};

function ClientManagement() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const fetchClients = async () => {
    try {
      setLoading(true);

      const response = await axios.get("/api/clients", {
        withCredentials: true,
      });

      setClients(response.data?.data || []);
    } catch (error) {
      console.error("Failed to fetch clients:", error);

      showToast.error(
        error.response?.data?.message || "Failed to fetch clients."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleChange = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const openAdd = () => {
    setEditingClient(null);
    setForm(EMPTY_FORM);
    setIsFormOpen(true);
  };

  const openEdit = (client) => {
    const user = client.user || {};

    setEditingClient(client);

    setForm({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      password: "",
      confirmPassword: "",
      phone: client.phone || "",
      gst: client.gst || "",
      type: client.type || "lead",
      domain: client.domain || "",
      address: client.address || "",
    });

    setIsFormOpen(true);
  };

  const closeForm = () => {
    if (saving) {
      return;
    }

    setIsFormOpen(false);
    setEditingClient(null);
    setForm(EMPTY_FORM);
  };

  const saveClient = async (event) => {
    event.preventDefault();

    if (!form.firstName.trim()) {
      showToast.error("First name is required.");
      return;
    }

    if (!form.email.trim()) {
      showToast.error("Email is required.");
      return;
    }

    // Password required only while creating.
    if (!editingClient && !form.password) {
      showToast.error("Password is required.");
      return;
    }

    if (form.password && form.password.length < 8) {
      showToast.error("Password must be at least 8 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      showToast.error("Password and confirm password do not match.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim() || null,
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        type: form.type || "",
        gst: form.gst.trim() || null,
        domain: form.domain.trim() || "",
        confirmPassword: form.confirmPassword,
      };

      if (form.password) {
        payload.password = form.password;
      }

      if (editingClient) {
        await axios.put(`/api/clients/${editingClient.uuid}`, payload, {
          withCredentials: true,
        });

        showToast.success("Client updated successfully.");
      } else {
        await axios.post(
          "/api/clients",
          {
            ...payload,
            password: form.password,
          },
          {
            withCredentials: true,
          }
        );

        showToast.success("Client created successfully.");
      }

      closeForm();

      await fetchClients();
    } catch (error) {
      console.error("Failed to save client:", error);

      showToast.error(
        error.response?.data?.message || "Failed to save client."
      );
    } finally {
      setSaving(false);
    }
  };

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
        client.phone?.toLowerCase().includes(query)
      );
    });
  }, [clients, search]);

  const columns = [
    {
      key: "name",
      header: "Client",
      render: (row) => {
        const user = row.user || {};

        return (
          <div>
            <p className="font-medium text-cm-text">
              {user.firstName} {user.lastName || ""}
            </p>

            <p className="text-xs text-cm-text-muted">
              {user.email || "—"}
            </p>
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
      render: (row) => (
        <Badge tone={row.user?.isActive ? "success" : "danger"}>
          {row.user?.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <Button size="sm" variant="outline" onClick={() => openEdit(row)}>
          View / Edit
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="relative isolate overflow-hidden rounded-[24px] border border-slate-200 bg-gradient-to-br from-white via-white to-blue-50/70 px-6 py-6 shadow-sm sm:px-8">
        <div className="pointer-events-none absolute -right-16 -top-32 h-80 w-80 rounded-full border-2 border-blue-100/80" />
        <div className="pointer-events-none absolute -right-5 -top-24 h-56 w-56 rounded-full border-2 border-blue-100/80" />

        <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] bg-[#0b1833] text-lg font-bold text-white shadow-md">
              CM
            </div>

            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-700 sm:text-sm">
                Administration
              </p>

              <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Client Management
              </h1>

              <p className="mt-2 text-sm text-slate-500 sm:text-base">
                Create client login accounts and manage client information.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-sm font-medium text-slate-500">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Client workspace
                </span>

                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-sm font-medium text-slate-500">
                  {clients.length} client records
                </span>
              </div>
            </div>
          </div>

          <div className="relative z-10 shrink-0">
            <Button onClick={openAdd}>Add Client</Button>
          </div>
        </div>
      </div>

      {/* Add / Edit Client Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-sm sm:p-5">
          <form
            onSubmit={saveClient}
            className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
          >
            {/* Modal Header */}
            <div className="relative isolate shrink-0 overflow-hidden bg-gradient-to-r from-[#0b1833] via-[#122b4d] to-[#1c4168] px-6 py-5 sm:px-7">
              <div className="pointer-events-none absolute -right-10 -top-24 h-64 w-64 rounded-full border border-white/10" />
              <div className="pointer-events-none absolute -right-2 -top-20 h-48 w-48 rounded-full border border-white/10" />

              <div className="relative z-10 flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-sm font-bold text-white shadow-sm">
                    CM
                  </div>

                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-200">
                      Client Management
                    </p>

                    <h2 className="mt-1 text-xl font-bold tracking-tight text-white sm:text-2xl">
                      {editingClient ? "Edit Client" : "Create Client"}
                    </h2>

                    <p className="mt-1 text-sm text-blue-100/80">
                      {editingClient
                        ? "Update client account and information."
                        : "Create a client account with login credentials."}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <span className="hidden rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white sm:inline-flex">
                    {editingClient ? "EDIT CLIENT" : "NEW CLIENT"}
                  </span>

                  <button
                    type="button"
                    onClick={closeForm}
                    disabled={saving}
                    aria-label="Close client form"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-xl text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-7">
              <div className="mb-5">
                <h3 className="text-sm font-semibold text-slate-800">
                  Client Information
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Enter the client's account details and contact information.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input
                  label="First Name"
                  required
                  value={form.firstName}
                  onChange={(event) =>
                    handleChange("firstName", event.target.value)
                  }
                />

                <Input
                  label="Last Name"
                  value={form.lastName}
                  onChange={(event) =>
                    handleChange("lastName", event.target.value)
                  }
                />

                <Input
                  label="Email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(event) =>
                    handleChange("email", event.target.value)
                  }
                />

                <Input
                  label="Phone"
                  value={form.phone}
                  onChange={(event) =>
                    handleChange("phone", event.target.value)
                  }
                />

                <Input
                  label={editingClient ? "New Password" : "Password"}
                  type="password"
                  required={!editingClient}
                  value={form.password}
                  onChange={(event) =>
                    handleChange("password", event.target.value)
                  }
                />

                <Input
                  label="Confirm Password"
                  type="password"
                  required={!editingClient}
                  value={form.confirmPassword}
                  onChange={(event) =>
                    handleChange("confirmPassword", event.target.value)
                  }
                />

                <Input
                  label="GST"
                  value={form.gst}
                  onChange={(event) =>
                    handleChange("gst", event.target.value)
                  }
                />

                <Input
                  label="Domain"
                  value={form.domain}
                  onChange={(event) =>
                    handleChange("domain", event.target.value)
                  }
                />

                <Select
                  label="Type"
                  value={form.type}
                  options={[
                    { value: "lead", label: "Lead" },
                    { value: "converted", label: "Convert" },
                  ]}
                  onChange={(e) => {
                    handleChange("type", e.target.value);
                  }}
                />

                <Select
                  label="Role"
                  value="Client"
                  disabled
                  options={[{ value: "Client", label: "Client" }]}
                  onChange={() => {}}
                />

                <div className="md:col-span-2">
                  <Input
                    label="Address"
                    value={form.address}
                    onChange={(event) =>
                      handleChange("address", event.target.value)
                    }
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex shrink-0 flex-wrap justify-end gap-3 border-t border-slate-200 bg-slate-50/80 px-6 py-4 sm:px-7">
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
                  ? "Saving..."
                  : editingClient
                    ? "Save Changes"
                    : "Create Client"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Client Search and Table */}
      <div className="flex flex-col gap-4">
        <TableSearch
          value={search}
          onChange={setSearch}
          placeholder="Search client, email, company or phone..."
        />

        {loading ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <Loader />
          </div>
        ) : (
          <DataTable
            columns={columns}
            rows={filteredClients}
            emptyMessage="No clients found."
          />
        )}
      </div>
    </div>
  );
}

export default ClientManagement;
