import { useState } from "react";
import { useForm } from "react-hook-form";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import { showToast } from "../../components/common/Toast";
import { required } from "../../utils/validators";

/**
 * Admin -> Company Policies (BRD 2.1: "Maintain common company policies").
 *
 * Kept separate from Company Profile because the BRD/planning doc treats
 * them as distinct pages. All state is local (no backend yet) — swap
 * `policies` for a real fetch and the add/edit/delete handlers for real
 * API calls once the backend exists; the JSX below shouldn't need to change.
 */
const EMPTY_FORM = { title: "", content: "" };

function CompanyPolicies() {
  const [policies, setPolicies] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: EMPTY_FORM });

  const startEdit = (policy) => {
    setEditingId(policy.id);
    setPendingDeleteId(null);
    reset({ title: policy.title, content: policy.content });
  };

  const cancelEdit = () => {
    setEditingId(null);
    reset(EMPTY_FORM);
  };

  const onSubmit = async (values) => {
    setIsSaving(true);
    try {
      // TODO: replace with a real API call once the backend exists.
      await new Promise((resolve) => setTimeout(resolve, 400));

      if (editingId) {
        setPolicies((prev) =>
          prev.map((policy) =>
            policy.id === editingId ? { ...policy, ...values } : policy
          )
        );
        showToast.success("Policy updated.");
      } else {
        setPolicies((prev) => [
          ...prev,
          { id: crypto.randomUUID(), ...values },
        ]);
        showToast.success("Policy added.");
      }

      setEditingId(null);
      reset(EMPTY_FORM);
    } catch {
      showToast.error("Couldn't save the policy. Try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (id) => {
    if (pendingDeleteId === id) {
      setPolicies((prev) => prev.filter((policy) => policy.id !== id));
      setPendingDeleteId(null);
      showToast.info("Policy removed.");
      if (editingId === id) cancelEdit();
    } else {
      setPendingDeleteId(id);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-cm-text">Company Policies</h1>
        <p className="mt-1 text-sm text-cm-text-muted">
          Policies employees and, where relevant, clients are expected to follow.
        </p>
      </div>

      {/* Add / edit form */}
      <form
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-4 rounded-cm-lg border border-cm-border bg-cm-card p-6 shadow-sm"
      >
        <h2 className="text-sm font-semibold text-cm-text">
          {editingId ? "Edit Policy" : "Add a Policy"}
        </h2>

        <Input
          label="Title"
          required
          placeholder="e.g. Leave Policy"
          error={errors.title?.message}
          {...register("title", { required: required("Title") })}
        />

        <Input
          label="Content"
          multiline
          rows={4}
          required
          placeholder="What the policy covers…"
          error={errors.content?.message}
          {...register("content", { required: required("Content") })}
        />

        <div className="flex items-center justify-end gap-3">
          {editingId && (
            <Button type="button" variant="outline" disabled={isSaving} onClick={cancelEdit}>
              Cancel
            </Button>
          )}
          <Button type="submit" loading={isSaving}>
            {editingId ? "Save Changes" : "Add Policy"}
          </Button>
        </div>
      </form>

      {/* Policy list */}
      <div className="flex flex-col gap-4">
        {policies.length === 0 ? (
          <div className="rounded-cm-lg border border-cm-border bg-cm-card p-6 text-center text-sm text-cm-text-muted shadow-sm">
            No policies added yet. Use the form above to add the first one.
          </div>
        ) : (
          policies.map((policy) => (
            <div
              key={policy.id}
              className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <h3 className="font-semibold text-cm-text">{policy.title}</h3>
                <div className="flex shrink-0 gap-2">
                  <Button size="sm" variant="outline" onClick={() => startEdit(policy)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleDeleteClick(policy.id)}
                  >
                    {pendingDeleteId === policy.id ? "Confirm delete?" : "Delete"}
                  </Button>
                </div>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-cm-text-muted">
                {policy.content}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default CompanyPolicies;