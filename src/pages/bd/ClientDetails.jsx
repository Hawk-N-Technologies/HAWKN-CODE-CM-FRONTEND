import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../../components/common/Button";
import Badge from "../../components/common/Badge";
import Loader from "../../components/common/Loader";
import ErrorState from "../../components/common/ErrorState";
import ClientForm from "../../components/forms/ClientForm";
import { showToast } from "../../components/common/Toast";
import * as clientService from "../../services/clientService";

const STATUS_TONE = { Lead: "warning", Active: "success", Inactive: "neutral" };

/**
 * BD -> single client: view, edit (via ClientForm), or delete.
 */
function ClientDetails() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(false);

  const loadClient = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await clientService.getClientById(clientId);
      setClient(data);
    } catch {
      setError("Client not found.");
    } finally {
      setIsLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    // Legitimate fetch-on-mount; loadClient sets loading/error/data state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadClient();
  }, [loadClient]);

  const handleSave = async (values) => {
    setIsSaving(true);
    try {
      const updated = await clientService.updateClient(clientId, values);
      setClient(updated);
      setIsEditing(false);
      showToast.success("Client updated.");
    } catch {
      showToast.error("Couldn't save changes. Try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) {
      setPendingDelete(true);
      return;
    }
    try {
      await clientService.deleteClient(clientId);
      showToast.info("Client removed.");
      navigate("/bd/clients", { replace: true });
    } catch {
      showToast.error("Couldn't remove the client. Try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-cm-lg border border-cm-border bg-cm-card">
        <Loader context="section" label="Loading client…" />
      </div>
    );
  }

  if (error || !client) {
    return <ErrorState description={error ?? "Client not found."} onRetry={loadClient} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate("/bd/clients")}
            className="text-sm text-cm-blue-700 hover:underline"
          >
            ← Back to Clients
          </button>
          <div className="mt-2 flex items-center gap-3">
            <h1 className="text-xl font-bold text-cm-text">{client.companyName}</h1>
            <Badge tone={STATUS_TONE[client.status] ?? "neutral"}>{client.status}</Badge>
          </div>
        </div>

        {!isEditing && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              {pendingDelete ? "Confirm delete?" : "Delete"}
            </Button>
          </div>
        )}
      </div>

      {isEditing ? (
        <ClientForm
          initialValues={client}
          onSubmit={handleSave}
          onCancel={() => setIsEditing(false)}
          isSaving={isSaving}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 rounded-cm-lg border border-cm-border bg-cm-card p-6 shadow-sm sm:grid-cols-2">
          <div>
            <p className="text-xs text-cm-text-muted">Contact Person</p>
            <p className="text-sm text-cm-text">{client.contactName}</p>
          </div>
          <div>
            <p className="text-xs text-cm-text-muted">Email</p>
            <p className="text-sm text-cm-text">{client.email}</p>
          </div>
          <div>
            <p className="text-xs text-cm-text-muted">Phone</p>
            <p className="text-sm text-cm-text">{client.phone}</p>
          </div>
          <div>
            <p className="text-xs text-cm-text-muted">City</p>
            <p className="text-sm text-cm-text">{client.city}</p>
          </div>
          <div>
            <p className="text-xs text-cm-text-muted">Industry</p>
            <p className="text-sm text-cm-text">{client.industry}</p>
          </div>
          <div>
            <p className="text-xs text-cm-text-muted">Added On</p>
            <p className="text-sm text-cm-text">{client.createdDate}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClientDetails;