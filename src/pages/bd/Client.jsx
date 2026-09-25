import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/common/Button";
import Badge from "../../components/common/Badge";
import Loader from "../../components/common/Loader";
import ErrorState from "../../components/common/ErrorState";
import DataTable from "../../components/tables/DataTable";
import TableSearch from "../../components/tables/TableSearch";
import TablePagination from "../../components/tables/TablePagination";
import { showToast } from "../../components/common/Toast";
import * as clientService from "../../services/clientService";

const PAGE_SIZE = 5;

const STATUS_TONE = { Lead: "warning", Active: "success", Inactive: "neutral" };

/**
 * BD -> Client Management (list). Add/Edit are separate pages
 * (CreateClient.jsx, ClientDetails.jsx) rather than an inline form,
 * per the existing scaffold's page split.
 */
function Client() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  const loadClients = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await clientService.getClients();
      setClients(data);
    } catch {
      setError("Couldn't load clients.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Legitimate fetch-on-mount; loadClients sets loading/error/data state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadClients();
  }, [loadClients]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return clients;
    return clients.filter(
      (c) =>
        c.companyName.toLowerCase().includes(query) ||
        c.contactName.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query),
    );
  }, [clients, search]);

  const paginated = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page],
  );

  const handleDeleteClick = async (id) => {
    if (pendingDeleteId !== id) {
      setPendingDeleteId(id);
      return;
    }
    try {
      await clientService.deleteClient(id);
      setClients((prev) => prev.filter((c) => c.id !== id));
      showToast.info("Client removed.");
    } catch {
      showToast.error("Couldn't remove the client. Try again.");
    } finally {
      setPendingDeleteId(null);
    }
  };

  const columns = [
    {
      key: "companyName",
      header: "Client",
      render: (row) => (
        <button
          type="button"
          onClick={() => navigate(`/bd/clients/${row.id}`)}
          className="text-left font-medium text-cm-blue-700 hover:underline"
        >
          {row.companyName}
        </button>
      ),
    },
    { key: "contactName", header: "Contact" },
    { key: "email", header: "Email" },
    { key: "city", header: "City" },
    { key: "industry", header: "Industry" },
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
            onClick={() => navigate(`/bd/clients/${row.id}`)}
          >
            View
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => handleDeleteClick(row.id)}
          >
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
          <h1 className="text-xl font-bold text-cm-text">Client Management</h1>
          <p className="mt-1 text-sm text-cm-text-muted">
            Leads and active clients.
          </p>
        </div>
        <Button onClick={() => navigate("/bd/clients/new")}>Add Client</Button>
      </div>

      {error ? (
        <ErrorState description={error} onRetry={loadClients} />
      ) : (
        <div className="flex flex-col gap-4">
          <TableSearch
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="Search by company, contact, email…"
          />

          {isLoading ? (
            <div className="rounded-cm-lg border border-cm-border bg-cm-card">
              <Loader context="section" label="Loading clients…" />
            </div>
          ) : (
            <>
              <DataTable
                columns={columns}
                rows={paginated}
                emptyMessage="No clients match your search."
              />
              <TablePagination
                page={page}
                pageSize={PAGE_SIZE}
                total={filtered.length}
                onPageChange={setPage}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default Client;
