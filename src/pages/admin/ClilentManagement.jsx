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
        error.response?.data?.message || "Failed to fetch clients.",
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
      };

      if (form.password) {
        payload.password = form.password;
      }

      if (editingClient) {
        await axios.put(`/api/clients/${editingClient.id}`, payload, {
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
          },
        );

        showToast.success("Client created successfully.");
      }

      closeForm();

      await fetchClients();
    } catch (error) {
      console.error("Failed to save client:", error);

      showToast.error(
        error.response?.data?.message || "Failed to save client.",
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-cm-text">Client Management</h1>

          <p className="mt-1 text-sm text-cm-text-muted">
            Create client login accounts and manage client information.
          </p>
        </div>

        <Button onClick={openAdd}>Add Client</Button>
      </div>

      {isFormOpen && (
        <form
          onSubmit={saveClient}
          className="flex flex-col gap-5 rounded-cm-lg border border-cm-border bg-cm-card p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-cm-text">
                {editingClient ? "Edit Client" : "Create Client"}
              </h2>

              <p className="mt-1 text-xs text-cm-text-muted">
                {editingClient
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
              onChange={(event) => handleChange("lastName", event.target.value)}
            />

            <Input
              label="Email"
              type="email"
              required
              value={form.email}
              onChange={(event) => handleChange("email", event.target.value)}
            />

            <Input
              label="Phone"
              value={form.phone}
              onChange={(event) => handleChange("phone", event.target.value)}
            />

            <Input
              label={editingClient ? "New Password" : "Password"}
              type="password"
              required={!editingClient}
              value={form.password}
              onChange={(event) => handleChange("password", event.target.value)}
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
                ? "Saving..."
                : editingClient
                  ? "Save Changes"
                  : "Create Client"}
            </Button>
          </div>
        </form>
      )}

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
