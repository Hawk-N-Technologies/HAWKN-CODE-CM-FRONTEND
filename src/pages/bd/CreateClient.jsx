import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ClientForm from "../../components/forms/ClientForm";
import { showToast } from "../../components/common/Toast";
import * as clientService from "../../services/clientService";

/**
 * BD -> Add a new client. On success, navigates to that client's
 * detail page (BRD pattern: "Successful creation -> Details/List").
 */
function CreateClient() {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (values) => {
    setIsSaving(true);
    try {
      const newClient = await clientService.createClient(values);
      showToast.success("Client added.");
      navigate(`/bd/clients/${newClient.id}`, { replace: true });
    } catch {
      showToast.error("Couldn't add the client. Try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-cm-text">Add Client</h1>
        <p className="mt-1 text-sm text-cm-text-muted">
          Create a new lead or client record.
        </p>
      </div>

      <ClientForm
        onSubmit={handleSubmit}
        onCancel={() => navigate("/bd/clients")}
        isSaving={isSaving}
      />
    </div>
  );
}

export default CreateClient;