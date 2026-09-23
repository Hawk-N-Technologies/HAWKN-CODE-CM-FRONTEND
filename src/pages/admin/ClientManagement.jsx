import { useMemo, useState } from "react";
import Button from "../../components/common/Button";
import Badge from "../../components/common/Badge";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import DataTable from "../../components/tables/DataTable";
import TableSearch from "../../components/tables/TableSearch";
import { showToast } from "../../components/common/Toast";

const EMPTY_FORM = {
  name: "",
  contact: "",
  email: "",
  deadline: "",
  internalDeadline: "",
  fieldTraining: "No",
  trainingDays: "",
  brdStatus: "Not Started",
};

const INITIAL_CLIENTS = [
  {
    id: "CLI-001",
    name: "Acme Retail",
    contact: "Priya Shah",
    email: "priya@acme.example",
    deadline: "2026-10-15",
    internalDeadline: "2026-10-05",
    fieldTraining: "Yes",
    trainingDays: "2",
    brdStatus: "Approved",
  },
  {
    id: "CLI-002",
    name: "Northstar Foods",
    contact: "Rahul Mehta",
    email: "rahul@northstar.example",
    deadline: "2026-11-02",
    internalDeadline: "2026-10-24",
    fieldTraining: "No",
    trainingDays: "",
    brdStatus: "Pending Client",
  },
];

const STATUS_TONE = {
  Approved: "success",
  "Pending Client": "warning",
  "Not Started": "neutral",
  "Pending Admin": "info",
};

function ClientManagement() {
  const [clients, setClients] = useState(INITIAL_CLIENTS);
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return clients;
    return clients.filter(
      (client) =>
        client.name.toLowerCase().includes(query) ||
        client.contact.toLowerCase().includes(query) ||
        client.email.toLowerCase().includes(query) ||
        client.brdStatus.toLowerCase().includes(query),
    );
  }, [clients, search]);

  const openAdd = () => {
    setEditingClient(null);
    setForm(EMPTY_FORM);
    setIsFormOpen(true);
  };

  const openEdit = (client) => {
    setEditingClient(client);
    setForm(client);
    setIsFormOpen(true);
  };

  const saveClient = (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.contact.trim() || !form.email.trim()) {
      showToast.error("Please complete the client name, contact and email.");
      return;
    }

    if (editingClient) {
      setClients((prev) =>
        prev.map((client) =>
          client.id === editingClient.id ? { ...client, ...form } : client,
        ),
      );
      showToast.success("Client updated.");
    } else {
      setClients((prev) => [
        { id: `CLI-${String(prev.length + 1).padStart(3, "0")}`, ...form },
        ...prev,
      ]);
      showToast.success("Client added.");
    }

    setIsFormOpen(false);
    setEditingClient(null);
    setForm(EMPTY_FORM);
  };

  const columns = [
    { key: "id", header: "Client ID" },
    { key: "name", header: "Client" },
    { key: "contact", header: "Contact" },
    { key: "deadline", header: "Deadline" },
    { key: "internalDeadline", header: "Internal Deadline" },
    {
      key: "brdStatus",
      header: "BRD Status",
      render: (row) => (
        <Badge tone={STATUS_TONE[row.brdStatus] ?? "neutral"}>
          {row.brdStatus}
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
            Manage clients, project deadlines, field training and BRD status.
          </p>
        </div>
        <Button onClick={openAdd}>Add Client</Button>
      </div>

      {isFormOpen && (
        <form
          onSubmit={saveClient}
          className="flex flex-col gap-4 rounded-cm-lg border border-cm-border bg-cm-card p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-cm-text">
              {editingClient ? "Edit Client" : "Add Client"}
            </h2>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setIsFormOpen(false)}
            >
              Close
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Company / Client Name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              label="Contact Person"
              required
              value={form.contact}
              onChange={(e) => setForm({ ...form, contact: e.target.value })}
            />
            <Input
              label="Email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Input
              label="Project Deadline"
              type="date"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            />
            <Input
              label="Internal Deadline"
              type="date"
              value={form.internalDeadline}
              onChange={(e) =>
                setForm({ ...form, internalDeadline: e.target.value })
              }
            />
            <Select
              label="Field Training"
              value={form.fieldTraining}
              options={[
                { value: "Yes", label: "Yes" },
                { value: "No", label: "No" },
              ]}
              onChange={(e) =>
                setForm({ ...form, fieldTraining: e.target.value })
              }
            />
            <Input
              label="Training Days"
              type="number"
              value={form.trainingDays}
              onChange={(e) =>
                setForm({ ...form, trainingDays: e.target.value })
              }
            />
            <Select
              label="BRD Status"
              value={form.brdStatus}
              options={[
                { value: "Not Started", label: "Not Started" },
                { value: "Pending Admin", label: "Pending Admin" },
                { value: "Pending Client", label: "Pending Client" },
                { value: "Approved", label: "Approved" },
              ]}
              onChange={(e) => setForm({ ...form, brdStatus: e.target.value })}
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
              {editingClient ? "Save Changes" : "Add Client"}
            </Button>
          </div>
        </form>
      )}

      <div className="flex flex-col gap-4">
        <TableSearch
          value={search}
          onChange={setSearch}
          placeholder="Search clients, contact or BRD status…"
        />
        <DataTable
          columns={columns}
          rows={filtered}
          emptyMessage="No clients found."
        />
      </div>
    </div>
  );
}

export default ClientManagement;
