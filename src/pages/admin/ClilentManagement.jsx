import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  Building2,
  CheckCircle2,
  CircleUserRound,
  Globe2,
  Mail,
  MapPin,
  PencilLine,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";

import Button from "../../components/common/Button";
import Badge from "../../components/common/Badge";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
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

const INITIAL_PAGINATION = {
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
};

const SEARCH_DEBOUNCE_MS = 400;

const getClientName = (client) => {
  const user = client?.user || {};
  return `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Unnamed Client";
};

function ClientManagement() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [refreshKey, setRefreshKey] = useState(0);

  const [pagination, setPagination] = useState(INITIAL_PAGINATION);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  // --------------------------------------------------
  // DEBOUNCED SEARCH
  // --------------------------------------------------

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [search]);

  // --------------------------------------------------
  // FETCH CLIENTS
  // --------------------------------------------------

  const fetchClients = useCallback(
    async (signal) => {
      try {
        setLoading(true);

        const response = await axios.get("/api/clients", {
          params: {
            search: debouncedSearch || undefined,
            page,
            limit,
          },
          withCredentials: true,
          signal,
        });

        if (signal?.aborted) return;

        const result = response.data;

        setClients(Array.isArray(result?.data) ? result.data : []);

        setPagination({
          total: Number(result?.pagination?.total) || 0,
          page: Number(result?.pagination?.page) || page,
          limit: Number(result?.pagination?.limit) || limit,
          totalPages: Number(result?.pagination?.totalPages) || 0,
        });
      } catch (error) {
        if (signal?.aborted || axios.isCancel(error)) return;

        console.error("Failed to fetch clients:", error);

        showToast.error(
          error.response?.data?.message || "Failed to fetch clients."
        );
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [debouncedSearch, page, limit]
  );

  // --------------------------------------------------
  // FETCH EFFECT
  // --------------------------------------------------

  useEffect(() => {
    const controller = new AbortController();

    fetchClients(controller.signal);

    return () => {
      controller.abort();
    };
  }, [fetchClients, refreshKey]);

  // --------------------------------------------------
  // FORM HANDLERS
  // --------------------------------------------------

  const handleChange = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleSearch = (value) => {
    setSearch(value);
  };

  const openAdd = () => {
    setEditingClient(null);
    setForm({ ...EMPTY_FORM });
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
    if (saving) return;

    setIsFormOpen(false);
    setEditingClient(null);
    setForm({ ...EMPTY_FORM });
  };

  // --------------------------------------------------
  // VALIDATE FORM
  // --------------------------------------------------

  const validateForm = () => {
    if (!form.firstName.trim()) {
      showToast.error("First name is required.");
      return false;
    }

    if (!form.email.trim()) {
      showToast.error("Email is required.");
      return false;
    }

    if (!editingClient && !form.password) {
      showToast.error("Password is required.");
      return false;
    }

    if (form.password && form.password.length < 8) {
      showToast.error("Password must be at least 8 characters.");
      return false;
    }

    if (form.password !== form.confirmPassword) {
      showToast.error("Password and confirm password do not match.");
      return false;
    }

    return true;
  };

  // --------------------------------------------------
  // CREATE / UPDATE CLIENT
  // --------------------------------------------------

  const saveClient = async (event) => {
    event.preventDefault();

    if (saving || !validateForm()) return;

    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim() || null,
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      address: form.address.trim() || null,
      type: form.type || "lead",
      gst: form.gst.trim() || null,
      domain: form.domain.trim() || "",
      confirmPassword: form.confirmPassword,
    };

    if (form.password) {
      payload.password = form.password;
    }

    try {
      setSaving(true);

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
          { withCredentials: true }
        );

        showToast.success("Client created successfully.");
      }

      setIsFormOpen(false);
      setEditingClient(null);
      setForm({ ...EMPTY_FORM });

      // Refresh data without resetting the search.
      setRefreshKey((previous) => previous + 1);
    } catch (error) {
      console.error("Failed to save client:", error);

      showToast.error(
        error.response?.data?.message || "Failed to save client."
      );
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------
  // TABLE COLUMNS
  // --------------------------------------------------

  const columns = [
    {
      key: "name",
      header: "Client",
      render: (row) => {
        const user = row.user || {};
        const name = getClientName(row);

        return (
          <div className="flex min-w-[190px] items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-sm font-bold text-[#17345c]">
              {name
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part.charAt(0).toUpperCase())
                .join("")}
            </div>

            <div className="min-w-0">
              <p className="truncate font-semibold text-cm-text">
                {name}
              </p>
              <p className="truncate text-xs text-cm-text-muted">
                {user.email || "—"}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      key: "phone",
      header: "Phone",
      render: (row) => (
        <span className="whitespace-nowrap text-sm text-cm-text">
          {row.phone || "—"}
        </span>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (row) => (
        <Badge tone="info">
          {row.user?.role?.name || "Client"}
        </Badge>
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
      header: "Actions",
      render: (row) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => openEdit(row)}
        >
          <PencilLine className="mr-1.5 h-3.5 w-3.5" />
          View / Edit
        </Button>
      ),
    },
  ];

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div className="flex flex-col gap-6 text-cm-text">
      {/* PAGE HEADER */}
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

        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-blue-100">
              <Users className="h-6 w-6" aria-hidden="true" />
            </div>

            <div className="min-w-0">
              <span className="inline-flex items-center rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-200">
                ADMINISTRATION
              </span>

              <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-[34px]">
                Client Management
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Manage client accounts, contact information and client workspace access.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3 py-1.5 text-xs font-medium text-slate-200">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Client workspace
                </span>

                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3 py-1.5 text-xs font-medium text-slate-200">
                  <Users className="h-3.5 w-3.5 text-blue-200" />
                  {pagination.total} client records
                </span>
              </div>
            </div>
          </div>

          <div className="relative z-10 shrink-0">
            <Button onClick={openAdd}>
              <Plus className="mr-1.5 h-4 w-4" />
              Add Client
            </Button>
          </div>
        </div>
      </header>

      {/* CLIENT OVERVIEW */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-4 rounded-2xl border border-cm-border bg-cm-card p-5 shadow-sm">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-800">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-cm-text-muted">
              Total client records
            </p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-cm-text">
              {loading && clients.length === 0 ? "…" : pagination.total}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-cm-border bg-cm-card p-5 shadow-sm">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-cm-text-muted">
              Current page
            </p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-cm-text">
              {pagination.totalPages > 0
                ? `${pagination.page} / ${pagination.totalPages}`
                : "—"}
            </p>
          </div>
        </div>
      </section>

      {/* CLIENT DIRECTORY */}
      <section className="overflow-hidden rounded-2xl border border-cm-border bg-cm-card shadow-sm">
        <div className="flex flex-col gap-4 border-b border-cm-border px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <Building2 className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-base font-bold text-cm-text">
                Client Directory
              </h2>
              <p className="mt-1 text-xs text-cm-text-muted">
                Search and manage registered client accounts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-cm-text-muted">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {loading ? "Updating records..." : "Directory"}
          </div>
        </div>

        <div className="flex flex-col gap-4 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="w-full sm:max-w-md">
              <TableSearch
                value={search}
                onChange={handleSearch}
                placeholder="Search client, email, company or phone..."
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg border border-cm-border bg-cm-card px-3 py-2 text-xs font-medium text-cm-text-muted">
                {pagination.total} total records
              </span>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setRefreshKey((previous) => previous + 1)}
                disabled={loading}
              >
                <RefreshCw
                  className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-cm-border">
            <DataTable
              columns={columns}
              rows={clients}
              isLoading={loading}
              emptyMessage={
                debouncedSearch
                  ? "No clients match your search."
                  : "No clients found."
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
        </div>
      </section>

      {/* ADD / EDIT CLIENT MODAL */}
      {isFormOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeForm();
          }}
        >
          <form
            onSubmit={saveClient}
            className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
          >
            {/* MODAL HEADER */}
            <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-[#080d25] via-[#0b1734] to-[#1b2052] px-6 py-5 sm:px-7">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-10 -top-24 h-64 w-64 rounded-full border border-white/10"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-2 -top-20 h-48 w-48 rounded-full border border-white/10"
              />

              <div className="relative z-10 flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-blue-100">
                    {editingClient ? (
                      <PencilLine className="h-5 w-5" />
                    ) : (
                      <CircleUserRound className="h-5 w-5" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-200">
                      Client Management
                    </p>

                    <h2 className="mt-1 text-xl font-bold tracking-tight text-white sm:text-2xl">
                      {editingClient ? "Edit Client" : "Create Client"}
                    </h2>

                    <p className="mt-1 text-sm text-slate-300">
                      {editingClient
                        ? "Update client account and information."
                        : "Create a client account with login credentials."}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <span className="hidden rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-semibold tracking-wider text-white sm:inline-flex">
                    {editingClient ? "EDIT CLIENT" : "NEW CLIENT"}
                  </span>

                  <button
                    type="button"
                    onClick={closeForm}
                    disabled={saving}
                    aria-label="Close client form"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* MODAL BODY */}
            <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-7">
              {/* PERSONAL INFORMATION */}
              <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-800">
                  <CircleUserRound className="h-4 w-4" />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Client Information
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Personal details and account contact information.
                  </p>
                </div>
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
              </div>

              {/* ACCOUNT CREDENTIALS */}
              <div className="mb-5 mt-8 flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-800">
                  <ShieldCheck className="h-4 w-4" />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Account Credentials
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {editingClient
                      ? "Leave password fields empty to retain the existing password."
                      : "Set the login password for this client account."}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
              </div>

              {/* BUSINESS INFORMATION */}
              <div className="mb-5 mt-8 flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-800">
                  <Building2 className="h-4 w-4" />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Business Information
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Client classification and business details.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                  onChange={(event) =>
                    handleChange("type", event.target.value)
                  }
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

              <div className="mt-6 flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50/70 p-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" />
                <p className="text-xs leading-5 text-blue-900">
                  Client information is managed through the existing account
                  workflow. Required fields and password validation are
                  enforced when saving.
                </p>
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-7">
              <p className="hidden text-xs text-slate-500 sm:block">
                {editingClient
                  ? "Changes will update this client record."
                  : "A new client account will be created."}
              </p>

              <div className="ml-auto flex flex-wrap justify-end gap-3">
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
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default ClientManagement;
